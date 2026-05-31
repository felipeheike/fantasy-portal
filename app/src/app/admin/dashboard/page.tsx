'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  UserPlus, 
  Clock, 
  Trash2, 
  Search, 
  ArrowLeft,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  ShieldMinus,
  Sparkles,
  Loader2,
  MoreVertical,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { startImpersonation } = useGameStore();
  const [players, setPlayers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchText] = useState('');

  const fetchPlayers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/players');
      if (res.ok) {
        const data = await res.json();
        setPlayers(data);
      } else {
        toast.error('Falha ao consultar pergaminhos de jogadores.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated' || (session && (session.user as any).role !== 'ADMIN')) {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchPlayers();
    }
  }, [status, session, router, fetchPlayers]);

  const updatePlayerStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/players/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountStatus: newStatus })
      });

      if (res.ok) {
        toast.success(`Acesso do aventureiro atualizado para ${newStatus}.`);
        fetchPlayers();
      } else {
        toast.error('Falha ao selar nova permissão.');
      }
    } catch (e) {
      toast.error('Erro de conexão com o mestre.');
    }
  };

  const handleSupervise = (player: any) => {
    startImpersonation(player.id, player.name);
    toast.success(`Iniciando supervisão de ${player.name}`);
    router.push('/');
  };

  const deletePlayer = async (id: string) => {
    if (!confirm('Deseja realmente banir permanentemente esta alma do portal?')) return;
    
    try {
      const res = await fetch(`/api/admin/players/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Alma removida do registro.');
        fetchPlayers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Falha ao banir.');
      }
    } catch (e) {
      toast.error('Erro ao processar banimento.');
    }
  };

  const filteredPlayers = players.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 p-6 md:p-12 selection:bg-primary/20 relative overflow-x-hidden">
      <div className="absolute inset-0 opacity-10 bg-[url('/noise.svg')] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
             <button 
                onClick={() => router.push('/')}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-200 transition-colors text-[10px] font-black uppercase tracking-widest mb-4"
             >
                <ArrowLeft className="w-3 h-3" /> Voltar ao Portal
             </button>
             <h1 className="text-5xl font-black tracking-tighter italic flex items-center gap-4">
                <ShieldCheck className="w-12 h-12 text-primary" />
                Câmara do <span className="text-primary">Mestre</span>
             </h1>
             <p className="text-zinc-500 font-serif italic text-lg">Moderação e Controle de Almas</p>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input 
                  type="text"
                  placeholder="Buscar aventureiro..."
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-6 text-sm outline-none focus:border-primary transition-all w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchText(e.target.value)}
                />
             </div>
             <button 
               onClick={fetchPlayers}
               className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 hover:text-primary transition-all"
             >
                <RefreshCcw className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl backdrop-blur-md">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Total de Almas</p>
              <h3 className="text-3xl font-black text-white">{players.length}</h3>
           </div>
           <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl backdrop-blur-md">
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-1">Aguardando Aprovação</p>
              <h3 className="text-3xl font-black text-white">{players.filter(p => p.accountStatus === 'PENDING').length}</h3>
           </div>
           <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl backdrop-blur-md">
              <p className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-1">Aventureiros Ativos</p>
              <h3 className="text-3xl font-black text-white">{players.filter(p => p.accountStatus === 'ACTIVE').length}</h3>
           </div>
        </div>

        {/* Players List */}
        <div className="space-y-4">
           <div className="flex items-center gap-3 ml-4 mb-6">
              <Users className="w-4 h-4 text-zinc-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Registros do Destino</span>
           </div>

           <div className="grid grid-cols-1 gap-4">
              <AnimatePresence>
                {filteredPlayers.map((player) => (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-6 bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 rounded-[32px] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                  >
                    <div className="flex items-center gap-6">
                       <div className={`w-16 h-16 rounded-[24px] border flex items-center justify-center relative ${
                          player.accountStatus === 'ACTIVE' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                          player.accountStatus === 'PENDING' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                          'bg-red-500/10 border-red-500/20 text-red-500'
                       }`}>
                          {player.role === 'ADMIN' ? <ShieldCheck className="w-8 h-8" /> : <Users className="w-8 h-8" />}
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-950 ${
                             player.accountStatus === 'ACTIVE' ? 'bg-green-500' :
                             player.accountStatus === 'PENDING' ? 'bg-orange-500' : 'bg-red-500'
                          }`} />
                       </div>
                       
                       <div className="space-y-1">
                          <div className="flex items-center gap-3">
                             <h4 className="text-xl font-black text-zinc-100">{player.name || 'Sem Nome'}</h4>
                             {player.role === 'ADMIN' && (
                               <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[8px] font-black uppercase rounded-full">Mestre</span>
                             )}
                          </div>
                          <p className="text-sm text-zinc-500 font-mono">{player.email}</p>
                          <div className="flex items-center gap-4 text-[9px] uppercase font-black text-zinc-700 mt-2">
                             <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Inscrito em {new Date(player.createdAt).toLocaleDateString()}</span>
                             <span className="flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> {player._count.journeys} Lendas</span>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-2">
                       {/* Impersonation Button */}
                       {player.role !== 'ADMIN' && (
                         <button 
                            onClick={() => handleSupervise(player)}
                            className="flex items-center gap-2 px-5 py-3 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all rounded-2xl text-[10px] font-black uppercase tracking-widest border border-zinc-700"
                            title="Supervisionar lendas deste jogador"
                         >
                            <Eye className="w-3.5 h-3.5" /> Ver Lendas
                         </button>
                       )}

                       {player.accountStatus !== 'ACTIVE' && (
                          <button 
                            onClick={() => updatePlayerStatus(player.id, 'ACTIVE')}
                            className="flex items-center gap-2 px-6 py-3 bg-zinc-100 text-zinc-950 hover:bg-green-500 transition-all rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl"
                          >
                             <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                          </button>
                       )}
                       
                       {player.accountStatus === 'ACTIVE' && player.role !== 'ADMIN' && (
                          <button 
                            onClick={() => updatePlayerStatus(player.id, 'INACTIVE')}
                            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-500 hover:border-red-500/50 transition-all rounded-2xl text-[10px] font-black uppercase tracking-widest"
                          >
                             <ShieldMinus className="w-3.5 h-3.5" /> Revogar
                          </button>
                       )}

                       <button 
                          onClick={() => deletePlayer(player.id)}
                          className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-2xl ml-2"
                          title="Banir Alma"
                       >
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
           </div>
        </div>
      </div>
    </div>
  );
}
