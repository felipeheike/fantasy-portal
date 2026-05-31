'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import NarrativePanel from '@/components/game/NarrativePanel';
import ActionOrchestrator from '@/components/game/ActionOrchestrator';
import PlayerStatusBar from '@/components/game/PlayerStatusBar';
import InventoryPanel from '@/components/game/InventoryPanel';
import SkillsPanel from '@/components/game/SkillsPanel';
import InfluencePanel from '@/components/game/InfluencePanel';
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
    actions: z.array(z.object({ 
      id: z.string(), 
      label: z.string(), 
      group: z.enum(['offensive', 'defensive']),
      requiresItem: z.boolean().optional(),
      itemType: z.enum(['weapon', 'armor', 'consumable', 'quest']).optional()
    })),
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
  statusChanges: z.object({ 
    hp: z.number().optional(), 
    sp: z.number().optional(), 
    combatPower: z.number().optional(), 
    moral: z.number().optional(),
    reputations: z.record(z.number()).optional()
  }).optional(),
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
  worldUpdate: z.object({
    flags: z.record(z.any()).optional(),
    memories: z.array(z.string()).optional()
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
  const [isInfluenceOpen, setIsInfluenceOpen] = useState(false);
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
  }, [currentJourneyId, updateSceneImage, setImageError]);

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

    if (prompt) setPendingChoice(prompt);

    const messages = [
      ...history.map(s => ([
        { role: 'assistant' as const, content: s.narration },
        { role: 'user' as const, content: s.selectedOption || '' }
      ])).flat(),
      { role: 'user' as const, content: prompt }
    ].filter(m => m.content);

    submit({ messages, playerContext });
  }, [isLoading, history, currentScene, object, playerContext, submit, setPendingChoice]);

  // DB Record Creation & Persistence Sync
  useEffect(() => {
    if (isGameStarted && !currentJourneyId && !creationInProgress.current) {
      console.log("FLOW: Creating new DB record...");
      creationInProgress.current = true;
      fetch('/api/journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...settings, 
          playerName: settings?.playerName || 'Viajante'
        })
      })
      .then(async r => {
        const data = await r.json();
        if (r.ok) {
          setJourneyId(data.id);
          console.log("FLOW: DB Record Created ID:", data.id);
        }
      })
      .finally(() => {
        creationInProgress.current = false;
      });
    }
  }, [isGameStarted, currentJourneyId, settings, setJourneyId]);

  // Sync state to DB on changes
  useEffect(() => {
    if (currentJourneyId && history.length > 0) {
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
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [history, status, inventory, currentJourneyId, flags, memories, settings]);

  // Auto-trigger first scene
  useEffect(() => {
    if (isGameStarted && currentJourneyId && history.length === 0 && !isLoading && !object && !initialTriggerDone.current) {
      initialTriggerDone.current = true;
      triggerAI(`Inicie a jornada para ${settings?.playerName}`);
    }
  }, [isGameStarted, currentJourneyId, history.length, isLoading, object, triggerAI, settings?.playerName]);

  if (!hasHydrated) return null;

  if (!isGameStarted) {
    return (
      <div className="h-screen w-full bg-zinc-950 flex flex-col items-center justify-center p-10 font-sans selection:bg-primary/30">
        <MainMenu />
        <JourneySetup />
      </div>
    );
  }

  const isGameOver = object?.isGameOver || currentScene?.isGameOver || status.hp <= 0;

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-50 overflow-hidden font-sans relative">
      <ScreenEffects />
      <PlayerStatusBar 
        onToggleInventory={() => setIsInventoryOpen(true)} 
        onToggleSkills={() => setIsSkillsOpen(true)}
        onToggleInfluence={() => setIsInfluenceOpen(true)}
      />

      <main className="flex-1 flex flex-col relative z-20">
        <div className="absolute top-4 left-4 z-50 flex gap-2">
          <button 
            onClick={() => setIsDetailsOpen(true)}
            className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 hover:text-primary transition-all shadow-xl"
            title="Detalhes da Jornada"
          >
            <Settings2 className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => resetGame()}
            className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 hover:text-red-500 transition-all shadow-xl"
            title="Sair para o Menu"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {persistentError && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-6 p-4 bg-red-950/80 border border-red-500/50 rounded-2xl backdrop-blur-xl flex items-center gap-4 text-red-200 shadow-2xl"
            >
               <AlertCircle className="w-6 h-6 shrink-0" />
               <div className="flex-1 text-sm">
                  <p className="font-black uppercase tracking-widest text-[10px] mb-1">Perturbação no Portal</p>
                  {persistentError === 'LIMITE_COTA' 
                    ? 'O Mestre está exausto. Aguarde alguns segundos para continuar sua lenda.'
                    : persistentError
                  }
               </div>
               {persistentError === 'LIMITE_COTA' && (
                  <button 
                    onClick={() => {
                      setPersistentError(null);
                      const lastChoice = useGameStore.getState().lastPendingChoice;
                      if (lastChoice) triggerAI(lastChoice);
                    }}
                    className="p-2 bg-red-500 text-white rounded-lg text-xs font-black uppercase"
                  >
                    Tentar
                  </button>
               )}
            </motion.div>
          </div>
        )}

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

        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent z-30 pointer-events-none" />
        
        <AnimatePresence>
          {history.length === 0 && !isLoading && !object && (
            <motion.div 
              exit={{ opacity: 0, scale: 1.1 }}
              className="fixed inset-0 z-40 bg-zinc-950 flex flex-col items-center justify-center gap-6"
            >
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                 className="w-20 h-20 border-t-4 border-primary rounded-full shadow-[0_0_50px_rgba(245,158,11,0.2)]"
               />
               <p className="text-zinc-500 font-serif italic text-xl animate-pulse">Invocando o Destino...</p>
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
      </main>

      {/* Modals & Panels */}
      <InventoryPanel isOpen={isInventoryOpen} onClose={() => setIsInventoryOpen(false)} />
      <SkillsPanel isOpen={isSkillsOpen} onClose={() => setIsSkillsOpen(false)} />
      <InfluencePanel isOpen={isInfluenceOpen} onClose={() => setIsInfluenceOpen(false)} />
      <JourneyDetailsModal 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
        settings={settings}
        historyCount={history.length}
      />

      {/* Global Visual Overlays */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[url('/noise.svg')] mix-blend-soft-light z-0" />
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-zinc-950/80 z-1" />
    </div>
  );
}
