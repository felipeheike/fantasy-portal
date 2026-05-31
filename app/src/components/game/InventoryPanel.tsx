'use client';

import { useGameStore, INVENTORY_CAPACITY } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  X, 
  Sword, 
  Shield as ShieldIcon, 
  Wine, 
  Scroll, 
  Info,
  Trash2,
  Hammer,
  Lock,
  Camera,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useState, useRef } from 'react';
import { InventoryItem } from '@/types';

interface InventoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InventoryPanel({ isOpen, onClose }: InventoryPanelProps) {
  const { inventory, discardItem, lockedItemName, addItem, settings, status } = useGameStore();
  const [filter, setFilter] = useState<InventoryItem['type'] | 'all'>('all');
  const [isVisionLoading, setIsVisionLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVisionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVisionLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        
        const res = await fetch('/api/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            image: base64Image,
            playerContext: { settings, status }
          })
        });

        if (res.ok) {
          const { item: visionItem, narrative } = await res.json();
          
          const newItem: InventoryItem = {
            id: `vision-${Date.now()}`,
            name: visionItem.name,
            description: visionItem.description,
            quantity: 1,
            type: visionItem.type,
            durability: visionItem.stats?.durability,
            maxDurability: visionItem.stats?.durability
          };

          addItem(newItem);
          alert(`OLHO DO MESTRE:\n\n${narrative}\n\nVocê recebeu: ${newItem.name}`);
        } else {
          alert('O Portal não conseguiu ler este objeto. Tente novamente.');
        }
        setIsVisionLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Vision Upload Err:", err);
      setIsVisionLoading(false);
    }
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
            className="fixed right-0 top-0 h-full w-full max-w-md bg-zinc-900 border-l border-zinc-800 shadow-2xl z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tighter text-zinc-100">Inventário</h2>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Gerencie seus pertences</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-zinc-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Category Filters */}
            <div className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-zinc-800/50 bg-zinc-900/30">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilter(cat.id as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                    filter === cat.id 
                      ? 'bg-primary border-primary text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
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
                  <Package className="w-16 h-16 mb-4 text-zinc-600" />
                  <p className="text-zinc-400 font-serif italic">Sua bolsa está vazia...</p>
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
                      className={`group p-4 bg-zinc-800/40 border rounded-2xl transition-all shadow-lg ${
                        item.name === lockedItemName 
                        ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' 
                        : 'border-zinc-700/50 hover:bg-zinc-800/80 hover:border-primary/30'
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-zinc-900 border flex items-center justify-center transition-all shrink-0 ${
                          item.name === lockedItemName 
                          ? 'text-primary border-primary/50' 
                          : 'text-zinc-500 border-zinc-700 group-hover:text-primary group-hover:border-primary/50'
                        }`}>
                          {getItemIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h3 className={`font-bold truncate ${item.name === lockedItemName ? 'text-primary' : 'text-zinc-200'}`}>
                              {item.name}
                            </h3>
                            <span className="text-[10px] font-black bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-700 text-zinc-400">
                              x{item.quantity}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed font-serif italic">
                            {item.description}
                          </p>
                          
                          {/* Durability Bar */}
                          {item.durability !== undefined && item.maxDurability !== undefined && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-[8px] uppercase tracking-widest font-bold text-zinc-500 mb-1">
                                <span className="flex items-center gap-1"><Hammer className="w-2 h-2" /> Durabilidade</span>
                                <span>{item.durability}/{item.maxDurability}</span>
                              </div>
                              <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                                <div 
                                  className={`h-full transition-all ${
                                    (item.durability / item.maxDurability) < 0.3 ? 'bg-red-500' : 'bg-zinc-400'
                                  }`}
                                  style={{ width: `${(item.durability / item.maxDurability) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action buttons (Appear on hover) */}
                      <div className="mt-3 pt-3 border-t border-zinc-700/30 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-100 transition-colors">
                           <Info className="w-3 h-3" /> Detalhes
                         </button>
                         {item.type !== 'quest' && (
                           item.name === lockedItemName ? (
                             <div 
                               className="p-1.5 rounded-lg bg-zinc-900 text-primary/40 cursor-help"
                               title="Item em uso: não pode ser descartado"
                             >
                               <Lock className="w-3.5 h-3.5" />
                             </div>
                           ) : (
                             <button 
                               onClick={() => discardItem(item.id)}
                               className="p-1.5 rounded-lg bg-red-950/20 text-red-500/50 hover:bg-red-500 hover:text-white transition-all"
                               title="Descartar Item"
                             >
                               <Trash2 className="w-3.5 h-3.5" />
                             </button>
                           )
                         )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer / Stats Summary */}
            <div className="p-6 border-t border-zinc-800 bg-zinc-950/50 space-y-6">
               {/* Vision Feature */}
               <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                    <Sparkles className="w-4 h-4 text-primary" />
                 </div>
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Olho do Mestre</h4>
                 <p className="text-[10px] text-zinc-500 mb-3 font-serif italic">Traga um objeto do mundo real para sua lenda.</p>
                 
                 <input 
                   type="file" 
                   accept="image/*" 
                   ref={fileInputRef} 
                   onChange={handleVisionUpload}
                   className="hidden" 
                 />
                 
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   disabled={isVisionLoading || inventory.length >= INVENTORY_CAPACITY}
                   className="w-full flex items-center justify-center gap-2 py-2 bg-primary text-zinc-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isVisionLoading ? (
                     <> <Loader2 className="w-3 h-3 animate-spin" /> Analisando Artefato... </>
                   ) : (
                     <> <Camera className="w-3 h-3" /> Capturar Objeto </>
                   )}
                 </button>
               </div>

               <div>
                 <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    <span>Capacidade</span>
                    <span>{inventory.length} / {INVENTORY_CAPACITY} Itens</span>
                 </div>
                 <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${(inventory.length / INVENTORY_CAPACITY) * 100}%` }}
                    />
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
