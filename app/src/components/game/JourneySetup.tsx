'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { JourneySettings } from '@/types';
import { OptionPicker } from './OptionPicker';
import {
  GENRE_OPTIONS,
  VISUAL_STYLE_OPTIONS,
  READ_STYLE_OPTIONS,
  PUNISH_SYSTEM_OPTIONS,
  MAGNITUDE_OPTIONS,
  JOURNEY_LENGTH_OPTIONS,
} from '@/lib/journeyOptions';
import {
  User,
  Map,
  Skull,
  Palette,
  BookOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Volume2,
  Type,
  Crown,
  ScrollText,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function JourneySetup() {
  const { setSettings, startGame, isSetupMode, setSetupMode } = useGameStore();
  const [step, setStep] = useState(1);
  const [hasBYOK, setHasBYOK] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [form, setForm] = useState<JourneySettings>({
    playerName: '',
    genre: 'fantasy',
    journeyLength: 'preview', 
    punishSystem: 'fail_tolerance_3',
    visualStyle: 'dark-realism',
    narrativeStyle: 'epic',
    tone: 'dark',
    readStyle: 'moderate',
    narrativeDetail: 'medium',
    enableImages: true,
    enableAudio: true,
    autoPlayAudio: false
  });

  // Fetch BYOK status on start
  useEffect(() => {
    if (isSetupMode) {
      fetch('/api/auth/profile')
        .then(r => r.json())
        .then(data => {
          const keys = data.apiKeys || {};
          const enabled = data.apiEnabled || {};
          const active = Object.entries(keys).some(([p, k]) => k && k !== '' && enabled[p] !== false);
          setHasBYOK(active);
          
          // Force defaults if no keys
          if (!active) {
            setForm(f => ({ ...f, journeyLength: 'preview', narrativeDetail: 'medium' }));
          }
        })
        .catch(() => setHasBYOK(false))
        .finally(() => setIsInitialLoading(false));
    }
  }, [isSetupMode]);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleStart = async () => {
    if (!form.playerName) return;
    setSettings(form);
    startGame();
  };

  const handleCancel = () => {
    setSetupMode(false);
    setStep(1);
  };

  const steps = [
    {
      id: 'name',
      title: "Quem é você?",
      desc: "Todo herói começa com um nome.",
      icon: User,
      content: (
        <div className="space-y-4">
          <input 
            autoFocus
            type="text" 
            placeholder="Digite o nome do herói..."
            className="w-full bg-portal-surface border-2 border-portal-border rounded-2xl p-4 text-portal-text placeholder:text-zinc-600 focus:border-primary outline-none transition-all text-lg font-bold italic"
            value={form.playerName || ''}
            onChange={(e) => setForm({ ...form, playerName: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && form.playerName && nextStep()}
          />
        </div>
      )
    },
    {
      id: 'length',
      title: "O Destino da Jornada",
      desc: "Quão longe pretende ir?",
      icon: Map,
      content: (
        <OptionPicker
          options={JOURNEY_LENGTH_OPTIONS}
          value={form.journeyLength}
          onChange={(id) => setForm({ ...form, journeyLength: id as any })}
          hasBYOK={hasBYOK}
          variant="cards"
        />
      )
    },
    {
      id: 'punish',
      title: "Regras de Punição",
      desc: "A morte é o fim ou apenas um revés?",
      icon: Skull,
      content: (
        <OptionPicker
          options={PUNISH_SYSTEM_OPTIONS}
          value={form.punishSystem}
          onChange={(id) => setForm({ ...form, punishSystem: id as any })}
          hasBYOK={hasBYOK}
          variant="list"
          accent="red"
          showRadio
        />
      )
    },
    {
      id: 'visual',
      title: "Estética do Mundo",
      desc: "Como o portal deve se manifestar?",
      icon: Palette,
      content: (
        <div className="space-y-4">
          <div className="max-h-40 overflow-y-auto custom-scrollbar pr-2">
            <OptionPicker
              options={GENRE_OPTIONS}
              value={form.genre}
              onChange={(id) => setForm({ ...form, genre: id as any })}
              hasBYOK={hasBYOK}
              variant="pills"
              accent="neutral"
            />
          </div>

          <div className="border-t border-portal-border pt-4 max-h-40 overflow-y-auto custom-scrollbar pr-2">
            <OptionPicker
              options={VISUAL_STYLE_OPTIONS}
              value={form.visualStyle}
              onChange={(id) => setForm({ ...form, visualStyle: id as any })}
              hasBYOK={hasBYOK}
              variant="pills"
            />
          </div>
        </div>
      )
    },
    {
      id: 'read',
      title: "Estilo Literário",
      desc: "A profundidade da narração.",
      icon: BookOpen,
      content: (
        <OptionPicker
          options={READ_STYLE_OPTIONS}
          value={form.readStyle}
          onChange={(id) => setForm({ ...form, readStyle: id as any })}
          hasBYOK={hasBYOK}
          variant="list"
        />
      )
    },
    {
      id: 'magnitude',
      title: "Magnitude Narrativa",
      desc: "A extensão dos relatos do Mestre.",
      icon: Type,
      content: (
        <OptionPicker
          options={MAGNITUDE_OPTIONS}
          value={form.narrativeDetail}
          onChange={(id) => setForm({ ...form, narrativeDetail: id as any })}
          hasBYOK={hasBYOK}
          variant="list"
        />
      )
    },
    {
      id: 'immersion',
      title: "Imersão e Cota",
      desc: "Configurações finais da sua lenda.",
      icon: Sparkles,
      content: (
        <div className="space-y-6">
          <div className="pt-4 space-y-4">
             <div className="flex items-center justify-between p-4 bg-portal-surface/30 rounded-2xl border border-portal-border/50">
                <div className="flex items-center gap-3">
                  <Palette className="w-4 h-4 text-zinc-500" />
                  <div>
                     <p className="text-[10px] font-bold text-zinc-200 uppercase">Ilustrações por IA</p>
                     <p className="text-[8px] text-zinc-600 uppercase font-black">Consome cota de imagem</p>
                  </div>
                </div>
                <button 
                  onClick={() => setForm({ ...form, enableImages: !form.enableImages })}
                  className={`w-10 h-5 rounded-full transition-all relative p-1 ${form.enableImages ? 'bg-primary' : 'bg-portal-surface-hover'}`}
                >
                  <motion.div 
                    animate={{ x: form.enableImages ? 20 : 0 }}
                    className="w-3 h-3 bg-white rounded-full"
                  />
                </button>
             </div>

             <div className="flex items-center justify-between p-4 bg-portal-surface/30 rounded-2xl border border-portal-border/50">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-4 h-4 text-zinc-500" />
                  <div>
                     <p className="text-[10px] font-bold text-zinc-200 uppercase">Narração por Áudio</p>
                     <p className="text-[8px] text-zinc-600 uppercase font-black">Consome cota de texto-para-voz</p>
                  </div>
                </div>
                <button 
                  onClick={() => setForm({ ...form, enableAudio: !form.enableAudio })}
                  className={`w-10 h-5 rounded-full transition-all relative p-1 ${form.enableAudio ? 'bg-primary' : 'bg-portal-surface-hover'}`}
                >
                  <motion.div 
                    animate={{ x: form.enableAudio ? 20 : 0 }}
                    className="w-3 h-3 bg-white rounded-full"
                  />
                </button>
             </div>

             <AnimatePresence>
               {form.enableAudio && (
                 <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   exit={{ opacity: 0, height: 0 }}
                   className="flex items-center justify-between p-4 bg-portal-surface/30 rounded-2xl border border-portal-border/50"
                 >
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-4 h-4 text-primary animate-pulse" />
                      <div>
                         <p className="text-[10px] font-bold text-zinc-200 uppercase">Auto-Play do Áudio</p>
                         <p className="text-[8px] text-zinc-600 uppercase font-black">Tocar áudio automaticamente</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setForm({ ...form, autoPlayAudio: !form.autoPlayAudio })}
                      className={`w-10 h-5 rounded-full transition-all relative p-1 ${form.autoPlayAudio ? 'bg-primary' : 'bg-portal-surface-hover'}`}
                    >
                      <motion.div 
                        animate={{ x: form.autoPlayAudio ? 20 : 0 }}
                        className="w-3 h-3 bg-white rounded-full"
                      />
                    </button>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[step - 1];

  return (
    <AnimatePresence>
      {isSetupMode && (
        <div className="fixed inset-0 bg-portal-bg z-[100] flex items-center justify-center p-6 overflow-hidden">
          {/* Background Ambience */}
          <div className="absolute inset-0 opacity-30 bg-[url('/noise.svg')] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-xl bg-portal-surface/50 border border-portal-border p-6 md:p-10 rounded-[32px] md:rounded-[40px] backdrop-blur-xl shadow-2xl relative"
            >
            {/* Cancel Button */}
            <button 
              onClick={handleCancel}
              className="absolute top-6 right-6 md:top-8 md:right-8 z-50 p-2 bg-portal-surface-hover/50 hover:bg-zinc-700 rounded-full text-zinc-500 hover:text-white transition-all group"
              title="Cancelar Criação"
            >
              <X className="w-4 h-4 md:w-5 md:h-5 group-hover:rotate-90 transition-transform" />
            </button>

            {/* Power Status Badge */}
            <div className="absolute top-8 left-10 flex items-center gap-2">
               {isInitialLoading ? (
                 <Loader2 className="w-3 h-3 animate-spin text-zinc-600" />
               ) : hasBYOK ? (
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <Crown className="w-2.5 h-2.5 text-emerald-500" />
                    <span className="text-[7px] font-black uppercase tracking-widest text-emerald-500">Poder Ancestral</span>
                 </div>
               ) : (
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-portal-surface-hover border border-zinc-700 rounded-full">
                    <ScrollText className="w-2.5 h-2.5 text-zinc-500" />
                    <span className="text-[7px] font-black uppercase tracking-widest text-zinc-500">Canalização do Reino</span>
                 </div>
               )}
            </div>

            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 flex gap-1 p-3 md:p-4 mt-2">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-full flex-1 rounded-full transition-all duration-500 ${
                    i + 1 <= step ? 'bg-primary shadow-[0_0_10px_var(--portal-primary-glow)]' : 'bg-portal-surface-hover'
                  }`} 
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 md:space-y-8 pt-6"
              >
                <div className="space-y-1 md:space-y-2">
                  <div className="flex items-center gap-3 text-primary mb-2 md:mb-4">
                    <currentStepData.icon className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em]">Passo {step} de {steps.length}</span>
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black text-portal-text tracking-tighter italic">
                    {currentStepData.title}
                  </h2>
                  <p className="text-zinc-500 font-body italic text-sm md:text-lg leading-relaxed">
                    {currentStepData.desc}
                  </p>
                </div>

                <div className="py-2 md:py-4">
                  {currentStepData.content}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 md:mt-10 flex items-center justify-between pt-4 md:pt-6 border-t border-portal-border/50 gap-4">
              <button
                disabled={step === 1}
                onClick={prevStep}
                className="flex items-center gap-2 text-zinc-500 hover:text-portal-text transition-colors disabled:opacity-0 shrink-0"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Voltar</span>
              </button>

              {step < steps.length ? (
                <button
                  disabled={step === 1 && !form.playerName}
                  onClick={nextStep}
                  className="group flex items-center gap-2 md:gap-3 bg-portal-primary text-portal-primary-foreground px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs hover:brightness-110 transition-all disabled:opacity-50"
                >
                  Próximo
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  className="flex items-center gap-2 md:gap-3 bg-portal-primary text-portal-primary-foreground px-6 md:px-10 py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-sm shadow-[0_0_30px_var(--portal-primary-glow-weak)] hover:scale-105 active:scale-95 transition-all"
                >
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 fill-portal-primary-foreground" />
                  <span className="truncate">Invocar Jornada</span>
                </button>
              )}
            </div>
            
            {/* Contextual Restriction Help */}
            {!hasBYOK && (step === 2 || step === 6) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-2"
              >
                 <AlertCircle className="w-3 h-3 text-primary" />
                 <p className="text-[7px] font-black uppercase tracking-widest text-primary/70">
                    Alguns caminhos exigem sua própria chave de API para sustentar a energia do portal.
                 </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
