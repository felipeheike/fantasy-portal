import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PlayerStatus, InventoryItem, NarrativeScene, JourneySettings, GameNotification, StatusLogEntry } from '@/types';

interface GameState {
  status: PlayerStatus;
  inventory: InventoryItem[];
  history: NarrativeScene[];
  currentScene: NarrativeScene | null;
  settings: JourneySettings | null;
  currentJourneyId: string | null;
  flags: Record<string, any>; // World Knowledge Graph
  memories: string[]; // Key lore points
  notificationHistory: GameNotification[]; // Log of all events
  statusHistory: StatusLogEntry[]; // New: Battle log for HP/SP
  impersonatedPlayerId: string | null; // Supervision mode
  impersonatedPlayerName: string | null; // Supervision feedback
  isGameStarted: boolean;
  isSetupMode: boolean;
  hasHydrated: boolean;
  lastPendingChoice: string | null;
  lockedItemName: string | null;
  theme: 'light' | 'dark';
  forcedNextAction: string | null; // Admin tool: Force next scene type
  forcedEndingType: string | null; // Admin tool: Force ending type
  showDebugInfo: boolean; // Admin tool: Show AI models and latency
  readingMode: boolean; // Immersion: Hide all UI except narrative
  
  // Actions
  setHasHydrated: (state: boolean) => void;
  setSettings: (settings: JourneySettings) => void;
  setSetupMode: (state: boolean) => void;
  updateSettings: (settings: Partial<JourneySettings>) => void;
  setJourneyId: (id: string, initialFlags?: any) => void;
  startGame: () => void;
  loadJourney: (id: string, data: any) => void;
  updateStatus: (changes: Partial<PlayerStatus>) => void;
  addItem: (item: InventoryItem) => void;
  removeItem: (itemId: string) => void;
  discardItem: (itemId: string) => void;
  setLockedItem: (itemName: string | null) => void;
  completeScene: (scene: NarrativeScene, statusChanges?: any) => void;
  setPendingChoice: (choice: string) => void;
  updateSceneImage: (sceneId: string, imageUrl: string) => void;
  updateSceneAudio: (sceneId: string, audioUrl: string) => void;
  setImageError: (sceneId: string, hasError: boolean) => void;
  setImageLoading: (sceneId: string, isLoading: boolean) => void;
  setAudioError: (sceneId: string, hasError: boolean) => void;
  setAudioLoading: (sceneId: string, isLoading: boolean) => void;
  addNotification: (notification: Omit<GameNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationsAsRead: () => void;
  clearNotifications: () => void;
  useInsightPoint: () => void;
  addInquiryToCurrentScene: (question: string, answer: string) => void;
  restoreInsightWithPotion: (potionId: string) => boolean;
  restoreInsightWithSacrifice: () => boolean;
  startImpersonation: (id: string, name: string) => void;
  stopImpersonation: () => void;
  toggleTheme: () => void;
  setForcedNextAction: (type: string | null) => void;
  setForcedEndingType: (type: string | null) => void;
  toggleShowDebugInfo: () => void;
  toggleReadingMode: () => void;
  revivePlayer: () => void;
  resetGame: () => void;
}

const INITIAL_INSIGHT_POINTS = Number(process.env.NEXT_PUBLIC_INITIAL_INSIGHT_POINTS || 5);

const initialStatus: PlayerStatus = {
  hp: 20,
  maxHp: 20,
  sp: 15,
  maxSp: 15,
  combatPower: 10,
  moral: 0,
  skills: [],
  reputations: {},
  insightPoints: INITIAL_INSIGHT_POINTS,
  deathCount: 0,
};

export const INVENTORY_CAPACITY = 10;
export const MAX_NOTIFICATIONS = 50;
export const MAX_LOG_ENTRIES = 100;

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      status: initialStatus,
      inventory: [],
      history: [],
      currentScene: null,
      settings: null,
      currentJourneyId: null,
      flags: {},
      memories: [],
      notificationHistory: [],
      statusHistory: [],
      impersonatedPlayerId: null,
      impersonatedPlayerName: null,
      isGameStarted: false,
      isSetupMode: false,
      hasHydrated: false,
      lastPendingChoice: null,
      lockedItemName: null,
      theme: 'dark',
      forcedNextAction: null,
      forcedEndingType: null,
      showDebugInfo: false,
      readingMode: false,

      setHasHydrated: (state) => set({ hasHydrated: state }),
      setSettings: (settings) => set({ settings }),
      setSetupMode: (state) => set({ isSetupMode: state }),
      updateSettings: (newSettings) => set((state) => ({
        settings: state.settings ? { ...state.settings, ...newSettings } : null
      })),
      setJourneyId: (id, initialFlags) => set((state) => ({ 
        currentJourneyId: id,
        flags: initialFlags ? { ...state.flags, ...initialFlags } : state.flags
      })),
      startGame: () => set({ isGameStarted: true, isSetupMode: false }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setForcedNextAction: (type) => set({ forcedNextAction: type }),
      setForcedEndingType: (type) => set({ forcedEndingType: type }),

      toggleShowDebugInfo: () => set((state) => ({ showDebugInfo: !state.showDebugInfo })),

      toggleReadingMode: () => set((state) => ({ readingMode: !state.readingMode })),

      loadJourney: (id, data) => {
        console.log("STORE: Loading Journey", id);
        const loadedHistory = data.history || [];
        const playerData = data.player || {};
        const rawInventory = (playerData.inventory || []) as InventoryItem[];
        const deduplicatedInventory = rawInventory.reduce((acc: InventoryItem[], item) => {
          const existing = acc.find(i => i.id === item.id);
          if (existing) {
            existing.quantity += (item.quantity || 1);
            if (item.durability !== undefined) existing.durability = item.durability;
          } else {
            acc.push({ ...item, quantity: item.quantity || 1 });
          }
          return acc;
        }, []);

        const loadedStatus = playerData.status || initialStatus;

        set({
          currentJourneyId: id,
          isGameStarted: true,
          isSetupMode: false,
          settings: {
            playerName: data.flags?.playerName || playerData.name,
            genre: data.genre,
            ...data.settings,
            narrativeDetail: data.settings?.narrativeDetail || 'medium',
            enableImages: data.settings?.enableImages ?? data.flags?.enableImages ?? true,
            enableAudio: data.settings?.enableAudio ?? data.flags?.enableAudio ?? true,
            autoPlayAudio: data.settings?.autoPlayAudio ?? data.flags?.autoPlayAudio ?? false,
          } as JourneySettings,
          history: loadedHistory,
          currentScene: loadedHistory.length > 0 ? loadedHistory[loadedHistory.length - 1] : null,
          status: {
            ...loadedStatus,
            reputations: loadedStatus.reputations || {},
            insightPoints: loadedStatus.insightPoints ?? INITIAL_INSIGHT_POINTS,
            deathCount: loadedStatus.deathCount ?? 0
          },
          inventory: deduplicatedInventory,
          flags: data.flags || {},
          memories: data.memories || [],
          notificationHistory: data.settings?.notificationHistory || [],
          statusHistory: data.settings?.statusHistory || [],
          forcedNextAction: null,
          forcedEndingType: null,
        });
      },

      updateStatus: (changes) => 
        set((state) => {
          const newHp = Math.max(0, Math.min(state.status.maxHp, (changes.hp !== undefined ? changes.hp : state.status.hp)));
          const newSp = Math.max(0, Math.min(state.status.maxSp, (changes.sp !== undefined ? changes.sp : state.status.sp)));
          
          let updatedReputations = { ...(state.status.reputations || {}) };
          if ((changes as any).reputations) {
            Object.entries((changes as any).reputations).forEach(([name, value]: [string, any]) => {
              updatedReputations[name] = (updatedReputations[name] || 0) + value;
            });
          }

          return {
            status: { 
              ...state.status, 
              ...changes,
              hp: newHp,
              sp: newSp,
              moral: state.status.moral + (changes.moral || 0),
              reputations: updatedReputations
            }
          };
        }),

      setPendingChoice: (choice) => set({ lastPendingChoice: choice }),

      addItem: (item) =>
        set((state) => {
          const existingIndex = state.inventory.findIndex(i => i.id === item.id);
          if (existingIndex > -1) {
            const updatedInventory = [...state.inventory];
            updatedInventory[existingIndex] = {
              ...updatedInventory[existingIndex],
              quantity: updatedInventory[existingIndex].quantity + (item.quantity || 1)
            };
            return { inventory: updatedInventory };
          }
          if (state.inventory.length >= INVENTORY_CAPACITY) return state;
          return {
            inventory: [...state.inventory, { ...item, quantity: item.quantity || 1 }]
          };
        }),

      removeItem: (itemId) =>
        set((state) => ({
          inventory: state.inventory.filter((i) => i.id !== itemId)
        })),

      discardItem: (itemId) =>
        set((state) => {
          const item = state.inventory.find(i => i.id === itemId);
          if (item?.type === 'quest' || item?.name === state.lockedItemName) return state;
          return {
            inventory: state.inventory.filter((i) => i.id !== itemId)
          };
        }),

      setLockedItem: (itemName) => set({ lockedItemName: itemName }),

      completeScene: (scene, statusChanges) =>
        set((state) => {
          let updatedStatus = { ...state.status };
          let newLogEntries: StatusLogEntry[] = [];

          if (statusChanges) {
            // Detect HP change for Log
            if (statusChanges.hp !== undefined) {
              const diff = statusChanges.hp - state.status.hp;
              if (diff !== 0) {
                newLogEntries.push({
                  id: `log-hp-${Date.now()}`,
                  type: 'hp',
                  amount: diff,
                  source: statusChanges.hpSource || (diff < 0 ? "Inimigo Desconhecido" : "Cura"),
                  timestamp: Date.now(),
                  sceneId: scene.sceneId
                });
              }
              updatedStatus.hp = Math.max(0, Math.min(state.status.maxHp, statusChanges.hp));
            }

            // Detect SP change for Log
            if (statusChanges.sp !== undefined) {
              const diff = statusChanges.sp - state.status.sp;
              if (diff !== 0) {
                newLogEntries.push({
                  id: `log-sp-${Date.now()}`,
                  type: 'sp',
                  amount: diff,
                  source: statusChanges.spSource || (diff < 0 ? "Ação Exaustiva" : "Recuperação"),
                  timestamp: Date.now(),
                  sceneId: scene.sceneId
                });
              }
              updatedStatus.sp = Math.max(0, Math.min(state.status.maxSp, statusChanges.sp));
            }

            updatedStatus.combatPower = statusChanges.combatPower !== undefined ? statusChanges.combatPower : state.status.combatPower;
            updatedStatus.moral = state.status.moral + (statusChanges.moral || 0);

            if (statusChanges.reputations) {
              const reps = { ...(updatedStatus.reputations || {}) };
              Object.entries(statusChanges.reputations).forEach(([name, val]: [string, any]) => {
                reps[name] = (reps[name] || 0) + val;
              });
              updatedStatus.reputations = reps;
            }
          }
          
          let updatedFlags = { ...state.flags };
          let updatedMemories = [...state.memories];

          if (scene.worldUpdate) {
            if (scene.worldUpdate.flags) updatedFlags = { ...updatedFlags, ...scene.worldUpdate.flags };
            if (scene.worldUpdate.memories) {
              scene.worldUpdate.memories.forEach(m => {
                if (!updatedMemories.includes(m)) updatedMemories.push(m);
              });
            }
          }

          let updatedInventory = [...state.inventory];
          if (scene.inventoryChanges) {
            if (scene.inventoryChanges.removed) {
              updatedInventory = updatedInventory.filter(item => 
                !scene.inventoryChanges!.removed.some(nameToRemove => 
                  item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === 
                  nameToRemove.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                )
              );
            }
            if (scene.inventoryChanges.added) {
              scene.inventoryChanges.added.forEach(newItem => {
                const existingIndex = updatedInventory.findIndex(i => i.id === newItem.id);
                if (existingIndex > -1) {
                  const currentItem = updatedInventory[existingIndex];
                  updatedInventory[existingIndex] = { ...currentItem, ...newItem, quantity: currentItem.quantity + (newItem.quantity || 1) };
                } else if (updatedInventory.length < INVENTORY_CAPACITY) {
                  updatedInventory.push({ ...newItem, quantity: newItem.quantity || 1 });
                }
              });
            }
          }

          if (scene.skillChanges) {
            scene.skillChanges.forEach(newSkill => {
              const existingIndex = updatedStatus.skills.findIndex(s => s.id === newSkill.id);
              if (existingIndex > -1) updatedStatus.skills[existingIndex] = { ...updatedStatus.skills[existingIndex], ...newSkill };
              else updatedStatus.skills.push(newSkill);
            });
          }

          const updatedHistory = [...state.history];
          if (updatedHistory.length > 0 && state.lastPendingChoice) {
            updatedHistory[updatedHistory.length - 1] = { ...updatedHistory[updatedHistory.length - 1], selectedOption: state.lastPendingChoice };
          }

          return {
            currentScene: scene,
            history: [...updatedHistory, scene],
            status: updatedStatus,
            inventory: updatedInventory,
            flags: updatedFlags,
            memories: updatedMemories,
            statusHistory: [...newLogEntries, ...state.statusHistory].slice(0, MAX_LOG_ENTRIES),
            lastPendingChoice: null,
            lockedItemName: null,
            forcedNextAction: null,
            forcedEndingType: null // Clear forced ending after scene completion
          };
        }),

      updateSceneImage: (sceneId, imageUrl) =>
        set((state) => ({
          history: state.history.map((scene) => scene.sceneId === sceneId ? { ...scene, imageUrl, imageError: false } : scene),
          currentScene: state.currentScene?.sceneId === sceneId ? { ...state.currentScene, imageUrl, imageError: false } : state.currentScene
        })),

      updateSceneAudio: (sceneId, audioUrl) =>
        set((state) => ({
          history: state.history.map((scene) => scene.sceneId === sceneId ? { ...scene, audioUrl, audioError: false } : scene),
          currentScene: state.currentScene?.sceneId === sceneId ? { ...state.currentScene, audioUrl, audioError: false } : state.currentScene
        })),

      setImageError: (sceneId, hasError) =>
        set((state) => ({
          history: state.history.map((scene) => scene.sceneId === sceneId ? { ...scene, imageError: hasError } : scene),
          currentScene: state.currentScene?.sceneId === sceneId ? { ...state.currentScene, imageError: hasError } : state.currentScene
        })),

      setImageLoading: (sceneId, isLoading) =>
        set((state) => ({
          history: state.history.map((scene) => scene.sceneId === sceneId ? { ...scene, imageLoading: isLoading } : scene),
          currentScene: state.currentScene?.sceneId === sceneId ? { ...state.currentScene, imageLoading: isLoading } : state.currentScene
        })),

      setAudioError: (sceneId, hasError) =>
        set((state) => ({
          history: state.history.map((scene) => scene.sceneId === sceneId ? { ...scene, audioError: hasError } : scene),
          currentScene: state.currentScene?.sceneId === sceneId ? { ...state.currentScene, audioError: hasError } : state.currentScene
        })),

      setAudioLoading: (sceneId, isLoading) =>
        set((state) => ({
          history: state.history.map((scene) => scene.sceneId === sceneId ? { ...scene, audioLoading: isLoading } : scene),
          currentScene: state.currentScene?.sceneId === sceneId ? { ...state.currentScene, audioLoading: isLoading } : state.currentScene
        })),

      addNotification: (notification) => 
        set((state) => {
          const newNotif = { 
            ...notification, 
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
            timestamp: Date.now(), 
            read: false 
          };
          return { notificationHistory: [newNotif, ...state.notificationHistory].slice(0, MAX_NOTIFICATIONS) };
        }),

      markNotificationsAsRead: () => set((state) => ({ notificationHistory: state.notificationHistory.map(n => ({ ...n, read: true })) })),
      clearNotifications: () => set({ notificationHistory: [] }),

      useInsightPoint: () => set((state) => ({
        status: { ...state.status, insightPoints: Math.max(0, state.status.insightPoints - 1) }
      })),

      addInquiryToCurrentScene: (question, answer) => set((state) => {
        if (!state.currentScene) return state;
        
        const newInquiry = { question, answer, timestamp: Date.now() };
        const updatedInquiries = [...(state.currentScene.inquiries || []), newInquiry];
        
        const updatedScene = { ...state.currentScene, inquiries: updatedInquiries };
        const updatedHistory = [...state.history];
        
        if (updatedHistory.length > 0) {
          updatedHistory[updatedHistory.length - 1] = updatedScene;
        }

        return {
          currentScene: updatedScene,
          history: updatedHistory
        };
      }),

      restoreInsightWithPotion: (potionId) => {
        const state = get();
        const itemIndex = state.inventory.findIndex(i => i.id === potionId);
        if (itemIndex === -1) return false;

        const updatedInventory = [...state.inventory];
        const item = updatedInventory[itemIndex];
        
        if (item.quantity > 1) {
          updatedInventory[itemIndex] = { ...item, quantity: item.quantity - 1 };
        } else {
          updatedInventory.splice(itemIndex, 1);
        }

        set({
          inventory: updatedInventory,
          status: { ...state.status, insightPoints: state.status.insightPoints + 2 }
        });
        return true;
      },

      restoreInsightWithSacrifice: () => {
        const state = get();
        if (state.status.hp < 5) return false;

        const newHp = state.status.hp - 4;
        const newLogEntry: StatusLogEntry = {
          id: `log-hp-sacrifice-${Date.now()}`,
          type: 'hp',
          amount: -4,
          source: "Sacrifício por Conhecimento",
          timestamp: Date.now(),
          sceneId: state.currentScene?.sceneId
        };

        set({
          status: { ...state.status, hp: newHp, insightPoints: state.status.insightPoints + 1 },
          statusHistory: [newLogEntry, ...state.statusHistory].slice(0, MAX_LOG_ENTRIES)
        });
        return true;
      },

      startImpersonation: (id, name) => set({ impersonatedPlayerId: id, impersonatedPlayerName: name }),
      stopImpersonation: () => set({ impersonatedPlayerId: null, impersonatedPlayerName: null }),

      revivePlayer: () => {
        const state = get();
        if (!state.currentScene) return;

        const newHp = Math.ceil(state.status.maxHp * 0.5);
        const updatedStatus = { 
          ...state.status, 
          hp: newHp, 
          deathCount: state.status.deathCount + 1 
        };

        const revivedScene = { ...state.currentScene, isGameOver: false };
        const updatedHistory = [...state.history];
        if (updatedHistory.length > 0) {
          updatedHistory[updatedHistory.length - 1] = revivedScene;
        }

        set({
          status: updatedStatus,
          currentScene: revivedScene,
          history: updatedHistory
        });

        get().addNotification({
          type: 'status',
          title: '✨ Renascimento',
          description: 'A poeira foi removida e você retornou à jogada.'
        });
      },

      resetGame: () => {
        set((state) => ({
          status: initialStatus,
          inventory: [],
          history: [],
          currentScene: null,
          settings: null,
          currentJourneyId: null,
          flags: {},
          memories: [],
          notificationHistory: [],
          statusHistory: [],
          // Preserve supervision mode
          impersonatedPlayerId: state.impersonatedPlayerId,
          impersonatedPlayerName: state.impersonatedPlayerName,
          isGameStarted: false,
          isSetupMode: false,
          lastPendingChoice: null,
          lockedItemName: null,
          hasHydrated: true,
          theme: state.theme,
          forcedNextAction: null,
          forcedEndingType: null
        }));
      },
    }),
    {
      name: 'fantasy-portal-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => { state?.setHasHydrated(true); },
      partialize: (state) => ({ 
        currentJourneyId: state.currentJourneyId,
        isGameStarted: state.isGameStarted,
        isSetupMode: state.isSetupMode,
        settings: state.settings,
        status: state.status,
        inventory: state.inventory,
        history: state.history,
        currentScene: state.currentScene,
        lastPendingChoice: state.lastPendingChoice,
        flags: state.flags,
        memories: state.memories,
        notificationHistory: state.notificationHistory,
        statusHistory: state.statusHistory,
        impersonatedPlayerId: state.impersonatedPlayerId,
        impersonatedPlayerName: state.impersonatedPlayerName,
        theme: state.theme,
        forcedNextAction: state.forcedNextAction,
        forcedEndingType: state.forcedEndingType
      }),
    }
  )
);
