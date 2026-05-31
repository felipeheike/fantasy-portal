import { generateSpeech } from '@/lib/audio';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { text, journeyId, sceneId } = await req.json();
    
    if (!text || !journeyId || !sceneId) {
      return new Response(JSON.stringify({ error: 'Text, journeyId and sceneId are required' }), { status: 400 });
    }
    
    const audioUrl = await generateSpeech(text, journeyId, sceneId);

    return new Response(JSON.stringify({ audioUrl }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('!!! AUDIO GENERATION FAILURE !!!', error);
    return new Response(JSON.stringify({ error: 'Falha ao gerar narração', details: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
