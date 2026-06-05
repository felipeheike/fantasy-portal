import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { uploadBuffer } from './storage';
import { spawn } from 'child_process';
import { Readable } from 'stream';
import { decrypt } from './security';

const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
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

/**
 * Generates speech using OpenAI TTS
 */
async function generateOpenAISpeech(text: string, voice: string, apiKey: string): Promise<Buffer> {
  const openai = new OpenAI({ apiKey });
  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: (voice.split('-')[1] || "alloy") as any,
    input: text,
  });
  return Buffer.from(await response.arrayBuffer());
}

/**
 * Generates speech using Google Gemini TTS
 */
async function generateGoogleSpeech(text: string, gender: string, apiKey: string): Promise<Buffer> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: AUDIO_MODEL,
    generationConfig: { responseModalities: ["audio"] } as any
  });

  const prompt = `Gere uma narração cinematográfica de um Mestre de RPG para o seguinte texto. 
  Use uma voz ${gender === 'female' ? 'feminina' : 'masculina'} e expressiva.
  
  Texto: "${text}"`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.mimeType?.includes('audio'));

  if (!audioPart || !audioPart.inlineData) {
    throw new Error("O modelo Gemini não retornou dados de áudio.");
  }

  const rawPcmBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
  return encodePcmToMp3(rawPcmBuffer);
}

export async function generateSpeech(
  text: string, 
  journeyId: string, 
  sceneId: string, 
  gender: 'male' | 'female' = 'male',
  userConfig?: { apiKeys?: any, apiEnabled?: any, aiPreferences?: any }
): Promise<string> {
  const preferences = userConfig?.aiPreferences || {};
  const userKeys = userConfig?.apiKeys || {};
  const apiEnabled = userConfig?.apiEnabled || {};
  
  const ttsProvider = preferences.ttsVoice || 'gemini-audio';
  let audioBuffer: Buffer;

  try {
    if (ttsProvider.startsWith('openai')) {
      const useUserKey = userKeys.openai && apiEnabled.openai !== false;
      const apiKey = useUserKey ? decrypt(userKeys.openai) : OPENAI_API_KEY;
      
      if (!apiKey) throw new Error("API Key da OpenAI para áudio não configurada.");
      console.log(`LOG: Generating OpenAI TTS (${ttsProvider}) ${useUserKey ? '(User Key)' : '(Global Key)'}`);
      audioBuffer = await generateOpenAISpeech(text, ttsProvider, apiKey);
    } else {
      // Default: Google Gemini
      const useUserKey = userKeys.gemini && apiEnabled.gemini !== false;
      const apiKey = useUserKey ? decrypt(userKeys.gemini) : GOOGLE_API_KEY;

      if (!apiKey) throw new Error("API Key do Google para áudio não configurada.");
      console.log(`LOG: Generating Gemini TTS ${useUserKey ? '(User Key)' : '(Global Key)'}`);
      audioBuffer = await generateGoogleSpeech(text, gender, apiKey);
    }

    const fileName = `journeys/${journeyId}/audio_${sceneId}.mp3`;
    const audioUrl = await uploadBuffer(new Uint8Array(audioBuffer), fileName, 'audio/mpeg');

    console.log(`LOG: Speech generated and uploaded: ${audioUrl}`);
    return audioUrl;

  } catch (error: any) {
    console.error("!!! TTS CRITICAL FAILURE !!!", error);
    throw new Error(`Falha na narração (${ttsProvider}): ${error.message}`);
  }
}
