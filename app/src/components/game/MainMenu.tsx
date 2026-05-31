'use client';

import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Play, Clock, Skull, Swords, ChevronRight, Trash2, Sparkles, Settings2, LogOut, ShieldCheck, Eye, X } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import JourneyDetailsModal from './JourneyDetailsModal';

export default function MainMenu() {
  const { data: session } = useSession();
  const router = useRouter();
  const { hasHydrated, loadJourney, resetGame, startGame, impersonatedPlayerId, impersonatedPlayerName, stopImpersonation } = useGameStore();
  const [journeys, setJourneys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJourneyForSettings, setSelectedJourneyForSettings] = useState<any | null>(null);

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
    <div className="fixed inset-0 bg-zinc-950 z-[80] flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Video or Image Placeholder */}
      <div className="absolute inset-0 opacity-20 pointer-events-none grayscale contrast-125 scale-110 bg-[url('/noise.svg')]" />
      
      {/* Impersonation Banner */}
      <AnimatePresence>
        {impersonatedPlayerId && (
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="absolute top-0 left-0 w-full h-12 bg-orange-600 z-[90] flex items-center justify-center gap-6 px-10 border-b border-orange-500 shadow-2xl"
          >
             <div className="flex items-center gap-3">
                <div className="p-1.5 bg-black/20 rounded-lg">
                  <Eye className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-orange-50">
                  Modo Supervisão: Lendas de <span className="text-white underline decoration-2 underline-offset-4">{impersonatedPlayerName}</span>
                </span>
             </div>
             <button 
                onClick={() => {
                  stopImpersonation();
                  window.location.reload();
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950 hover:bg-black transition-all rounded-xl text-[10px] font-black uppercase text-white border border-white/10"
             >
                <X className="w-3 h-3" /> Sair
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`w-full max-w-6xl flex flex-col items-center gap-12 relative z-10 ${impersonatedPlayerId ? 'mt-12' : ''} transition-all duration-300`}>
        {/* Logo Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 relative"
        >
          <div className="absolute -top-16 right-0 flex gap-2">
            {session?.user && (session.user as any).role === 'ADMIN' && !impersonatedPlayerId && (
              <button 
                onClick={() => router.push('/admin/dashboard')}
                className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-primary hover:bg-zinc-800 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-xl group"
              >
                <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" /> Câmara do Mestre
              </button>
            )}

            <button 
              onClick={() => signOut()}
              className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-600 hover:text-red-500 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-xl group"
            >
              <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" /> Sair da Conta
            </button>
          </div>

          <div className="inline-block p-4 bg-primary/10 rounded-[32px] border border-primary/20 mb-4 shadow-[0_0_50px_rgba(245,158,11,0.1)]">
             <Sparkles className="w-12 h-12 text-primary fill-primary/20" />
          </div>
          <h1 className="text-7xl font-black tracking-tighter italic text-white uppercase">
            Fantasy <span className="text-primary">Portal</span>
          </h1>
          <p className="text-zinc-500 font-serif italic text-xl tracking-widest uppercase">Crônicas do Destino Infinito</p>
        </motion.div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* New Game Card */}
          <motion.button
            whileHover={{ scale: 1.02, translateY: -5 }}
            whileActive={{ scale: 0.98 }}
            onClick={handleNewGame}
            className="lg:col-span-1 h-full min-h-[300px] p-10 bg-white rounded-[40px] flex flex-col items-start justify-between text-left group shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-100 group-hover:scale-110 transition-all text-zinc-950">
               <Plus className="w-24 h-24" />
            </div>
            <div className="space-y-4 relative z-10">
              <div className="p-3 bg-zinc-50 rounded-2xl text-zinc-900 w-fit border border-zinc-100">
                <Plus className="w-6 h-6" />
              </div>
              <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Iniciar<br/>Nova Lenda</h2>
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-zinc-400 group-hover:text-primary transition-colors flex items-center gap-2">
               Cruzar o Portal <ChevronRight className="w-4 h-4" />
            </span>
          </motion.button>

          {/* Saved Sessions List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2">
                 <Clock className="w-4 h-4" /> Sessões Preservadas
              </h3>
              <span className="text-[10px] font-bold text-zinc-700 uppercase">{journeys.length} Registros</span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center p-20">
                <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                   className="w-8 h-8 border-t-2 border-primary rounded-full"
                />
              </div>
            ) : journeys.length === 0 ? (
              <div className="p-12 border-2 border-dashed border-zinc-800 rounded-[40px] text-center space-y-4 opacity-50">
                 <Skull className="w-12 h-12 text-zinc-700 mx-auto" />
                 <p className="text-zinc-500 font-serif italic text-lg">Nenhuma alma atravessou este portal ainda...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {journeys.map((j, i) => (
                    <motion.div
                      key={j.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => loadJourney(j.id, j)}
                      className="p-6 bg-zinc-900/50 border border-zinc-800 hover:border-primary/40 hover:bg-zinc-800/80 rounded-3xl transition-all group cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <Swords className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-zinc-200 tracking-tight">{j.flags?.playerName || j.name || 'Herói Sem Nome'}</h4>
                            <div className="flex items-center gap-3 text-[10px] uppercase font-bold text-zinc-600 mt-1">
                              <span className="text-primary">{j.genre}</span>
                              <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                              <span>{new Date(j.updatedAt).toLocaleDateString()}</span>
                              <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                              <span>{j.history?.length || 0} Passos</span>
                            </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => openSettings(j, e)}
                          className="p-3 bg-zinc-950 rounded-xl text-zinc-600 hover:text-zinc-200 hover:bg-zinc-800 transition-all border border-zinc-800"
                          title="Configurações da Sessão"
                        >
                          <Settings2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(j.id, e)}
                          className="p-3 bg-zinc-950 rounded-xl text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all border border-zinc-800"
                          title="Apagar Registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Troubleshooting Button */}
                <div className="pt-10 flex justify-center">
                  <button 
                    onClick={handleHardReset}
                    className="flex items-center gap-2 px-4 py-2 bg-red-950/20 text-red-500/50 hover:bg-red-500 hover:text-white transition-all rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20"
                  >
                    <Trash2 className="w-3 h-3" /> Limpar Memória do Navegador (Cache)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
