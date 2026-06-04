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
    <div className="w-full max-w-2xl mx-auto p-5 md:p-8 bg-zinc-900 border border-zinc-800 md:rounded-[40px] rounded-t-[32px] rounded-b-none border-b-0 shadow-2xl relative overflow-hidden md:backdrop-blur-xl">
      {/* Background Decor (Desktop Only) */}
      <div className="absolute top-0 right-0 p-8 opacity-5 hidden lg:block">
         <HelpCircle className="w-32 h-24" />
      </div>

      <div className="relative z-10 flex flex-col landscape:grid landscape:grid-cols-2 gap-4 md:gap-8 landscape:items-center">
        
        {/* Enigma Section */}
        <div className="space-y-4 text-center landscape:text-left">
          <div className="space-y-1.5 md:space-y-2">
            <div className="flex items-center justify-center landscape:justify-start gap-3 text-primary mb-1 md:mb-2">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 animate-pulse" />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em]">Enigma Ativo</span>
            </div>
            <h3 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase italic">
              {puzzle.type === 'hangman' ? 'O Ritual das Runas' : 
               puzzle.type === 'anagram' ? 'O Selo Fragmentado' : 
               puzzle.type === 'cipher' ? 'Cifra de Decifração' : 'O Enigma Ancestral'}
            </h3>
          </div>

          {/* Puzzle Visual Area - Solid Background */}
          <div className="py-5 md:py-10 bg-zinc-950 rounded-2xl md:rounded-[32px] border border-zinc-800/50 shadow-inner">
             <div className="text-xl md:text-4xl font-mono font-black text-primary tracking-[0.3em] md:tracking-[0.5em] mb-2 md:mb-4 break-words px-4 text-center">
                {puzzle.displayData}
             </div>
             
             <AnimatePresence>
               {showHint && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="px-4 md:px-6 py-1.5 md:py-2 bg-primary/10 border border-primary/20 rounded-full inline-flex items-center gap-2 mx-auto md:mx-0 md:ml-4"
                 >
                   <Lightbulb className="w-3 h-3 text-primary" />
                   <span className="text-[9px] md:text-[10px] font-bold text-primary uppercase italic">{puzzle.hint}</span>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>

        {/* Input & Actions Section */}
        <div className="space-y-5 md:space-y-6">
          {!isSolved && !isFailed && (
            <>
              <div className="flex flex-col gap-3 md:gap-4">
                <input 
                  type="text"
                  autoFocus
                  placeholder="Sua resposta..."
                  className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl md:rounded-2xl p-3 md:p-4 text-center text-lg md:text-xl font-bold text-white placeholder:text-zinc-700 focus:border-primary outline-none transition-all"
                  value={input}
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && input.length > 0 && handleGuess()}
                />
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleGuess}
                    disabled={!input}
                    className="flex-1 bg-white text-zinc-950 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-primary transition-all disabled:opacity-50"
                  >
                    Confirmar
                  </button>
                  
                  {!showHint && (
                    <button 
                      onClick={buyHint}
                      disabled={status.insightPoints <= 0}
                      className="px-5 md:px-6 py-3.5 md:py-4 bg-zinc-800 text-zinc-400 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] hover:bg-zinc-700 hover:text-white transition-all disabled:opacity-20 flex items-center gap-2"
                      title="Gasta 1 Insight Point"
                    >
                      <Sparkles className="w-4 h-4" /> <span className="hidden sm:inline">Dica</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 md:gap-6 pb-2">
                 <div className="flex items-center gap-2">
                   <AlertTriangle className="w-3 h-3 text-red-500" />
                   <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-600">Erros: {attempts}/{puzzle.maxAttempts}</span>
                 </div>
                 <div className="w-px h-3 bg-zinc-800" />
                 <div className="flex items-center gap-2 hidden md:flex">
                   <Keyboard className="w-3 h-3 text-zinc-600" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">ENTER</span>
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
              className="flex flex-col items-center gap-3 py-6 text-green-500"
            >
              <CheckCircle2 className="w-16 h-12" />
              <span className="font-black uppercase tracking-[0.3em] italic">Resolvido</span>
            </motion.div>
          )}

          {isFailed && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-3 py-6 text-red-500"
            >
              <XCircle className="w-16 h-12" />
              <span className="font-black uppercase tracking-[0.3em] italic">Falhou</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
