import { useEffect } from 'react';
import { toast } from 'sonner';
import { NarrativeScene } from '@/types';
import { SPOTIFY_THEMES } from '@/lib/audio/spotifyPlaylists';
import { logger } from '@/lib/logger';

interface UseSpotifyMoodSyncParams {
  isGameStarted: boolean;
  currentScene: NarrativeScene | null | undefined;
  isSpotifyConnected: boolean;
  genre: string | undefined;
  playInBrowser: boolean;
}

/**
 * Triggers Spotify playback of a mood-matched playlist whenever the current
 * scene's audio mood changes, for players with Spotify connected.
 *
 * Gated on `playInBrowser`: without it, this would call the Spotify Web API's
 * play endpoint with no deviceId, which targets whichever device is currently
 * active — hijacking playback on the player's phone/desktop just from opening
 * a session. Only opt in (by flipping "Tocar neste Navegador") should do that.
 */
export function useSpotifyMoodSync({ isGameStarted, currentScene, isSpotifyConnected, genre, playInBrowser }: UseSpotifyMoodSyncParams) {
  useEffect(() => {
    if (!isGameStarted || !currentScene || !isSpotifyConnected || !playInBrowser) return;

    const normalizedGenre = genre?.toLowerCase() || 'fantasy';
    const mood = currentScene.audioTheme?.mood || 'exploration';
    const playlistUri = SPOTIFY_THEMES[normalizedGenre]?.[mood];

    if (playlistUri) {
      logger.log(`LOG: Triggering Spotify playback [Genre: ${normalizedGenre}, Mood: ${mood}]`);
      fetch('/api/audio/spotify/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contextUri: playlistUri })
      })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          if (data.code === 'NO_ACTIVE_DEVICE') {
            toast.warning("Spotify: Nenhum dispositivo ativo encontrado. Abra o app do Spotify e dê play.");
          } else if (data.code === 'NOT_PREMIUM') {
            toast.error("Spotify: Controle de player exige conta Spotify Premium.");
          } else {
            logger.warn("Spotify Playback warning:", data.error);
          }
        }
      })
      .catch((err) => {
        logger.warn("Spotify Playback critical warning:", err);
      });
    }
  }, [currentScene?.sceneId, isSpotifyConnected, isGameStarted, genre, playInBrowser]);
}
