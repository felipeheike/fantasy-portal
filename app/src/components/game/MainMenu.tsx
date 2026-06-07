'use client';

import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Play, Clock, Skull, Swords, ChevronRight, Trash2, Sparkles, Settings2, LogOut, ShieldCheck, Eye, X, User, Moon, Sun, Palette } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import JourneyDetailsModal from './JourneyDetailsModal';
import UserProfileModal from './UserProfileModal';

export default function MainMenu() {
  const { data: session } = useSession();
  const router = useRouter();
  const { 
    hasHydrated, loadJourney, resetGame, startGame, 
    impersonatedPlayerId, impersonatedPlayerName, stopImpersonation,
    theme, toggleTheme
  } = useGameStore();
  
  const [journeys, setJourneys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJourneyForSettings, setSelectedJourneyForSettings] = useState<any | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Apply theme to document element
  useEffect(() => {
    if (!hasHydrated) return;
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [theme, hasHydrated]);

  const fetchJourneys = useCallback(async () => {
    if (!hasHydrated) return;
    try {
      const url = impersonatedPlayerId ? `/api/journey?userId=${impersonatedPlayerId}` : '/api/journey';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setJourneys(data);
      }
    } catch (e) {
      console.error("Fetch Journeys Error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [hasHydrated, impersonatedPlayerId]);

  useEffect(() => {
    fetchJourneys();
  }, [fetchJourneys]);

  const handleNewGame = () => {
    resetGame();
    useGameStore.getState().setSetupMode(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja apagar esta lenda para sempre?')) {
      try {
        const url = impersonatedPlayerId ? `/api/journey/${id}?impersonatedPlayerId=${impersonatedPlayerId}` : `/api/journey/${id}`;
        const res = await fetch(url, { method: 'DELETE' });
        if (res.ok) fetchJourneys();
      } catch (e) {
        console.error("Delete Error:", e);
      }
    }
  };

  const handleHardReset = () => {
    if (confirm('ISSO APAGARÁ O CACHE LOCAL DO SEU NAVEGADOR. Use apenas se os dados parecerem incorretos ou se o jogo estiver travado. As jornadas no servidor serão preservadas. Continuar?')) {
      localStorage.removeItem('fantasy-portal-storage');
      window.location.reload();
    }
  };

  const openSettings = (journey: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedJourneyForSettings(journey);
  };

  if (!hasHydrated) return null;

  return (
    <div className="fixed inset-0 bg-portal-bg z-[80] flex flex-col items-center p-4 md:p-6 overflow-y-auto">
      {/* Background Video or Image Placeholder */}
      <div className="fixed inset-0 opacity-20 pointer-events-none grayscale contrast-125 scale-110 bg-[url('/noise.svg')]" />
      
      {/* Impersonation Banner */}
      <AnimatePresence>
        {impersonatedPlayerId && (
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 left-0 w-full h-12 bg-orange-600 z-[100] flex items-center justify-center gap-6 px-4 md:px-10 border-b border-orange-500 shadow-2xl"
          >
             <div className="flex items-center gap-3">
                <div className="p-1.5 bg-black/20 rounded-lg">
                  <Eye className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-orange-50">
                  <span className="hidden xs:inline">Modo Supervisão:</span> {impersonatedPlayerName}
                </span>
             </div>
             <button 
                onClick={() => {
                  stopImpersonation();
                  window.location.reload();
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-portal-bg hover:bg-black transition-all rounded-xl text-[10px] font-black uppercase text-white border border-white/10"
             >
                <X className="w-3 h-3" /> Sair
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`w-full max-w-6xl flex flex-col items-center gap-8 md:gap-12 relative z-10 ${impersonatedPlayerId ? 'mt-16' : 'mt-8'} transition-all duration-300`}>
        
        {/* Top Navigation Bar (Mobile Friendly) */}
        <div className="w-full flex flex-wrap justify-center md:justify-end gap-2 md:gap-3">
          {/* Theme Toggle Button */}
          <button 
            onClick={() => toggleTheme()}
            className="p-2.5 md:p-3 bg-portal-surface border border-portal-border rounded-xl md:rounded-2xl text-portal-text-muted hover:text-primary transition-all flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-xl group"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 group-hover:rotate-90 transition-transform" /> : <Moon className="w-4 h-4 group-hover:-rotate-12 transition-transform" />}
            <span className="hidden md:inline">{theme === 'dark' ? 'Modo Luz' : 'Modo Sombras'}</span>
          </button>

          {/* Theme Hub Button */}
          <button 
            onClick={() => router.push('/theme-hub')}
            className="p-2.5 md:p-3 bg-portal-surface border border-portal-border rounded-xl md:rounded-2xl text-primary hover:bg-portal-surface-hover transition-all flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-xl group"
          >
            <Palette className="w-4 h-4 group-hover:scale-110 transition-transform" /> <span className="hidden md:inline">Hub de Temas</span>
          </button>

          {session?.user && (session.user as any).role === 'ADMIN' && !impersonatedPlayerId && (
            <button 
              onClick={() => router.push('/admin/dashboard')}
              className="p-2.5 md:p-3 bg-portal-surface border border-portal-border rounded-xl md:rounded-2xl text-primary hover:bg-portal-surface-hover transition-all flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-xl group"
            >
              <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" /> <span className="hidden md:inline">Câmara do Mestre</span>
            </button>
          )}

          <button
            onClick={() => setIsProfileOpen(true)}
            className="p-2.5 md:p-3 bg-portal-surface border border-portal-border rounded-xl md:rounded-2xl text-portal-text-muted hover:text-primary transition-all flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-xl group"
          >
            <User className="w-4 h-4 group-hover:scale-110 transition-transform" /> <span className="hidden md:inline">Identidade</span>
          </button>

          <button
            onClick={() => signOut()}
            className="p-2.5 md:p-3 bg-portal-surface border border-portal-border rounded-xl md:rounded-2xl text-portal-text-muted hover:text-red-500 transition-all flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-xl group"
          >
            <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" /> <span className="hidden md:inline">Sair da Conta</span>
          </button>
          </div>

          {/* Logo Section */}
          <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
          >
          <div className="inline-block p-3 md:p-4 bg-primary/10 rounded-2xl md:rounded-[32px] border border-primary/20 mb-2 md:mb-4 shadow-[0_0_50px_var(--portal-primary-glow-subtle)]">
             <Sparkles className="w-8 h-8 md:w-12 md:h-12 text-primary fill-primary/20" />
          </div>
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter italic text-portal-text uppercase">
            Fantasy <span className="text-primary">Portal</span>
          </h1>
          <p className="text-portal-text-muted font-body italic text-sm md:text-xl tracking-[0.2em] md:tracking-widest uppercase">Crônicas do Destino Infinito</p>
          </motion.div>
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 pb-12">
          {/* New Game Card */}
          <motion.button
            whileHover={{ scale: 1.02, translateY: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNewGame}
            className="lg:col-span-1 h-[200px] md:h-[300px] p-6 md:p-10 bg-portal-text text-portal-bg rounded-[32px] md:rounded-[40px] flex flex-col items-start justify-between text-left group shadow-2xl relative overflow-hidden w-full max-w-[400px] mx-auto lg:mx-0 border-2 border-portal-text/10"
          >
            <div className="absolute top-0 right-0 p-4 md:p-8 opacity-5 md:opacity-10 group-hover:opacity-100 group-hover:scale-110 transition-all text-portal-bg">
               <Plus className="w-16 h-16 md:w-24 md:h-24" />
            </div>
            <div className="space-y-3 md:space-y-4 relative z-10">
              <div className="p-2 md:p-3 bg-portal-bg/10 rounded-xl md:rounded-2xl text-portal-bg w-fit border border-portal-bg/20">
                <Plus className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase leading-none">Iniciar<br/>Nova Lenda</h2>
            </div>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all flex items-center gap-2">
               Cruzar o Portal <ChevronRight className="w-4 h-4" />
            </span>
          </motion.button>

          {/* Saved Sessions List */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-portal-text-muted flex items-center gap-2">
                 <Clock className="w-4 h-4" /> Sessões Preservadas
              </h3>
              <span className="text-[9px] md:text-[10px] font-bold text-portal-text-muted uppercase">{journeys.length} Registros</span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center p-12 md:p-20">
                <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                   className="w-8 h-8 border-t-2 border-primary rounded-full"
                />
              </div>
            ) : journeys.length === 0 ? (
              <div className="p-8 md:p-12 border-2 border-dashed border-portal-border rounded-[32px] md:rounded-[40px] text-center space-y-4 opacity-50">
                 <Skull className="w-10 h-10 md:w-12 md:h-12 text-portal-text-muted mx-auto" />
                 <p className="text-portal-text-muted font-body italic text-base md:text-lg">Nenhuma alma atravessou este portal ainda...</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                <AnimatePresence>
                  {journeys.map((j, i) => (
                    <motion.div
                      key={j.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => loadJourney(j.id, j)}
                      className="p-4 md:p-6 bg-portal-surface/50 border border-portal-border hover:border-primary/40 hover:bg-portal-surface-hover/80 rounded-[24px] md:rounded-3xl transition-all group cursor-pointer flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 md:gap-6 min-w-0">
                        <div className="w-10 h-10 md:w-14 md:h-14 bg-portal-bg border border-portal-border rounded-xl md:rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
                            <Swords className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-lg md:text-xl font-black text-portal-text tracking-tight truncate">{j.flags?.playerName || j.name || j.player?.name || 'Herói Sem Nome'}</h4>
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[8px] md:text-[10px] uppercase font-bold text-portal-text-muted mt-1">
                              <span className="text-primary truncate">{j.genre}</span>
                              <span className="w-0.5 h-0.5 bg-portal-border rounded-full" />
                              <span className="shrink-0">{new Date(j.updatedAt).toLocaleDateString()}</span>
                              <span className="w-0.5 h-0.5 bg-portal-border rounded-full" />
                              <span className="shrink-0">{j.history?.length || 0} Passos</span>
                            </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                        <button 
                          onClick={(e) => openSettings(j, e)}
                          className="p-2 md:p-3 bg-portal-bg rounded-lg md:rounded-xl text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover transition-all border border-portal-border"
                        >
                          <Settings2 className="w-4 h-4 md:w-4 md:h-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(j.id, e)}
                          className="p-2 md:p-3 bg-portal-bg rounded-lg md:rounded-xl text-portal-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all border border-portal-border"
                        >
                          <Trash2 className="w-4 h-4 md:w-4 md:h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Troubleshooting Button */}
                <div className="pt-6 md:pt-10 flex justify-center px-4 text-center">
                  <button 
                    onClick={handleHardReset}
                    className="flex items-center gap-2 px-4 py-2 bg-red-950/20 text-red-500/50 hover:bg-red-500 hover:text-white transition-all rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-red-500/20"
                  >
                    <Trash2 className="w-3 h-3" /> Limpar Cache Local
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Details/Settings Modal for Menu */}
      <JourneyDetailsModal 
        isOpen={!!selectedJourneyForSettings}
        onClose={() => {
          setSelectedJourneyForSettings(null);
          fetchJourneys(); 
        }}
        settings={selectedJourneyForSettings?.settings || selectedJourneyForSettings?.flags}
        historyCount={selectedJourneyForSettings?.history?.length || 0}
      />
    </div>
  );
}
