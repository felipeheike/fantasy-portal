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
  Swords,
  Bell,
  Menu as MenuIcon
} from 'lucide-react';
import { useEffect, useState } from 'react';
import MobileMenu from './MobileMenu';

interface PlayerStatusBarProps {
  onToggleInventory: () => void;
  onToggleSkills: () => void;
  onToggleInfluence: () => void;
  onToggleNotifications: () => void;
  onToggleSettings: () => void;
  onToggleInquiry: () => void;
  onDownloadPDF: () => void;
  onDownloadMD: () => void;
  onToggleHPLog: () => void;
  onToggleSPLog: () => void;
  onLogout: () => void;
}

export default function PlayerStatusBar({ 
  onToggleInventory, 
  onToggleSkills, 
  onToggleInfluence,
  onToggleNotifications,
  onToggleSettings,
  onToggleInquiry,
  onDownloadPDF,
  onDownloadMD,
  onToggleHPLog,
  onToggleSPLog,
  onLogout
}: PlayerStatusBarProps) {
  const { status, inventory, notificationHistory, impersonatedPlayerId } = useGameStore();
  const [isCritical, setIsCritical] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const unreadCount = notificationHistory.filter(n => !n.read).length;

  useEffect(() => {
    setIsCritical(status.hp <= status.maxHp * 0.25);
  }, [status.hp, status.maxHp]);

  const hpPercentage = (status.hp / status.maxHp) * 100;
  const spPercentage = (status.sp / status.maxSp) * 100;

  return (
    <>
    <motion.div 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed ${impersonatedPlayerId ? 'top-12' : 'top-0'} left-0 w-full h-20 md:h-24 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 z-50 flex items-center justify-between px-4 md:px-10 shadow-[0_10px_50px_rgba(0,0,0,0.5)] transition-all duration-300`}
    >
      {/* Left Section: Stats & Reputation */}
      <div className="flex items-center gap-4 md:gap-8">
        {/* HP Bar - Clicável */}
        <button 
          onClick={onToggleHPLog}
          className="flex flex-col md:gap-2 group cursor-pointer hover:scale-105 transition-transform"
        >
          <div className="flex items-center gap-2 md:justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Heart className={`w-4 h-4 md:w-3.5 md:h-3.5 ${isCritical ? 'text-red-500 animate-pulse' : 'text-red-400'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-red-400 transition-colors hidden md:inline-block">Vitalidade</span>
            </div>
            <span className="text-[10px] md:text-[10px] font-mono font-bold text-zinc-100">{status.hp}/{status.maxHp}</span>
          </div>
          <div className="hidden md:block w-48 h-3 bg-zinc-950 rounded-full border border-zinc-800 p-0.5 overflow-hidden shadow-inner relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${hpPercentage}%` }}
              transition={{ type: "spring", stiffness: 60, damping: 20 }}
              className="h-full bg-gradient-to-r from-red-700 to-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
            >
              <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-t-full" />
            </motion.div>
          </div>
        </button>

        {/* SP Bar - Clicável */}
        <button 
          onClick={onToggleSPLog}
          className="flex flex-col md:gap-2 group cursor-pointer hover:scale-105 transition-transform"
        >
          <div className="flex items-center gap-2 md:justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 md:w-3.5 md:h-3.5 text-blue-500 group-hover:text-blue-400 transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-blue-400 transition-colors hidden md:inline-block">Estamina</span>
            </div>
            <span className="text-[10px] md:text-[10px] font-mono font-bold text-zinc-100">{status.sp}/{status.maxSp}</span>
          </div>
          <div className="hidden md:block w-48 h-3 bg-zinc-950 rounded-full border border-zinc-800 p-0.5 overflow-hidden shadow-inner relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${spPercentage}%` }}
              transition={{ type: "spring", stiffness: 60, damping: 20 }}
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
            >
              <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-t-full" />
            </motion.div>
          </div>
        </button>

        <div className="w-px h-10 bg-zinc-800 mx-1 md:mx-2" />

        {/* Reputation Trigger */}
        <button 
          onClick={onToggleInfluence}
          className="flex flex-col md:gap-1.5 group cursor-pointer hover:scale-105 transition-transform flex"
        >
          <div className="flex items-center gap-1.5 px-1">
            {status.moral > 0 ? (
              <ShieldCheck className="w-4 h-4 md:w-3.5 md:h-3.5 text-green-500" />
            ) : status.moral < 0 ? (
              <ShieldAlert className="w-4 h-4 md:w-3.5 md:h-3.5 text-red-500" />
            ) : (
              <Scale className="w-4 h-4 md:w-3.5 md:h-3.5 text-zinc-500" />
            )}
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-primary transition-colors hidden md:inline-block">Reputação</span>
            <span className="text-[10px] font-mono font-bold text-zinc-100 md:hidden">{status.moral > 0 ? `+${status.moral}` : status.moral}</span>
          </div>
          <div className="hidden md:block w-24 h-2 bg-zinc-950 rounded-full border border-zinc-800 p-0.5 overflow-hidden relative flex items-center">
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
      <div className="absolute left-1/2 -translate-x-1/2 flex-col items-center hidden lg:flex">
        <h1 className="text-2xl font-black tracking-tighter italic text-white uppercase flex items-center gap-2">
          Fantasy <span className="text-primary">Portal</span>
        </h1>
        <span className="text-[7px] font-black uppercase tracking-[0.5em] text-zinc-600">Crônicas do Destino</span>
      </div>

      {/* Right Section: Control Buttons */}
      <div className="flex items-center gap-1.5 md:gap-3">
        {/* Desktop Controls (Hidden on Mobile/Tablet) */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Notifications (Bell) */}
          <button 
            onClick={onToggleNotifications}
            className="relative p-2 md:p-3 bg-zinc-900 border border-zinc-800 rounded-xl md:rounded-2xl text-zinc-500 hover:text-primary hover:border-primary/50 transition-all shadow-xl group"
            title="Histórico de Notificações"
          >
            <Bell className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:rotate-12" />
            <AnimatePresence>
               {unreadCount > 0 && (
                 <motion.span 
                   initial={{ scale: 0 }}
                   animate={{ scale: 1 }}
                   exit={{ scale: 0 }}
                   className="absolute top-1 right-1 md:top-1.5 md:right-1.5 w-2 h-2 md:w-2.5 md:h-2.5 bg-red-500 rounded-full border-2 border-zinc-950 shadow-lg"
                 />
               )}
             </AnimatePresence>
          </button>

          {/* Settings */}
          <button 
            onClick={onToggleSettings}
            className="p-2 md:p-3 bg-zinc-900 border border-zinc-800 rounded-xl md:rounded-2xl text-zinc-500 hover:text-primary hover:border-primary/50 transition-all shadow-xl group"
            title="Configurações"
          >
            <Settings2 className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:rotate-90" />
          </button>

          <div className="w-px h-8 bg-zinc-800 mx-0.5 md:mx-1" />

          {/* Skills */}
          <button 
            onClick={onToggleSkills}
            className="p-2 md:p-3 bg-zinc-900 border border-zinc-800 rounded-xl md:rounded-2xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all shadow-xl group flex items-center gap-2"
            title="Habilidades"
          >
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:scale-110" />
            <span className="text-[10px] font-black uppercase tracking-widest">Habilidades</span>
          </button>

          {/* Inventory */}
          <button 
            onClick={onToggleInventory}
            className="relative p-2 md:p-3 bg-zinc-900 border border-zinc-800 rounded-xl md:rounded-2xl text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/50 transition-all shadow-xl group flex items-center gap-2"
            title="Inventário"
          >
            <Package className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:-rotate-12" />
            <span className="text-[10px] font-black uppercase tracking-widest">Inventário</span>
            <AnimatePresence>
               {inventory.length > 0 && (
                 <motion.span 
                   initial={{ scale: 0 }}
                   animate={{ scale: 1 }}
                   exit={{ scale: 0 }}
                   className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-primary text-zinc-950 text-[8px] md:text-[9px] font-black rounded-full border-2 border-zinc-950 flex items-center justify-center shadow-lg"
                 >
                   {inventory.length}
                 </motion.span>
               )}
             </AnimatePresence>
          </button>

          <div className="w-px h-8 bg-zinc-800 mx-0.5 md:mx-1" />

          {/* Logout */}
          <button 
            onClick={onLogout}
            className="p-2 md:p-3 bg-zinc-900 border border-zinc-800 rounded-xl md:rounded-2xl text-zinc-600 hover:text-red-500 hover:border-red-500/50 transition-all shadow-xl group"
            title="Sair da Jornada"
          >
            <LogOut className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Mobile Menu Trigger (Hamburger) */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden relative p-3 bg-primary text-zinc-950 rounded-xl shadow-lg active:scale-90 transition-all flex items-center gap-2"
        >
          <MenuIcon className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Menu</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-zinc-950 shadow-md" />
          )}
        </button>
      </div>
    </motion.div>

    <MobileMenu 
      isOpen={isMobileMenuOpen}
      onClose={() => setIsMobileMenuOpen(false)}
      onToggleInventory={onToggleInventory}
      onToggleSkills={onToggleSkills}
      onToggleInfluence={onToggleInfluence}
      onToggleNotifications={onToggleNotifications}
      onToggleSettings={onToggleSettings}
      onToggleInquiry={onToggleInquiry}
      onDownloadPDF={onDownloadPDF}
      onDownloadMD={onDownloadMD}
      onLogout={onLogout}
    />
    </>
  );
}
