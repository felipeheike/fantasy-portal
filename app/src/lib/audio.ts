import { uploadBuffer } from './storage';

const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export async function generateSpeech(text: string, journeyId: string, sceneId: string): Promise<string> {
  if (!GOOGLE_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  }

  console.log(`LOG: Generating Speech for [Scene: ${sceneId}]`);

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode: 'pt-BR',
        name: 'pt-BR-Wavenet-B', // Voz masculina de alta qualidade
        ssmlGender: 'MALE',
      },
      audioConfig: {
        audioEncoding: 'MP3',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("TTS API Error:", error);
    throw new Error(`Failed to generate speech: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const audioBuffer = Buffer.from(data.audioContent, 'base64');

  const fileName = `journeys/${journeyId}/audio_${sceneId}.mp3`;
  const audioUrl = await uploadBuffer(new Uint8Array(audioBuffer), fileName, 'audio/mpeg');

  console.log(`LOG: Speech generated and uploaded: ${audioUrl}`);
  return audioUrl;
}
