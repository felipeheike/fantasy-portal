'use client';

import { useGameStore, INVENTORY_CAPACITY, SPECTRAL_CAPACITY } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  X, 
  Sword, 
  Shield as ShieldIcon, 
  Wine, 
  Scroll, 
  Trash2,
  Hammer,
  Lock,
  Camera,
  Loader2,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp, Eye
} from 'lucide-react';
import { useState, useRef } from 'react';
import { InventoryItem } from '@/types';

interface InventoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InventoryPanel({ isOpen, onClose }: InventoryPanelProps) {
  const { inventory, discardItem, lockedItemName, addItem, settings, status, currentScene } = useGameStore();
  const [filter, setFilter] = useState<InventoryItem['type'] | 'all'>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredItems = filter === 'all' 
    ? inventory 
    : inventory.filter(item => item.type === filter);

  const categories = [
    { id: 'all', label: 'Tudo', icon: Package },
    { id: 'weapon', label: 'Armas', icon: Sword },
    { id: 'armor', label: 'Armaduras', icon: ShieldIcon },
    { id: 'consumable', label: 'Consumíveis', icon: Wine },
    { id: 'quest', label: 'Missão', icon: Scroll },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-portal-surface border-l border-portal-border shadow-2xl z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-portal-border flex items-center justify-between bg-portal-surface/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tighter text-portal-text">Inventário</h2>
                  <p className="text-[10px] text-portal-text-muted uppercase tracking-widest font-bold">Gerencie seus pertences</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-portal-surface-hover rounded-full transition-colors text-portal-text-muted hover:text-portal-text"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Category Filters */}
            <div className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-portal-border/50 bg-portal-surface/30">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilter(cat.id as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                    filter === cat.id 
                      ? 'bg-primary border-primary text-zinc-950 shadow-[0_0_15px_var(--portal-primary-glow-medium)]' 
                      : 'bg-portal-surface-hover border-portal-border text-portal-text-muted hover:border-portal-text-muted'
                  }`}
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Items Grid */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {filteredItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                  <Package className="w-16 h-16 mb-4 text-portal-text-muted" />
                  <p className="text-portal-text-muted font-body italic">Sua bolsa está vazia...</p>
                  <p className="text-[10px] uppercase tracking-widest mt-2">Explore o portal para encontrar itens</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredItems.map((item, index) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={item.id + index}
                      className={`group p-4 border rounded-2xl transition-all shadow-lg ${
                        item.isSpectral
                        ? 'bg-primary/5 border-primary/30 shadow-[0_0_20px_var(--portal-primary-glow-subtle)]'
                        : item.name === lockedItemName 
                        ? 'bg-primary/5 border-primary/50 ring-1 ring-primary/20' 
                        : 'bg-portal-surface-hover/40 border-portal-border/50 hover:bg-portal-surface-hover/80 hover:border-primary/30'
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-portal-surface border flex items-center justify-center transition-all shrink-0 ${
                          item.isSpectral ? 'text-primary border-primary/30' :
                          item.name === lockedItemName 
                          ? 'text-primary border-primary/50' 
                          : 'text-portal-text-muted border-portal-border group-hover:text-primary group-hover:border-primary/50'
                        }`}>
                          {item.isSpectral ? <Eye className="w-5 h-5" /> : getItemIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1 gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className={`font-bold truncate ${item.name === lockedItemName || item.isSpectral ? 'text-primary' : 'text-portal-text'}`}>
                                  {item.name}
                                </h3>
                                {item.isSpectral && <span className="text-[6px] font-black uppercase bg-primary text-zinc-950 px-1 rounded-sm animate-pulse">Spectral</span>}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1.5 shrink-0">
                               <span className="text-[10px] font-black bg-portal-surface px-2 py-1 rounded-md border border-portal-border text-portal-text-muted">
                                 x{item.quantity}
                               </span>

                               <button 
                                 onClick={() => toggleExpand(item.id)}
                                 className={`p-1.5 rounded-lg transition-colors ${
                                   expandedItems.has(item.id) 
                                   ? 'bg-primary text-zinc-950' 
                                   : 'bg-portal-surface text-portal-text-muted hover:text-portal-text'
                                 }`}
                                 title={expandedItems.has(item.id) ? 'Recolher' : 'Detalhes'}
                               >
                                 <Info className="w-3.5 h-3.5" />
                               </button>

                               {item.type !== 'quest' && (
                                 item.name === lockedItemName ? (
                                   <div 
                                     className="p-1.5 rounded-lg bg-portal-surface text-primary/40 cursor-help"
                                     title="Item em uso: não pode ser descartado"
                                   >
                                     <Lock className="w-3.5 h-3.5" />
                                   </div>
                                 ) : (
                                   <button 
                                     onClick={() => discardItem(item.id)}
                                     disabled={currentScene?.isGameOver}
                                     className="p-1.5 rounded-lg bg-red-950/20 text-red-500/50 hover:bg-red-500 hover:text-white transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                                     title={currentScene?.isGameOver ? "Lenda finalizada" : "Descartar Item"}
                                   >
                                     <Trash2 className="w-3.5 h-3.5" />
                                   </button>
                                 )
                               )}
                            </div>
                          </div>
                          <motion.p 
                            layout="position"
                            className={`text-xs text-portal-text-muted leading-relaxed font-body italic ${expandedItems.has(item.id) ? '' : 'line-clamp-2'}`}
                          >
                            {item.description}
                          </motion.p>
                          
                          {/* Durability Bar */}
                          {item.durability !== undefined && item.maxDurability !== undefined && (
                            <motion.div layout="position" className="mt-2">
                              <div className="flex items-center justify-between text-[8px] uppercase tracking-widest font-bold text-portal-text-muted mb-1">
                                <span className="flex items-center gap-1"><Hammer className="w-2 h-2" /> Durabilidade</span>
                                <span>{item.durability}/{item.maxDurability}</span>
                              </div>
                              <div className="w-full h-1 bg-portal-surface rounded-full overflow-hidden border border-portal-border">
                                <div 
                                  className={`h-full transition-all ${
                                    (item.durability / item.maxDurability) < 0.3 ? 'bg-red-500' : 'bg-portal-text-muted'
                                  }`}
                                  style={{ width: `${(item.durability / item.maxDurability) * 100}%` }}
                                />
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer / Stats Summary */}
            <div className="p-6 border-t border-portal-border bg-portal-bg/50 space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <div className="flex items-center justify-between text-[9px] font-black text-portal-text-muted uppercase tracking-widest mb-2">
                      <span>Espaço da Bolsa</span>
                      <span>{inventory.length} / {INVENTORY_CAPACITY}</span>
                   </div>
                   <div className="w-full h-1 bg-portal-surface rounded-full overflow-hidden border border-portal-border">
                      <div 
                        className="h-full bg-portal-text-muted" 
                        style={{ width: `${(inventory.length / INVENTORY_CAPACITY) * 100}%` }}
                      />
                   </div>
                 </div>

                 <div>
                   <div className="flex items-center justify-between text-[9px] font-black text-primary uppercase tracking-widest mb-2">
                      <span className="flex items-center gap-1"><Eye className="w-2.5 h-2.5" /> Itens Espectrais</span>
                      <span>{inventory.filter(i => i.isSpectral).length} / {SPECTRAL_CAPACITY}</span>
                   </div>
                   <div className="w-full h-1 bg-primary/10 rounded-full overflow-hidden border border-primary/20">
                      <div 
                        className="h-full bg-primary shadow-[0_0_10px_var(--portal-primary-glow)]" 
                        style={{ width: `${(inventory.filter(i => i.isSpectral).length / SPECTRAL_CAPACITY) * 100}%` }}
                      />
                   </div>
                 </div>
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function getItemIcon(type: InventoryItem['type']) {
  switch (type) {
    case 'weapon': return <Sword className="w-6 h-6" />;
    case 'armor': return <ShieldIcon className="w-6 h-6" />;
    case 'consumable': return <Wine className="w-6 h-6" />;
    case 'quest': return <Scroll className="w-6 h-6" />;
    default: return <Package className="w-6 h-6" />;
  }
}
