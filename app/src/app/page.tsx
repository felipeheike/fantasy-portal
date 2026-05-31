'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import NarrativePanel from '@/components/game/NarrativePanel';
import ActionOrchestrator from '@/components/game/ActionOrchestrator';
import PlayerStatusBar from '@/components/game/PlayerStatusBar';
import InventoryPanel from '@/components/game/InventoryPanel';
import SkillsPanel from '@/components/game/SkillsPanel';
import JourneySetup from '@/components/game/JourneySetup';
import MainMenu from '@/components/game/MainMenu';
import JourneyDetailsModal from '@/components/game/JourneyDetailsModal';
import ScreenEffects from '@/components/game/ScreenEffects';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';
import { NarrativeScene, NarrativeOption } from '@/types';
import { LogOut, AlertCircle, Sparkles, Settings2, Clock, Type, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const sceneSchema = z.object({
  sceneId: z.string(),
  narration: z.string(),
  visualDescription: z.string(),
  audioDescription: z.string().optional(),
  imageUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  recommendedInputType: z.enum(['binary', 'multiple', 'combined', 'interpretative']),
  options: z.array(z.object({ id: z.string(), label: z.string() })).optional(),
  tacticalOptions: z.object({
    actions: z.array(z.object({ id: z.string(), label: z.string(), group: z.enum(['offensive', 'defensive']) })),
    targets: z.array(z.object({ id: z.string(), label: z.string(), description: z.string().optional() })),
    availableItems: z.array(z.string()).optional(),
    availableSkills: z.array(z.string()).optional()
  }).optional(),
  tacticalMap: z.object({
    gridSize: z.object({ rows: z.number(), cols: z.number() }),
    entities: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['player', 'enemy', 'npc']),
      position: z.object({ x: z.number(), y: z.number() }),
      hp: z.number().optional(),
      maxHp: z.number().optional()
    })),
    environment: z.array(z.object({
      id: z.string(),
      type: z.enum(['wall', 'fire', 'water', 'obstacle']),
      position: z.object({ x: z.number(), y: z.number() })
    })).optional()
  }).optional(),
  statusChanges: z.object({ hp: z.number().optional(), sp: z.number().optional(), combatPower: z.number().optional(), moral: z.number().optional() }).optional(),
  inventoryChanges: z.object({
    added: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      quantity: z.number(),
      type: z.enum(['weapon', 'armor', 'consumable', 'quest'])
    })).optional(),
    removed: z.array(z.string()).optional()
  }).optional(),
  isGameOver: z.boolean(),
  requiresRoll: z.boolean().optional(),
});

export default function GamePage() {
  const {
    status, completeScene, currentScene, isGameStarted,
    settings, currentJourneyId, setJourneyId, history,
    inventory, resetGame, loadJourney, hasHydrated,
    setPendingChoice, addItem, removeItem, updateSceneImage, updateSceneAudio, setImageError,
    flags, memories
  } = useGameStore();

  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [persistentError, setPersistentError] = useState<string | null>(null);
  const [lastResponseTime, setLastResponseTime] = useState<number | null>(null);
  const [aiModels, setAiModels] = useState<{ text?: string, image?: string }>({});
  const startTimeRef = useRef<number | null>(null);

  // Fetch AI status for the footer
  useEffect(() => {
    if (hasHydrated) {
      fetch('/api/ai-status')
        .then(r => r.json())
        .then(data => {
          setAiModels({
            text: data.text.model,
            image: data.image.model
          });
        })
        .catch(() => {});
    }
  }, [hasHydrated]);

  // SEMAPHORES to block any unintended double-calls
  const initialTriggerDone = useRef(false);
  const creationInProgress = useRef(false);

  const playerContext = useMemo(() => ({
    status, // Full status including skills and moral
    inventory,
    settings,
    flags,
    memories,
    lastSceneId: currentScene?.sceneId,
    sceneCount: history.length // Actual total count
  }), [status, inventory, settings, currentScene?.sceneId, history.length, flags, memories]);

  const generateSceneImage = useCallback((sceneId: string, prompt: string) => {
    setImageError(sceneId, false);
    fetch('/api/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, journeyId: currentJourneyId, sceneId })
    })
    .then(async r => {
      if (r.ok) {
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        updateSceneImage(sceneId, url);
      } else {
        setImageError(sceneId, true);
      }
    })
    .catch(e => {
      console.error("IMAGE_GEN_ERR:", e);
      setImageError(sceneId, true);
    });
  }, [updateSceneImage, setImageError]);

  const generateSceneAudio = useCallback((sceneId: string, text: string) => {
    fetch('/api/audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, journeyId: currentJourneyId, sceneId })
    })
    .then(async r => {
      if (r.ok) {
        const { audioUrl } = await r.json();
        updateSceneAudio(sceneId, audioUrl);
      }
    })
    .catch(e => {
      console.error("AUDIO_GEN_ERR:", e);
    });
  }, [currentJourneyId, updateSceneAudio]);

  const { object, submit, isLoading, error, stop } = useObject({
    api: '/api/chat',
    schema: sceneSchema,
    onFinish: ({ object }) => {
      const endTime = Date.now();
      if (startTimeRef.current) {
        setLastResponseTime(endTime - startTimeRef.current);
      }

      console.log("LOG: AI Stream Finished. Received Object:", object);

      if (object) {
        const scene = object as unknown as NarrativeScene;
        
        // VALIDATION: Only complete if we have a real scene
        if (!scene.sceneId || !scene.narration) {
          console.error("!!! ABORT: Received partial or invalid scene object.", scene);
          setPersistentError("O Mestre se calou subitamente. Verifique sua cota ou conexão.");
          return;
        }

        // CRITICAL: Ensure we clear the choice association logic
        completeScene(scene, scene.statusChanges);
        console.log("LOG: completeScene called for ID:", scene.sceneId);

        // ASYNC: Trigger image generation
        if (settings?.enableImages && scene.visualDescription && scene.sceneId && scene.sceneId !== 'undefined') {
          generateSceneImage(scene.sceneId, scene.visualDescription);
        }

        // ASYNC: Trigger audio generation for narration
        if (settings?.enableAudio && scene.narration && scene.sceneId && scene.sceneId !== 'undefined') {
          generateSceneAudio(scene.sceneId, scene.narration);
        }

        setPersistentError(null);
      }
    },

    onError: (err) => {
      console.error("LOG: useObject Error Callback:", err);
      const msg = err.message || "";
      if (msg.includes('429') || msg.includes('quota') || msg.includes('limit')) {
        setPersistentError('LIMITE_COTA');
      } else {
        setPersistentError(msg || 'Erro inesperado no Portal.');
      }
    }
  });

  const triggerAI = useCallback((prompt: string) => {
    if (isLoading) return;
    
    startTimeRef.current = Date.now();
    const scene = (object as unknown as NarrativeScene) || currentScene;
    console.log(`LOG: Triggering AI [Prompt: ${prompt}] [Current Scene: ${scene?.sceneId}]`);

    // Build context-aware history for Gemini
    // We only send the text narration and the user's explicit choice
    const messageHistory = history.map(s => ([
      { role: 'assistant' as const, content: s.narration },
      { role: 'user' as const, content: s.selectedOption || 'Avançar' }
    ])).flat();

    // Add current prompt
    const messages = [...messageHistory, { role: 'user' as const, content: prompt }].slice(-14);

    setPendingChoice(prompt); // Link this prompt to the CURRENT scene being completed
    submit({ messages, playerContext });
  }, [isLoading, submit, playerContext, setPendingChoice, history, object, currentScene]);

  // EFFECT 1: RESTORE SESSION (Runs only once on load if needed)
  useEffect(() => {
    if (hasHydrated && isGameStarted && currentJourneyId && history.length === 0 && !isRestoring) {
      console.log("FLOW: Checking for history in DB...");
      setIsRestoring(true);
      fetch(`/api/journey`)
        .then(r => r.json())
        .then(journeys => {
          const current = journeys.find((j: any) => j.id === currentJourneyId);
          if (current && current.history?.length > 0) {
            console.log("FLOW: History found, loading state.");
            loadJourney(current.id, current);
            initialTriggerDone.current = true; // Mark as done since we have history
          }
          setIsRestoring(false);
        })
        .catch(() => setIsRestoring(false));
    }
  }, [hasHydrated, isGameStarted, currentJourneyId]); // Strict dependencies

  // EFFECT 2: CREATE NEW JOURNEY (Runs only if NO ID exists)
  useEffect(() => {
    if (hasHydrated && isGameStarted && settings && !currentJourneyId && !creationInProgress.current) {
      console.log("FLOW: Creating new DB record...");
      creationInProgress.current = true;
      fetch('/api/journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      .then(r => r.json())
      .then(data => {
        setJourneyId(data.id);
        creationInProgress.current = false;
      })
      .catch((err) => { 
        console.error("FLOW: Create journey failed", err);
        creationInProgress.current = false; 
      });
    }
  }, [hasHydrated, isGameStarted, settings, currentJourneyId, setJourneyId]);

  // EFFECT 3: DB PERSISTENCE (Saves progress)
  useEffect(() => {
    if (hasHydrated && currentJourneyId && !isLoading && !isRestoring && history.length > 0) {
      // Small debounce to avoid intermediate state syncing
      const timer = setTimeout(() => {
        console.log("DB_SYNC: Sending update to server...");
        fetch(`/api/journey/${currentJourneyId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            history, 
            playerStatus: status, 
            inventory,
            flags,
            memories,
            settings 
          })
        })
        .then(async r => {
          if (!r.ok) {
            const err = await r.json();
            console.error("Sync Failed:", err);
          } else {
            console.log("DB_SYNC: Success");
          }
        })
        .catch(e => console.error("Sync Error", e));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [history, status, inventory, currentJourneyId, hasHydrated, isLoading, isRestoring]);

  // EFFECT 5: LOGGING (Must be before early returns)
  useEffect(() => {
    const scene = (object as unknown as NarrativeScene) || currentScene;
    if (scene) {
      console.log(`LOG: Current Scene: ${scene.sceneId} | RequiresRoll: ${scene.requiresRoll}`);
    }
  }, [object, currentScene]);

  useEffect(() => {
    if (error) {
      console.error("LOG: Portal API Error:", error);
    }
  }, [error]);

  if (!hasHydrated) return null;
  if (!isGameStarted) return <MainMenu />;
  if (isGameStarted && !settings) return <JourneySetup />;

  if (isRestoring) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="text-zinc-500 animate-pulse font-serif italic text-xl">Retornando ao Portal...</div>
      </div>
    );
  }

  const isGameOver = object?.isGameOver || currentScene?.isGameOver || status.hp <= 0;

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-50 overflow-hidden font-sans relative">
      <ScreenEffects />
      <PlayerStatusBar onToggleInventory={() => setIsInventoryOpen(true)} onToggleSkills={() => setIsSkillsOpen(true)} />

      <main className="flex-1 flex flex-col relative z-20">
        <div className="absolute top-4 left-4 z-50 flex gap-2">
          <button 
            onClick={() => { 
              stop(); 
              initialTriggerDone.current = false; 
              creationInProgress.current = false;
              resetGame(); 
            }} 
            className="p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all group"
            title="Sair da Jornada"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </button>
          
          <button 
            onClick={() => setIsDetailsOpen(true)} 
            className="p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all group"
            title="Detalhes do Destino"
          >
            <Settings2 className="w-4 h-4 group-hover:rotate-45 transition-transform" />
          </button>
        </div>

        {/* Removed fixed game over overlay to allow history review */}

        <NarrativePanel onRetryImage={(sceneId, prompt) => generateSceneImage(sceneId, prompt)} />
        
        {/* Performance & Model Info */}
        <div className="fixed bottom-4 left-6 z-[45] flex items-center gap-4 opacity-30 hover:opacity-100 transition-opacity">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-full">
              <Type className="w-3 h-3 text-zinc-500" />
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">{aiModels.text || 'Carregando...'}</span>
           </div>
           <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-full">
              <Palette className="w-3 h-3 text-zinc-500" />
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">{aiModels.image || 'Carregando...'}</span>
           </div>
           {lastResponseTime && (
             <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-full">
                <Clock className="w-3 h-3 text-primary" />
                <span className="text-[8px] font-black uppercase tracking-widest text-primary">{lastResponseTime}ms</span>
             </div>
           )}
        </div>
        
        {/* Visual Fade to prevent text clashing with fixed bottom elements */}
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent z-30 pointer-events-none" />
        
        <AnimatePresence>
          {history.length === 0 && !isLoading && !object && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
               <button 
                 onClick={() => triggerAI(`Inicie a jornada para ${settings?.playerName}`)}
                 className="flex items-center gap-3 bg-primary text-zinc-950 px-10 py-5 rounded-3xl font-black uppercase tracking-[0.2em] shadow-[0_0_50px_rgba(245,158,11,0.2)] pointer-events-auto hover:scale-105 active:scale-95 transition-all"
               >
                 <Sparkles className="w-6 h-6 fill-current" />
                 Invocar Destino
               </button>
            </motion.div>
          )}
        </AnimatePresence>

        {(history.length > 0 || (isLoading && history.length === 0) || (!!object && history.length > 0)) && (
          <ActionOrchestrator 
            scene={object as unknown as NarrativeScene || currentScene} 
            onAction={(label) => triggerAI(label)} 
            isLoading={isLoading} 
          />
        )}

        {persistentError && (
          <div className="fixed inset-x-0 bottom-32 z-[100] flex justify-center px-4 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="bg-red-600/90 backdrop-blur-xl border border-red-500/50 p-6 rounded-[32px] flex flex-col gap-4 shadow-[0_20px_50px_rgba(220,38,38,0.5)] pointer-events-auto max-w-sm w-full"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-tighter text-white">
                    {persistentError === 'LIMITE_COTA' ? 'Limite de Cota Alcançado' : 'Portal Instável'}
                  </h3>
                  <p className="text-[11px] font-bold text-red-100 leading-relaxed">
                    {persistentError === 'LIMITE_COTA' 
                      ? 'O Mestre de Jogo (Gemini) atingiu o limite de requisições diárias da sua chave. Tente novamente em 24h ou faça o upgrade do seu plano no Google AI Studio.' 
                      : persistentError}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setPersistentError(null)}
                className="w-full bg-white text-red-600 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-100 transition-all"
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </main>

      <InventoryPanel isOpen={isInventoryOpen} onClose={() => setIsInventoryOpen(false)} />
      <SkillsPanel isOpen={isSkillsOpen} onClose={() => setIsSkillsOpen(false)} />
      <JourneyDetailsModal 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
        settings={settings} 
        historyCount={history.length}
      />
      
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[url('/noise.svg')] mix-blend-soft-light z-0" />
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-zinc-950/80 z-1" />
    </div>
  );
}
