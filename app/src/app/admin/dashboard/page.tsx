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
  Eye,
  EyeOff,
  Key,
  LayoutPanelLeft
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { startImpersonation, showAdminPanel, toggleShowAdminPanel } = useGameStore();
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

  const handleResetPassword = async (id: string, name: string) => {
    if (!confirm(`Deseja resetar a senha de ${name}? Uma senha temporária será gerada.`)) return;

    try {
      const res = await fetch(`/api/admin/players/${id}/reset-password`, { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        toast.success('Senha Resetada!', {
          description: `Nova senha para ${name}: ${data.tempPassword}`,
          duration: 30000,
          action: {
            label: 'Copiar',
            onClick: () => {
              navigator.clipboard.writeText(data.tempPassword);
              toast.success('Senha copiada!');
            }
          }
        });
      } else {
        toast.error('Falha ao resetar senha.', { description: data.error });
      }
    } catch (e) {
      toast.error('Erro de conexão.');
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
      <div className="min-h-screen w-full bg-portal-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-portal-bg text-portal-text p-4 md:p-12 selection:bg-primary/20 relative overflow-x-hidden">
      <div className="absolute inset-0 opacity-10 bg-[url('/noise.svg')] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto space-y-8 md:space-y-12 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
             <button 
                onClick={() => router.push('/')}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-200 transition-colors text-[10px] font-black uppercase tracking-widest mb-4"
             >
                <ArrowLeft className="w-3 h-3" /> Voltar ao Portal
             </button>
             <h1 className="text-3xl md:text-5xl font-black tracking-tighter italic flex items-center gap-4">
                <ShieldCheck className="w-8 h-8 md:w-12 md:h-12 text-primary" />
                Câmara do <span className="text-primary">Mestre</span>
             </h1>
             <p className="text-zinc-500 font-body italic text-sm md:text-lg">Moderação e Controle de Almas</p>
          </div>

          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
             <div className="relative flex-1 md:flex-initial">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input 
                  type="text"
                  placeholder="Buscar..."
                  className="bg-portal-surface border border-portal-border rounded-2xl py-3 pl-12 pr-6 text-sm outline-none focus:border-primary transition-all w-full md:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchText(e.target.value)}
                />
             </div>
             <button 
               onClick={fetchPlayers}
               className="p-3 bg-portal-surface border border-portal-border rounded-2xl text-zinc-500 hover:text-primary transition-all"
             >
                <RefreshCcw className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
           <div className="p-4 md:p-6 bg-portal-surface/50 border border-portal-border rounded-3xl backdrop-blur-md">
              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Total de Almas</p>
              <h3 className="text-xl md:text-3xl font-black text-white">{players.length}</h3>
           </div>
           <div className="p-4 md:p-6 bg-portal-surface/50 border border-portal-border rounded-3xl backdrop-blur-md">
              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-orange-500 mb-1">Aguardando</p>
              <h3 className="text-xl md:text-3xl font-black text-white">{players.filter(p => p.accountStatus === 'PENDING').length}</h3>
           </div>
           <div className="p-4 md:p-6 bg-portal-surface/50 border border-portal-border rounded-3xl backdrop-blur-md">
              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-green-500 mb-1">Ativos</p>
              <h3 className="text-xl md:text-3xl font-black text-white">{players.filter(p => p.accountStatus === 'ACTIVE').length}</h3>
           </div>
        </div>

        {/* Narrative Panel Admin Controls Toggle */}
        <div className="p-5 md:p-6 bg-portal-surface/40 border-2 border-portal-border rounded-[32px] flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl transition-colors ${
              showAdminPanel 
                ? 'bg-orange-500/10 text-orange-500' 
                : 'bg-portal-surface text-portal-text-muted'
            }`}>
              <LayoutPanelLeft className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-portal-text">Painel de Controle Narrativo</p>
              <p className="text-[9px] text-portal-text-muted uppercase font-bold mt-0.5">
                {showAdminPanel 
                  ? 'Botões de admin visíveis no painel' 
                  : 'Botões de admin ocultos no painel'
                }
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              toggleShowAdminPanel();
              toast.success(
                showAdminPanel 
                  ? 'Botões de admin ocultados no painel narrativo.' 
                  : 'Botões de admin exibidos no painel narrativo.',
                { icon: showAdminPanel ? '🙈' : '👁️' }
              );
            }}
            className={`relative flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 cursor-pointer shrink-0 ${
              showAdminPanel
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-white hover:border-orange-500'
                : 'bg-portal-bg border-portal-border text-portal-text-muted hover:border-primary/50 hover:text-primary'
            }`}
          >
            {/* Toggle pill */}
            <span className={`w-10 h-5 rounded-full relative flex items-center transition-colors ${
              showAdminPanel ? 'bg-orange-500' : 'bg-portal-surface-hover'
            }`}>
              <span className={`absolute w-3.5 h-3.5 bg-white rounded-full shadow-md transition-all ${
                showAdminPanel ? 'left-[22px]' : 'left-[3px]'
              }`} />
            </span>
            {showAdminPanel 
              ? <><Eye className="w-3.5 h-3.5" /> Visível</> 
              : <><EyeOff className="w-3.5 h-3.5" /> Oculto</>
            }
          </button>
        </div>

        {/* Players List */}
        <div className="space-y-4">
           <div className="flex items-center gap-3 ml-2 md:ml-4 mb-4 md:mb-6">
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
                    className="p-4 md:p-6 bg-portal-surface/40 border border-portal-border hover:border-zinc-700 rounded-[28px] md:rounded-[32px] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                  >
                    <div className="flex items-center gap-4 md:gap-6">
                       <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[24px] border flex items-center justify-center relative shrink-0 ${
                          player.accountStatus === 'ACTIVE' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                          player.accountStatus === 'PENDING' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                          'bg-red-500/10 border-red-500/20 text-red-500'
                       }`}>
                          {player.role === 'ADMIN' ? <ShieldCheck className="w-6 h-6 md:w-8 md:h-8" /> : <Users className="w-6 h-6 md:w-8 md:h-8" />}
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-zinc-950 ${
                             player.accountStatus === 'ACTIVE' ? 'bg-green-500' :
                             player.accountStatus === 'PENDING' ? 'bg-orange-500' : 'bg-red-500'
                          }`} />
                       </div>
                       
                       <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 md:gap-3">
                             <h4 className="text-lg md:text-xl font-black text-portal-text truncate">{player.name || 'Sem Nome'}</h4>
                             {player.role === 'ADMIN' && (
                               <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[7px] md:text-[8px] font-black uppercase rounded-full">Mestre</span>
                             )}
                          </div>
                          <p className="text-xs md:text-sm text-zinc-500 font-mono truncate">{player.email}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[8px] md:text-[9px] uppercase font-black text-zinc-700 mt-2">
                             <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {new Date(player.createdAt).toLocaleDateString()}</span>
                             <span className="flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> {player._count.journeys} Lendas</span>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                       {/* Impersonation Button */}
                       {player.role !== 'ADMIN' && (
                         <button 
                            onClick={() => handleSupervise(player)}
                            className="flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 md:py-3 bg-portal-surface-hover text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-zinc-700 flex-1 md:flex-initial"
                         >
                            <Eye className="w-3.5 h-3.5" /> <span className="md:inline">Ver</span>
                         </button>
                       )}

                       {player.accountStatus !== 'ACTIVE' && (
                          <button 
                            onClick={() => updatePlayerStatus(player.id, 'ACTIVE')}
                            className="flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-zinc-100 text-zinc-950 hover:bg-green-500 transition-all rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-xl flex-1 md:flex-initial"
                          >
                             <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                          </button>
                       )}
                       
                       {player.accountStatus === 'ACTIVE' && player.role !== 'ADMIN' && (
                          <button 
                            onClick={() => updatePlayerStatus(player.id, 'INACTIVE')}
                            className="flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-portal-surface border border-portal-border text-zinc-500 hover:text-red-500 hover:border-red-500/50 transition-all rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest flex-1 md:flex-initial"
                          >
                             <ShieldMinus className="w-3.5 h-3.5" /> <span className="md:inline">Revogar</span>
                          </button>
                       )}

                       <button 
                          onClick={() => handleResetPassword(player.id, player.name)}
                          className="p-2.5 md:p-3 bg-portal-surface border border-portal-border text-amber-500/50 hover:text-amber-400 hover:bg-amber-500/10 transition-all rounded-xl md:rounded-2xl"
                          title="Resetar Senha"
                       >
                          <Key className="w-4 h-4" />
                       </button>

                       <button 
                          onClick={() => deletePlayer(player.id)}
                          className="p-2.5 md:p-3 bg-portal-surface border border-portal-border text-zinc-700 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-xl md:rounded-2xl"
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
