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
}

/**
 * Triggers Spotify playback of a mood-matched playlist whenever the current
 * scene's audio mood changes, for players with Spotify connected.
 */
export function useSpotifyMoodSync({ isGameStarted, currentScene, isSpotifyConnected, genre }: UseSpotifyMoodSyncParams) {
  useEffect(() => {
    if (!isGameStarted || !currentScene || !isSpotifyConnected) return;

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
  }, [currentScene?.sceneId, isSpotifyConnected, isGameStarted, genre]);
}
