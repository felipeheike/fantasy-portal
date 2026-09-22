import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { decrypt } from '../security';

export type TextProvider = 'google' | 'openai' | 'anthropic';
export type ImageProvider = 'google' | 'openai';

interface UserAIConfig {
  apiKeys?: any;
  apiEnabled?: any;
  aiPreferences?: any;
}

/**
 * Gets the configured text model.
 * Prioritizes user keys and preferences if provided and ENABLED.
 */
export function getTextModel(userConfig?: UserAIConfig) {
  const preferences = userConfig?.aiPreferences || {};
  const userKeys = userConfig?.apiKeys || {};
  const apiEnabled = userConfig?.apiEnabled || {};

  const userModelId = preferences.textModel;
  let modelId = '';
  let provider: TextProvider = 'google';
  let useUserKey = false;

  // Verify if the user has both key and model configured in the application
  if (userModelId) {
    let userProvider: TextProvider = 'google';
    if (userModelId.startsWith('gpt-') || userModelId.startsWith('o1-') || userModelId.startsWith('o3-')) {
      userProvider = 'openai';
    } else if (userModelId.startsWith('claude-')) {
      userProvider = 'anthropic';
    }

    const hasKey = userProvider === 'google'
      ? (!!userKeys.gemini && apiEnabled.gemini !== false)
      : userProvider === 'openai'
      ? (!!userKeys.openai && apiEnabled.openai !== false)
      : (!!userKeys.anthropic && apiEnabled.anthropic !== false);

    if (hasKey) {
      modelId = userModelId;
      provider = userProvider;
      useUserKey = true;
    }
  }

  // Fallback if not configured or if key is missing/disabled
  if (!modelId) {
    modelId = process.env.TEXT_MODEL || 'claude-sonnet-5';
    provider = 'anthropic';
    if (modelId.startsWith('gpt-') || modelId.startsWith('o1-') || modelId.startsWith('o3-')) {
      provider = 'openai';
    } else if (modelId.startsWith('gemini-')) {
      provider = 'google';
    }

    useUserKey = provider === 'google'
      ? (!!userKeys.gemini && apiEnabled.gemini !== false)
      : provider === 'openai'
      ? (!!userKeys.openai && apiEnabled.openai !== false)
      : (!!userKeys.anthropic && apiEnabled.anthropic !== false);
  }

  if (provider === 'google') {
    const apiKey = useUserKey ? decrypt(userKeys.gemini) : process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const google = createGoogleGenerativeAI({ apiKey: apiKey || '' });
    return google(modelId);
  }

  if (provider === 'openai') {
    const apiKey = useUserKey ? decrypt(userKeys.openai) : process.env.OPENAI_API_KEY;
    const openai = createOpenAI({ apiKey: apiKey || '' });
    return openai(modelId);
  }

  if (provider === 'anthropic') {
    const apiKey = useUserKey ? decrypt(userKeys.anthropic) : process.env.ANTHROPIC_API_KEY;
    const anthropic = createAnthropic({ apiKey: apiKey || '' });
    return anthropic(modelId);
  }

  // Final fallback to system Claude
  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
  return anthropic('claude-sonnet-5');
}

/**
 * Gets the configured image model.
 * Prioritizes user keys and preferences if provided and ENABLED.
 * If the user does not have both a key and a model configured, falls back to the .env "IMAGE_MODEL".
 */
export function getImageModel(userConfig?: UserAIConfig) {
  const preferences = userConfig?.aiPreferences || {};
  const userKeys = userConfig?.apiKeys || {};
  const apiEnabled = userConfig?.apiEnabled || {};

  const userModelId = preferences.imageModel;
  let modelId = '';
  let provider: ImageProvider = 'google';
  let useUserKey = false;

  if (userModelId) {
    const userProvider = userModelId.startsWith('dall-e') ? 'openai' : 'google';
    const hasKey = userProvider === 'openai' 
      ? (!!userKeys.openai && apiEnabled.openai !== false)
      : (!!userKeys.gemini && apiEnabled.gemini !== false);

    if (hasKey) {
      modelId = userModelId;
      provider = userProvider;
      useUserKey = true;
    }
  }

  // Fallback if not configured or if key is missing/disabled
  if (!modelId) {
    modelId = process.env.IMAGE_MODEL || 'imagen-3.0-fast-generate-001';
    provider = modelId.startsWith('dall-e') ? 'openai' : 'google';
    useUserKey = provider === 'openai'
      ? (!!userKeys.openai && apiEnabled.openai !== false)
      : (!!userKeys.gemini && apiEnabled.gemini !== false);
  }

  if (provider === 'google') {
    const apiKey = useUserKey ? decrypt(userKeys.gemini) : process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const google = createGoogleGenerativeAI({ apiKey: apiKey || '' });
    return google.image(modelId);
  }

  if (provider === 'openai') {
    const apiKey = useUserKey ? decrypt(userKeys.openai) : process.env.OPENAI_API_KEY;
    const openai = createOpenAI({ apiKey: apiKey || '' });
    return openai.image(modelId);
  }

  const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '' });
  return google.image(modelId);
}

/**
 * Returns metadata about the active configuration.
 */
export function getAIConfigMetadata(userConfig?: UserAIConfig) {
  const preferences = userConfig?.aiPreferences || {};
  const userKeys = userConfig?.apiKeys || {};
  const apiEnabled = userConfig?.apiEnabled || {};

  // Text Model Resolution
  const textModelId = preferences.textModel || process.env.TEXT_MODEL || 'claude-sonnet-5';
  let textProvider: TextProvider = 'anthropic';
  if (textModelId.startsWith('gpt-') || textModelId.startsWith('o1-') || textModelId.startsWith('o3-')) {
    textProvider = 'openai';
  } else if (textModelId.startsWith('gemini-')) {
    textProvider = 'google';
  }
  
  let useUserTextKey = false;
  if (textProvider === 'google') {
    useUserTextKey = !!userKeys.gemini && apiEnabled.gemini !== false;
  } else if (textProvider === 'openai') {
    useUserTextKey = !!userKeys.openai && apiEnabled.openai !== false;
  } else if (textProvider === 'anthropic') {
    useUserTextKey = !!userKeys.anthropic && apiEnabled.anthropic !== false;
  }

  // Image Model Resolution
  const userImageModelId = preferences.imageModel;
  let imageModelId = '';
  let imageProvider: ImageProvider = 'google';
  let useUserImageKey = false;

  if (userImageModelId) {
    const userProvider = userImageModelId.startsWith('dall-e') ? 'openai' : 'google';
    const hasKey = userProvider === 'openai' 
      ? (!!userKeys.openai && apiEnabled.openai !== false)
      : (!!userKeys.gemini && apiEnabled.gemini !== false);

    if (hasKey) {
      imageModelId = userImageModelId;
      imageProvider = userProvider;
      useUserImageKey = true;
    }
  }

  if (!imageModelId) {
    imageModelId = process.env.IMAGE_MODEL || 'imagen-3.0-fast-generate-001';
    imageProvider = imageModelId.startsWith('dall-e') ? 'openai' : 'google';
    useUserImageKey = imageProvider === 'openai'
      ? (!!userKeys.openai && apiEnabled.openai !== false)
      : (!!userKeys.gemini && apiEnabled.gemini !== false);
  }

  return {
    text: {
      model: textModelId,
      isCustomKey: useUserTextKey,
    },
    image: {
      model: imageModelId,
      isCustomKey: useUserImageKey,
    },
  };
}

/**
 * Diz se o jogador tem uma chave própria (BYOK) configurada e habilitada pro
 * modelo de texto que ele escolheu — usado pela geração local pra nunca
 * desviar o tráfego de quem já tem seu próprio provedor de nuvem.
 *
 * Exceção: um admin pode ligar um override pessoal (`aiPreferences.forceLocalText`)
 * pra testar a geração local na própria conta sem precisar apagar as chaves reais.
 * Só vale pra role === 'ADMIN' — a regra "chave própria sempre vence" continua
 * absoluta pros jogadores comuns, mesmo que esse campo apareça no JSON deles.
 */
export function hasOwnTextKey(userConfig?: UserAIConfig, role?: string): boolean {
  const preferences = userConfig?.aiPreferences || {};
  if (role === 'ADMIN' && preferences.forceLocalText) return false;

  const userKeys = userConfig?.apiKeys || {};
  const apiEnabled = userConfig?.apiEnabled || {};
  const userModelId = preferences.textModel;
  if (!userModelId) return false;

  let provider: TextProvider = 'google';
  if (userModelId.startsWith('gpt-') || userModelId.startsWith('o1-') || userModelId.startsWith('o3-')) {
    provider = 'openai';
  } else if (userModelId.startsWith('claude-')) {
    provider = 'anthropic';
  }

  return provider === 'google'
    ? !!userKeys.gemini && apiEnabled.gemini !== false
    : provider === 'openai'
    ? !!userKeys.openai && apiEnabled.openai !== false
    : !!userKeys.anthropic && apiEnabled.anthropic !== false;
}

/** Mesma ideia de `hasOwnTextKey` (incluindo o override de admin), só que pro modelo de imagem. */
export function hasOwnImageKey(userConfig?: UserAIConfig, role?: string): boolean {
  const preferences = userConfig?.aiPreferences || {};
  if (role === 'ADMIN' && preferences.forceLocalImage) return false;

  const userKeys = userConfig?.apiKeys || {};
  const apiEnabled = userConfig?.apiEnabled || {};
  const userModelId = preferences.imageModel;
  if (!userModelId) return false;

  const provider = userModelId.startsWith('dall-e') ? 'openai' : 'google';
  return provider === 'openai'
    ? !!userKeys.openai && apiEnabled.openai !== false
    : !!userKeys.gemini && apiEnabled.gemini !== false;
}
