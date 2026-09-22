import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAIConfigMetadata, hasOwnTextKey, hasOwnImageKey } from './providers';

describe('getAIConfigMetadata', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.TEXT_MODEL;
    delete process.env.IMAGE_MODEL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('falls back to the system Claude model when no user config is given', () => {
    const meta = getAIConfigMetadata();
    expect(meta.text.model).toBe('claude-sonnet-5');
    expect(meta.text.isCustomKey).toBe(false);
    expect(meta.image.isCustomKey).toBe(false);
  });

  it('uses the .env TEXT_MODEL/IMAGE_MODEL as the fallback when set', () => {
    process.env.TEXT_MODEL = 'gemini-2.0-flash';
    process.env.IMAGE_MODEL = 'imagen-3.0-generate-001';
    const meta = getAIConfigMetadata();
    expect(meta.text.model).toBe('gemini-2.0-flash');
    expect(meta.image.model).toBe('imagen-3.0-generate-001');
  });

  it('uses the BYOK text model + key when the user has one configured and enabled', () => {
    const meta = getAIConfigMetadata({
      aiPreferences: { textModel: 'gpt-4o' },
      apiKeys: { openai: 'encrypted-key' },
      apiEnabled: {},
    });
    expect(meta.text.model).toBe('gpt-4o');
    expect(meta.text.isCustomKey).toBe(true);
  });

  it('does not report a custom key when the matching provider key is missing', () => {
    const meta = getAIConfigMetadata({
      aiPreferences: { textModel: 'gpt-4o' },
      apiKeys: {},
      apiEnabled: {},
    });
    expect(meta.text.isCustomKey).toBe(false);
  });

  it('does not report a custom key when the provider is explicitly disabled', () => {
    const meta = getAIConfigMetadata({
      aiPreferences: { textModel: 'gpt-4o' },
      apiKeys: { openai: 'encrypted-key' },
      apiEnabled: { openai: false },
    });
    expect(meta.text.isCustomKey).toBe(false);
  });

  it('resolves the image provider from a dall-e model id', () => {
    const meta = getAIConfigMetadata({
      aiPreferences: { imageModel: 'dall-e-3' },
      apiKeys: { openai: 'encrypted-key' },
      apiEnabled: {},
    });
    expect(meta.image.model).toBe('dall-e-3');
    expect(meta.image.isCustomKey).toBe(true);
  });
});

describe('hasOwnTextKey', () => {
  it('is false when the player has no textModel preference', () => {
    expect(hasOwnTextKey()).toBe(false);
    expect(hasOwnTextKey({ apiKeys: { openai: 'key' } })).toBe(false);
  });

  it('is true when the matching provider key is present and enabled', () => {
    expect(hasOwnTextKey({ aiPreferences: { textModel: 'gpt-4o' }, apiKeys: { openai: 'key' }, apiEnabled: {} })).toBe(true);
  });

  it('is false when the provider is explicitly disabled', () => {
    expect(hasOwnTextKey({ aiPreferences: { textModel: 'gpt-4o' }, apiKeys: { openai: 'key' }, apiEnabled: { openai: false } })).toBe(false);
  });

  it('ignores a real own key when an ADMIN has the personal override on', () => {
    expect(hasOwnTextKey({ aiPreferences: { textModel: 'gpt-4o', forceLocalText: true }, apiKeys: { openai: 'key' }, apiEnabled: {} }, 'ADMIN')).toBe(false);
  });

  it('does not honor the override for a non-admin role, even if the field is present', () => {
    expect(hasOwnTextKey({ aiPreferences: { textModel: 'gpt-4o', forceLocalText: true }, apiKeys: { openai: 'key' }, apiEnabled: {} }, 'PLAYER')).toBe(true);
  });
});

describe('hasOwnImageKey', () => {
  it('is false when the player has no imageModel preference', () => {
    expect(hasOwnImageKey()).toBe(false);
  });

  it('is true when the matching provider key is present and enabled', () => {
    expect(hasOwnImageKey({ aiPreferences: { imageModel: 'dall-e-3' }, apiKeys: { openai: 'key' }, apiEnabled: {} })).toBe(true);
  });

  it('is false when the key is missing', () => {
    expect(hasOwnImageKey({ aiPreferences: { imageModel: 'dall-e-3' }, apiKeys: {}, apiEnabled: {} })).toBe(false);
  });

  it('ignores a real own key when an ADMIN has the personal override on', () => {
    expect(hasOwnImageKey({ aiPreferences: { imageModel: 'dall-e-3', forceLocalImage: true }, apiKeys: { openai: 'key' }, apiEnabled: {} }, 'ADMIN')).toBe(false);
  });
});
