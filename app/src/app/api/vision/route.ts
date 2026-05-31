import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { image, prompt, playerContext } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({ error: 'Image is required' }), { status: 400 });
    }

    // O modelo Gemini 1.5 Pro ou Flash suporta multimodalidade
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `
Você é o "Olho do Mestre" no sistema Fantasy Portal. 
Sua tarefa é analisar a imagem enviada pelo jogador (um objeto do mundo real) e transformá-la em um item lendário dentro do contexto de RPG do jogo.

DADOS DO MUNDO:
- Gênero: ${playerContext?.settings?.genre || 'Fantasia'}
- Tom: ${playerContext?.settings?.tone || 'Sombrio'}

INSTRUÇÕES:
1. Identifique o objeto na foto.
2. Crie um nome épico e uma descrição literária para ele.
3. Defina atributos técnicos (ataque, defesa, utilidade) compatíveis com o sistema.
4. O item deve ser útil para o protagonista: ${playerContext?.settings?.playerName}.

Responda ESTRITAMENTE em JSON com o seguinte formato:
{
  "item": {
    "name": "Nome Épico",
    "description": "Descrição literária...",
    "type": "weapon | armor | consumable | quest",
    "stats": { "combatPower": 5, "durability": 10 },
    "rarity": "Common | Rare | Legendary"
  },
  "narrative": "Um pequeno texto narrando como o jogador encontrou ou reconheceu este artefato no mundo."
}
`;

    const result = await model.generateContent([
      systemPrompt,
      {
        inlineData: {
          data: image.split(",")[1], // Remove o prefixo data:image/png;base64,
          mimeType: "image/jpeg"
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Tenta extrair o JSON da resposta (Gemini as vezes coloca ```json)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const itemData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

    return new Response(JSON.stringify(itemData), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('!!! VISION API FAILURE !!!', error);
    return new Response(JSON.stringify({ error: 'Falha ao analisar artefato', details: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
