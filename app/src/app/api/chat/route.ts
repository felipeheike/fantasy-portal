import { getTextModel } from '@/lib/ai/providers';
import { streamObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

const sceneSchema = z.object({
  sceneId: z.string(),
  narration: z.string().describe('Texto literário e envolvendo da cena.'),
  visualDescription: z.string().describe('Descrição visual detalhada para a cena.'),
  audioDescription: z.string().optional().describe('Descrição da paisagem sonora e tom da narração para síntese de áudio.'),
  imageUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  recommendedInputType: z.enum(['binary', 'multiple', 'combined', 'interpretative']),
  options: z.array(z.object({ id: z.string(), label: z.string() })).optional(),
  tacticalOptions: z.object({
    actions: z.array(z.object({ 
      id: z.string(), 
      label: z.string(), 
      group: z.enum(['offensive', 'defensive']),
      requiresItem: z.boolean().optional().describe('Se true, o jogador PRECISA selecionar um item para esta ação.'),
      itemType: z.enum(['weapon', 'armor', 'consumable', 'quest']).optional().describe('Filtro de categoria para o item necessário.')
    })),
    targets: z.array(z.object({ id: z.string(), label: z.string(), description: z.string().optional() })),
    availableItems: z.array(z.string()).optional(),
    availableSkills: z.array(z.string()).optional()
  }).optional(),
  tacticalMap: z.object({
    gridSize: z.object({ rows: z.number(), cols: z.number() }),
    entities: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['player', 'enemy', 'npc']),
      position: z.object({ x: z.number(), y: z.number() }),
      hp: z.number().optional(),
      maxHp: z.number().optional()
    })),
    environment: z.array(z.object({
      id: z.string(),
      type: z.enum(['wall', 'fire', 'water', 'obstacle']),
      position: z.object({ x: z.number(), y: z.number() })
    })).optional()
  }).optional().describe('Mapa tático para combates ou exploração complexa em grade.'),
  statusChanges: z.object({ 
    hp: z.number().optional(), 
    sp: z.number().optional(), 
    combatPower: z.number().optional(),
    moral: z.number().optional().describe('Alteração no Karma/Moral do jogador. Valores negativos para ações malignas, positivos para heróicas.')
  }).optional(),
  inventoryChanges: z.object({
    added: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      quantity: z.number(),
      type: z.enum(['weapon', 'armor', 'consumable', 'quest']),
      durability: z.number().optional(),
      maxDurability: z.number().optional(),
    })).optional(),
    removed: z.array(z.string()).optional(),
  }).optional(),
  skillChanges: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    level: z.number(),
    maxLevel: z.number(),
    icon: z.string().optional()
  })).optional(),
  worldUpdate: z.object({
    flags: z.record(z.any()).optional().describe('Atualização de flags globais do mundo (ex: { "taverna_queimada": true }).'),
    memories: z.array(z.string()).optional().describe('Memórias importantes para o World Knowledge Graph.')
  }).optional(),
  isGameOver: z.boolean(),
  requiresRoll: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const { messages, playerContext } = await req.json();
    
    // Total de cenas reais no histórico do banco
    const actualSceneCount = playerContext?.sceneCount ?? 0;

    // CONFIGURAÇÃO DE LIMITES
    const baseLimits: Record<string, number> = {
      preview: 10,
      short: 50,
      medium: 99,
      long: 250,
      epic: 300,
      'life-long': 1000
    };

    let baseLimit = baseLimits[playerContext?.settings?.journeyLength] || 10;
    
    // Detectar se o jogador escolheu aprofundar no histórico
    const aprofundarCount = messages.filter((m: any) => 
      m.role === 'user' && m.content.toLowerCase().includes('aprofundar a lenda')
    ).length;
    
    const effectiveLimit = baseLimit + (aprofundarCount * 10);
    const isExceeded = actualSceneCount >= effectiveLimit;

    console.log(
      'LOG: Chat Request [Player:', playerContext?.settings?.playerName, 
      '| Step:', actualSceneCount, 
      '| Limit:', effectiveLimit, ']'
    );

    const result = await streamObject({
      model: getTextModel(),
      schema: sceneSchema,
      output: 'object',
      system: `
Você é o Narrador soberano do "Fantasy Portal".

REGRAS DE DIVERSIFICAÇÃO (ANTI-REPETIÇÃO):
1. LIMITE DE REPETIÇÃO: Você NÃO deve usar o mesmo 'recommendedInputType' por mais de ${process.env.MAX_REPETITIVE_INTERACTIONS || 2} cenas consecutivas.
2. VARIEDADE: Alterne entre 'binary', 'multiple', 'combined' e 'interpretative' para manter o dinamismo.
3. PRIORIDADE TÁTICA: SEMPRE use o modo 'combined' (Combate Tático) em situações de conflito físico, perseguição ou obstáculos que exijam uso de itens/habilidades.
4. USO DE HABILIDADES: Ofereça pelo menos uma opção que utilize as habilidades do jogador em cada 3 cenas.

REGRAS DE CONTROLE DE JORNADA (STEPS):
1. LIMITE ATUAL: ${effectiveLimit} cenas.
2. CENA ATUAL: ${actualSceneCount + 1}.

3. MOMENTO DA ESCOLHA (Cena ${effectiveLimit}):
   - Ao chegar EXATAMENTE na cena ${effectiveLimit}, você DEVE oferecer um dilema narrativo:
   - "O fim parece próximo, mas os fios do tempo vibram. Você deseja APROFUNDAR A LENDA ou seguir para o seu DESFECHO FINAL?"
   - Forneça duas opções explícitas: "Aprofundar a Lenda (+10 capítulos)" e "Seguir para o Desfecho Final".

4. MODO DESFECHO (Se o jogador escolher 'Seguir para o Desfecho' ou se o limite foi atingido):
   - Você tem no máximo 3 cenas para encerrar tudo de forma épica.
   - Cena Final + 3: O epílogo literário. Defina obrigatoriamente 'isGameOver: true'.

SISTEMA DE MEMÓRIA E MUNDO (WORLD KNOWLEDGE GRAPH):
- Use 'worldUpdate.flags' para registrar mudanças permanentes no mundo (ex: locais destruídos, alianças firmadas).
- Use 'worldUpdate.memories' para registrar fatos que devem ser lembrados no futuro.
- Reaja às flags atuais: ${JSON.stringify(playerContext?.flags || {})}.

SISTEMA DE EFEITO BORBOLETA (BUTTERFLY EFFECT):
- Use 'statusChanges.moral' para rastrear o alinhamento do jogador. 
- Ações nobres aumentam a moral, ações cruéis a diminuem.
- O mundo e NPCs devem reagir à moral acumulada (${playerContext?.status?.moral || 0}).

SISTEMA DE PAISAGENS SONORAS:
- Preencha 'audioDescription' com uma descrição rica do ambiente sonoro (ex: "vento uivante misturado com o som de correntes arrastando").

SISTEMA DE COMBATE TÁTICO (GRID-BASED):
- Quando a cena envolver combate ou exploração tática, preencha 'tacticalMap'.
- Use uma grade padrão de 5x5 ou 8x8 conforme a complexidade.
- Posicione o jogador e inimigos logicamente.
- No 'visualDescription', forneça prompts específicos para os sprites dos inimigos se o campo 'tacticalMap' for usado.

REGRAS TÉCNICAS ABSOLUTAS:
1. FORMATO: Responda estritamente em JSON seguindo o schema.
2. ID ÚNICO (CRÍTICO): 'sceneId' deve ser ÚNICO, NOVO e JAMAIS igual a '${playerContext?.lastSceneId}'. Invente um ID descritivo para cada nova cena.
3. RESOLUÇÃO DE DADO: Se a última mensagem for "RESULTADO DO DADO: X", narre o desfecho e AVANCE para uma NOVA cena com 'requiresRoll: false'.
4. TÁTICA (combined): Ao oferecer 'tacticalOptions', preencha 'availableItems' com os NOMES dos itens na mochila e 'availableSkills' estritamente com os NOMES das habilidades presentes na lista de Habilidades abaixo. Não invente habilidades.
   - REGRAS DE REQUISITO: Classifique cada ação com 'requiresItem: true' se ela depender fisicamente de um item (ex: golpear com arma, usar poção). Defina 'itemType' para orientar a escolha. Use 'requiresItem: false' para ações corporais ou inatas (ex: esquivar, recuar, intimidar).
5. GESTÃO DE STATUS: Use valores ABSOLUTOS em 'statusChanges' para HP/SP/CombatPower, mas use valores RELATIVOS (+X ou -X) para 'moral'.
6. INVENTÁRIO: Use 'inventoryChanges' para adicionar/remover itens narrativamente. 
7. HABILIDADES: Use 'skillChanges' para conceder novas habilidades (level 1) ou evoluir existentes.

ESTILO NARRATIVO:
- Tom literário compatível com o gênero: ${playerContext?.settings?.genre}.
- Narre em PT-BR, de forma imersiva e sem repetições.

CONTEXTO ATUAL:
- Protagonista: ${playerContext?.settings?.playerName}
- HP/SP: ${playerContext?.status?.hp}/${playerContext?.status?.maxHp} | ${playerContext?.status?.sp}/${playerContext?.status?.maxSp}
- Moral/Karma: ${playerContext?.status?.moral || 0}
- Mochila: ${playerContext?.inventory?.map((i: any) => i.name).join(', ') || 'Vazia'}
- Habilidades: ${playerContext?.status?.skills?.map((s: any) => s.name).join(', ') || 'Nenhuma'}
- Última Cena Resolvida: ${playerContext?.lastSceneId}
- Flags do Mundo: ${JSON.stringify(playerContext?.flags || {})}
`,
      messages,
    });

    return result.toTextStreamResponse();

  } catch (error: any) {
    console.error('!!! CHAT API CRITICAL FAILURE !!!', error);

    const isQuotaError = 
      error?.message?.includes('429') || 
      error?.status === 429 || 
      error?.message?.includes('quota') ||
      error?.message?.includes('limit') ||
      error?.response?.status === 429;

    return new Response(
      JSON.stringify({
        error: isQuotaError ? 'LIMITE_COTA' : 'ERRO_MESTRE',
        message: isQuotaError 
          ? 'Quota exceeded: O limite diário do Gemini foi atingido.' 
          : (error?.message ?? 'Erro desconhecido'),
      }),
      {
        status: isQuotaError ? 429 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
