'use client';

import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Package, Heart, Flame, Sparkles, Scale, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

interface PlayerStatusBarProps {
  onToggleInventory: () => void;
  onToggleSkills: () => void;
}

export default function PlayerStatusBar({ onToggleInventory, onToggleSkills }: PlayerStatusBarProps) {
  const { status, inventory } = useGameStore();
  const [isDamaged, setIsDamaged] = useState(false);
  const prevHpRef = useRef(status.hp);

  // Trigger damage animation when HP drops
  useEffect(() => {
    if (status.hp < prevHpRef.current) {
      setIsDamaged(true);
      const timer = setTimeout(() => setIsDamaged(false), 500);
      return () => clearTimeout(timer);
    }
    prevHpRef.current = status.hp;
  }, [status.hp]);

  const hpPercentage = (status.hp / status.maxHp) * 100;
  const spPercentage = (status.sp / status.maxSp) * 100;

  return (
    <motion.div 
      animate={isDamaged ? { x: [-2, 2, -2, 2, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="w-full bg-zinc-950/80 border-b border-zinc-800/50 backdrop-blur-2xl px-6 py-4 flex items-center justify-between shadow-2xl relative z-50"
    >
      {/* Damage Overlay Flash */}
      <AnimatePresence>
        {isDamaged && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-600 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="flex items-center gap-10">
        {/* HP Bar */}
        <div className="flex flex-col gap-1.5 group">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <motion.div
                animate={status.hp <= 5 ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <Heart className={`w-3.5 h-3.5 ${status.hp <= 5 ? 'text-red-500 fill-red-500' : 'text-red-600'}`} />
              </motion.div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Vitalidade</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 font-bold">{status.hp} <span className="text-zinc-700">/</span> {status.maxHp}</span>
          </div>
          
          <div className="w-56 h-3.5 bg-zinc-950 rounded-full border border-zinc-800 p-0.5 overflow-hidden shadow-inner relative">
             {/* Critical Health Background */}
             {status.hp <= 5 && (
               <motion.div 
                 animate={{ opacity: [0.1, 0.4, 0.1] }}
                 transition={{ repeat: Infinity, duration: 1.5 }}
                 className="absolute inset-0 bg-red-900/50"
               />
             )}
            
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${hpPercentage}%` }}
              transition={{ type: "spring", stiffness: 60, damping: 20 }}
              className={`h-full rounded-full relative z-10 ${
                status.hp <= 5 
                  ? 'bg-gradient-to-r from-red-700 to-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]' 
                  : 'bg-gradient-to-r from-red-600 to-red-500'
              }`}
            >
              <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-t-full" />
            </motion.div>
          </div>
        </div>

        {/* SP Bar */}
        <div className="flex flex-col gap-1.5 group">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Estamina</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 font-bold">{status.sp} <span className="text-zinc-700">/</span> {status.maxSp}</span>
          </div>
          <div className="w-56 h-3.5 bg-zinc-950 rounded-full border border-zinc-800 p-0.5 overflow-hidden shadow-inner relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${spPercentage}%` }}
              transition={{ type: "spring", stiffness: 60, damping: 20 }}
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
            >
              <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-t-full" />
            </motion.div>
          </div>
        </div>

        {/* Karma / Moral */}
        <div className="flex flex-col gap-1.5 group">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              {status.moral > 0 ? (
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
              ) : status.moral < 0 ? (
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
              ) : (
                <Scale className="w-3.5 h-3.5 text-zinc-500" />
              )}
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Karma</span>
            </div>
            <span className={`text-[10px] font-mono font-bold ${
              status.moral > 0 ? 'text-green-500' : status.moral < 0 ? 'text-red-500' : 'text-zinc-500'
            }`}>
              {status.moral > 0 ? `+${status.moral}` : status.moral}
            </span>
          </div>
          <div className="w-32 h-3 bg-zinc-950 rounded-full border border-zinc-800 p-0.5 overflow-hidden shadow-inner relative flex items-center">
             <div className="absolute left-1/2 w-px h-full bg-zinc-800 z-0" />
             <motion.div 
               animate={{ 
                 width: `${Math.min(100, Math.abs(status.moral) * 10)}%`,
                 x: status.moral > 0 ? '100%' : status.moral < 0 ? '0%' : '50%', // Simplified logic for demo
                 backgroundColor: status.moral > 0 ? '#22c55e' : status.moral < 0 ? '#ef4444' : '#71717a'
               }}
               className="h-full rounded-full relative z-10 w-0"
               style={{ marginLeft: status.moral > 0 ? '50%' : status.moral < 0 ? `calc(50% - ${Math.min(50, Math.abs(status.moral) * 10)}%)` : '50%' }}
             />
          </div>
        </div>
      </div>

      {/* Central Logo - Living Book Concept - Now opens Skills */}
      <motion.button 
        onClick={onToggleSkills}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2 group"
      >
        <motion.div 
          whileHover={{ rotate: 180 }}
          className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-lg transform transition-all duration-700 group-hover:border-primary/50"
        >
          <Swords className="w-5 h-5 text-primary" />
        </motion.div>
        <div className="flex flex-col items-start text-left">
          <h1 className="text-sm font-black tracking-[0.25em] uppercase text-zinc-100 drop-shadow-md group-hover:text-primary transition-colors">Fantasy Portal</h1>
          <div className="flex items-center gap-2">
            <div className="h-[1px] w-4 bg-primary/50" />
            <span className="text-[8px] font-bold text-primary tracking-[0.3em] uppercase">The Chronicles</span>
            <div className="h-[1px] w-4 bg-primary/50" />
          </div>
        </div>
      </motion.button>

      <div className="flex items-center gap-8">
        {/* Skills Mini-HUD */}
        {status.skills.length > 0 && (
          <div className="flex items-center gap-2 px-4 border-r border-zinc-800/50 mr-2">
            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mr-1">Disciplinas</span>
            <div className="flex -space-x-2">
              {status.skills.slice(0, 4).map((skill, i) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-primary shadow-lg group relative cursor-help"
                  title={`${skill.name} (Nív. ${skill.level})`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {/* Skill Level Badge */}
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-zinc-800 text-[6px] font-black rounded-full flex items-center justify-center border border-zinc-700 text-zinc-400">
                    {skill.level}
                  </span>
                </motion.div>
              ))}
              {status.skills.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[8px] font-bold text-zinc-500">
                  +{status.skills.length - 4}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Skills Trigger */}
        <motion.button 
          onClick={onToggleSkills}
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(39, 39, 42, 1)' }}
          whileTap={{ scale: 0.9 }}
          className="relative p-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700 transition-colors shadow-lg group"
          title="Ver Habilidades"
        >
           <Sparkles className="w-5 h-5 text-zinc-400 group-hover:text-primary transition-colors" />
        </motion.button>

        {/* Combat Power */}
        <div className="flex flex-col items-end">
           <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Poder de Ataque</span>
           <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-zinc-200 font-mono italic leading-none">{status.combatPower}</span>
              <div className="flex flex-col gap-0.5">
                {[...Array(3)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={status.combatPower > 15 ? { opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                    className="w-3 h-1 bg-primary rounded-full shadow-[0_0_5px_rgba(245,158,11,0.5)]"
                  />
                ))}
              </div>
           </div>
        </div>

        {/* Inventory Trigger */}
        <motion.button 
          onClick={onToggleInventory}
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(39, 39, 42, 1)' }}
          whileTap={{ scale: 0.9 }}
          className="relative p-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700 transition-colors shadow-lg group"
        >
           <Package className="w-5 h-5 text-zinc-400 group-hover:text-primary transition-colors" />
           <AnimatePresence>
             {inventory.length > 0 && (
               <motion.span 
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 exit={{ scale: 0 }}
                 className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-zinc-950 text-[10px] font-black rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.5)]"
               >
                 {inventory.length}
               </motion.span>
             )}
           </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
}

