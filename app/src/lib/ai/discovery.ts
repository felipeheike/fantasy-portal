import { decrypt } from '../security';

export interface AIModelDiscovery {
  id: string;
  name: string;
  provider: 'google' | 'openai' | 'anthropic';
  type: 'text' | 'image' | 'audio';
}

/**
 * Fetches available models from Google Gemini API
 */
async function discoverGoogleModels(encryptedKey: string): Promise<AIModelDiscovery[]> {
  const apiKey = decrypt(encryptedKey);
  if (!apiKey) return [];

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!res.ok) return [];

    const data = await res.json();
    const models: AIModelDiscovery[] = [];

    (data.models || []).forEach((m: any) => {
      const id = m.name.replace('models/', '');
      const name = m.displayName || id;

      // Text models
      if (m.supportedGenerationMethods?.includes('generateContent')) {
        models.push({ id, name, provider: 'google', type: 'text' });
      }

      // Audio (Gemini 2.x supports TTS natively but we map it here if detected)
      if (id.includes('tts') || id.includes('audio')) {
        models.push({ id, name: `${name} (Voice)`, provider: 'google', type: 'audio' });
      }
      
      // Image: Google standard API doesn't usually list Imagen yet, 
      // but we can add it if it appears in the future or keep gemini as text-only for now.
    });

    return models;
  } catch (err) {
    console.error('DISCOVER_GOOGLE_ERR:', err);
    return [];
  }
}

/**
 * Fetches available models from OpenAI API
 */
async function discoverOpenAIModels(encryptedKey: string): Promise<AIModelDiscovery[]> {
  const apiKey = decrypt(encryptedKey);
  if (!apiKey) return [];

  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    if (!res.ok) return [];

    const data = await res.json();
    const models: AIModelDiscovery[] = [];

    (data.data || []).forEach((m: any) => {
      // Text
      if (m.id.startsWith('gpt-4') || m.id.startsWith('gpt-3.5') || m.id.startsWith('o1-') || m.id.startsWith('o3-')) {
        models.push({ id: m.id, name: m.id.toUpperCase(), provider: 'openai', type: 'text' });
      } 
      // Image
      else if (m.id.startsWith('dall-e-')) {
        models.push({ id: m.id, name: `DALL-E ${m.id.split('-')[2] || m.id}`, provider: 'openai', type: 'image' });
      }
      // Audio
      else if (m.id.startsWith('tts-1')) {
        // Map generic tts-1 to specific voices if needed, or just list the base models
        models.push({ id: m.id, name: `OpenAI ${m.id.toUpperCase()}`, provider: 'openai', type: 'audio' });
      }
    });

    return models;
  } catch (err) {
    console.error('DISCOVER_OPENAI_ERR:', err);
    return [];
  }
}

/**
 * Fetches available models from Anthropic API
 */
async function discoverAnthropicModels(encryptedKey: string): Promise<AIModelDiscovery[]> {
  const apiKey = decrypt(encryptedKey);
  if (!apiKey) return [];

  try {
    // Anthropic API for listing models
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: { 
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    });
    if (!res.ok) return [];

    const data = await res.json();
    return (data.data || [])
      .filter((m: any) => m.type === 'model')
      .map((m: any) => ({
        id: m.id,
        name: m.display_name || m.id,
        provider: 'anthropic',
        type: 'text'
      }));
  } catch (err) {
    console.error('DISCOVER_ANTHROPIC_ERR:', err);
    return [];
  }
}

/**
 * Consolidates models from all providers based on user keys
 */
export async function discoverAllModels(userKeys: Record<string, string>): Promise<AIModelDiscovery[]> {
  const discoveries: Promise<AIModelDiscovery[]>[] = [];

  if (userKeys.gemini) discoveries.push(discoverGoogleModels(userKeys.gemini));
  if (userKeys.openai) discoveries.push(discoverOpenAIModels(userKeys.openai));
  if (userKeys.anthropic) discoveries.push(discoverAnthropicModels(userKeys.anthropic));

  const results = await Promise.all(discoveries);
  return results.flat();
}
