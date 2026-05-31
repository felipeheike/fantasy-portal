import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

export type TextProvider = 'google' | 'openai' | 'anthropic';
export type ImageProvider = 'google' | 'openai';

/**
 * Gets the configured text model based on environment variables.
 */
export function getTextModel() {
  const provider = (process.env.ACTIVE_TEXT_PROVIDER || 'google') as TextProvider;
  const modelId = process.env.TEXT_MODEL || 'gemini-1.5-flash';

  switch (provider) {
    case 'openai':
      return openai(modelId);
    case 'anthropic':
      return anthropic(modelId);
    case 'google':
    default:
      return google(modelId);
  }
}

/**
 * Gets the configured image model based on environment variables.
 */
export function getImageModel() {
  const provider = (process.env.ACTIVE_IMAGE_PROVIDER || 'google') as ImageProvider;
  const modelId = process.env.IMAGE_MODEL || 'imagen-3.0-fast-generate-001';

  switch (provider) {
    case 'openai':
      return openai.image(modelId);
    case 'google':
    default:
      return google.image(modelId);
  }
}

/**
 * Returns metadata about the active configuration for monitoring.
 */
export function getAIConfigMetadata() {
  return {
    text: {
      provider: process.env.ACTIVE_TEXT_PROVIDER || 'google',
      model: process.env.TEXT_MODEL || 'gemini-1.5-flash',
    },
    image: {
      provider: process.env.ACTIVE_IMAGE_PROVIDER || 'google',
      model: process.env.IMAGE_MODEL || 'imagen-3.0-fast-generate-001',
    },
  };
}
