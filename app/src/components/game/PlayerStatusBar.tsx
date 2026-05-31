'use client';

import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Package, Heart, Flame, Sparkles, Scale, ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

interface PlayerStatusBarProps {
  onToggleInventory: () => void;
  onToggleSkills: () => void;
  onToggleInfluence: () => void;
}

export default function PlayerStatusBar({ onToggleInventory, onToggleSkills, onToggleInfluence }: PlayerStatusBarProps) {
  const { status, inventory } = useGameStore();
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    setIsCritical(status.hp <= status.maxHp * 0.25);
  }, [status.hp, status.maxHp]);

  const hpPercentage = (status.hp / status.maxHp) * 100;
  const spPercentage = (status.sp / status.maxSp) * 100;

  return (
    <motion.div 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 w-full h-24 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 z-50 flex items-center justify-between px-10 shadow-[0_10px_50px_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-center gap-10">
        {/* HP Bar */}
        <div className="flex flex-col gap-2 group">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Heart className={`w-3.5 h-3.5 ${isCritical ? 'text-red-500 animate-pulse' : 'text-zinc-500'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-red-400 transition-colors">Vitalidade</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-zinc-100">{status.hp}/{status.maxHp}</span>
          </div>
          <div className="w-56 h-3.5 bg-zinc-950 rounded-full border border-zinc-800 p-0.5 overflow-hidden shadow-inner relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${hpPercentage}%` }}
              transition={{ type: "spring", stiffness: 60, damping: 20 }}
              className={`h-full transition-colors duration-500 ${
                isCritical 
                ? 'bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                : 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              }`}
            >
              <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-t-full" />
            </motion.div>
          </div>
        </div>

        {/* SP Bar */}
        <div className="flex flex-col gap-2 group">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-zinc-500 group-hover:text-blue-400 transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-blue-400 transition-colors">Estamina</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-zinc-100">{status.sp}/{status.maxSp}</span>
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

        {/* Karma / Influence Button */}
        <button 
          onClick={onToggleInfluence}
          className="flex flex-col gap-1.5 group cursor-pointer hover:scale-105 transition-transform"
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              {status.moral > 0 ? (
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
              ) : status.moral < 0 ? (
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
              ) : (
                <Scale className="w-3.5 h-3.5 text-zinc-500" />
              )}
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-primary transition-colors">Reputação</span>
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
                 backgroundColor: status.moral > 0 ? '#22c55e' : status.moral < 0 ? '#ef4444' : '#71717a'
               }}
               className="h-full rounded-full relative z-10"
               style={{ 
                 marginLeft: status.moral > 0 ? '50%' : status.moral < 0 ? `calc(50% - ${Math.min(50, Math.abs(status.moral) * 10)}%)` : '50%' 
               }}
             />
          </div>
        </button>
      </div>

      {/* Central Logo - Living Book Concept - Now opens Skills */}
      <motion.button 
        onClick={onToggleSkills}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileActive={{ scale: 0.9 }}
        className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 group"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 bg-zinc-900 border-2 border-zinc-800 rounded-2xl flex items-center justify-center text-primary shadow-2xl relative z-10 transition-colors group-hover:border-primary/50">
             <Sparkles className="w-6 h-6 fill-current" />
          </div>
        </div>
        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-600 group-hover:text-primary transition-colors">Habilidades</span>
      </motion.button>

      <div className="flex items-center gap-4">
        {/* Inventory Trigger */}
        <motion.button
           whileHover={{ scale: 1.05 }}
           whileActive={{ scale: 0.95 }}
           onClick={onToggleInventory}
           className="relative p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-primary hover:border-primary/50 transition-all shadow-xl group"
        >
           <Package className="w-6 h-6 transition-transform group-hover:-rotate-12" />
           <AnimatePresence>
             {inventory.length > 0 && (
               <motion.span 
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 exit={{ scale: 0 }}
                 className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-zinc-950 text-[10px] font-black rounded-full border-2 border-zinc-950 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.5)]"
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
