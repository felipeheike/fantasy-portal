import { getTextModel } from '@/lib/ai/providers';
import { generateText } from 'ai';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { question, currentScene, history } = await req.json();

    if (!question || !currentScene) {
      return NextResponse.json({ error: "Pergunta ou cena ausentes." }, { status: 400 });
    }

    const { text } = await generateText({
      model: getTextModel(),
      system: `
Você é a Intuição e o Conhecimento Oculto do protagonista no "Fantasy Portal".
O jogador gastou um 'Ponto de Visão' (Insight Point) para obter esclarecimentos sobre a situação atual.

SUA MISSÃO:
1. Responda à pergunta do jogador de forma ÚTIL, porém MISTERIOSA e EVASIVA.
2. Forneça contexto sobre o lore, pesos das armas, sensações físicas, detalhes visuais que podem ter passado despercebidos ou boatos do reino.
3. NUNCA diga qual é a "opção correta" ou o desfecho exato das escolhas. 
4. Mantenha o tom literário e imersivo condizente com o gênero da jornada.
5. Use Português (PT-BR).

DADOS DA CENA ATUAL:
Narração: ${currentScene.narration}
Contexto Sonoro: ${currentScene.audioDescription || 'Não descrito'}

HISTÓRICO RECENTE (MEMÓRIAS):
${history.slice(-3).map((h: any) => h.narration).join('\n---\n')}
`,
      prompt: `Pergunta do Jogador: "${question}"`,
    });

    return NextResponse.json({ answer: text });

  } catch (error: any) {
    console.error('INQUIRY_API_FAILURE:', error);
    return NextResponse.json({ error: 'O Mestre não conseguiu sussurrar uma resposta.' }, { status: 500 });
  }
}
