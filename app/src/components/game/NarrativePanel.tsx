'use client';

import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { 
  ChevronDown, 
  MessageCircle, 
  AlertCircle, 
  Download, 
  RefreshCcw, 
  RotateCcw,
  Volume2, 
  Play,
  Pause,
  Headphones, 
  Sun, 
  Moon, 
  Terminal,
  FileDown, 
  FileText,
  Trophy, BookOpen, BookText, Eye, EyeOff,
  Skull,
  Ghost,
  Home,
  Sparkles,
  Zap
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { exportJourneyToMarkdown, downloadMarkdown } from '@/lib/exportUtils';
import { generateJourneyPDF } from '@/lib/pdfUtils';

interface NarrativePanelProps {
  onRetryImage?: (sceneId: string, prompt: string) => void;
  onRetryAudio?: (sceneId: string, text: string, gender?: 'male' | 'female') => void;
  onRevive?: () => void;
}

export default function NarrativePanel({ onRetryImage, onRetryAudio, onRevive }: NarrativePanelProps) {
  const { data: session } = useSession();
  const { 
    history, currentScene, status, settings, resetGame, 
    theme, toggleTheme, hasHydrated,
    forcedNextAction, setForcedNextAction,
    forcedEndingType, setForcedEndingType, showDebugInfo, toggleShowDebugInfo, readingMode, toggleReadingMode,
    revivePlayer, setSetupMode
  } = useGameStore();
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  // State mapping for Punishment System
  const toleranceLimits: Record<string, number> = {
    'fail_tolerance_5': 5,
    'fail_tolerance_3': 3,
    'no_fail_tolerance': 0,
    'permadeath': -1 // Special case
  };

  const currentLimit = settings ? toleranceLimits[settings.punishSystem] : 3;
  const canRevive = settings?.punishSystem !== 'permadeath' && (currentLimit === 0 || status.deathCount < currentLimit);
  const isDeath = status.hp <= 0;
  const isGlory = currentScene?.isGameOver && status.hp > 0;

  const handleExportMarkdown = () => {
    const markdown = exportJourneyToMarkdown(history, settings, settings?.playerName || 'Viajante', currentScene);
    downloadMarkdown(markdown, `jornada-${settings?.playerName || 'viajante'}.md`);
  };

  const handleExportPDF = async () => {
    await generateJourneyPDF(history, settings, settings?.playerName || 'Viajante');
  };

  const handleStartNewJourney = () => {
    resetGame();
    setSetupMode(true);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, currentScene, isDeath, isGlory]);

  // Apply theme to document element
  useEffect(() => {
    if (!hasHydrated) return;
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [theme, hasHydrated]);

  const renderGameOver = () => {
    if (isGlory) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto py-20 text-center space-y-8 relative"
        >
          {/* Golden Flash Effect - Looping */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full pointer-events-none"
          />

          <motion.div 
            animate={{ 
              y: [0, -10, 0],
              scale: [1, 1.05, 1],
              rotate: [0, 2, -2, 0]
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="w-24 h-24 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(245,158,11,0.3)] relative z-10"
          >
            <Trophy className="w-12 h-12 text-primary" />
          </motion.div>
          <div className="space-y-4 relative z-10">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
              Sua Lenda foi Escrita
            </h2>
            <p className="text-zinc-400 font-serif italic text-lg md:text-xl leading-relaxed max-w-lg mx-auto">
              "Seu nome ecoará pelos salões do Portal por toda a eternidade. A jornada termina aqui, mas sua glória é imortal."
            </p>
          </div>
          <div className="flex flex-col gap-3 max-w-sm mx-auto">
            <button 
              onClick={() => resetGame()}
              className="w-full bg-white text-zinc-950 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl flex items-center justify-center gap-3"
            >
              <Home className="w-4 h-4" /> Voltar ao Menu Principal
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleExportPDF} className="bg-zinc-900 text-zinc-400 border border-zinc-800 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-all">PDF Arte</button>
              <button onClick={handleExportMarkdown} className="bg-zinc-900 text-zinc-400 border border-zinc-800 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-all">Crônicas .MD</button>
            </div>
          </div>
        </motion.div>
      );
    }

    if (isDeath) {
      const isPermadeath = settings?.punishSystem === 'permadeath';
      
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto py-20 text-center space-y-8"
        >
          <div className={`w-24 h-24 ${isPermadeath ? 'bg-zinc-900' : 'bg-red-500/10'} border ${isPermadeath ? 'border-zinc-800' : 'border-red-500/20'} rounded-full flex items-center justify-center mx-auto shadow-2xl`}>
            {isPermadeath ? <Skull className="w-12 h-12 text-zinc-600" /> : <Ghost className="w-12 h-12 text-red-500 animate-pulse" />}
          </div>
          
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white">
              {isPermadeath ? 'O Fim Absoluto' : 'A Morte é Apenas um Revés'}
            </h2>
            <p className="text-zinc-500 font-serif italic text-base md:text-lg leading-relaxed max-w-lg mx-auto">
              {isPermadeath 
                ? "O destino foi implacável e o Portal se fechou para esta alma. Suas cinzas agora sopram pelo vazio."
                : "As sombras tentaram te levar, mas sua lenda ainda não terminou. A poeira foi removida e você retornou à jogada."
              }
            </p>
            {!isPermadeath && (
               <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                  <Sparkles className="w-3 h-3" /> Ressurreições Usadas: {status.deathCount} / {currentLimit === 0 ? '∞' : currentLimit}
               </div>
            )}
          </div>

          <div className="flex flex-col gap-3 max-w-sm mx-auto">
            {canRevive ? (
              <button 
                onClick={() => {
                  revivePlayer();
                  onRevive?.();
                }}
                className="w-full bg-primary text-zinc-950 py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)]"
              >
                ✨ Levantar-se e Continuar
              </button>
            ) : (
              <button 
                onClick={handleStartNewJourney}
                className="w-full bg-white text-zinc-950 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl"
              >
                🌀 Iniciar Nova Jornada
              </button>
            )}
            <button 
              onClick={() => resetGame()}
              className="w-full bg-zinc-900 text-zinc-500 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-all border border-zinc-800"
            >
              🏛️ Menu Principal
            </button>
          </div>
        </motion.div>
      );
    }

    return null;
  };

  return (
    <div className="flex-1 overflow-hidden relative">
      <div 
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto p-6 space-y-12 scroll-smooth custom-scrollbar pb-[45vh]"
      >
        <AnimatePresence mode="popLayout">
          {history.map((scene, index) => (
            <div key={scene.sceneId + index} className="space-y-12">
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="max-w-4xl mx-auto space-y-6"
              >
                {/* Scene Image */}
                {(scene.imageUrl || scene.visualDescription) && (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl group">
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60 z-10" />
                    
                    {scene.imageUrl ? (
                      <motion.img 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        src={scene.imageUrl} 
                        alt={scene.visualDescription}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[2s]"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-zinc-900 animate-pulse flex flex-col items-center justify-center gap-4 z-20">
                        {scene.imageError ? (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                          >
                            <div className="p-3 bg-red-500/10 rounded-full w-fit mx-auto mb-3">
                              <AlertCircle className="w-6 h-6 text-red-500" />
                            </div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-bold mb-4">Falha na Ilustração</p>
                            <button 
                              onClick={() => onRetryImage?.(scene.sceneId, scene.visualDescription)}
                              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-zinc-700 active:scale-95"
                            >
                              <RefreshCcw className="w-3 h-3" /> Tentar Novamente
                            </button>
                          </motion.div>
                        ) : (
                          <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 font-bold">
                            Ilustrando Cena...
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="absolute bottom-4 left-6 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                       <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">
                         Prompt: {scene.visualDescription.substring(0, 60)}...
                       </p>
                    </div>
                  </div>
                )}

                {/* Narration Block */}
                <div className="relative px-8 py-10 bg-zinc-900/40 border border-zinc-800/50 rounded-3xl backdrop-blur-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <div className="absolute -top-3 left-10 px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-md flex items-center gap-4">
                      <span className="text-[8px] font-black uppercase tracking-[0.4em] text-primary">Capítulo {index + 1}</span>
                      
                      {scene.audioUrl ? (
                        <div className="flex items-center gap-3 border-l border-zinc-700 pl-4 py-1">
                          <audio 
                            id={`audio-${scene.sceneId}`} 
                            src={scene.audioUrl} 
                            autoPlay={index === history.length - 1 && settings?.enableAudio}
                            onPlay={() => setIsPlaying(scene.sceneId)}
                            onEnded={() => setIsPlaying(null)}
                            onPause={() => setIsPlaying(null)}
                          />
                          <button 
                            onClick={() => {
                              const audio = document.getElementById(`audio-${scene.sceneId}`) as HTMLAudioElement;
                              if (audio.paused) {
                                // Pause all other audios first
                                document.querySelectorAll('audio').forEach(a => {
                                  if (a.id !== `audio-${scene.sceneId}`) a.pause();
                                });
                                audio.play();
                              } else {
                                audio.pause();
                              }
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border ${
                              isPlaying === scene.sceneId 
                              ? 'bg-primary/20 border-primary text-primary shadow-[0_0_20px_rgba(245,158,11,0.4)]' 
                              : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-primary hover:border-primary/50'
                            }`}
                          >
                            <AnimatePresence mode="wait">
                              {isPlaying === scene.sceneId ? (
                                <motion.div 
                                  key="pause"
                                  initial={{ scale: 0, rotate: -90 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: 90 }}
                                >
                                  <Pause className="w-3.5 h-3.5 fill-current" />
                                </motion.div>
                              ) : (
                                <motion.div 
                                  key="play"
                                  initial={{ scale: 0, rotate: 90 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: -90 }}
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                            
                            <span className="text-[10px] font-black uppercase tracking-widest min-w-[55px]">
                              {isPlaying === scene.sceneId ? 'Pausar' : 'Ouvir'}
                            </span>

                            {isPlaying === scene.sceneId && (
                              <div className="flex gap-0.5 items-end h-3 mb-0.5">
                                {[1, 2, 3].map((i) => (
                                  <motion.div
                                    key={i}
                                    animate={{ height: ["20%", "100%", "20%"] }}
                                    transition={{ 
                                      repeat: Infinity, 
                                      duration: 0.5 + (i * 0.2),
                                      ease: "easeInOut" 
                                    }}
                                    className="w-0.5 bg-primary rounded-full"
                                  />
                                ))}
                              </div>
                            )}
                          </button>

                          {/* Restart Button */}
                          <button 
                            onClick={() => {
                              const audio = document.getElementById(`audio-${scene.sceneId}`) as HTMLAudioElement;
                              audio.currentTime = 0;
                              audio.play();
                            }}
                            className="p-2 bg-zinc-800/50 border border-zinc-700 rounded-full text-zinc-500 hover:text-primary hover:border-primary/50 transition-all active:rotate-[-45deg]"
                            title="Reiniciar Áudio"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        settings?.enableAudio && (
                          <div className="flex items-center gap-3 border-l border-zinc-700 pl-4 py-1">
                             <button 
                               onClick={() => onRetryAudio?.(scene.sceneId, scene.narration, scene.audioVoice)}
                               className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border ${
                                 scene.audioError
                                 ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' 
                                 : 'bg-zinc-800/30 border-zinc-700 text-zinc-500'
                               }`}
                               disabled={!onRetryAudio}
                             >
                               {scene.audioError ? <RefreshCcw className="w-3 h-3" /> : <Volume2 className="w-3.5 h-3.5 opacity-30 animate-pulse" />}
                               <span className="text-[8px] font-black uppercase tracking-widest">
                                 {scene.audioError ? 'Falha / Tentar' : 'Gerando...'}
                               </span>
                             </button>
                          </div>
                        )
                      )}
                  </div>
                  
                  <p className="text-xl md:text-2xl leading-relaxed text-zinc-200 font-serif selection:bg-primary/20">
                    {scene.narration}
                  </p>

                  {scene.audioDescription && (
                    <div className="mt-6 flex items-center gap-2 text-zinc-600">
                      <Headphones className="w-3 h-3" />
                      <span className="text-[10px] italic font-serif opacity-50">{scene.audioDescription}</span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Player Choice Display (The bridge between scenes) */}
              {scene.selectedOption && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-2xl mx-auto flex flex-col items-center gap-4"
                >
                  <div className="h-12 w-px bg-gradient-to-b from-zinc-800 to-transparent" />
                  <div className="flex items-center gap-3 px-6 py-3 bg-primary/10 border border-primary/20 rounded-2xl">
                     <MessageCircle className="w-4 h-4 text-primary" />
                     <span className="text-xs font-black uppercase tracking-widest text-primary/80 italic">Sua Escolha:</span>
                     <span className="text-xs font-bold text-zinc-100">{scene.selectedOption}</span>
                  </div>
                  <ChevronDown className="w-5 h-5 text-zinc-800 animate-bounce" />
                </motion.div>
              )}
            </div>
          ))}

          {(isDeath || isGlory) && renderGameOver()}
        </AnimatePresence>


        {/* Current Streaming Scene Placeholder (if applicable) */}
        {!currentScene && history.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <motion.div 
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-zinc-500 font-serif italic"
            >
              Aguardando o início da jornada...
            </motion.div>
          </div>
        )}
      </div>

      {/* Right Controls - Top Right (Desktop Only) */}
      <div className="absolute top-10 right-10 z-50 hidden lg:flex flex-col gap-3">
        {/* Position 1: Theme Toggle */}
        <motion.button 
          onClick={toggleTheme}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-full backdrop-blur-xl shadow-2xl text-zinc-400 hover:text-primary transition-all group"
          title={theme === 'dark' ? 'Modo Luz' : 'Modo Sombras'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 group-hover:rotate-90 transition-transform" /> : <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />}
        </motion.button>

        {/* Position 2: Reading Mode Toggle */}
        <motion.button 
          onClick={toggleReadingMode}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`p-4 rounded-full backdrop-blur-xl shadow-2xl transition-all border ${
            readingMode 
            ? 'bg-primary border-primary text-zinc-950 shadow-[0_0_25px_rgba(245,158,11,0.4)]' 
            : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-primary hover:border-primary/50'
          }`}
          title={readingMode ? 'Sair do Modo Leitura' : 'Modo Leitura'}
        >
          {readingMode ? <BookOpen className="w-5 h-5" /> : <BookText className="w-5 h-5" />}
        </motion.button>
      </div>

      {/* Admin Dropdowns - Top Left (Desktop Only) */}
      {isAdmin && !readingMode && (
        <div className="absolute top-28 left-10 z-50 hidden lg:flex flex-col items-start gap-2">
          {/* Force Action Selector */}
          <div className="flex items-center gap-3 bg-zinc-950/80 border border-orange-500/30 p-2 rounded-2xl backdrop-blur-xl shadow-2xl">
            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
              <Terminal className="w-4 h-4" />
            </div>
            <select 
              value={forcedNextAction || ''}
              onChange={(e) => setForcedNextAction(e.target.value || null)}
              className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:text-orange-500 transition-colors cursor-pointer"
            >
              <option value="">🎲 Ação Aleatória</option>
              <option value="puzzle">🧩 Desafio Mental</option>
              <option value="combined">⚔️ Combate Tático</option>
              <option value="binary">🌓 Escolha Binária</option>
              <option value="multiple">📜 Múltipla Escolha</option>
              <option value="interpretative">✍️ Interpretação Livre</option>
            </select>
          </div>

          {/* Force Ending Selector */}
          <div className="flex items-center gap-3 bg-zinc-950/80 border border-cyan-500/30 p-2 rounded-2xl backdrop-blur-xl shadow-2xl">
            <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-500">
              <Zap className="w-4 h-4" />
            </div>
            <select 
              value={forcedEndingType || ''}
              onChange={(e) => setForcedEndingType(e.target.value || null)}
              className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:text-cyan-500 transition-colors cursor-pointer"
            >
              <option value="">🌿 Continuar História</option>
              <option value="glory">🏆 Glória do Herói</option>
              <option value="death">💀 Morte (Tolerância)</option>
              <option value="permadeath">🌑 Morte Permanente</option>
              <option value="defeat">🚩 Derrota Amarga</option>
            </select>
          </div>

          {/* Debug Info Toggle */}
          <button 
            onClick={toggleShowDebugInfo}
            className={`flex items-center gap-3 p-2 rounded-2xl backdrop-blur-xl shadow-2xl border transition-all ${
              showDebugInfo 
              ? 'bg-primary/10 border-primary/30 text-primary' 
              : 'bg-zinc-950/80 border-zinc-800 text-zinc-500'
            }`}
          >
            <div className={`p-2 rounded-xl ${showDebugInfo ? 'bg-primary/20' : 'bg-zinc-900'}`}>
              {showDebugInfo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">
              {showDebugInfo ? 'Debug: Ativo' : 'Debug: Oculto'}
            </span>
          </button>
        </div>
      )}

      {/* Scribe's Hub - Floating Export Menu (Desktop Only) */}
      {history.length > 0 && !readingMode && (
        <motion.div 
          className="absolute bottom-36 lg:bottom-10 right-4 lg:right-10 z-50 hidden lg:flex flex-col lg:flex-row items-center gap-2 lg:gap-1 bg-zinc-950/50 lg:bg-zinc-950/90 border border-zinc-800 p-1.5 rounded-2xl lg:rounded-3xl backdrop-blur-xl shadow-2xl group/hub opacity-60 hover:opacity-100 lg:opacity-100 transition-opacity"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col lg:flex-row items-center gap-1">
            {/* PDF Option */}
            <motion.button
              onClick={handleExportPDF}
              className="p-2.5 lg:p-3 rounded-xl lg:rounded-2xl text-zinc-500 hover:text-amber-500 hover:bg-amber-500/10 transition-all flex items-center gap-2 group/pdf"
              title="Livro de Arte (PDF)"
            >
              <FileText className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="text-[9px] font-black uppercase tracking-widest hidden lg:group-hover/hub:inline-block transition-all">PDF Arte</span>
            </motion.button>

            <div className="h-px w-6 lg:h-6 lg:w-px bg-zinc-800/50 my-1 lg:mx-1" />

            {/* Markdown Option */}
            <motion.button
              onClick={handleExportMarkdown}
              className="p-2.5 lg:p-3 rounded-xl lg:rounded-2xl text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all flex items-center gap-2 group/md"
              title="Crônicas (.md)"
            >
              <FileDown className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="text-[9px] font-black uppercase tracking-widest hidden lg:group-hover/hub:inline-block transition-all">Dados .MD</span>
            </motion.button>
          </div>

          <div className="hidden lg:flex bg-zinc-900 p-3 rounded-2xl text-zinc-600 group-hover/hub:text-primary transition-colors ml-1 border border-zinc-800">
             <Download className="w-4 h-4" />
          </div>
        </motion.div>
      )}
    </div>
  );
}
