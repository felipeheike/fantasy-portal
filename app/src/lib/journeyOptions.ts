// Fonte única das opções de criação/edição de jornada — usada tanto no wizard de
// criação (JourneySetup) quanto na edição em pleno jogo (JourneyDetailsModal), pra
// nunca divergir (ex.: adicionar um gênero novo só precisa mexer aqui).
export interface JourneyOption {
  id: string;
  label: string;
  desc?: string;
  restricted?: boolean; // exige chave própria (BYOK)
}

export const GENRE_OPTIONS: JourneyOption[] = [
  { id: 'fantasy', label: 'Fantasia' },
  { id: 'medieval-epic', label: 'Épico Medieval' },
  { id: 'cyberpunk', label: 'Cyberpunk' },
  { id: 'sci-fi', label: 'Ficção Científica' },
  { id: 'steampunk', label: 'Steampunk' },
  { id: 'gothic-horror', label: 'Terror Gótico' },
  { id: 'post-apocalyptic', label: 'Pós-Apocalipse' },
  { id: 'pirates', label: 'Piratas' },
  { id: 'western', label: 'Velho Oeste' },
  { id: 'real-world', label: 'Mundo Real' },
];

export const VISUAL_STYLE_OPTIONS: JourneyOption[] = [
  { id: 'anime', label: 'Anime' },
  { id: 'manga', label: 'Mangá' },
  { id: 'pixel-art', label: 'Pixel Art' },
  { id: 'dark-realism', label: 'Realismo' },
  { id: 'baroque', label: 'Pintura Barroca' },
  { id: 'noir', label: 'Noir Cinematográfico' },
  { id: 'digital-art', label: 'Arte Digital' },
  { id: 'sketch', label: 'Rascunho a Lápis' },
];

export const READ_STYLE_OPTIONS: JourneyOption[] = [
  { id: 'essential', label: 'Essencial', desc: 'Texto mínimo, foco na ação' },
  { id: 'moderate', label: 'Moderado', desc: 'Equilíbrio e fluidez' },
  { id: 'detailed', label: 'Detalhado', desc: 'Rico em ambientação' },
  { id: 'literary', label: 'Literário', desc: 'Profundo, poético e complexo' },
];

export const PUNISH_SYSTEM_OPTIONS: JourneyOption[] = [
  { id: 'fail_tolerance_5', label: 'Tolerante', desc: 'IA perdoa até 5 falhas graves' },
  { id: 'fail_tolerance_3', label: 'Moderado', desc: 'IA perdoa até 3 falhas graves' },
  { id: 'no_fail_tolerance', label: 'Rigoroso', desc: 'Cada falha tem peso imediato' },
  { id: 'permadeath', label: 'Morte Permanente', desc: 'Fim de jogo significa fim da sessão' },
];

export const MAGNITUDE_OPTIONS: JourneyOption[] = [
  { id: 'short', label: 'Curto', desc: '1-2 parágrafos. Foco na objetividade.' },
  { id: 'medium', label: 'Médio', desc: '3-4 parágrafos. Equilíbrio ideal.' },
  { id: 'long', label: 'Longo', desc: '5-7 parágrafos. Rico em detalhes.', restricted: true },
  { id: 'epic', label: 'Épico', desc: '8+ parágrafos. Imersão literária.', restricted: true },
];

// Mantém em sincronia com `baseLimits` em api/chat/route.ts — usado tanto pro
// seletor quanto pra travar reduções abaixo do progresso já feito na jornada.
export const JOURNEY_LENGTH_OPTIONS: (JourneyOption & { sceneLimit: number })[] = [
  { id: 'preview', label: 'Preview', desc: '10 cenas', sceneLimit: 10 },
  { id: 'short', label: 'Curta', desc: '11-50 cenas', restricted: true, sceneLimit: 50 },
  { id: 'medium', label: 'Média', desc: '51-99 cenas', restricted: true, sceneLimit: 99 },
  { id: 'long', label: 'Longa', desc: '100+ cenas', restricted: true, sceneLimit: 250 },
];
