import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

interface UseProfileBootstrapParams {
  hasHydrated: boolean;
  authStatus: string;
  setCustomThemes: (themes: any) => void;
  setActiveTheme: (id: string) => void;
}

/**
 * Fetches AI provider/model status and the player's profile (themes, Spotify
 * connection) once the store has hydrated and the session is authenticated.
 */
export function useProfileBootstrap({ hasHydrated, authStatus, setCustomThemes, setActiveTheme }: UseProfileBootstrapParams) {
  const [aiModels, setAiModels] = useState<{ text?: string, image?: string }>({});
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);

  useEffect(() => {
    if (hasHydrated && authStatus === 'authenticated') {
      // AI Status
      fetch('/api/ai-status')
        .then(r => r.json())
        .then(data => {
          setAiModels({
            text: data.text?.model || data.text,
            image: data.image?.model || data.image
          });
        })
        .catch(() => {});

      // Profile (Themes)
      fetch('/api/auth/profile')
        .then(r => r.json())
        .then(data => {
          if (data.customThemes) {
            setCustomThemes(data.customThemes);
          }
          if (data.activeThemeId) {
            setActiveTheme(data.activeThemeId);
          }
          if (data.apiKeys && data.apiKeys.spotifyAccessToken) {
            setIsSpotifyConnected(true);
          } else {
            setIsSpotifyConnected(false);
          }
        })
        .catch(err => logger.error("PROFILE_HYDRATION_ERR:", err));
    }
  }, [hasHydrated, authStatus, setCustomThemes, setActiveTheme]);

  return { aiModels, isSpotifyConnected };
}
