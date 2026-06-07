import { GoogleGenAI } from "@google/genai";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 });

    const { image, visionPrompt, playerContext } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({ error: 'Image is required' }), { status: 400 });
    }

    // Fetch User AI Config (BYOK)
    const player = await prisma.player.findUnique({
      where: { id: (session.user as any).id },
      select: { apiKeys: true, aiPreferences: true, apiEnabled: true }
    });

    const userKeys = (player?.apiKeys as any) || {};
    const preferences = (player?.aiPreferences as any) || {};
    const apiEnabled = (player?.apiEnabled as any) || {};

    const useUserKey = userKeys.gemini && apiEnabled.gemini !== false;
    const apiKey = useUserKey ? decrypt(userKeys.gemini) : process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const modelId = preferences.textModel || process.env.TEXT_MODEL || "gemini-1.5-flash-latest";

    const ai = new GoogleGenAI({ apiKey: apiKey || "" });

    const systemPrompt = `
Você é o "Olho do Mestre" no sistema Fantasy Portal. 
Sua tarefa é atuar como um validador de oferendas e forjador de realidade. O jogador enviou uma imagem do mundo real para cumprir um desafio narrativo.

REQUISITO DO PORTAL: "${visionPrompt || 'Um objeto místico'}"

DADOS DO PROTAGONISTA:
- Nome: ${playerContext?.status?.playerName || 'Herói'}
- Karma: ${playerContext?.status?.moral || 0}
- Gênero do Jogo: ${playerContext?.settings?.genre || 'Fantasia'}

INSTRUÇÕES DE VALIDAÇÃO:
1. ANALISE a imagem e verifique se ela contém o objeto solicitado no "REQUISITO DO PORTAL".
2. QUALIDADE: Se a imagem estiver muito borrada, escura ou for impossível de identificar, considere falha.
3. CRIATIVIDADE: Valorize oferendas criativas que lembrem o objeto pedido.

INSTRUÇÕES DE RESPOSTA (ESTRITAMENTE JSON):
- Se VÁLIDO: set "success": true. 
  - Crie uma descrição poética (max 2 parágrafos) de como este objeto do mundo real se materializou/ressonou no jogo.
  - Gere o objeto místico resultante (generatedItem). Ele deve ter a tag "isSpectral": true.
  - REGRAS DO ITEM: O item espectral DEVE ser um utilitário ou bônus. NUNCA classifique o item como 'quest' (isso quebraria o jogo). Use apenas: weapon, armor, consumable ou companion.
- Se INVÁLIDO: set "success": false.
  - Explique brevemente por que a conexão falhou (ex: "O objeto não possui a essência de luz exigida").

Formato de Saída:
{
  "success": boolean,
  "message": "Mensagem em caso de erro",
  "description": "Narrativa de materialização (sucesso)",
  "generatedItem": {
    "id": "string-unico",
    "name": "Nome Épico",
    "description": "O que o item faz no jogo...",
    "type": "weapon | armor | consumable | companion",
    "quantity": 1,
    "isSpectral": true
  }
}
`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        systemPrompt,
        {
          inlineData: {
            data: image.split(",")[1], // Remove o prefixo data:image/png;base64,
            mimeType: "image/jpeg"
          }
        }
      ]
    });

    const text = response.text || "";
    
    // Tenta extrair o JSON da resposta (Gemini as vezes coloca ```json)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const itemData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

    return new Response(JSON.stringify(itemData), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('!!! VISION API FAILURE !!!', error);
    return new Response(JSON.stringify({ error: 'Falha ao analisar oferenda', details: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
