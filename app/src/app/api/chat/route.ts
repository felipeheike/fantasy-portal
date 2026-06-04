import { getTextModel } from '@/lib/ai/providers';
import { streamObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

const sceneSchema = z.object({
  sceneId: z.string(),
  narration: z.string().describe('Texto literário e envolvendo da cena.'),
  visualDescription: z.string().describe('Descrição visual detalhada para a cena.'),
  audioDescription: z.string().optional().describe('Descrição da paisagem sonora e tom da narração para síntese de áudio.'),
  audioVoice: z.enum(['male', 'female']).optional().describe('Gênero da voz para narração.'),
  imageUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  recommendedInputType: z.enum(['binary', 'multiple', 'combined', 'interpretative', 'puzzle']),
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
  }).optional().describe('Opções estruturadas para combates ou desafios técnicos.'),
  puzzle: z.object({
    type: z.enum(['hangman', 'anagram', 'cipher', 'riddle']),
    solution: z.string().describe('Resposta correta em maiúsculas.'),
    hint: z.string().describe('Pista para ser comprada com Insight.'),
    displayData: z.string().describe('Representação visual inicial (ex: "_ _ _" ou letras embaralhadas).'),
    maxAttempts: z.number().describe('Limite de erros (geralmente 3 a 5).')
  }).optional().describe('Desafios de puzzle para transições ou interações especiais.'),
  statusChanges: z.object({ 
    hp: z.number().optional(), 
    hpSource: z.string().optional().describe('Fonte do dano ou cura (ex: "Garras do Lobo", "Poção").'),
    sp: z.number().optional(), 
    spSource: z.string().optional().describe('Fonte do gasto ou ganho de estamina (ex: "Salto Acrobático", "Descanso").'),
    combatPower: z.number().optional(),
    moral: z.number().optional().describe('Alteração no Karma Global.'),
    reputations: z.record(z.string(), z.number()).optional().describe('Alterações em reputações locais (NPCs, Cidades).')
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
    reputations: z.record(z.string(), z.number()).optional().describe('Atualização de flags globais do mundo (ex: { "taverna_queimada": true }).'),
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

    // MAGNITUDE NARRATIVA (VERBOSIDADE)
    const narrativeDetail = playerContext?.settings?.narrativeDetail || 'medium';
    const detailInstructions: Record<string, string> = {
      short: "CURTO: 1-2 parágrafos objetivos. Foco na ação imediata.",
      medium: "MÉDIO: 3-4 parágrafos. Equilíbrio entre descrição e fluidez.",
      long: "LONGO: 5-7 parágrafos. Rico em detalhes sensoriais e ambientação.",
      epic: "ÉPICO: 8+ parágrafos. Imersão literária total, monólogos internos e exploração profunda do cenário."
    };

    // ADMIN: FORÇAR TIPO DE AÇÃO OU DESFECHO
    const forcedType = playerContext?.forcedNextAction;
    const forcedEnding = playerContext?.forcedEndingType;
    
    let forceRule = "";
    if (forcedEnding) {
      if (forcedEnding === 'glory') {
        forceRule = "\n!!! REGRA ABSOLUTA: FINALIZE A HISTÓRIA AGORA COM GLÓRIA. Narre a vitória triunfal do herói e defina 'isGameOver: true'. Mantenha o HP atual.";
      } else if (forcedEnding === 'death') {
        forceRule = "\n!!! REGRA ABSOLUTA: O HERÓI DEVE MORRER AGORA (REVIVÍVEL). Narre um golpe fatal, defina 'hp: 0' e 'isGameOver: true'.";
      } else if (forcedEnding === 'permadeath') {
        forceRule = "\n!!! REGRA ABSOLUTA: O HERÓI DEVE MORRER PERMANENTEMENTE AGORA. Narre o fim absoluto, defina 'hp: 0' e 'isGameOver: true'.";
      } else if (forcedEnding === 'defeat') {
        forceRule = "\n!!! REGRA ABSOLUTA: FINALIZE A HISTÓRIA COM DERROTA AMARGA. O herói sobrevive, mas falha em seu objetivo principal. Defina 'isGameOver: true'.";
      }
    } else if (forcedType) {
      forceRule = `\n!!! REGRA ABSOLUTA PARA ESTA CENA !!!\nVocê DEVE gerar obrigatoriamente uma interação do tipo '${forcedType}'. Ignore as regras normais de diversificação para esta cena.`;
    }

    console.log(
      'LOG: Chat Request [Player:', playerContext?.settings?.playerName, 
      '| Step:', actualSceneCount, 
      '| Forced:', forcedEnding || forcedType || 'None', ']'
    );

    const result = await streamObject({
      model: getTextModel(),
      schema: sceneSchema,
      output: 'object',
      system: `
Você é o Narrador soberano do "Fantasy Portal".
${forceRule}

REGRAS DE DIVERSIFICAÇÃO (ANTI-REPETIÇÃO):
1. LIMITE DE REPETIÇÃO: Você NÃO deve usar o same 'recommendedInputType' por more than ${process.env.MAX_REPETITIVE_INTERACTIONS || 2} cenas consecutivas.
2. VARIEDADE: Alterne entre 'binary', 'multiple', 'combined' e 'interpretative' para manter o dinamismo.
3. PRIORIDADE TÁTICA: SEMPRE use o modo 'combined' (Escolha Estruturada) em situações de conflito físico, perseguição ou obstáculos técnicos.
4. USO DE HABILIDADES: Ofereça pelo menos uma opção que utilize as habilidades do jogador em cada 3 cenas.

REGRAS DE CONTROLE DE JORNADA (STEPS):
1. LIMITE ATUAL: ${effectiveLimit} cenas.
2. CENA ATUAL: ${actualSceneCount + 1}.

ESTILO E EXTENSÃO (CRÍTICO):
- ESTILO LITERÁRIO: ${playerContext?.settings?.readStyle} (Combine isso com a magnitude abaixo).
- MAGNITUDE NARRATIVA: ${detailInstructions[narrativeDetail]}
- TÉCNICA DE FOCO: Para 'Longo' ou 'Épico', use o cenário como um personagem vivo. Comece com a vastidão, afunile para o detalhe e termine na sensação interna do herói.

REGRAS DE MOMENTO DA ESCOLHA (Cena ${effectiveLimit}):
1. Ao chegar EXATAMENTE na cena ${effectiveLimit}, você DEVE oferecer um dilema narrativo:
   - "O fim parece próximo, mas os fios do tempo vibram. Você deseja APROFUNDAR A LENDA ou seguir para o seu DESFECHO FINAL?"
   - Forneça duas opções explícitas: "Aprofundar a Lenda (+10 capítulos)" e "Seguir para o Desfecho Final".

2. MODO DESFECHO (Se o jogador escolher 'Seguir para o Desfecho' ou se o limite foi atingido):
   - Você tem no máximo 3 cenas para encerrar tudo de forma épica.
   - Cena Final + 3: O epílogo literário. Defina obrigatoriamente 'isGameOver: true'.

SISTEMA DE MEMÓRIA E MUNDO (WORLD KNOWLEDGE GRAPH):
- Use 'worldUpdate.flags' para registrar mudanças permanentes no mundo (ex: locais destruídos, alianças firmadas).
- Use 'worldUpdate.memories' para registrar fatos que devem ser lembrados no futuro.
- Reaja às flags atuais: ${JSON.stringify(playerContext?.flags || {})}.

SISTEMA DE EFEITO BORBOLETA (BUTTERFLY EFFECT):
- Use 'statusChanges.moral' para o alinhamento GLOBAL (média).
- Use 'statusChanges.reputations' (Record<string, number>) para fama local.
- REGRA OBRIGATÓRIA: Sempre que 'moral' for diferente de zero, você DEVE adicionar uma entrada correspondente em 'reputations' (ex: {"NPC João": +2} ou {"Vila de Alvorada": -5}).
- Se o ato não for para uma entidade específica, use "O Mundo" como chave em 'reputations'.
- Ações nobres ativam feedback DOURADO, ações cruéis ativam feedback ROXO.
- O mundo e NPCs devem reagir à moral acumulada e às reputações locais.

SISTEMA DE DESAFIOS MENTAIS (puzzle):
- Use o campo 'puzzle' para travar o progresso atrás de um desafio intelectual.
- 'hangman': Forca temática. Defina 'solution' e 'displayData' com espaços (ex: "A _ _ _ _ A").
- 'anagram': Letras embaralhadas. Defina 'displayData' com a bagunça (ex: "R T P O A L").
- 'cipher': Código de substituição. Dê a dica no campo 'hint'.
- 'riddle': Charada clássica. A resposta curta deve estar em 'solution'.
- RECOMPENSA: Resolver um puzzle concede +1 Insight Point automaticamente.

SISTEMA DE PAISAGENS SONORAS:
- Preencha 'audioDescription' com uma descrição rica do ambiente sonoro.
- Use 'audioVoice' para definir se a narração deve ser 'male' (masculina) ou 'female' (feminina), baseando-se no tom da cena ou se há um narrador/NPC específico falando.

REGRAS DE COMBATE E DESAFIOS (combined):
- Quando a cena envolver combate ou exploração técnica, preencha 'tacticalOptions'.
- Narre o posicionamento e a tensão de forma puramente textual. Não tente gerar mapas visuais ou grades de coordenadas.
- Ao oferecer 'tacticalOptions', preencha 'availableItems' com os NOMES dos itens na mochila e 'availableSkills' estritamente com os NOMES das habilidades presentes na lista de Habilidades abaixo. Não invente habilidades.
- Classifique cada ação com 'requiresItem: true' se ela depender fisicamente de um item.

REGRAS TÉCNICAS ABSOLUTAS:
1. FORMATO: Responda estritamente em JSON seguindo o schema.
2. ID ÚNICO (CRÍTICO): 'sceneId' deve ser ÚNICO, NOVO e JAMAIS igual a '${playerContext?.lastSceneId}'.
3. RESOLUÇÃO DE DADO: Se a última mensagem for "RESULTADO DO DADO: X", narre o desfecho e AVANCE para uma NOVA cena com 'requiresRoll: false'.
4. RENASCIMENTO: Se a última mensagem indicar um renascimento (revive), narre como o herói recuperou a consciência ou quem o salvou milagrosamente, mantendo a continuidade.
5. GESTÃO DE STATUS: Use valores ABSOLUTOS em 'statusChanges' para HP/SP/CombatPower, mas use valores RELATIVOS (+X ou -X) para 'moral'.
   - SEMPRE preencha 'hpSource' ou 'spSource' se houver mudança de vitalidade ou estamina.
6. INVENTÁRIO: Use 'inventoryChanges' para adicionar/remover itens narrativamente. 
7. HABILIDADES: Use 'skillChanges' para conceder novas habilidades (level 1) ou evoluir existentes.

ESTILO NARRATIVO:
- Tom literário compatível com o gênero: ${playerContext?.settings?.genre}.
- Narre em PT-BR, de forma imersiva e sem repetições.

CONTEXTO ATUAL:
- Protagonista: ${playerContext?.settings?.playerName}
- HP/SP: ${playerContext?.status?.hp}/${playerContext?.status?.maxHp} | ${playerContext?.status?.sp}/${playerContext?.status?.maxSp}
- Moral/Karma Global: ${playerContext?.status?.moral || 0}
- Reputações Locais: ${JSON.stringify(playerContext?.status?.reputations || {})}
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
