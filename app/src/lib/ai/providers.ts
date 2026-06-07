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
    modelId = process.env.TEXT_MODEL || 'gemini-1.5-flash';
    provider = 'google';
    if (modelId.startsWith('gpt-') || modelId.startsWith('o1-') || modelId.startsWith('o3-')) {
      provider = 'openai';
    } else if (modelId.startsWith('claude-')) {
      provider = 'anthropic';
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

  // Final fallback to system gemini
  const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '' });
  return google('gemini-1.5-flash');
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
  const textModelId = preferences.textModel || process.env.TEXT_MODEL || 'gemini-1.5-flash';
  let textProvider: TextProvider = 'google';
  if (textModelId.startsWith('gpt-') || textModelId.startsWith('o1-') || textModelId.startsWith('o3-')) {
    textProvider = 'openai';
  } else if (textModelId.startsWith('claude-')) {
    textProvider = 'anthropic';
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
