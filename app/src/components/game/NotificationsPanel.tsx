'use client';

import { useGameStore, MAX_NOTIFICATIONS } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  Trash2, 
  CheckCircle2, 
  Package, 
  Sparkles, 
  Scale, 
  ScrollText, 
  AlertCircle,
  Clock,
  Circle
} from 'lucide-react';
import { GameNotification } from '@/types';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const { notificationHistory, markNotificationsAsRead, clearNotifications } = useGameStore();

  const getIcon = (type: GameNotification['type']) => {
    switch (type) {
      case 'item': return <Package className="w-4 h-4 text-emerald-500" />;
      case 'skill': return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'reputation': return <Scale className="w-4 h-4 text-blue-500" />;
      case 'moral': return <Scale className="w-4 h-4 text-purple-500" />;
      case 'memory': return <ScrollText className="w-4 h-4 text-zinc-400" />;
      case 'status': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Bell className="w-4 h-4 text-zinc-500" />;
    }
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
            onClick={() => {
              markNotificationsAsRead();
              onClose();
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120]"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-portal-surface border-l border-portal-border shadow-2xl z-[130] flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-portal-border flex items-center justify-between bg-portal-surface/30 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter text-portal-text">Sinalizador</h2>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Histórico do Destino</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={clearNotifications}
                  className="p-2 hover:bg-red-500/10 rounded-xl transition-colors text-zinc-600 hover:text-red-500"
                  title="Limpar Tudo"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    markNotificationsAsRead();
                    onClose();
                  }}
                  className="p-2 hover:bg-portal-surface-hover rounded-full transition-colors text-zinc-500 hover:text-zinc-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {notificationHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                  <Bell className="w-16 h-16 mb-4 text-zinc-700" />
                  <p className="text-zinc-500 font-body italic text-lg">Silêncio no portal...</p>
                  <p className="text-[10px] uppercase tracking-widest mt-2 font-black">Nenhum evento registrado ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notificationHistory.map((notif) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={notif.id}
                      className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                        notif.read ? 'bg-portal-surface-hover/20 border-portal-border/50' : 'bg-portal-surface-hover/40 border-portal-border ring-1 ring-primary/10'
                      }`}
                    >
                      {!notif.read && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                      )}
                      <div className="flex gap-4">
                        <div className="p-2 bg-portal-surface rounded-xl h-fit border border-portal-border">
                          {getIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={`text-xs font-bold truncate ${notif.read ? 'text-zinc-400' : 'text-portal-text'}`}>
                              {notif.title}
                            </h3>
                            <span className="text-[8px] font-mono text-zinc-600 flex items-center gap-1">
                              <Clock className="w-2 h-2" /> {formatTime(notif.timestamp)}
                            </span>
                          </div>
                          {notif.description && (
                            <p className="text-[10px] text-zinc-500 leading-relaxed font-body italic line-clamp-2">
                              {notif.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-portal-bg/50 border-t border-portal-border flex items-center justify-between">
               <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Limite: {MAX_NOTIFICATIONS} registros</span>
               <div className="flex items-center gap-2 text-zinc-500">
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Sincronizado</span>
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
