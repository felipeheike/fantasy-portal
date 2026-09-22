import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export type LocalGenerationKind = 'image' | 'text' | 'tts';
export type TtsEngine = 'kokoro' | 'xtts';

export interface LocalGenerationConfigData {
  imageEnabled: boolean;
  textEnabled: boolean;
  ttsEnabled: boolean;
  ttsEngine: TtsEngine;
}

const DEFAULTS: LocalGenerationConfigData = {
  imageEnabled: false,
  textEnabled: false,
  ttsEnabled: false,
  ttsEngine: 'kokoro',
};

const CACHE_TTL_MS = 5000;
let cache: { data: LocalGenerationConfigData; expiresAt: number } | null = null;

// Cache curto: essa flag é lida em toda geração de cena/imagem/áudio, e o toggle
// muda raramente (o admin liga/desliga manualmente) — não vale bater no banco a
// cada requisição.
export async function getLocalGenerationConfig(): Promise<LocalGenerationConfigData> {
  if (cache && cache.expiresAt > Date.now()) return cache.data;
  try {
    const row = await prisma.localGenerationConfig.findUnique({ where: { id: 'global' } });
    const data: LocalGenerationConfigData = row
      ? {
          imageEnabled: row.imageEnabled,
          textEnabled: row.textEnabled,
          ttsEnabled: row.ttsEnabled,
          ttsEngine: (row.ttsEngine === 'xtts' ? 'xtts' : 'kokoro'),
        }
      : DEFAULTS;
    cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    return data;
  } catch (error) {
    logger.error('LOCAL_GENERATION_CONFIG_READ_ERR:', error);
    return DEFAULTS;
  }
}

export function invalidateLocalGenerationCache() {
  cache = null;
}

/**
 * Decisão pura (sem I/O) de usar local ou nuvem — testável sem mocks.
 *
 * BYOK sempre vence pra jogadores comuns: é a estratégia deles poderem escolher
 * entre nossa IA e a própria, e essa escolha nunca é atropelada pelo toggle do
 * admin. Um ADMIN é uma exceção deliberada — ele é quem liga o toggle geral, e
 * ligar já expressa a intenção de usar local, inclusive na própria conta. Por
 * isso, pra role === 'ADMIN', o toggle sozinho basta: não existe um controle
 * pessoal separado, o comportamento já muda junto com o toggle de sistema.
 */
export function resolveLocalUsage(input: {
  enabled: boolean;
  hasOwnKey: boolean;
  localUrlConfigured: boolean;
  isAdmin: boolean;
}): boolean {
  return input.enabled && input.localUrlConfigured && (input.isAdmin || !input.hasOwnKey);
}

export async function shouldUseLocal(kind: LocalGenerationKind, hasOwnKey: boolean, role?: string): Promise<boolean> {
  const config = await getLocalGenerationConfig();
  const enabled = kind === 'image' ? config.imageEnabled : kind === 'text' ? config.textEnabled : config.ttsEnabled;
  const urlEnvKey = kind === 'image' ? 'LOCAL_IMAGE_URL' : kind === 'text' ? 'LOCAL_TEXT_URL' : 'LOCAL_TTS_URL';
  const localUrlConfigured = !!process.env[urlEnvKey];
  return resolveLocalUsage({ enabled, hasOwnKey, localUrlConfigured, isAdmin: role === 'ADMIN' });
}

/**
 * fetch com timeout que nunca lança por causa do timeout em si — quem chama decide
 * o que fazer (tipicamente: cair pra nuvem). Erros de rede/HTTP != 2xx também viram
 * exceção normal, pra manter o call site simples (try/catch único).
 */
export async function fetchLocal(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Local generation server respondeu ${res.status}: ${body.slice(0, 200)}`);
    }
    return res;
  } finally {
    clearTimeout(timer);
  }
}
