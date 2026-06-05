import { generateSpeech } from '@/lib/audio';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { text, journeyId, sceneId, gender } = await req.json();
    
    if (!text || !journeyId || !sceneId) {
      return new Response(JSON.stringify({ error: 'Text, journeyId and sceneId are required' }), { status: 400 });
    }

    // Fetch User Config (BYOK)
    let userConfig = undefined;
    if (session) {
      const player = await prisma.player.findUnique({
        where: { id: (session.user as any).id },
        select: { apiKeys: true, aiPreferences: true }
      });
      if (player) userConfig = player;
    }
    
    const audioUrl = await generateSpeech(text, journeyId, sceneId, gender, userConfig);

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
