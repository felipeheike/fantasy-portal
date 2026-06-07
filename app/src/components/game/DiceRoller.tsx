'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Dices, Zap, Check, Lock } from 'lucide-react';

interface DiceRollerProps {
  onRollComplete: (result: number, selectedSkill?: { name: string, bonus: number, spCost: number }) => void;
  isLoading?: boolean;
  suggestedSkills?: { id: string; name: string; spCost: number }[];
  playerSp?: number;
  playerSkills?: { id: string, name: string, level: number }[];
}

export default function DiceRoller({ 
  onRollComplete, 
  isLoading, 
  suggestedSkills = [], 
  playerSp = 0,
  playerSkills = []
}: DiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  
  const rollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rollTimeoutRef.current) clearTimeout(rollTimeoutRef.current);
      if (completionTimeoutRef.current) clearTimeout(completionTimeoutRef.current);
    };
  }, []);

  // Filter skills that the player actually has and has enough SP for
  const availableSkills = suggestedSkills.map(suggested => {
    const playerSkill = playerSkills.find(s => s.id === suggested.id || s.name === suggested.name);
    return {
      ...suggested,
      level: playerSkill?.level || 0,
      canAfford: playerSp >= suggested.spCost,
      hasSkill: !!playerSkill
    };
  }).filter(s => s.hasSkill);

  const handleRoll = () => {
    if (isRolling || isLoading || hasTriggered) return;
    
    setIsRolling(true);
    setResult(null);
    setHasTriggered(false);

    // Dramatic roll duration
    rollTimeoutRef.current = setTimeout(() => {
      const newResult = Math.floor(Math.random() * 10) + 1; // D10 System
      setResult(newResult);
      setIsRolling(false); // Stop animation
      
      const skill = availableSkills.find(s => s.id === selectedSkillId);
      
      // Give the user a moment to see the result before sending
      completionTimeoutRef.current = setTimeout(() => {
        setHasTriggered(true);
        onRollComplete(newResult, skill ? { name: skill.name, bonus: skill.level, spCost: skill.spCost } : undefined);
      }, 1500);
    }, 1200);
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-portal-surface/60 border border-portal-border rounded-[40px] backdrop-blur-xl shadow-2xl relative overflow-hidden max-w-md w-full">
      <div className="relative">
        {/* Decorative background glow */}
        <div className={`absolute inset-0 bg-primary/20 blur-[60px] rounded-full transition-opacity duration-500 ${isRolling ? 'opacity-100' : 'opacity-0'}`} />
        
        <motion.div
          animate={isRolling ? {
            rotate: [0, 90, 180, 270, 360],
            scale: [1, 1.2, 0.9, 1.1, 1],
            y: [0, -20, 10, -5, 0]
          } : {}}
          transition={{ duration: 1, ease: "easeInOut" }}
          onClick={handleRoll}
          className={`w-32 h-32 rounded-3xl border-2 flex items-center justify-center relative z-10 transition-all ${
            isRolling 
              ? 'bg-primary border-primary shadow-[0_0_50px_var(--portal-primary-glow)]' 
              : hasTriggered || isLoading
                ? 'bg-portal-surface border-portal-border opacity-50 cursor-not-allowed'
                : 'bg-portal-bg border-portal-border hover:border-primary/50 group cursor-pointer'
              }`}
              >
              {isRolling ? (
              <Dices className="w-16 h-16 text-zinc-950 animate-bounce" />
              ) : result !== null ? (
              <span className="text-5xl font-black text-primary italic drop-shadow-[0_0_10px_var(--portal-primary-glow)]">
              {result}
              </span>
              ) : (
            <Sparkles className={`w-16 h-16 transition-colors ${hasTriggered || isLoading ? 'text-zinc-700' : 'text-zinc-800 group-hover:text-primary'}`} />
          )}
        </motion.div>
      </div>

      <div className="text-center space-y-2 relative z-10">
        <h3 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-500">
          {isRolling ? 'Consultando o Destino...' : result !== null ? 'Sorte Manifestada!' : 'Toque para Rolar'}
        </h3>
        
        <AnimatePresence mode="wait">
          {!isRolling && result === null && availableSkills.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 pt-2"
            >
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Canalizar Habilidade?</p>
              <div className="flex flex-wrap justify-center gap-2">
                {availableSkills.map(skill => (
                  <button
                    key={skill.id}
                    disabled={!skill.canAfford}
                    onClick={() => setSelectedSkillId(selectedSkillId === skill.id ? null : skill.id)}
                    className={`px-3 py-2 rounded-xl border-2 transition-all flex items-center gap-2 ${
                      selectedSkillId === skill.id
                      ? 'bg-primary border-primary text-zinc-950'
                      : skill.canAfford
                        ? 'bg-portal-surface border-portal-border text-zinc-400 hover:border-zinc-700'
                        : 'bg-portal-bg border-portal-surface text-zinc-700 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] font-black uppercase">{skill.name}</span>
                      <span className="text-[8px] font-bold opacity-70">Bônus: +{skill.level}</span>
                    </div>
                    <div className={`px-1.5 py-0.5 rounded-md text-[8px] font-black ${
                      selectedSkillId === skill.id ? 'bg-portal-bg text-primary' : 'bg-portal-surface-hover text-zinc-500'
                    }`}>
                      {skill.spCost} SP
                    </div>
                    {selectedSkillId === skill.id ? <Check className="w-3 h-3" /> : !skill.canAfford && <Lock className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {result !== null && (
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest max-w-[200px] mt-2">
            Seu valor: {result}. Aguarde a resolução...
          </p>
        )}
      </div>

      {/* Numerical particles around the dice */}
      <AnimatePresence>
        {isRolling && (
          <div className="absolute inset-0 pointer-events-none">
             {[...Array(6)].map((_, i) => (
               <motion.span
                 key={i}
                 initial={{ opacity: 0, x: 0, y: 0 }}
                 animate={{ 
                   y: [0, (Math.random() - 0.5) * 200], 
                   x: [0, (Math.random() - 0.5) * 200],
                   opacity: [0, 1, 0],
                   scale: [0.5, 1.5, 0.5]
                 }}
                 transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                 className="absolute top-1/2 left-1/2 text-primary font-black text-sm"
               >
                 {Math.floor(Math.random() * 10) + 1}
               </motion.span>
             ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
