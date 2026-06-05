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

  // 1. Determine Model ID
  const modelId = preferences.textModel || process.env.TEXT_MODEL || 'gemini-1.5-flash';
  
  // 2. Determine Provider based on common prefixes
  let provider: TextProvider = 'google';
  if (modelId.startsWith('gpt-') || modelId.startsWith('o1-') || modelId.startsWith('o3-')) {
    provider = 'openai';
  } else if (modelId.startsWith('claude-')) {
    provider = 'anthropic';
  }

  // 3. Use User Key if available AND ENABLED, otherwise use Global Key (from env)
  if (provider === 'google') {
    const useUserKey = userKeys.gemini && apiEnabled.gemini !== false;
    const apiKey = useUserKey ? decrypt(userKeys.gemini) : process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const google = createGoogleGenerativeAI({ apiKey: apiKey || '' });
    return google(modelId);
  }

  if (provider === 'openai') {
    const useUserKey = userKeys.openai && apiEnabled.openai !== false;
    const apiKey = useUserKey ? decrypt(userKeys.openai) : process.env.OPENAI_API_KEY;
    const openai = createOpenAI({ apiKey: apiKey || '' });
    return openai(modelId);
  }

  if (provider === 'anthropic') {
    const useUserKey = userKeys.anthropic && apiEnabled.anthropic !== false;
    const apiKey = useUserKey ? decrypt(userKeys.anthropic) : process.env.ANTHROPIC_API_KEY;
    const anthropic = createAnthropic({ apiKey: apiKey || '' });
    return anthropic(modelId);
  }

  // Final fallback to system gemini
  const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '' });
  return google('gemini-1.5-flash');
}

/**
 * Gets the configured image model.
 * Prioritizes user keys and preferences if provided and ENABLED.
 */
export function getImageModel(userConfig?: UserAIConfig) {
  const preferences = userConfig?.aiPreferences || {};
  const userKeys = userConfig?.apiKeys || {};
  const apiEnabled = userConfig?.apiEnabled || {};

  const modelId = preferences.imageModel || process.env.IMAGE_MODEL || 'imagen-3.0-fast-generate-001';
  
  let provider: ImageProvider = 'google';
  if (modelId.startsWith('dall-e')) provider = 'openai';

  if (provider === 'google') {
    const useUserKey = userKeys.gemini && apiEnabled.gemini !== false;
    const apiKey = useUserKey ? decrypt(userKeys.gemini) : process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const google = createGoogleGenerativeAI({ apiKey: apiKey || '' });
    return google.image(modelId);
  }

  if (provider === 'openai') {
    const useUserKey = userKeys.openai && apiEnabled.openai !== false;
    const apiKey = useUserKey ? decrypt(userKeys.openai) : process.env.OPENAI_API_KEY;
    const openai = createOpenAI({ apiKey: apiKey || '' });
    return openai.image(modelId);
  }

  const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '' });
  return google.image('imagen-3.0-fast-generate-001');
}

/**
 * Returns metadata about the active configuration.
 */
export function getAIConfigMetadata(userConfig?: UserAIConfig) {
  const preferences = userConfig?.aiPreferences || {};
  const userKeys = userConfig?.apiKeys || {};
  const apiEnabled = userConfig?.apiEnabled || {};

  const modelId = preferences.textModel || process.env.TEXT_MODEL || 'gemini-1.5-flash';
  const imageId = preferences.imageModel || process.env.IMAGE_MODEL || 'imagen-3.0-fast-generate-001';

  return {
    text: {
      model: modelId,
      isCustomKey: (!!userKeys.gemini && apiEnabled.gemini !== false) || 
                   (!!userKeys.openai && apiEnabled.openai !== false) || 
                   (!!userKeys.anthropic && apiEnabled.anthropic !== false),
    },
    image: {
      model: imageId,
      isCustomKey: (!!userKeys.gemini && apiEnabled.gemini !== false) || 
                   (!!userKeys.openai && apiEnabled.openai !== false),
    },
  };
}
