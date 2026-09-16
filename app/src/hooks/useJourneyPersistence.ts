import { useEffect, useRef, RefObject } from 'react';
import { Session } from 'next-auth';
import { NarrativeScene, JourneySettings, PlayerStatus, InventoryItem, StatusLogEntry } from '@/types';
import { logger } from '@/lib/logger';

interface UseJourneyPersistenceParams {
  isGameStarted: boolean;
  currentJourneyId: string | null;
  settings: JourneySettings | null;
  setJourneyId: (id: string, flags?: any) => void;
  session: Session | null;
  impersonatedPlayerId: string | null;
  history: NarrativeScene[];
  status: PlayerStatus;
  inventory: InventoryItem[];
  statusHistory: StatusLogEntry[];
  flags: Record<string, any>;
  memories: string[];
  hasHydrated: boolean;
  authStatus: string;
  /** Shared with the caller's own reset effect (e.g. cleared when a new game starts). */
  creationInProgress: RefObject<boolean>;
}

/**
 * Creates the Journey DB record once a game starts, then keeps it in sync:
 * an append-only POST per new scene, plus a debounced PATCH for other
 * state changes (flags, memories, settings).
 */
export function useJourneyPersistence({
  isGameStarted, currentJourneyId, settings, setJourneyId, session, impersonatedPlayerId,
  history, status, inventory, statusHistory, flags, memories, hasHydrated, authStatus,
  creationInProgress
}: UseJourneyPersistenceParams) {
  // DB Record Creation
  useEffect(() => {
    if (isGameStarted && !currentJourneyId && !creationInProgress.current && session?.user) {
      creationInProgress.current = true;
      fetch('/api/journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          playerName: settings?.playerName || session.user.name || 'Viajante',
          impersonatedPlayerId
        })
      })
      .then(async r => {
        const data = await r.json();
        if (r.ok) {
          setJourneyId(data.id, data.flags);
        }
      })
      .finally(() => {
        creationInProgress.current = false;
      });
    }
  }, [isGameStarted, currentJourneyId, settings, setJourneyId, session, impersonatedPlayerId]);

  // Sync state to DB on changes
  const lastSyncedRef = useRef<string>('');
  const lastSyncedSceneIdRef = useRef<string>('');
  const syncInProgressRef = useRef<boolean>(false);

  useEffect(() => {
    if (currentJourneyId && history.length > 0 && hasHydrated && authStatus === 'authenticated') {
      const currentScene = history[history.length - 1];
      const isNewScene = currentScene.sceneId !== lastSyncedSceneIdRef.current;

      // Se for uma nova cena e não houver sincronização em curso para este ID específico
      if (isNewScene && !syncInProgressRef.current) {
        // Bloqueio imediato para evitar race conditions no re-render
        lastSyncedSceneIdRef.current = currentScene.sceneId;
        syncInProgressRef.current = true;

        fetch(`/api/journey/${currentJourneyId}/scenes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scene: currentScene,
            playerStatus: status,
            inventory,
            statusHistory,
            impersonatedPlayerId
          })
        })
        .then(() => {
          // Sincronização concluída
          lastSyncedRef.current = JSON.stringify({ history, status, inventory });
        })
        .catch(err => {
          logger.error("INCREMENTAL_SYNC_ERR:", err);
          // Em caso de erro, permitimos tentar novamente no próximo ciclo se o ID mudar
          lastSyncedSceneIdRef.current = '';
        })
        .finally(() => {
          syncInProgressRef.current = false;
        });
        return;
      }

      // Para outras mudanças (flags, memories, settings), mantemos o PATCH periódico
      const currentStateString = JSON.stringify({ history, status, inventory, flags, memories, settings });
      if (currentStateString === lastSyncedRef.current) return;

      const timer = setTimeout(() => {
        fetch(`/api/journey/${currentJourneyId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            history,
            playerStatus: status,
            inventory,
            flags,
            memories,
            settings,
            impersonatedPlayerId
          })
        })
        .then(() => {
          lastSyncedRef.current = currentStateString;
        })
        .catch(err => logger.error("DB_SYNC_ERR:", err));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [history, status, inventory, statusHistory, currentJourneyId, flags, memories, settings, hasHydrated, authStatus, impersonatedPlayerId]);
}
