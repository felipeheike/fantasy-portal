'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import NarrativePanel from '@/components/game/NarrativePanel';
import ActionOrchestrator from '@/components/game/ActionOrchestrator';
import PlayerStatusBar from '@/components/game/PlayerStatusBar';
import InventoryPanel from '@/components/game/InventoryPanel';
import SkillsPanel from '@/components/game/SkillsPanel';
import InfluencePanel from '@/components/game/InfluencePanel';
import NotificationsPanel from '@/components/game/NotificationsPanel';
import StatusLogPanel from '@/components/game/StatusLogPanel';
import InquiryPanel from '@/components/game/InquiryPanel';
import ForcePasswordChangeModal from '@/components/game/ForcePasswordChangeModal';
import JourneySetup from '@/components/game/JourneySetup';
import MainMenu from '@/components/game/MainMenu';
import JourneyDetailsModal from '@/components/game/JourneyDetailsModal';
import ScreenEffects from '@/components/game/ScreenEffects';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import { NarrativeScene, NarrativeOption, StatusLogEntry } from '@/types';
import { LogOut, AlertCircle, Sparkles, Settings2, Clock, Type, Palette, RefreshCcw, Package, ShieldAlert, ShieldCheck, Eye, X, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const sceneSchema = z.object({
  sceneId: z.string(),
  narration: z.string(),
  visualDescription: z.string(),
  audioDescription: z.string().optional(),
  imageUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  recommendedInputType: z.enum(['binary', 'multiple', 'combined', 'interpretative', 'puzzle']),
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
  puzzle: z.object({
    type: z.enum(['hangman', 'anagram', 'cipher', 'riddle']),
    solution: z.string(),
    hint: z.string(),
    displayData: z.string(),
    maxAttempts: z.number()
  }).optional(),
  statusChanges: z.object({ 
    hp: z.number().optional(), 
    hpSource: z.string().optional(),
    sp: z.number().optional(), 
    spSource: z.string().optional(),
    combatPower: z.number().optional(), 
    moral: z.number().optional(),
    reputations: z.record(z.string(), z.number()).optional()
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
    flags: z.record(z.string(), z.any()).optional(),
    memories: z.array(z.string()).optional()
  }).optional(),
  isGameOver: z.boolean(),
  requiresRoll: z.boolean().optional(),
});

export default function GamePage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [authStatus, router]);

  const {
    status, completeScene, currentScene, isGameStarted,
    settings, currentJourneyId, setJourneyId, history,
    inventory, resetGame, loadJourney, hasHydrated,
    setPendingChoice, addItem, removeItem, updateSceneImage, updateSceneAudio, setImageError,
    flags, memories, addNotification, impersonatedPlayerId, impersonatedPlayerName, stopImpersonation
  } = useGameStore();

  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);
  const [isInfluenceOpen, setIsInfluenceOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHPLogOpen, setIsHPLogOpen] = useState(false);
  const [isSPLogOpen, setIsSPLogOpen] = useState(false);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [persistentError, setPersistentError] = useState<string | null>(null);
  const [lastResponseTime, setLastResponseTime] = useState<number | null>(null);
  const [aiModels, setAiModels] = useState<{ text?: string, image?: string }>({});
  const startTimeRef = useRef<number | null>(null);

  // Reset semaphores when game is not started (to allow fresh starts)
  useEffect(() => {
    if (!isGameStarted) {
      initialTriggerDone.current = false;
      creationInProgress.current = false;
    }
  }, [isGameStarted]);

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
    sceneCount: history.length, // Actual total count
    forcedNextAction: useGameStore.getState().forcedNextAction
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

        // --- DETECT CHANGES FOR NOTIFICATIONS ---
        const currentInventory = [...useGameStore.getState().inventory];
        const currentStatus = { ...useGameStore.getState().status };

        // 1. Check for removed items (Consumption or Breaking)
        if (scene.inventoryChanges?.removed?.length) {
          scene.inventoryChanges.removed.forEach(nameToRemove => {
             const item = currentInventory.find(i => 
               i.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === 
               nameToRemove.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
             );
             if (item) {
               if (item.type === 'consumable') {
                 const title = `🧪 ${item.name} consumido(a)`;
                 toast(title);
                 addNotification({ type: 'item', title, description: `Efeito aplicado conforme narração.` });
               } else if (item.type === 'weapon' || item.type === 'armor') {
                 const title = `⚔️ Sua ${item.name} se quebrou!`;
                 toast.error(title, { description: "O item foi removido do seu inventário." });
                 addNotification({ type: 'status', title, description: `O equipamento atingiu o limite de durabilidade.` });
               } else {
                 const title = `🎒 Item removido: ${item.name}`;
                 toast(title);
                 addNotification({ type: 'item', title });
               }
             }
          });
        }

        // 2. Check for added items
        if (scene.inventoryChanges?.added?.length) {
          scene.inventoryChanges.added.forEach(item => {
            const title = `✨ Item Encontrado: ${item.name}`;
            toast.success(title, {
              description: item.description,
              icon: <Package className="w-4 h-4 text-emerald-500" />
            });
            addNotification({ type: 'item', title, description: item.description });
          });
        }

        // 3. Check for Reputation Changes
        if (scene.statusChanges?.reputations) {
          Object.entries(scene.statusChanges.reputations).forEach(([name, value]) => {
            const val = value as number;
            if (val > 0) {
              const title = `⚖️ Fama aumentada em ${name}`;
              toast.success(title, { description: `Sua reputação subiu [+${val}]` });
              addNotification({ type: 'reputation', title, description: `Reputação local: +${val}` });
            } else if (val < 0) {
              const title = `⚖️ Fama diminuída em ${name}`;
              toast.error(title, { description: `Sua reputação caiu [${val}]` });
              addNotification({ type: 'reputation', title, description: `Reputação local: ${val}` });
            }
          });
        }

        // 4. Check for Global Moral (Karma)
        if (scene.statusChanges?.moral) {
           const val = scene.statusChanges.moral;
           if (val > 0) {
             const title = "🌟 Ato de Bondade";
             toast(title, { icon: <Sparkles className="w-4 h-4 text-primary" />, description: "Sua alma brilha." });
             addNotification({ type: 'moral', title, description: "Seu alinhamento moral subiu." });
           } else if (val < 0) {
             const title = "🌑 Ato de Crueldade";
             toast(title, { icon: <ShieldAlert className="w-4 h-4 text-purple-500" />, description: "Uma sombra escurece seu coração." });
             addNotification({ type: 'moral', title, description: "Seu alinhamento moral caiu." });
           }
        }

        // 5. Check for World Memories
        if (scene.worldUpdate?.memories?.length) {
          scene.worldUpdate.memories.forEach(m => {
            const title = "📜 Memória Gravada";
            toast(title, { description: `${m.substring(0, 40)}...` });
            addNotification({ type: 'memory', title, description: m });
          });
        }

        // 6. Critical Status Alerts
        if (scene.statusChanges?.hp !== undefined && scene.statusChanges.hp <= currentStatus.maxHp * 0.25 && scene.statusChanges.hp > 0) {
           const title = "🩸 Vitalidade Crítica!";
           toast.error(title, { description: "Você está à beira da morte!" });
           addNotification({ type: 'status', title, description: "Seu HP está muito baixo." });
        }
        if (scene.statusChanges?.sp !== undefined && scene.statusChanges.sp === 0) {
           const title = "😫 Exaustão Total!";
           toast.warning(title, { description: "Você gastou todo o seu fôlego." });
           addNotification({ type: 'status', title, description: "Sua estamina chegou a zero." });
        }

        // --- APPLY CHANGES ---
        completeScene(scene, scene.statusChanges);
        console.log("LOG: completeScene called for ID:", scene.sceneId);

        // ASYNC: Trigger image and audio
        if (settings?.enableImages && scene.visualDescription && scene.sceneId && scene.sceneId !== 'undefined') {
          generateSceneImage(scene.sceneId, scene.visualDescription);
        }
        if (settings?.enableAudio && scene.narration && scene.sceneId && scene.sceneId !== 'undefined') {
          generateSceneAudio(scene.sceneId, scene.narration);
        }

        setPersistentError(null);
      } else {
        console.error("!!! AI Stream finished but object is undefined.");
        setPersistentError("O Portal não conseguiu materializar esta cena. Verifique o limite de cota do Gemini.");
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
    if (isGameStarted && !currentJourneyId && !creationInProgress.current && session?.user) {
      console.log("FLOW: Creating new DB record...");
      creationInProgress.current = true;
      fetch('/api/journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...settings, 
          playerName: settings?.playerName || session.user.name || 'Viajante',
          impersonatedPlayerId // Pass to API if in supervision mode
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
  }, [isGameStarted, currentJourneyId, settings, setJourneyId, session, impersonatedPlayerId]);

  // Sync state to DB on changes
  const lastSyncedRef = useRef<string>('');

  useEffect(() => {
    if (currentJourneyId && history.length > 0 && hasHydrated && authStatus === 'authenticated') {
      const currentStateString = JSON.stringify({ history, status, inventory });
      if (currentStateString === lastSyncedRef.current) return;

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
            settings,
            impersonatedPlayerId // Pass to API if in supervision mode
          })
        })
        .then(() => {
          lastSyncedRef.current = currentStateString;
        })
        .catch(err => console.error("DB_SYNC_ERR:", err));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [history, status, inventory, currentJourneyId, flags, memories, settings, hasHydrated, authStatus, impersonatedPlayerId]);

  // Auto-trigger first scene
  useEffect(() => {
    if (isGameStarted && currentJourneyId && history.length === 0 && !isLoading && !object && !initialTriggerDone.current) {
      initialTriggerDone.current = true;
      triggerAI(`Inicie a jornada para ${settings?.playerName}`);
    }
  }, [isGameStarted, currentJourneyId, history.length, isLoading, object, triggerAI, settings?.playerName]);

  if (!hasHydrated || authStatus === 'loading') return null;

  if (!isGameStarted) {
    return (
      <div className="h-screen w-full bg-zinc-950 flex flex-col items-center justify-center p-10 font-sans selection:bg-primary/30">
        <ForcePasswordChangeModal />
        <MainMenu />
        <JourneySetup />
      </div>
    );
  }

  const isGameOver = object?.isGameOver || currentScene?.isGameOver || status.hp <= 0;

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-50 overflow-hidden font-sans relative">
      <ScreenEffects />
      <ForcePasswordChangeModal />
      
      {/* Impersonation Banner */}
      <AnimatePresence>
        {impersonatedPlayerId && (
          <motion.div 
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            exit={{ y: -50 }}
            className="fixed top-0 left-0 w-full h-12 bg-orange-600 z-[100] flex items-center justify-center gap-4 px-10 border-b border-orange-500/50 shadow-xl"
          >
             <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-orange-200" />
                <span className="text-xs font-black uppercase tracking-widest text-orange-50">
                  Modo Supervisão: Atuando como <span className="text-white underline decoration-2 underline-offset-4">{impersonatedPlayerName}</span>
                </span>
             </div>
             <button 
                onClick={() => {
                  stopImpersonation();
                  window.location.reload();
                }}
                className="flex items-center gap-2 px-4 py-1.5 bg-black/20 hover:bg-black/40 transition-all rounded-full text-[10px] font-black uppercase text-white border border-white/10"
             >
                <X className="w-3.5 h-3.5" /> Sair da Supervisão
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      <PlayerStatusBar 
        onToggleInventory={() => setIsInventoryOpen(true)} 
        onToggleSkills={() => setIsSkillsOpen(true)}
        onToggleInfluence={() => setIsInfluenceOpen(true)}
        onToggleNotifications={() => setIsNotificationsOpen(true)}
        onToggleSettings={() => setIsDetailsOpen(true)}
        onToggleHPLog={() => setIsHPLogOpen(true)}
        onToggleSPLog={() => setIsSPLogOpen(true)}
        onLogout={() => resetGame()}
      />

      <main 
        className={`flex-1 flex flex-col relative z-20 ${impersonatedPlayerId ? 'pt-36' : 'pt-24'} ${isInquiryOpen ? 'pl-[448px]' : 'pl-0'} transition-all duration-500 ease-in-out`}
      >
        {/* Top Actions Hub */}
        <div className={`absolute ${impersonatedPlayerId ? 'top-40' : 'top-28'} ${isInquiryOpen ? 'left-[468px]' : 'left-10'} z-50 flex gap-2 transition-all duration-500 ease-in-out`}>
          {session?.user && (session.user as any).role === 'ADMIN' && !impersonatedPlayerId && (
            <button 
              onClick={() => router.push('/admin/dashboard')}
              className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-primary hover:bg-zinc-800 transition-all shadow-xl"
              title="Câmara do Mestre (Admin)"
            >
              <ShieldCheck className="w-5 h-5" />
            </button>
          )}

          <button 
            onClick={() => setIsDetailsOpen(true)}
            className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 hover:text-primary transition-all shadow-xl"
            title="Detalhes da Jornada"
          >
            <Settings2 className="w-5 h-5" />
          </button>
        </div>

        {/* Insight Hub (Questioning) - Floating above Export Hub */}
        <div className="fixed bottom-32 right-10 z-50 flex flex-col items-center gap-4">
           <AnimatePresence>
             {!isGameOver && history.length > 0 && (
               <motion.button 
                 initial={{ scale: 0, rotate: -45 }}
                 animate={{ scale: 1, rotate: 0 }}
                 exit={{ scale: 0, rotate: 45 }}
                 onClick={() => setIsInquiryOpen(true)}
                 className="p-5 bg-primary text-zinc-950 rounded-[28px] hover:scale-110 active:scale-95 transition-all shadow-[0_0_50px_rgba(245,158,11,0.3)] group relative border-4 border-zinc-950"
                 title="Questionar o Mestre (Pontos de Visão)"
               >
                  <HelpCircle className="w-8 h-8" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-zinc-950 text-primary text-[12px] font-black rounded-full flex items-center justify-center border-2 border-primary/50 shadow-lg">
                    {status.insightPoints}
                  </span>
               </motion.button>
             )}
           </AnimatePresence>
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
               <div className="text-center space-y-4">
                 <p className="text-zinc-500 font-serif italic text-xl animate-pulse">Invocando o Destino...</p>
                 <button 
                   onClick={() => triggerAI(`Inicie a jornada para ${settings?.playerName}`)}
                   className="flex items-center gap-2 mx-auto px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-primary hover:border-primary/50 transition-all font-black uppercase tracking-widest text-[10px]"
                 >
                   <RefreshCcw className="w-4 h-4" /> Tentar Novamente
                 </button>
               </div>
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
      <NotificationsPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
      <StatusLogPanel type="hp" isOpen={isHPLogOpen} onClose={() => setIsHPLogOpen(false)} />
      <StatusLogPanel type="sp" isOpen={isSPLogOpen} onClose={() => setIsSPLogOpen(false)} />
      <InquiryPanel isOpen={isInquiryOpen} onClose={() => setIsInquiryOpen(false)} />
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
