import { GoogleGenerativeAI } from "@google/generative-ai";
import { uploadBuffer } from './storage';
import { spawn } from 'child_process';
import { Readable } from 'stream';

const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const AUDIO_MODEL = process.env.AUDIO_MODEL || "gemini-2.5-flash-preview-tts";

/**
 * Converts raw PCM data (S16LE, 24kHz) to MP3 using FFmpeg
 */
async function encodePcmToMp3(pcmBuffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-f', 's16le',       // Input format: 16-bit little-endian PCM
      '-ar', '24000',      // Input sample rate: 24kHz (Gemini default)
      '-ac', '1',          // Input channels: mono
      '-i', 'pipe:0',      // Read from stdin
      '-codec:a', 'libmp3lame', 
      '-b:a', '128k',      // 128kbps bitrate
      '-f', 'mp3',         // Output format
      'pipe:1'             // Write to stdout
    ]);

    const chunks: Buffer[] = [];
    ffmpeg.stdout.on('data', (chunk) => chunks.push(chunk));
    ffmpeg.stderr.on('data', (data) => {
      // ffmpeg writes logs to stderr, we can ignore them unless there's an error
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    ffmpeg.stdin.write(pcmBuffer);
    ffmpeg.stdin.end();
  });
}

export async function generateSpeech(text: string, journeyId: string, sceneId: string, gender: 'male' | 'female' = 'male'): Promise<string> {
  if (!GOOGLE_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  }

  console.log(`LOG: Generating Gemini TTS for [Scene: ${sceneId}] [Gender: ${gender}]`);

  try {
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: AUDIO_MODEL,
      generationConfig: {
        responseModalities: ["audio"],
      } as any
    });

    const prompt = `Gere uma narração cinematográfica de um Mestre de RPG para o seguinte texto. 
    Use uma voz ${gender === 'female' ? 'feminina' : 'masculina'} e expressiva.
    
    Texto: "${text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    const parts = response.candidates?.[0]?.content?.parts;
    const audioPart = parts?.find(p => p.inlineData?.mimeType?.includes('audio'));

    if (!audioPart || !audioPart.inlineData) {
      console.error("Gemini TTS Error: No audio part in response", JSON.stringify(response, null, 2));
      throw new Error("O modelo Gemini não retornou dados de áudio.");
    }

    // Gemini returns raw PCM data even if it says 'audio/wav' in some cases
    const rawPcmBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
    console.log(`LOG: Raw Audio Data received (${rawPcmBuffer.length} bytes). Encoding to MP3...`);

    const mp3Buffer = await encodePcmToMp3(rawPcmBuffer);
    console.log(`LOG: Audio encoded successfully (${mp3Buffer.length} bytes)`);

    const fileName = `journeys/${journeyId}/audio_${sceneId}.mp3`;
    const audioUrl = await uploadBuffer(new Uint8Array(mp3Buffer), fileName, 'audio/mpeg');

    console.log(`LOG: Gemini Speech generated and uploaded: ${audioUrl}`);
    return audioUrl;

  } catch (error: any) {
    console.error("!!! GEMINI TTS CRITICAL FAILURE !!!", error);
    throw new Error(`Failed to generate speech with Gemini: ${error.message}`);
  }
}
