'use client';

import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  X, 
  Sparkles,
  Lock,
  Star,
  Target,
  FlaskConical,
  ShieldCheck
} from 'lucide-react';
import { Skill } from '@/types';

interface SkillsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SkillsPanel({ isOpen, onClose }: SkillsPanelProps) {
  const { status, settings } = useGameStore();

  // Dynamic Rank Calculation
  const totalLevels = status.skills.reduce((acc, skill) => acc + skill.level, 0);
  
  const rankData = [
    { rank: 'F', min: 0, max: 0, label: 'Iniciante' },
    { rank: 'E', min: 1, max: 5, label: 'Aprendiz' },
    { rank: 'D', min: 6, max: 12, label: 'Competente' },
    { rank: 'C', min: 13, max: 20, label: 'Especialista' },
    { rank: 'B', min: 21, max: 30, label: 'Mestre' },
    { rank: 'A', min: 31, max: 45, label: 'Grão-Mestre' },
    { rank: 'S', min: 46, max: 100, label: 'Lenda' },
  ];

  const currentRank = rankData.find(r => totalLevels >= r.min && (totalLevels <= r.max || r.rank === 'S')) || rankData[0];
  
  // Progress within current rank for the 5 mini-bars
  const getRankProgress = () => {
    if (currentRank.rank === 'S') return 5;
    if (totalLevels === 0) return 0;
    const range = currentRank.max - currentRank.min + 1;
    const progress = totalLevels - currentRank.min + 1;
    return Math.ceil((progress / range) * 5);
  };

  const filledBars = getRankProgress();

  const getRankTitle = () => {
    switch (settings?.genre) {
      case 'cyberpunk': return 'CYBER RANK';
      case 'fantasy': return 'ARCANE RANK';
      case 'sci-fi': return 'TECH RANK';
      case 'gothic-horror': return 'BLOOD RANK';
      default: return 'RANK GERAL';
    }
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

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
                <div className="p-2 bg-primary/10 rounded-lg text-primary shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Zap className="w-5 h-5 fill-primary/20" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tighter text-zinc-100 italic">Habilidades</h2>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Domínio e Maestria</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-zinc-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mastery Level Info */}
            <div className="px-6 py-4 bg-zinc-950/30 border-b border-zinc-800/50">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Level Geral</span>
                 <span className="text-xs font-mono text-primary font-bold">
                   {getRankTitle()}: {currentRank.rank}
                 </span>
               </div>
               <div className="flex gap-1">
                 {[...Array(5)].map((_, i) => (
                   <div 
                    key={i} 
                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                      i < filledBars 
                      ? 'bg-primary shadow-[0_0_10px_rgba(245,158,11,0.5)]' 
                      : 'bg-zinc-800'
                    }`} 
                  />
                 ))}
               </div>
            </div>

            {/* Skills List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {status.skills.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                  <Lock className="w-16 h-16 mb-4 text-zinc-600" />
                  <p className="text-zinc-400 font-serif italic text-lg">Habilidades Ocultas...</p>
                  <p className="text-[10px] uppercase tracking-widest mt-2 max-w-[200px]">
                    Sua mente ainda não despertou para os mistérios do portal.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {status.skills.map((skill) => (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={skill.id}
                      className="group relative p-5 bg-zinc-800/20 border border-zinc-800 rounded-3xl hover:border-primary/30 transition-all overflow-hidden"
                    >
                      {/* Mastery background flare */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full translate-x-10 -translate-y-10" />

                      <div className="flex gap-5 relative z-10">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400 group-hover:text-primary group-hover:border-primary/50 transition-all shadow-xl">
                            {getSkillIcon(skill.id, skill.name)}
                          </div>
                          {/* Level Badge */}
                          <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-zinc-950 border border-zinc-700 rounded-lg flex items-center justify-center shadow-lg">
                             <span className="text-[10px] font-black text-primary italic">{skill.level}</span>
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-zinc-100 tracking-tight">{skill.name}</h3>
                            <div className="flex gap-0.5">
                               {[...Array(skill.maxLevel)].map((_, i) => (
                                 <Star 
                                   key={i} 
                                   className={`w-2.5 h-2.5 ${i < skill.level ? 'text-primary fill-primary' : 'text-zinc-800'}`} 
                                 />
                               ))}
                            </div>
                          </div>
                          <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                            {skill.description}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar for current level */}
                      <div className="mt-4 h-1 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${(skill.level / skill.maxLevel) * 100}%` }}
                           className="h-full bg-gradient-to-r from-primary/80 to-primary shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                         />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Summary */}
            <div className="p-6 border-t border-zinc-800 bg-zinc-950/50">
               <div className="flex items-center gap-4 text-zinc-400">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <p className="text-[10px] font-medium leading-tight uppercase tracking-tight">
                    Habilidades passivas e ativas são automáticas. 
                    A IA considera seu nível para sucessos críticos.
                  </p>
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function getSkillIcon(skillId: string, name: string) {
  const search = (skillId + ' ' + name).toLowerCase();
  if (search.includes('rastreamento') || search.includes('tracking') || search.includes('olho')) return <Target className="w-6 h-6" />;
  if (search.includes('cura') || search.includes('healing') || search.includes('medicina')) return <FlaskConical className="w-6 h-6" />;
  if (search.includes('defesa') || search.includes('shield') || search.includes('proteção')) return <ShieldCheck className="w-6 h-6" />;
  if (search.includes('fogo') || search.includes('fire') || search.includes('chama')) return <Zap className="w-6 h-6" />;
  return <Sparkles className="w-6 h-6" />;
}
