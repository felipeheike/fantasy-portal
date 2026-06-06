import { getTextModel } from '@/lib/ai/providers';
import { generateText } from 'ai';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { question, currentScene, history, journeyId } = await req.json();

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
2. DINÂMICA DE EXTENSÃO: 
   - Para perguntas de LORE/HISTÓRIA: Seja denso, literário e épico (máx. 3 parágrafos).
   - Para perguntas TÁTICAS/OBJETIVAS: Seja curto, visceral e focado em sensações físicas (máx. 1 parágrafo curto).
3. NUNCA diga qual é a "opção correta" ou o desfecho exato das escolhas. 
4. NÃO REPITA o que já foi dito na narração da cena; traga dados NOVOS (detalhes de fabricação, lendas locais, pressentimentos).
5. Mantenha o tom literário condizente com o gênero da jornada.
6. Use Português (PT-BR).

DADOS DA CENA ATUAL:
Narração: ${currentScene.narration}
Contexto Sonoro: ${currentScene.audioDescription || 'Não descrito'}

HISTÓRICO RECENTE (MEMÓRIAS):
${history.slice(-3).map((h: any) => h.narration).join('\n---\n')}
`,
      prompt: `Pergunta do Jogador: "${question}"`,
    });

    // --- Persistência em Tempo Real ---
    if (journeyId && currentScene.sceneId) {
      try {
        const newInquiry = { question, answer: text, timestamp: Date.now() };

        // 1. Atualizar no modelo Scene individual
        await prisma.scene.updateMany({
          where: { journeyId, sceneId: currentScene.sceneId },
          data: {
            inquiries: {
              push: newInquiry
            }
          }
        });

        // 2. Atualizar no JSON history da Journey (Sincronia Global)
        const journey = await prisma.journey.findUnique({
          where: { id: journeyId },
          select: { history: true }
        });

        if (journey && Array.isArray(journey.history)) {
          const updatedHistory = journey.history.map((s: any) => {
            if (s.sceneId === currentScene.sceneId) {
              return {
                ...s,
                inquiries: [...(s.inquiries || []), newInquiry]
              };
            }
            return s;
          });

          await prisma.journey.update({
            where: { id: journeyId },
            data: { history: updatedHistory }
          });
        }
      } catch (dbErr) {
        console.error('INQUIRY_PERSISTENCE_ERR:', dbErr);
        // Não falhamos a requisição se o log falhar, apenas logamos
      }
    }

    return NextResponse.json({ answer: text });

  } catch (error: any) {
    console.error('INQUIRY_API_FAILURE:', error);

    const isQuotaError = 
      error?.message?.includes('429') || 
      error?.status === 429 || 
      error?.message?.includes('quota') ||
      error?.message?.includes('limit') ||
      error?.response?.status === 429;

    return NextResponse.json(
      { 
        error: isQuotaError ? 'LIMITE_COTA' : 'ERRO_MESTRE',
        message: isQuotaError 
          ? 'O Mestre está exausto. Aguarde alguns segundos para obter sua intuição.' 
          : 'O Mestre não conseguiu sussurrar uma resposta.'
      }, 
      { status: isQuotaError ? 429 : 500 }
    );
  }
}
