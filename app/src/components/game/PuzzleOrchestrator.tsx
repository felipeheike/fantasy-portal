'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { HelpCircle, Sparkles, AlertTriangle, CheckCircle2, XCircle, Keyboard, Lightbulb } from 'lucide-react';

interface PuzzleOrchestratorProps {
  onSolve: (answer: string) => void;
}

export default function PuzzleOrchestrator({ onSolve }: PuzzleOrchestratorProps) {
  const { currentScene, status, updateStatus, useInsightPoint, addNotification } = useGameStore();
  const puzzle = currentScene?.puzzle;

  const [input, setInput] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [showHint, setShowShowHint] = useState(false);

  if (!puzzle) return null;

  const handleGuess = () => {
    const normalizedInput = input.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normalizedSolution = puzzle.solution.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (normalizedInput === normalizedSolution) {
      handleSuccess();
    } else {
      handleFailure();
    }
  };

  const handleSuccess = () => {
    setIsSolved(true);
    addNotification({
      type: 'moral',
      title: 'Desafio Superado!',
      description: 'Seu intelecto brilhou intensamente.'
    });
    // Reward with 1 Insight Point
    updateStatus({ insightPoints: status.insightPoints + 1 });
    setTimeout(() => onSolve(puzzle.solution), 1500);
  };

  const handleFailure = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    
    // Consumir SP por cansaço mental
    updateStatus({ sp: Math.max(0, status.sp - 2) });
    
    addNotification({
      type: 'status',
      title: 'Esforço Mental',
      description: 'Sua mente se cansa com o erro. (-2 SP)'
    });

    if (newAttempts >= puzzle.maxAttempts) {
      setIsFailed(true);
      addNotification({
        type: 'status',
        title: 'Falha Crítica',
        description: 'O enigma se fechou ou ativou uma retaliação.'
      });
      setTimeout(() => onSolve("FALHA NO ENIGMA"), 2000);
    }
    setInput('');
  };

  const buyHint = () => {
    if (status.insightPoints > 0) {
      useInsightPoint();
      setShowShowHint(true);
      addNotification({
        type: 'info',
        title: 'Visão Comprada',
        description: 'Um fragmento da verdade foi revelado.'
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 bg-zinc-900 border border-zinc-800 md:rounded-[32px] rounded-t-[32px] rounded-b-none border-b-0 shadow-2xl relative overflow-hidden md:backdrop-blur-xl">
      {/* Background Decor (Desktop Only) */}
      <div className="absolute top-0 right-0 p-6 opacity-5 hidden md:block">
         <HelpCircle className="w-24 h-24" />
      </div>

      <div className="relative z-10 flex flex-col gap-4 md:gap-5">
        
        {/* Enigma Section */}
        <div className="space-y-3 text-center">
          <div className="space-y-1 md:space-y-1.5">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em]">Enigma Ativo</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase italic">
              {puzzle.type === 'hangman' ? 'O Ritual das Runas' : 
               puzzle.type === 'anagram' ? 'O Selo Fragmentado' : 
               puzzle.type === 'cipher' ? 'Cifra de Decifração' : 'O Enigma Ancestral'}
            </h3>
          </div>

          {/* Puzzle Visual Area - Solid Background */}
          <div className="py-4 md:py-4 bg-zinc-950 rounded-2xl md:rounded-3xl border border-zinc-800/50 shadow-inner max-w-3xl mx-auto w-full">
             <div className="text-xl md:text-2xl font-mono font-black text-primary tracking-[0.2em] md:tracking-[0.3em] mb-2 break-words px-4 text-center">
                {puzzle.displayData}
             </div>
             
             <AnimatePresence>
               {showHint && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full inline-flex items-center justify-center gap-2 mx-auto"
                 >
                   <Lightbulb className="w-3 h-3 text-primary shrink-0" />
                   <span className="text-[9px] font-bold text-primary uppercase italic">{puzzle.hint}</span>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>

        {/* Input & Actions Section */}
        <div className="space-y-3 md:space-y-4 max-w-2xl mx-auto w-full">
          {!isSolved && !isFailed && (
            <>
              <div className="flex flex-col gap-3">
                <input 
                  type="text"
                  autoFocus
                  placeholder="Sua resposta..."
                  className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-2.5 text-center text-base md:text-lg font-bold text-white placeholder:text-zinc-700 focus:border-primary outline-none transition-all"
                  value={input}
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && input.length > 0 && handleGuess()}
                />
                
                <div className="flex items-center gap-2 md:gap-3">
                  <button 
                    onClick={handleGuess}
                    disabled={!input}
                    className="flex-1 bg-white text-zinc-950 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-[11px] hover:bg-primary transition-all disabled:opacity-50"
                  >
                    Confirmar
                  </button>
                  
                  {!showHint && (
                    <button 
                      onClick={buyHint}
                      disabled={status.insightPoints <= 0}
                      className="px-4 py-2.5 bg-zinc-800 text-zinc-400 rounded-xl font-black uppercase tracking-widest text-[9px] md:text-[10px] hover:bg-zinc-700 hover:text-white transition-all disabled:opacity-20 flex items-center justify-center gap-2 min-w-[80px]"
                      title="Gasta 1 Insight Point"
                    >
                      <Sparkles className="w-4 h-4" /> <span className="hidden sm:inline">Dica</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 pb-1">
                 <div className="flex items-center gap-2">
                   <AlertTriangle className="w-3 h-3 text-red-500" />
                   <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-600">Erros: {attempts}/{puzzle.maxAttempts}</span>
                 </div>
                 <div className="w-px h-3 bg-zinc-800" />
                 <div className="flex items-center gap-2 hidden md:flex">
                   <Keyboard className="w-3 h-3 text-zinc-600" />
                   <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-600">ENTER</span>
                 </div>
                 <div className="flex items-center gap-2 md:hidden">
                   <Sparkles className="w-3 h-3 text-primary" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Insight: {status.insightPoints}</span>
                 </div>
              </div>
            </>
          )}

          {/* Feedback States */}
          {isSolved && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-2 py-4 text-green-500"
            >
              <CheckCircle2 className="w-12 h-12" />
              <span className="font-black uppercase tracking-[0.3em] italic text-xs">Resolvido</span>
            </motion.div>
          )}

          {isFailed && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-2 py-4 text-red-500"
            >
              <XCircle className="w-12 h-12" />
              <span className="font-black uppercase tracking-[0.3em] italic text-xs">Falhou</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}