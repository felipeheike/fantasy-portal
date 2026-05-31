'use client';

import { useGameStore, INVENTORY_CAPACITY } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  X, 
  Scale, 
  MapPin, 
  Flag,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Info,
  Sparkles
} from 'lucide-react';
import { useState } from 'react';

interface InfluencePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InfluencePanel({ isOpen, onClose }: InfluencePanelProps) {
  const { status } = useGameStore();
  const reputations = status.reputations || {};
  
  // Categorize reputations
  const categorized = Object.entries(reputations).reduce((acc: any, [name, value]) => {
    const n = name.toLowerCase();
    if (n.includes('vila') || n.includes('cidade') || n.includes('reino') || n.includes('vale') || n.includes('floresta')) {
      acc.places.push({ name, value: value as number });
    } else if (n.includes('guilda') || n.includes('ordem') || n.includes('facção') || n.includes('clã') || n.includes('exército')) {
      acc.factions.push({ name, value: value as number });
    } else {
      acc.people.push({ name, value: value as number });
    }
    return acc;
  }, { people: [], places: [], factions: [] });

  const renderReputationList = (items: { name: string, value: number }[], icon: any, title: string) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2">
             {icon} {title}
           </h3>
           <span className="text-[8px] font-bold text-zinc-700 uppercase">{items.length} Registros</span>
        </div>
        <div className="space-y-2">
          {items.map(({ name, value }) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={name} 
              className="p-4 bg-zinc-800/40 border border-zinc-700/50 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all shadow-lg"
            >
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg transition-colors ${value > 0 ? 'bg-green-500/10 text-green-500' : value < 0 ? 'bg-red-500/10 text-red-500' : 'bg-zinc-700/50 text-zinc-400'}`}>
                    {value > 0 ? <ShieldCheck className="w-4 h-4" /> : value < 0 ? <ShieldAlert className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
                 </div>
                 <div>
                    <p className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">{name}</p>
                    <p className="text-[9px] uppercase font-black text-zinc-600 tracking-tighter">
                      {value > 15 ? 'Aliado Leal' : value > 5 ? 'Amigável' : value > -5 ? 'Indiferente' : value > -15 ? 'Hostil' : 'Inimigo Declarado'}
                    </p>
                 </div>
              </div>
              <div className="text-right">
                <div className={`text-xs font-mono font-bold ${value > 0 ? 'text-green-500' : value < 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                  {value > 0 ? `+${value}` : value}
                </div>
                <div className="flex items-center gap-1 justify-end mt-1">
                   {value > 0 ? <TrendingUp className="w-3 h-3 text-green-700" /> : value < 0 ? <TrendingDown className="w-3 h-3 text-red-900" /> : null}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
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
            className="fixed left-0 top-0 h-full w-full max-w-md bg-zinc-900 border-r border-zinc-800 shadow-2xl z-[130] flex flex-col"
          >

            {/* Header */}
            <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter text-zinc-100">Influência & Fama</h2>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">O reflexo da sua alma no mundo</p>
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
            <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
              {Object.keys(reputations).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                  <div className="relative mb-6">
                    <Users className="w-20 h-20 text-zinc-700" />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                      className="absolute -top-2 -right-2 bg-primary rounded-full p-2"
                    >
                      <Sparkles className="w-4 h-4 text-zinc-950" />
                    </motion.div>
                  </div>
                  <p className="text-zinc-400 font-serif italic text-lg">Você ainda é um desconhecido...</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] mt-3 font-black text-zinc-600">Suas decisões moldarão como o mundo o vê</p>
                </div>
              ) : (
                <>
                  {/* Summary Card */}
                  <div className="p-8 bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-[40px] border border-zinc-700/50 relative overflow-hidden shadow-2xl">
                     <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12">
                        <Scale className="w-40 h-40" />
                     </div>
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Karma Global</p>
                     <div className="flex items-end gap-3">
                        <h3 className="text-6xl font-black text-white tracking-tighter">
                          {status.moral > 0 ? `+${status.moral}` : status.moral}
                        </h3>
                        <div className="mb-2">
                           <p className={`text-xs font-black uppercase tracking-widest ${status.moral > 0 ? 'text-green-500' : status.moral < 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                              {status.moral > 15 ? 'Lendário' : status.moral > 5 ? 'Benevolente' : status.moral < -15 ? 'Infame' : status.moral < -5 ? 'Cruel' : 'Neutro'}
                           </p>
                           <div className="flex gap-0.5 mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className={`w-3 h-1 rounded-full ${i < Math.abs(status.moral) / 4 ? (status.moral > 0 ? 'bg-green-500' : 'bg-red-500') : 'bg-zinc-800'}`} />
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>

                  {renderReputationList(categorized.people, <Users className="w-3.5 h-3.5 text-blue-500" />, "Personagens Conhecidos")}
                  {renderReputationList(categorized.places, <MapPin className="w-3.5 h-3.5 text-emerald-500" />, "Locais e Regiões")}
                  {renderReputationList(categorized.factions, <Flag className="w-3.5 h-3.5 text-purple-500" />, "Facções e Alianças")}
                </>
              )}
            </div>

            {/* Footer Lore */}
            <div className="p-8 bg-zinc-900/50 border-t border-zinc-800">
               <div className="flex gap-4 items-start">
                  <div className="p-2 bg-zinc-800 rounded-lg shrink-0">
                    <Info className="w-4 h-4 text-zinc-500" />
                  </div>
                  <p className="text-[11px] text-zinc-500 font-serif italic leading-relaxed">
                    "O mundo não é uma página em branco; cada ato seu é uma mancha de tinta indelével na tapeçaria do tempo. NPCs e cidades reagirão à sua fama local."
                  </p>
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
