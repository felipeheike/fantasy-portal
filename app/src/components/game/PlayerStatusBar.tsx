'use client';

import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Heart, 
  Flame, 
  Sparkles, 
  Scale, 
  ShieldAlert, 
  ShieldCheck, 
  Settings2, 
  LogOut,
  Swords
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface PlayerStatusBarProps {
  onToggleInventory: () => void;
  onToggleSkills: () => void;
  onToggleInfluence: () => void;
  onToggleSettings: () => void;
  onLogout: () => void;
}

export default function PlayerStatusBar({ 
  onToggleInventory, 
  onToggleSkills, 
  onToggleInfluence,
  onToggleSettings,
  onLogout
}: PlayerStatusBarProps) {
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
      {/* Left Section: Stats & Reputation */}
      <div className="flex items-center gap-8">
        {/* HP Bar */}
        <div className="flex flex-col gap-2 group">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Heart className={`w-3.5 h-3.5 ${isCritical ? 'text-red-500 animate-pulse' : 'text-red-400'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-red-400 transition-colors">Vitalidade</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-zinc-100">{status.hp}/{status.maxHp}</span>
          </div>
          <div className="w-48 h-3 bg-zinc-950 rounded-full border border-zinc-800 p-0.5 overflow-hidden shadow-inner relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${hpPercentage}%` }}
              transition={{ type: "spring", stiffness: 60, damping: 20 }}
              className="h-full bg-gradient-to-r from-red-700 to-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
            >
              <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-t-full" />
            </motion.div>
          </div>
        </div>

        {/* SP Bar */}
        <div className="flex flex-col gap-2 group">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-blue-500 group-hover:text-blue-400 transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-blue-400 transition-colors">Estamina</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-zinc-100">{status.sp}/{status.maxSp}</span>
          </div>
          <div className="w-48 h-3 bg-zinc-950 rounded-full border border-zinc-800 p-0.5 overflow-hidden shadow-inner relative">
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

        <div className="w-px h-10 bg-zinc-800 mx-2" />

        {/* Reputation Trigger */}
        <button 
          onClick={onToggleInfluence}
          className="flex flex-col gap-1.5 group cursor-pointer hover:scale-105 transition-transform"
        >
          <div className="flex items-center gap-1.5 px-1">
            {status.moral > 0 ? (
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
            ) : status.moral < 0 ? (
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
            ) : (
              <Scale className="w-3.5 h-3.5 text-zinc-500" />
            )}
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-primary transition-colors">Reputação</span>
          </div>
          <div className="w-24 h-2 bg-zinc-950 rounded-full border border-zinc-800 p-0.5 overflow-hidden relative flex items-center">
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

      {/* Center Section: Logo */}
      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
        <h1 className="text-2xl font-black tracking-tighter italic text-white uppercase flex items-center gap-2">
          Fantasy <span className="text-primary">Portal</span>
        </h1>
        <span className="text-[7px] font-black uppercase tracking-[0.5em] text-zinc-600">Crônicas do Destino</span>
      </div>

      {/* Right Section: Control Buttons */}
      <div className="flex items-center gap-3">
        {/* Settings */}
        <button 
          onClick={onToggleSettings}
          className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 hover:text-primary hover:border-primary/50 transition-all shadow-xl group"
          title="Configurações"
        >
          <Settings2 className="w-5 h-5 transition-transform group-hover:rotate-90" />
        </button>

        <div className="w-px h-8 bg-zinc-800 mx-1" />

        {/* Skills */}
        <button 
          onClick={onToggleSkills}
          className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all shadow-xl group flex items-center gap-2"
          title="Habilidades"
        >
          <Sparkles className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline-block">Habilidades</span>
        </button>

        {/* Inventory */}
        <button 
          onClick={onToggleInventory}
          className="relative p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/50 transition-all shadow-xl group flex items-center gap-2"
          title="Inventário"
        >
          <Package className="w-5 h-5 transition-transform group-hover:-rotate-12" />
          <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline-block">Inventário</span>
          <AnimatePresence>
             {inventory.length > 0 && (
               <motion.span 
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 exit={{ scale: 0 }}
                 className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-zinc-950 text-[9px] font-black rounded-full border-2 border-zinc-950 flex items-center justify-center shadow-lg"
               >
                 {inventory.length}
               </motion.span>
             )}
           </AnimatePresence>
        </button>

        <div className="w-px h-8 bg-zinc-800 mx-1" />

        {/* Logout */}
        <button 
          onClick={onLogout}
          className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 hover:text-red-500 hover:border-red-500/50 transition-all shadow-xl group"
          title="Sair da Jornada"
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </motion.div>
  );
}
