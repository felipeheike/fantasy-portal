'use client';

import { NarrativeOption } from '@/types';
import { motion } from 'framer-motion';
import { Compass, Sword, Shield, MessageSquare, Package } from 'lucide-react';

interface ChoiceSelectorProps {
  options: NarrativeOption[];
  onSelect: (option: NarrativeOption) => void;
  isLoading: boolean;
}

export default function ChoiceSelector({ options, onSelect, isLoading }: ChoiceSelectorProps) {
  if (options.length === 0 && !isLoading) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full p-8 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent z-40">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map((option, index) => (
            <motion.button
              key={option.id}
              whileHover={{ 
                scale: 1.01, 
                backgroundColor: 'rgba(24, 24, 27, 0.9)',
                borderColor: 'rgba(245, 158, 11, 0.4)',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.1)'
              }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
              onClick={() => onSelect(option)}
              disabled={isLoading}
              className="flex items-center gap-5 p-5 rounded-2xl border border-zinc-800/50 bg-zinc-900/60 backdrop-blur-md text-left transition-all group disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 group-hover:border-primary/50 group-hover:bg-primary/5 flex items-center justify-center text-zinc-500 group-hover:text-primary transition-all duration-300 shadow-inner shrink-0">
                {getOptionIcon(option.type)}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 group-hover:text-primary/70 transition-colors">
                  {option.type === 'composite' ? 'Ação Tática' : 'Escolha do Destino'}
                </span>
                <span className="text-zinc-200 font-bold tracking-tight text-sm md:text-base leading-tight">
                  {option.label}
                </span>
              </div>
            </motion.button>
          ))}
          
          {isLoading && (
            <div className="col-span-full py-4 flex justify-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-200 rounded-full"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getOptionIcon(type: NarrativeOption['type']) {
  switch (type) {
    case 'binary':
    case 'ternary':
    case 'quaternary':
      return <Compass className="w-5 h-5" />;
    case 'composite':
      return <Sword className="w-5 h-5" />;
    case 'interpretative':
      return <MessageSquare className="w-5 h-5" />;
    default:
      return <Package className="w-5 h-5" />;
  }
}
