'use client';

import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { 
  ChevronDown, 
  MessageCircle, 
  AlertCircle, 
  Download, 
  RefreshCcw, 
  Volume2, 
  Headphones, 
  Sun, 
  Moon, 
  Terminal,
  FileDown, 
  FileText 
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { exportJourneyToMarkdown, downloadMarkdown } from '@/lib/exportUtils';
import { generateJourneyPDF } from '@/lib/pdfUtils';

interface NarrativePanelProps {
  onRetryImage?: (sceneId: string, prompt: string) => void;
}

export default function NarrativePanel({ onRetryImage }: NarrativePanelProps) {
  const { data: session } = useSession();
  const { 
    history, currentScene, status, settings, resetGame, 
    theme, toggleTheme, hasHydrated,
    forcedNextAction, setForcedNextAction
  } = useGameStore();
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const isGameOver = currentScene?.isGameOver || status.hp <= 0;
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  const handleExportMarkdown = () => {
    const markdown = exportJourneyToMarkdown(history, settings, settings?.playerName || 'Viajante', currentScene);
    downloadMarkdown(markdown, `jornada-${settings?.playerName || 'viajante'}.md`);
  };

  const handleExportPDF = async () => {
    await generateJourneyPDF(history, settings, settings?.playerName || 'Viajante');
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, currentScene, isGameOver]);

  // Apply theme to document element
  useEffect(() => {
    if (!hasHydrated) return;
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [theme, hasHydrated]);

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
                      
                      {scene.audioUrl && (
                        <div className="flex items-center gap-2 border-l border-zinc-700 pl-3">
                          <audio id={`audio-${scene.sceneId}`} src={scene.audioUrl} />
                          <button 
                            onClick={() => {
                              const audio = document.getElementById(`audio-${scene.sceneId}`) as HTMLAudioElement;
                              if (audio.paused) {
                                audio.play();
                              } else {
                                audio.pause();
                              }
                            }}
                            className="text-zinc-500 hover:text-primary transition-colors flex items-center gap-1"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span className="text-[8px] font-bold uppercase tracking-widest">Ouvir</span>
                          </button>
                        </div>
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

          {isGameOver && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto py-20 text-center space-y-8"
            >
              <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Sua Jornada Encerrou</h2>
                <p className="text-zinc-500 font-serif italic text-lg leading-relaxed">
                  O destino foi implacável e suas cinzas agora sopram pelo Portal.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => resetGame()}
                  className="w-full bg-white text-zinc-950 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl active:scale-95"
                >
                  Tentar Novamente
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleExportPDF}
                    className="bg-zinc-900 text-zinc-400 border border-zinc-800 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-800 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> PDF de Arte
                  </button>
                  <button 
                    onClick={handleExportMarkdown}
                    className="bg-zinc-900 text-zinc-400 border border-zinc-800 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-800 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <FileDown className="w-4 h-4" /> Crônicas (.md)
                  </button>
                </div>
              </div>
            </motion.div>
          )}
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

      {/* Admin Control & Theme Toggle - Top Right */}
      <div className="absolute top-10 right-10 z-50 flex items-center gap-4">
        {/* Admin Force-Action Dropdown */}
        {isAdmin && (
          <div className="flex items-center gap-3 bg-zinc-950/80 border border-orange-500/30 p-2 rounded-2xl backdrop-blur-xl shadow-2xl">
            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
               <Terminal className="w-4 h-4" />
            </div>
            <select 
              value={forcedNextAction || ''}
              onChange={(e) => setForcedNextAction(e.target.value || null)}
              className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:text-orange-500 transition-colors cursor-pointer"
            >
              <option value="">🎲 Aleatório</option>
              <option value="puzzle">🧩 Desafio Mental</option>
              <option value="combined">⚔️ Combate Tático</option>
              <option value="binary">🌓 Escolha Binária</option>
              <option value="multiple">📜 Múltipla Escolha</option>
              <option value="interpretative">✍️ Interpretação Livre</option>
            </select>
          </div>
        )}

        <motion.button 
          onClick={toggleTheme}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-full backdrop-blur-xl shadow-2xl text-zinc-400 hover:text-primary transition-all group"
          title={theme === 'dark' ? 'Modo Luz' : 'Modo Sombras'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 group-hover:rotate-90 transition-transform" /> : <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />}
        </motion.button>
      </div>

      {/* Scribe's Hub - Floating Export Menu */}
      {history.length > 0 && (
        <motion.div 
          className="absolute bottom-10 right-10 z-50 flex items-center gap-1 bg-zinc-950/90 border border-zinc-800 p-1.5 rounded-3xl backdrop-blur-xl shadow-2xl group/hub"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-1">
            {/* PDF Option */}
            <motion.button
              onClick={handleExportPDF}
              className="p-3 rounded-2xl text-zinc-500 hover:text-amber-500 hover:bg-amber-500/10 transition-all flex items-center gap-2 group/pdf"
              title="Livro de Arte (PDF)"
            >
              <FileText className="w-5 h-5" />
              <span className="text-[9px] font-black uppercase tracking-widest hidden group-hover/hub:inline-block transition-all">PDF Arte</span>
            </motion.button>

            <div className="w-px h-6 bg-zinc-800/50 mx-1" />

            {/* Markdown Option */}
            <motion.button
              onClick={handleExportMarkdown}
              className="p-3 rounded-2xl text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all flex items-center gap-2 group/md"
              title="Crônicas (.md)"
            >
              <FileDown className="w-5 h-5" />
              <span className="text-[9px] font-black uppercase tracking-widest hidden group-hover/hub:inline-block transition-all">Dados .MD</span>
            </motion.button>
          </div>

          <div className="bg-zinc-900 p-3 rounded-2xl text-zinc-600 group-hover/hub:text-primary transition-colors ml-1 border border-zinc-800">
             <Download className="w-4 h-4" />
          </div>
        </motion.div>
      )}
    </div>
  );
}
