'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Palette, 
  ScrollText, 
  Target, 
  BookOpen,
  Info,
  Clock,
  ShieldCheck,
  Volume2,
  Sparkles,
  Cpu,
  Activity,
  Zap,
  Type,
  Link,
  Crown
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

interface JourneyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: any;
  historyCount: number;
}

interface AIStatus {
  text: {
    model: string;
    isCustom: boolean;
    status: string;
    latency: string;
  };
  image: {
    model: string;
    isCustom: boolean;
    status: string;
    latency: string;
  };
}

export default function JourneyDetailsModal({ isOpen, onClose, settings, historyCount }: JourneyDetailsModalProps) {
  const { updateSettings } = useGameStore();
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/ai-status')
        .then(r => r.json())
        .then(setAiStatus)
        .catch(() => setAiStatus(null));
    }
  }, [isOpen]);

  if (!settings) return null;

  const journeyLengthMap: Record<string, string> = {
    preview: 'Jornada Preview (1-10)',
    short: 'Jornada Curta (11-50)',
    medium: 'Jornada Média (51-99)',
    long: 'Jornada Longa (100-249)',
    epic: 'Jornada Épica (250-499)',
    'life-long': 'Jornada Eterna (500+)'
  };

  const narrativeDetailMap: Record<string, string> = {
    short: 'Curto (1-2 parágrafos)',
    medium: 'Médio (3-4 parágrafos)',
    long: 'Longo (5-7 parágrafos)',
    epic: 'Épico (8+ parágrafos)'
  };

  const readStyleMap: Record<string, string> = {
    essential: 'Essencial',
    fast: 'Rápido',
    moderate: 'Médio',
    detailed: 'Detalhado',
    literary: 'Literário'
  };

  const stats = [
    { label: 'Protagonista', value: settings.playerName, icon: User },
    { label: 'Estilo Visual', value: settings.visualStyle, icon: Palette },
    { label: 'Gênero', value: settings.genre, icon: BookOpen },
    { label: 'Tom Narrativo', value: settings.tone, icon: Target },
    { label: 'Estilo Literário', value: readStyleMap[settings.readStyle] || settings.readStyle, icon: Type },
    { label: 'Magnitude', value: narrativeDetailMap[settings.narrativeDetail] || settings.narrativeDetail || 'Médio', icon: Zap },
    { label: 'Tamanho Base', value: journeyLengthMap[settings.journeyLength] || settings.journeyLength, icon: Clock },
    { label: 'Cenas no Registro', value: historyCount.toString(), icon: ScrollText },
    { label: 'Sistema de Punição', value: settings.punishSystem?.replace(/_/g, ' ') || 'Não definido', icon: ShieldCheck },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter text-zinc-100">Configurações do Destino</h2>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Parâmetros da sua lenda atual</p>
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
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {stats.map((stat, i) => (
                  <div key={i} className="flex flex-col gap-1.5 p-3 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 hover:bg-zinc-900 transition-colors">
                    <div className="flex items-center gap-2">
                      <stat.icon className="w-3 h-3 text-primary/70" />
                      <p className="text-[8px] text-zinc-500 uppercase font-black tracking-widest leading-none">{stat.label}</p>
                    </div>
                    <p className="text-[11px] font-bold text-zinc-200 uppercase truncate pl-5">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* AI Controls in Modal */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Configurações de IA e Cota</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-3xl border border-zinc-800">
                      <div className="flex items-center gap-3">
                        <Palette className="w-4 h-4 text-zinc-500" />
                        <span className="text-xs font-bold text-zinc-200">Ilustrações</span>
                      </div>
                      <button 
                        onClick={() => updateSettings({ enableImages: !settings.enableImages })}
                        className={`w-10 h-5 rounded-full transition-all relative p-1 ${settings.enableImages ? 'bg-primary' : 'bg-zinc-800'}`}
                      >
                        <motion.div 
                          animate={{ x: settings.enableImages ? 20 : 0 }}
                          className="w-3 h-3 bg-white rounded-full shadow-md"
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-3xl border border-zinc-800">
                      <div className="flex items-center gap-3">
                        <Volume2 className="w-4 h-4 text-zinc-500" />
                        <span className="text-xs font-bold text-zinc-200">Narração</span>
                      </div>
                      <button 
                        onClick={() => updateSettings({ enableAudio: !settings.enableAudio })}
                        className={`w-10 h-5 rounded-full transition-all relative p-1 ${settings.enableAudio ? 'bg-primary' : 'bg-zinc-800'}`}
                      >
                        <motion.div 
                          animate={{ x: settings.enableAudio ? 20 : 0 }}
                          className="w-3 h-3 bg-white rounded-full shadow-md"
                        />
                      </button>
                    </div>

                    <AnimatePresence>
                      {settings.enableAudio && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center justify-between p-4 bg-zinc-900 rounded-3xl border border-zinc-800"
                        >
                          <div className="flex items-center gap-3">
                            <Volume2 className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold text-zinc-200">Auto-Play</span>
                          </div>
                          <button 
                            onClick={() => updateSettings({ autoPlayAudio: !settings.autoPlayAudio })}
                            className={`w-10 h-5 rounded-full transition-all relative p-1 ${settings.autoPlayAudio ? 'bg-primary' : 'bg-zinc-800'}`}
                          >
                            <motion.div 
                              animate={{ x: settings.autoPlayAudio ? 20 : 0 }}
                              className="w-3 h-3 bg-white rounded-full shadow-md"
                            />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                </div>
              </div>

              {/* Simplified AI Status Cards */}
              {aiStatus && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bloco de Texto (Mente) */}
                  <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-3xl border border-zinc-800 relative group overflow-hidden">
                    <div className="flex items-center gap-3 relative z-10">
                      <div className={`p-2 rounded-xl ${aiStatus.text.isCustom ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-500'}`}>
                         {aiStatus.text.isCustom ? <Crown className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Mente</p>
                           {aiStatus.text.isCustom && (
                             <span className="text-[7px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-black uppercase border border-primary/20 flex items-center gap-1">
                                <Link className="w-2 h-2" /> Vinculada à Alma
                             </span>
                           )}
                        </div>
                        <p className="text-xs font-bold text-zinc-300">{aiStatus.text.model}</p>
                      </div>
                    </div>
                    <div className="text-right relative z-10">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Activity className={`w-3 h-3 ${aiStatus.text.status === 'Operacional' ? 'text-green-500' : 'text-red-500'}`} />
                        <span className={`text-[9px] font-bold uppercase ${aiStatus.text.status === 'Operacional' ? 'text-green-500' : 'text-red-500'}`}>{aiStatus.text.status}</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-600">{aiStatus.text.latency}</span>
                    </div>
                    {/* Thematic Glow if custom */}
                    {aiStatus.text.isCustom && (
                      <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary/5 blur-2xl rounded-full group-hover:bg-primary/10 transition-all" />
                    )}
                  </div>

                  {/* Bloco de Imagem (Visão) */}
                  <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-3xl border border-zinc-800 relative group overflow-hidden">
                    <div className="flex items-center gap-3 relative z-10">
                      <div className={`p-2 rounded-xl ${aiStatus.image.isCustom ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-500'}`}>
                         {aiStatus.image.isCustom ? <Crown className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Visão</p>
                           {aiStatus.image.isCustom && (
                             <span className="text-[7px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-black uppercase border border-primary/20 flex items-center gap-1">
                                <Link className="w-2 h-2" /> Vinculada à Alma
                             </span>
                           )}
                        </div>
                        <p className="text-xs font-bold text-zinc-300">{aiStatus.image.model}</p>
                      </div>
                    </div>
                    <div className="text-right relative z-10">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Activity className={`w-3 h-3 ${aiStatus.image.status === 'Operacional' ? 'text-green-500' : 'text-red-500'}`} />
                        <span className={`text-[9px] font-bold uppercase ${aiStatus.image.status === 'Operacional' ? 'text-green-500' : 'text-red-500'}`}>{aiStatus.image.status}</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-600">{aiStatus.image.latency}</span>
                    </div>
                    {/* Thematic Glow if custom */}
                    {aiStatus.image.isCustom && (
                      <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary/5 blur-2xl rounded-full group-hover:bg-primary/10 transition-all" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
