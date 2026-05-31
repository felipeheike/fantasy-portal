'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { JourneySettings } from '@/types';
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
  Target
} from 'lucide-react';

export default function JourneySetup() {
  const { setSettings, startGame, resetGame, isSetupMode, setSetupMode } = useGameStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<JourneySettings>({
    playerName: '',
    genre: 'fantasy',
    journeyLength: 'medium',
    punishSystem: 'fail_tolerance_3',
    visualStyle: 'dark-realism',
    narrativeStyle: 'epic',
    tone: 'dark',
    readStyle: 'moderate',
    enableImages: true,
    enableAudio: true
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleStart = () => {
    if (form.playerName) {
      setSettings(form);
      startGame();
    }
  };

  const handleCancel = () => {
    setSetupMode(false);
    setStep(1);
  };

  const steps = [
    {
      title: "Quem é você?",
      desc: "Todo herói começa com um nome.",
      icon: User,
      content: (
        <div className="space-y-4">
          <input 
            autoFocus
            type="text" 
            placeholder="Digite o nome do herói..."
            className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 text-zinc-100 placeholder:text-zinc-600 focus:border-primary outline-none transition-all text-lg font-bold italic"
            value={form.playerName || ''}
            onChange={(e) => setForm({ ...form, playerName: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && form.playerName && nextStep()}
          />
        </div>
      )
    },
    {
      title: "O Destino da Jornada",
      desc: "Quão longe pretende ir?",
      icon: Map,
      content: (
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'preview', label: 'Preview', desc: '1-10 cenas' },
            { id: 'short', label: 'Curta', desc: '11-50 cenas' },
            { id: 'medium', label: 'Média', desc: '51-99 cenas' },
            { id: 'long', label: 'Longa', desc: '100+ cenas' },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setForm({ ...form, journeyLength: opt.id as any })}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                form.journeyLength === opt.id 
                ? 'border-primary bg-primary/10' 
                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
              }`}
            >
              <div className="font-black uppercase tracking-tighter text-xs mb-1">{opt.label}</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase">{opt.desc}</div>
            </button>
          ))}
        </div>
      )
    },
    {
      title: "Regras de Punição",
      desc: "A morte é o fim ou apenas um revés?",
      icon: Skull,
      content: (
        <div className="space-y-3">
          {[
            { id: 'fail_tolerance_5', label: 'Tolerante', desc: 'IA perdoa até 5 falhas graves' },
            { id: 'fail_tolerance_3', label: 'Moderado', desc: 'IA perdoa até 3 falhas graves' },
            { id: 'no_fail_tolerance', label: 'Rigoroso', desc: 'Cada falha tem peso imediato' },
            { id: 'permadeath', label: 'Morte Permanente', desc: 'Fim de jogo significa fim da sessão' },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setForm({ ...form, punishSystem: opt.id as any })}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                form.punishSystem === opt.id 
                ? 'border-red-500/50 bg-red-500/5' 
                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="font-black uppercase tracking-tighter text-xs">{opt.label}</div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase">{opt.desc}</div>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${form.punishSystem === opt.id ? 'border-red-500 bg-red-500' : 'border-zinc-700'}`} />
            </button>
          ))}
        </div>
      )
    },
    {
      title: "Estética do Mundo",
      desc: "Como o portal deve se manifestar?",
      icon: Palette,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'fantasy', label: 'Fantasia' },
              { id: 'cyberpunk', label: 'Cyberpunk' },
              { id: 'gothic-horror', label: 'Terror' },
              { id: 'sci-fi', label: 'Sci-Fi' },
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => setForm({ ...form, genre: g.id as any })}
                className={`py-2 px-4 rounded-xl border text-[10px] font-black uppercase transition-all ${
                  form.genre === g.id ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'border-zinc-800 text-zinc-500'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-zinc-800 pt-4">
            {[
              { id: 'anime', label: 'Anime' },
              { id: 'pixel-art', label: 'Pixel Art' },
              { id: 'dark-realism', label: 'Realismo' },
              { id: 'sketch', label: 'Sketch' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setForm({ ...form, visualStyle: s.id as any })}
                className={`py-2 px-4 rounded-xl border text-[10px] font-black uppercase transition-all ${
                  form.visualStyle === s.id ? 'bg-primary text-zinc-950 border-primary' : 'border-zinc-800 text-zinc-500'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Estilo Literário",
      desc: "A profundidade da narração.",
      icon: BookOpen,
      content: (
        <div className="space-y-3">
          {[
            { id: 'essential', label: 'Essencial', desc: 'Texto mínimo, foco na ação' },
            { id: 'moderate', label: 'Moderado', desc: 'Equilíbrio e fluidez' },
            { id: 'detailed', label: 'Detalhado', desc: 'Rico em ambientação' },
            { id: 'literary', label: 'Literário', desc: 'Profundo, poético e complexo' },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setForm({ ...form, readStyle: opt.id as any })}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                form.readStyle === opt.id 
                ? 'border-primary bg-primary/10' 
                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
              }`}
            >
              <div className="font-black uppercase tracking-tighter text-xs">{opt.label}</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase">{opt.desc}</div>
            </button>
          ))}
        </div>
      )
    },
    {
      title: "Imersão e Cota",
      desc: "Configurações finais da sua lenda.",
      icon: Sparkles,
      content: (
        <div className="space-y-6">
          <div className="pt-4 space-y-4">
             <div className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <Palette className="w-4 h-4 text-zinc-500" />
                  <div>
                     <p className="text-[10px] font-bold text-zinc-200 uppercase">Ilustrações por IA</p>
                     <p className="text-[8px] text-zinc-600 uppercase font-black">Consome cota de imagem</p>
                  </div>
                </div>
                <button 
                  onClick={() => setForm({ ...form, enableImages: !form.enableImages })}
                  className={`w-10 h-5 rounded-full transition-all relative p-1 ${form.enableImages ? 'bg-primary' : 'bg-zinc-800'}`}
                >
                  <motion.div 
                    animate={{ x: form.enableImages ? 20 : 0 }}
                    className="w-3 h-3 bg-white rounded-full"
                  />
                </button>
             </div>

             <div className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-4 h-4 text-zinc-500" />
                  <div>
                     <p className="text-[10px] font-bold text-zinc-200 uppercase">Narração por Áudio</p>
                     <p className="text-[8px] text-zinc-600 uppercase font-black">Consome cota de texto-para-voz</p>
                  </div>
                </div>
                <button 
                  onClick={() => setForm({ ...form, enableAudio: !form.enableAudio })}
                  className={`w-10 h-5 rounded-full transition-all relative p-1 ${form.enableAudio ? 'bg-primary' : 'bg-zinc-800'}`}
                >
                  <motion.div 
                    animate={{ x: form.enableAudio ? 20 : 0 }}
                    className="w-3 h-3 bg-white rounded-full"
                  />
                </button>
             </div>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[step - 1];

  return (
    <AnimatePresence>
      {isSetupMode && (
        <div className="fixed inset-0 bg-zinc-950 z-[100] flex items-center justify-center p-6 overflow-hidden">
          {/* Background Ambience */}
          <div className="absolute inset-0 opacity-30 bg-[url('/noise.svg')] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-xl bg-zinc-900/50 border border-zinc-800 p-10 rounded-[40px] backdrop-blur-xl shadow-2xl relative"
            >
            {/* Cancel Button */}
            <button 
              onClick={handleCancel}
              className="absolute top-8 right-8 z-50 p-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-full text-zinc-500 hover:text-white transition-all group"
              title="Cancelar Criação"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            </button>

            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 flex gap-1 p-4">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-full flex-1 rounded-full transition-all duration-500 ${
                    i + 1 <= step ? 'bg-primary shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-zinc-800'
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
                className="space-y-8"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-primary mb-4">
                    <currentStepData.icon className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Passo {step} de {steps.length}</span>
                  </div>
                  <h2 className="text-4xl font-black text-zinc-100 tracking-tighter italic">
                    {currentStepData.title}
                  </h2>
                  <p className="text-zinc-500 font-serif italic text-lg leading-relaxed">
                    {currentStepData.desc}
                  </p>
                </div>

                <div className="py-4">
                  {currentStepData.content}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-10 flex items-center justify-between pt-6 border-t border-zinc-800/50">
              <button
                disabled={step === 1}
                onClick={prevStep}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-100 transition-colors disabled:opacity-0"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">Voltar</span>
              </button>

              {step < steps.length ? (
                <button
                  disabled={step === 1 && !form.playerName}
                  onClick={nextStep}
                  className="group flex items-center gap-3 bg-zinc-100 text-zinc-950 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary transition-all disabled:opacity-50"
                >
                  Próximo
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  className="flex items-center gap-3 bg-primary text-zinc-950 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95 transition-all"
                >
                  <Sparkles className="w-5 h-5 fill-zinc-950" />
                  Invocar Jornada
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
