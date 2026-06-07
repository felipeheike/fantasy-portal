'use client';

import { useGameStore, MAX_LOG_ENTRIES } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Flame, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Activity,
  History,
  ShieldCheck,
  Sword
} from 'lucide-react';
import { StatusLogEntry } from '@/types';

interface StatusLogPanelProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'hp' | 'sp';
}

export default function StatusLogPanel({ isOpen, onClose, type }: StatusLogPanelProps) {
  const { statusHistory, status, currentScene } = useGameStore();
  
  const filteredLogs = statusHistory.filter(log => log.type === type);

  const getIcon = (log: StatusLogEntry) => {
    if (log.type === 'hp') {
      return log.amount > 0 ? <Heart className="w-4 h-4 text-green-500" /> : <Heart className="w-4 h-4 text-red-500" />;
    }
    return log.amount > 0 ? <Flame className="w-4 h-4 text-cyan-400" /> : <Flame className="w-4 h-4 text-blue-600" />;
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120]"
          />

          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 border-r top-0 h-full w-full max-w-md bg-zinc-950 border-zinc-800 shadow-2xl z-[130] flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${type === 'hp' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  {type === 'hp' ? <Heart className="w-6 h-6" /> : <Flame className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter text-zinc-100">
                    {type === 'hp' ? 'Diário de Batalha' : 'Histórico de Vigor'}
                  </h2>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                    {type === 'hp' ? 'Vitalidade e Sobrevivência' : 'Estamina e Esforço'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-zinc-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {/* Current Stats Summary */}
              <div className={`p-6 rounded-[32px] border flex items-center justify-between overflow-hidden relative ${type === 'hp' ? 'bg-red-950/10 border-red-900/30' : 'bg-blue-950/10 border-blue-900/30'}`}>
                 <div className="absolute right-0 top-0 p-6 opacity-5 rotate-12">
                   {type === 'hp' ? <Activity className="w-24 h-24" /> : <History className="w-24 h-24" />}
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                      {currentScene?.isGameOver ? 'Status Final' : 'Status Atual'}
                    </p>
                    <div className="flex items-end gap-2">
                       <h3 className="text-4xl font-black text-white">
                         {type === 'hp' ? status.hp : status.sp}
                       </h3>
                       <p className="text-sm font-bold text-zinc-600 uppercase mb-1.5">/ {type === 'hp' ? status.maxHp : status.maxSp}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Estado</p>
                    <p className={`text-xs font-black uppercase ${type === 'hp' && status.hp < 5 ? 'text-red-500 animate-pulse' : 'text-zinc-400'}`}>
                       {type === 'hp' 
                        ? (status.hp > 15 ? 'Vigoroso' : status.hp > 5 ? 'Ferido' : 'Crítico')
                        : (status.sp > 10 ? 'Descansado' : status.sp > 3 ? 'Cansado' : 'Exausto')}
                    </p>
                 </div>
              </div>

              {/* Log List */}
              <div className="space-y-4">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 ml-2 flex items-center gap-2">
                   <Clock className="w-3.5 h-3.5" /> Registros Recentes
                 </h3>
                 
                 {filteredLogs.length === 0 ? (
                   <div className="p-12 border-2 border-dashed border-zinc-900 rounded-[40px] text-center opacity-30">
                      <p className="text-zinc-500 font-serif italic">Nenhum evento registrado nesta lenda ainda...</p>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {filteredLogs.map((log) => (
                       <motion.div
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         key={log.id}
                         className="p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl flex items-center justify-between group hover:border-zinc-700 transition-all"
                       >
                         <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-zinc-950 border border-zinc-800`}>
                               {getIcon(log)}
                            </div>
                            <div>
                               <p className="text-sm font-bold text-zinc-200">{log.source}</p>
                               <p className="text-[9px] uppercase font-black text-zinc-600 flex items-center gap-1">
                                  <Clock className="w-2 h-2" /> {formatTime(log.timestamp)}
                               </p>
                            </div>
                         </div>
                         <div className={`text-sm font-mono font-black ${log.amount > 0 ? 'text-green-500' : type === 'hp' ? 'text-red-500' : 'text-blue-500'}`}>
                            {log.amount > 0 ? `+${log.amount}` : log.amount}
                         </div>
                       </motion.div>
                     ))}
                   </div>
                 )}
              </div>
            </div>

            {/* Footer Tip */}
            <div className="p-8 bg-zinc-900/50 border-t border-zinc-800">
               <div className="flex gap-4 items-start">
                  <div className="p-2 bg-zinc-800 rounded-lg shrink-0">
                    <ShieldCheck className="w-4 h-4 text-zinc-500" />
                  </div>
                  <p className="text-[11px] text-zinc-500 font-serif italic leading-relaxed">
                    {type === 'hp' 
                      ? "Ferimentos graves podem deixar cicatrizes permanentes. Use poções com sabedoria."
                      : "Ações táticas consomem estamina. Gerencie seu fôlego para não ficar vulnerável."}
                  </p>
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
