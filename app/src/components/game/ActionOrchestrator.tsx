'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { NarrativeScene, NarrativeOption, TacticalOptions, InventoryItem } from '@/types';
import DiceRoller from './DiceRoller';
import PuzzleOrchestrator from './PuzzleOrchestrator';
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
  Filter
} from 'lucide-react';

interface ActionOrchestratorProps {
  scene: NarrativeScene | null;
  onAction: (action: string) => void;
  isLoading: boolean;
}

export default function ActionOrchestrator({ scene, onAction, isLoading }: ActionOrchestratorProps) {
  const { status, setLockedItem, inventory } = useGameStore();
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
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
  }, [scene?.sceneId, setLockedItem]);

  if ((!scene && !isLoading) || scene?.isGameOver || status.hp <= 0) return null;

  const renderInterpretative = () => (
    <div className="flex gap-2 md:gap-4 items-center bg-zinc-900/90 p-3 md:p-2 rounded-2xl border border-zinc-800 focus-within:border-primary/50 transition-all backdrop-blur-md shadow-2xl">
      <div className="p-2 md:p-3 text-zinc-500">
        <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
      </div>
      <input 
        type="text"
        placeholder="Escreva seu destino..."
        className="flex-1 bg-transparent border-none outline-none text-sm md:text-base text-zinc-200 placeholder:text-zinc-600 font-serif italic"
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
          className="flex items-center justify-between p-4 md:p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl hover:border-primary/40 hover:bg-zinc-800/80 transition-all group"
        >
          <span className="text-zinc-300 text-sm md:text-base font-bold tracking-tight text-left">{option.label}</span>
          <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-primary transition-colors shrink-0" />
        </motion.button>
      ))}
    </div>
  );

  const renderTactical = () => (
    <div className="space-y-4 md:space-y-6 bg-zinc-900/90 p-4 md:p-6 rounded-3xl border border-zinc-800/50 backdrop-blur-md relative overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-2 flex items-center gap-1.5">
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
                  : 'bg-zinc-900/90 border-zinc-800 text-zinc-400'
                }`}
              >
                {a.label}
                {a.requiresItem && <Lock className="absolute -top-1 -right-1 w-2.5 h-2.5 text-orange-500 fill-current" />}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-2 flex items-center gap-1.5">
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
                  : 'bg-zinc-900/90 border-zinc-800 text-zinc-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`space-y-2 transition-all ${selectedActionData?.requiresItem && !selectedTactical.item ? 'ring-2 ring-orange-500/20 rounded-xl p-2 -m-2 bg-orange-500/20' : ''}`}>
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-2 flex items-center gap-1.5">
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
                  className={`px-3 py-2 rounded-lg text-[10px] font-bold border ${!selectedTactical.item ? 'border-zinc-500 text-zinc-200' : 'border-zinc-800 text-zinc-600'}`}
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
                  : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Habilidade
          </label>
          <div className="flex flex-wrap gap-2">
             <button 
                onClick={() => {
                  setSelectedTactical(prev => ({ ...prev, skill: undefined }));
                }}
                className={`px-3 py-2 rounded-lg text-[10px] font-bold border ${!selectedTactical.skill ? 'border-zinc-500 text-zinc-200' : 'border-zinc-800 text-zinc-600'}`}
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
                  : 'bg-zinc-900/90 border-zinc-800 text-zinc-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-800 flex justify-center">
         <button 
            disabled={!isActionValid || isLoading}
            onClick={handleSendTactical}
            className={`flex items-center gap-3 px-10 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all relative overflow-hidden ${
              isActionValid 
              ? 'bg-zinc-100 text-zinc-950 hover:bg-primary shadow-[0_0_30px_rgba(255,255,255,0.1)] scale-100' 
              : 'bg-zinc-950 border-2 border-dashed border-zinc-800 text-zinc-600 cursor-not-allowed opacity-100 scale-[0.98]'
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
      className="fixed bottom-0 left-0 w-full z-40 bg-zinc-900/90 border-t border-zinc-800/50"
    >
      {/* Toggle Button */}
      <div className="absolute -top-8 left-0 w-full flex justify-center z-50">
         <button 
           onClick={() => setIsMinimized(!isMinimized)}
           className="bg-zinc-900/90 border border-zinc-800 border-b-0 px-6 py-1.5 rounded-t-xl text-zinc-400 flex items-center gap-2 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] transition-colors hover:text-primary backdrop-blur-md"
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
              ) : scene?.tacticalOptions ? renderTactical() : scene?.options?.length ? renderOptions() : renderInterpretative()}
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
