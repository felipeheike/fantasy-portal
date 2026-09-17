// Valores padrão do editor de narrativa — idênticos ao que já estava fixo em
// api/chat/route.ts antes deste editor existir, garantindo que nenhuma jornada em
// andamento mude de comportamento até um admin editar algo de propósito.
export const NARRATIVE_DEFAULTS = {
  persona: 'Você é o Narrador soberano do "Fantasy Portal".',
  detailShort: 'CURTO: 1-2 parágrafos objetivos. Foco na ação imediata.',
  detailMedium: 'MÉDIO: 3-4 parágrafos. Equilíbrio entre descrição e fluidez.',
  detailLong: 'LONGO: 5-7 parágrafos. Rico em detalhes sensoriais e ambientação.',
  detailEpic: 'ÉPICO: 8+ parágrafos. Imersão literária total, monólogos internos e exploração profunda do cenário.',
  extraDirectives: '',
};
