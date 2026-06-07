'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useGameStore, SPECTRAL_CAPACITY } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { NarrativeScene, NarrativeOption, TacticalOptions, InventoryItem } from '@/types';
import DiceRoller from './DiceRoller';
import PuzzleOrchestrator from './PuzzleOrchestrator';
import { toast } from 'sonner';
import { 
  Send, 
  Sword, 
  Shield, 
  Target, 
  Package, 
  Sparkles,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Lock,
  Unlock,
  Filter,
  Camera,
  Eye,
  X,
  CheckCircle,
  RefreshCcw,
  Ghost
} from 'lucide-react';

interface ActionOrchestratorProps {
  scene: NarrativeScene | null;
  onAction: (action: string) => void;
  isLoading: boolean;
}

export default function ActionOrchestrator({ scene, onAction, isLoading }: ActionOrchestratorProps) {
  const { status, setLockedItem, inventory, addItem, discardItem } = useGameStore();
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [visionState, setVisionState] = useState<'choice' | 'scanning' | 'validating' | 'overflow'>('choice');
  const [visionError, setVisionError] = useState<string | null>(null);
  const [pendingVisionResult, setPendingVisionResult] = useState<any | null>(null);

  const [selectedTactical, setSelectedTactical] = useState<{
    actionId?: string;
    actionLabel?: string;
    target?: string;
    item?: string;
    skill?: string;
  }>({});

  const handleSendText = useCallback(() => {
    if (inputText.trim()) {
      onAction(inputText);
    }
  }, [inputText, onAction]);

  const handleSendTactical = useCallback(() => {
    if (selectedTactical.actionLabel && selectedTactical.target) {
      let summary = `Eu escolho ${selectedTactical.actionLabel} no ${selectedTactical.target}`;
      if (selectedTactical.item) summary += ` usando ${selectedTactical.item}`;
      if (selectedTactical.skill) summary += ` e ativando ${selectedTactical.skill}`;
      summary += '.';
      onAction(summary);
      setSelectedTactical({});
      setLockedItem(null);
    }
  }, [selectedTactical, onAction, setLockedItem]);

  const handleDiceRoll = useCallback((result: number, skill?: { name: string, bonus: number, spCost: number }) => {
    let summary = `RESULTADO DO DADO: ${result}`;
    if (skill) {
      summary += ` [Skill: ${skill.name} (+${skill.bonus})] [SP: -${skill.spCost}]`;
    }
    summary += `. Narre o desfecho considerando este valor final de sorte.`;
    onAction(summary);
  }, [onAction]);

  const handleSolvePuzzle = useCallback((solution: string) => {
    onAction(`RESOLUÇÃO DO ENIGMA: ${solution}. Prossiga com as consequências.`);
  }, [onAction]);

  const handleVisionAction = async (base64Image: string) => {
    setVisionState('validating');
    setVisionError(null);
    try {
      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: base64Image,
          visionPrompt: scene?.visionPrompt,
          playerContext: { status }
        })
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          const spectralItems = inventory.filter(i => i.isSpectral);
          const incomingItems = Array.isArray(result.generatedItem) ? result.generatedItem : (result.generatedItem ? [result.generatedItem] : []);
          const incomingCount = incomingItems.length;

          if (incomingCount > 0 && spectralItems.length + incomingCount > SPECTRAL_CAPACITY) {
            setPendingVisionResult(result);
            setVisionState('overflow');
          } else {
            incomingItems.forEach((item: any) => addItem({ ...item, isSpectral: true }));
            onAction(`RESSONÂNCIA MATERIAL SUCESSO: ${result.description}. O objeto se materializou perfeitamente.`);
          }
        } else {
          setVisionError(result.message || "O objeto não ressoa com este portal.");
          setVisionState('scanning');
        }
      } else {
        setVisionError("Conexão instável. Tente novamente.");
        setVisionState('scanning');
      }
    } catch (e) {
      setVisionError("Erro na conexão mística.");
      setVisionState('scanning');
    }
  };

  const handleSacrificeItem = (itemIdToDiscard: string | null) => {
    const incomingItems = Array.isArray(pendingVisionResult?.generatedItem) 
      ? pendingVisionResult.generatedItem 
      : (pendingVisionResult?.generatedItem ? [pendingVisionResult.generatedItem] : []);
    const incomingCount = incomingItems.length;

    if (itemIdToDiscard) {
      discardItem(itemIdToDiscard);
      toast('Vínculo Rompido', { description: 'Um item espectral se desfez no ar.' });
      
      // Calculate remaining spectral items manually since Zustand state might not be fully flushed to this closure yet
      const remainingSpectral = inventory.filter(i => i.isSpectral && i.id !== itemIdToDiscard);
      
      if (remainingSpectral.length + incomingCount <= SPECTRAL_CAPACITY) {
        incomingItems.forEach((item: any) => addItem({ ...item, isSpectral: true }));
        onAction(`RESSONÂNCIA MATERIAL SUCESSO: ${pendingVisionResult.description}. O objeto se materializou após o sacrifício.`);
        setVisionState('choice');
        setPendingVisionResult(null);
      } else {
        const needed = (remainingSpectral.length + incomingCount) - SPECTRAL_CAPACITY;
        toast.warning('Alma Sobrecarregada', { description: `Você ainda possui muitos vínculos. Rompa mais ${needed} para abrir espaço.` });
      }
    } else {
      toast('Oferenda Rejeitada', { description: 'A nova conexão material foi dissipada no vazio.' });
      onAction(`RESSONÂNCIA MATERIAL SUCESSO: ${pendingVisionResult.description}. Porém o herói recusou o item por falta de espaço.`);
      setVisionState('choice');
      setPendingVisionResult(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleVisionAction(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderVisionRequirement = () => (
    <div className="bg-portal-surface/90 p-6 md:p-8 rounded-[40px] border border-portal-border backdrop-blur-xl shadow-2xl relative overflow-hidden">
      <AnimatePresence mode="wait">
        {visionState === 'choice' ? (
          <motion.div 
            key="choice"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-6 text-center"
          >
            <div className="inline-block p-4 bg-primary/10 rounded-3xl border border-primary/20 mb-2">
              <Eye className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tight text-portal-text">Ressonância Material Requerida</h3>
              <p className="text-sm font-body italic text-portal-text-muted max-w-md mx-auto">
                {scene?.visionPrompt || "O portal exige uma âncora do seu mundo para prosseguir."}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto pt-4">
              <button
                onClick={() => setVisionState('scanning')}
                className="flex items-center justify-center gap-3 px-8 py-5 bg-portal-primary text-portal-primary-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl"
              >
                <Camera className="w-5 h-5" /> Estabelecer Conexão
              </button>
              <button
                onClick={() => onAction("Eu escolho ignorar o desafio de visão e seguir em frente, aceitando as consequências do vácuo.")}
                className="flex items-center justify-center gap-3 px-8 py-5 bg-portal-bg border border-portal-border text-portal-text-muted rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-red-500 hover:border-red-500/30 transition-all"
              >
                <X className="w-5 h-5" /> Seguir em Frente
              </button>
            </div>
          </motion.div>
        ) : visionState === 'scanning' ? (
          <motion.div 
            key="scanning"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
               <button onClick={() => setVisionState('choice')} className="text-[10px] font-black uppercase tracking-widest text-portal-text-muted hover:text-portal-text flex items-center gap-2">
                 <X className="w-3 h-3" /> Voltar
               </button>
               <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                 <span className="text-[9px] font-black uppercase text-primary">Câmera Ativa</span>
               </div>
            </div>

            <div className="p-12 border-2 border-dashed border-portal-border rounded-[32px] bg-portal-bg/50 text-center space-y-4">
               {visionError && (
                 <p className="text-xs font-bold text-red-500 bg-red-500/10 py-2 rounded-xl mb-4 animate-bounce">
                   {visionError}
                 </p>
               )}
               <div className="w-16 h-16 bg-portal-surface rounded-full flex items-center justify-center mx-auto shadow-lg border border-portal-border">
                 <Camera className="w-8 h-8 text-portal-text-muted" />
               </div>
               <div className="space-y-1">
                 <p className="text-sm font-black text-portal-text uppercase">Aponte para o Objeto</p>
                 <p className="text-[10px] text-portal-text-muted font-body italic">Clique abaixo para capturar ou enviar foto</p>
               </div>

               <input 
                 type="file" 
                 accept="image/*" 
                 capture="environment"
                 onChange={handleFileUpload}
                 id="vision-upload-orchestrator"
                 className="hidden"
               />
               <label 
                htmlFor="vision-upload-orchestrator"
                className="inline-flex items-center gap-3 px-10 py-4 bg-portal-text text-portal-bg rounded-2xl font-black uppercase tracking-widest text-[10px] cursor-pointer hover:scale-105 transition-all shadow-2xl"
               >
                 Abrir Obturador
               </label>
            </div>
          </motion.div>
        ) : visionState === 'overflow' ? (
          <motion.div 
            key="overflow"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full border border-red-500/20 mb-2 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <RefreshCcw className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-red-400">Limite Espectral Excedido</h3>
              <p className="text-sm font-body text-portal-text-muted max-w-md mx-auto">
                Sua alma só pode ancorar <span className="text-portal-text font-bold">3 vínculos materiais</span> simultâneos. Para absorver as novas oferendas, rompa vínculos antigos ou descarte o que foi gerado.
              </p>
            </div>

            <div className="bg-portal-bg/50 border border-portal-border rounded-3xl p-6 space-y-4">
               <div className="flex items-center gap-3 mb-2">
                 <Sparkles className="w-4 h-4 text-emerald-400" />
                 <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Nova Oferenda Forjada:</span>
                 <span className="text-xs font-bold text-portal-text ml-auto text-right">
                   {Array.isArray(pendingVisionResult?.generatedItem) 
                     ? pendingVisionResult.generatedItem.map((i: any) => i.name).join(', ') 
                     : pendingVisionResult?.generatedItem?.name}
                 </span>
               </div>

               <div className="h-px w-full bg-gradient-to-r from-transparent via-portal-border to-transparent my-4" />

               <p className="text-[10px] font-black uppercase tracking-widest text-portal-text-muted mb-2 text-center">Seus Vínculos Atuais</p>

               <div className="space-y-3">
                 {inventory.filter(i => i.isSpectral).map((item) => (
                   <button
                     key={item.id}
                     onClick={() => handleSacrificeItem(item.id)}
                     className="w-full flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 rounded-2xl bg-portal-surface border border-portal-border hover:border-red-500 hover:bg-red-500/5 transition-all text-left group"
                   >
                     <div className="w-10 h-10 bg-portal-bg border border-portal-border rounded-full flex items-center justify-center shrink-0 group-hover:border-red-500/50">
                       <Eye className="w-5 h-5 text-portal-text-muted group-hover:text-red-400" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-bold text-portal-text truncate">{item.name}</p>
                       <p className="text-[10px] text-portal-text-muted font-body italic truncate">{item.description}</p>
                     </div>
                     <span className="text-[9px] font-black uppercase tracking-widest text-red-500/50 group-hover:text-red-500 shrink-0 mt-2 md:mt-0">
                       Romper Vínculo
                     </span>
                   </button>
                 ))}
               </div>
            </div>

            <button
              onClick={() => handleSacrificeItem(null)}
              className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-portal-text-muted hover:text-portal-text transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" /> Descartar nova oferenda e manter os atuais
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="validating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center space-y-6"
          >
            <div className="relative w-24 h-24 mx-auto">
               <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
               <RefreshCcw className="w-full h-full text-primary animate-spin-slow p-4 relative z-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tighter text-portal-text animate-pulse">Sincronizando Realidades...</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-portal-text-muted">Aguarde o julgamento do mestre</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Derived state for validation
  const selectedActionData = useMemo(() => 
    scene?.tacticalOptions?.actions?.find(a => a.id === selectedTactical.actionId),
    [scene, selectedTactical.actionId]
  );

  const isActionValid = useMemo(() => {
    if (!selectedTactical.actionLabel || !selectedTactical.target) return false;
    if (selectedActionData?.requiresItem && !selectedTactical.item) return false;
    return true;
  }, [selectedTactical, selectedActionData]);

  const filteredItems = useMemo(() => {
    const rawItems = scene?.tacticalOptions?.availableItems || [];
    if (!selectedActionData?.itemType) return rawItems;
    
    return rawItems.filter(itemName => {
      const itemData = inventory.find(i => i.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === itemName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
      return !itemData || itemData.type === selectedActionData.itemType;
    });
  }, [scene, selectedActionData, inventory]);

  // Clear tactical selection when scene changes
  useEffect(() => {
    setSelectedTactical({});
    setInputText('');
    setLockedItem(null);
    setIsMinimized(false);
    setVisionState('choice');
    setVisionError(null);
  }, [scene?.sceneId, setLockedItem]);

  if ((!scene && !isLoading) || scene?.isGameOver || status.hp <= 0) return null;

  const renderInterpretative = () => (
    <div className="flex gap-2 md:gap-4 items-center bg-portal-surface/90 p-3 md:p-2 rounded-2xl border border-portal-border focus-within:border-primary/50 transition-all backdrop-blur-md shadow-2xl">
      <div className="p-2 md:p-3 text-portal-text-muted">
        <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
      </div>
      <input 
        type="text"
        placeholder="Escreva seu destino..."
        className="flex-1 bg-transparent border-none outline-none text-sm md:text-base text-portal-text placeholder:text-portal-text-muted font-body italic"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
        disabled={isLoading}
      />
      <button 
        onClick={handleSendText}
        disabled={isLoading || !inputText.trim()}
        className="p-2.5 md:p-3 bg-primary text-zinc-950 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
      >
        <Send className="w-4 h-4 md:w-5 md:h-5" />
      </button>
    </div>
  );

  const renderOptions = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
      {scene?.options?.map((option, index) => (
        <motion.button
          key={option.id + index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onAction(option.label)}
          disabled={isLoading}
          className="flex items-center justify-between p-4 md:p-5 bg-portal-surface/90 border border-portal-border rounded-2xl hover:border-primary/40 hover:bg-portal-surface-hover/80 transition-all group"
        >
          <span className="text-portal-text text-sm md:text-base font-bold tracking-tight text-left">{option.label}</span>
          <ChevronRight className="w-4 h-4 text-portal-text-muted group-hover:text-primary transition-colors shrink-0" />
        </motion.button>
      ))}
    </div>
  );

  const renderTactical = () => (
    <div className="space-y-4 md:space-y-6 bg-portal-surface/90 p-4 md:p-6 rounded-3xl border border-portal-border/50 backdrop-blur-md relative overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-portal-text-muted ml-2 flex items-center gap-1.5">
            <Sword className="w-3 h-3" /> Ação
          </label>
          <div className="flex flex-wrap gap-2">
            {scene?.tacticalOptions?.actions.map(a => (
              <button 
                key={a.id}
                onClick={() => setSelectedTactical(prev => ({ ...prev, actionId: a.id, actionLabel: a.label, item: undefined }))}
                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all relative ${
                  selectedTactical.actionId === a.id 
                  ? 'bg-primary border-primary text-zinc-950' 
                  : 'bg-portal-surface/90 border-portal-border text-portal-text-muted'
                }`}
              >
                {a.label}
                {a.requiresItem && <Lock className="absolute -top-1 -right-1 w-2.5 h-2.5 text-orange-500 fill-current" />}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-portal-text-muted ml-2 flex items-center gap-1.5">
            <Target className="w-3 h-3" /> Alvo
          </label>
          <div className="flex flex-wrap gap-2">
            {scene?.tacticalOptions?.targets.map(t => (
              <button 
                key={t.id}
                onClick={() => setSelectedTactical(prev => ({ ...prev, target: t.label }))}
                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                  selectedTactical.target === t.label 
                  ? 'bg-primary border-primary text-zinc-950' 
                  : 'bg-portal-surface/90 border-portal-border text-portal-text-muted'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`space-y-2 transition-all ${selectedActionData?.requiresItem && !selectedTactical.item ? 'ring-2 ring-orange-500/20 rounded-xl p-2 -m-2 bg-orange-500/20' : ''}`}>
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-portal-text-muted ml-2 flex items-center gap-1.5">
            <Package className="w-3 h-3" /> Item
            {selectedActionData?.requiresItem && <span className="text-[7px] text-orange-500 animate-pulse">(Obrigatório)</span>}
          </label>
          <div className="flex flex-wrap gap-2">
             {!selectedActionData?.requiresItem && (
               <button 
                  onClick={() => {
                    setSelectedTactical(prev => ({ ...prev, item: undefined }));
                    setLockedItem(null);
                  }}
                  className={`px-3 py-2 rounded-lg text-[10px] font-bold border ${!selectedTactical.item ? 'border-portal-border text-portal-text' : 'border-portal-border text-portal-text-muted'}`}
                >
                  Nenhum
                </button>
             )}
            {filteredItems.map((i, idx) => (
              <button 
                key={i + idx}
                onClick={() => {
                  setSelectedTactical(prev => ({ ...prev, item: i, skill: undefined }));
                  setLockedItem(i);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                  selectedTactical.item === i 
                  ? 'bg-primary border-primary text-zinc-950' 
                  : 'bg-portal-surface/90 border-portal-border text-portal-text-muted hover:border-portal-border'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-portal-text-muted ml-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Habilidade
          </label>
          <div className="flex flex-wrap gap-2">
             <button 
                onClick={() => {
                  setSelectedTactical(prev => ({ ...prev, skill: undefined }));
                }}
                className={`px-3 py-2 rounded-lg text-[10px] font-bold border ${!selectedTactical.skill ? 'border-portal-border text-portal-text' : 'border-portal-border text-portal-text-muted'}`}
              >
                Nenhuma
              </button>
            {scene?.tacticalOptions?.availableSkills?.map((s, idx) => (
              <button 
                key={s + idx}
                onClick={() => {
                  setSelectedTactical(prev => ({ ...prev, skill: s, item: undefined }));
                  setLockedItem(null);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                  selectedTactical.skill === s 
                  ? 'bg-primary border-primary text-zinc-950' 
                  : 'bg-portal-surface/90 border-portal-border text-portal-text-muted'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-portal-border flex justify-center">
         <button 
            disabled={!isActionValid || isLoading}
            onClick={handleSendTactical}
            className={`flex items-center gap-3 px-10 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all relative overflow-hidden ${
              isActionValid 
              ? 'bg-portal-text text-zinc-950 hover:bg-primary shadow-[0_0_30px_rgba(255,255,255,0.1)] scale-100' 
              : 'bg-portal-bg border-2 border-dashed border-portal-border text-portal-text-muted cursor-not-allowed opacity-100 scale-[0.98]'
            }`}
         >
           {!isActionValid && !isLoading && <Lock className="w-3.5 h-3.5 opacity-50" />}
           <span>
             {isLoading ? 'Invocando...' : 
              selectedActionData?.requiresItem && !selectedTactical.item ? 'Selecione um Item' : 
              !selectedTactical.actionId ? 'Escolha uma Ação' :
              !selectedTactical.target ? 'Escolha um Alvo' : 'Executar Ação'}
           </span>
         </button>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={false}
      animate={{ 
        y: isMinimized ? 'calc(100% - 24px)' : '0px',
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed bottom-0 left-0 w-full z-40 bg-portal-surface/90 border-t border-portal-border/50 action-orchestrator"
    >
      {/* Toggle Button */}
      <div className="absolute -top-8 left-0 w-full flex justify-center z-50">
         <button 
           onClick={() => setIsMinimized(!isMinimized)}
           className="bg-portal-surface/90 border border-portal-border border-b-0 px-6 py-1.5 rounded-t-xl text-portal-text-muted flex items-center gap-2 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] transition-colors hover:text-primary backdrop-blur-md"
         >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="text-[9px] font-black uppercase tracking-widest">
              {isMinimized ? 'Expandir Ações' : 'Recolher Painel'}
            </span>
         </button>
      </div>

      <div className="w-full max-h-[85vh] overflow-y-auto custom-scrollbar pb-6 pt-4 px-4 md:p-6">
        <div className="max-w-4xl mx-auto relative mt-2 md:mt-0">
          <AnimatePresence mode="wait">
            {isLoading ? (
             <motion.div 
               key="loading"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="flex justify-center p-8"
             >
               <Sparkles className="w-8 h-8 text-primary animate-pulse" />
             </motion.div>
          ) : (
            <motion.div
              key={scene?.sceneId || 'empty'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {scene?.requiresRoll ? (
                 <div className="flex justify-center w-full">
                    <DiceRoller 
                      onRollComplete={handleDiceRoll} 
                      isLoading={isLoading} 
                      suggestedSkills={scene.suggestedSkills}
                      playerSp={status.sp}
                      playerSkills={status.skills}
                    />
                 </div>
              ) : scene?.puzzle ? (
                 <PuzzleOrchestrator onSolve={handleSolvePuzzle} />
              ) : scene?.inputType === 'VISION_REQUIREMENT' || (scene as any)?.recommendedInputType === 'vision_requirement' ? (
                 renderVisionRequirement()
              ) : scene?.tacticalOptions ? renderTactical() : scene?.options?.length ? renderOptions() : renderInterpretative()}
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
