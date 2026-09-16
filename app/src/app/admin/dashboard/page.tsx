'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  ShieldCheck, 
  Clock, 
  Trash2, 
  Search, 
  ArrowLeft,
  RefreshCcw,
  CheckCircle2,
  ShieldMinus,
  Sparkles,
  Loader2,
  Eye,
  EyeOff,
  Key,
  LayoutPanelLeft,
  SlidersHorizontal,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Filter,
  Terminal
} from 'lucide-react';
import { toast } from 'sonner';

type AdminTab = 'souls' | 'controls';
type PlayerFilter = 'all' | 'ACTIVE' | 'PENDING' | 'INACTIVE';
type SortKey = 'name' | 'createdAt' | 'journeys';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { startImpersonation, showAdminPanel, toggleShowAdminPanel } = useGameStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('souls');
  const [players, setPlayers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [playerFilter, setPlayerFilter] = useState<PlayerFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

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
    if (status === 'unauthenticated' || (session && session.user.role !== 'ADMIN')) {
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

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(a => !a);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const filteredPlayers = players
    .filter(p => {
      const matchSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = playerFilter === 'all' || p.accountStatus === playerFilter;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      let valA: any, valB: any;
      if (sortKey === 'name') { valA = a.name || ''; valB = b.name || ''; }
      else if (sortKey === 'createdAt') { valA = new Date(a.createdAt).getTime(); valB = new Date(b.createdAt).getTime(); }
      else { valA = a._count?.journeys || 0; valB = b._count?.journeys || 0; }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  const statusColors: Record<string, string> = {
    ACTIVE: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    PENDING: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    INACTIVE: 'text-red-500 bg-red-500/10 border-red-500/20',
  };
  const statusDot: Record<string, string> = {
    ACTIVE: 'bg-emerald-500',
    PENDING: 'bg-orange-500',
    INACTIVE: 'bg-red-500',
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen w-full bg-portal-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-portal-bg text-portal-text p-6 md:p-12 relative overflow-x-hidden">
      <div className="absolute inset-0 opacity-10 bg-[url('/noise.svg')] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-portal-text-muted hover:text-portal-text transition-colors text-[10px] font-black uppercase tracking-widest cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Retornar ao Portal
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-portal-primary/10 rounded-[24px] border border-portal-primary/20 text-portal-primary shadow-[0_0_20px_var(--portal-primary-glow-weak)]">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter italic">
                  Câmara do <span className="text-portal-primary">Mestre</span>
                </h1>
                <p className="text-portal-text-muted font-body italic">Moderação, controle e configurações do sistema</p>
              </div>
            </div>

            <button
              onClick={fetchPlayers}
              className="p-3 bg-portal-surface border border-portal-border rounded-2xl text-portal-text-muted hover:text-portal-primary hover:border-portal-primary/40 transition-all cursor-pointer"
              title="Atualizar dados"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Tab Selector ───────────────────────────────────────── */}
        <div className="bg-portal-surface border-2 border-portal-border rounded-[40px] shadow-2xl overflow-hidden">
          <div className="flex p-2 bg-portal-bg/50 border-b border-portal-border gap-2">
            {([
              { id: 'souls',    label: 'Almas',     icon: Users,             badge: players.filter(p => p.accountStatus === 'PENDING').length || null },
              { id: 'controls', label: 'Controles', icon: SlidersHorizontal, badge: null },
            ] as const).map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer relative ${
                  activeTab === tab.id
                    ? 'bg-portal-surface text-portal-primary border border-portal-border shadow-md shadow-black/20'
                    : 'text-portal-text-muted hover:text-portal-text hover:bg-portal-surface/30'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-portal-primary' : 'text-portal-text-muted'}`} />
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-orange-500 text-white text-[8px] font-black rounded-full flex items-center justify-center px-1">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── TAB: ALMAS ──────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {activeTab === 'souls' && (
              <motion.div
                key="souls"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="p-6 md:p-10 space-y-6"
              >
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total de Almas',  value: players.length,                                              color: 'text-portal-text' },
                    { label: 'Aguardando',       value: players.filter(p => p.accountStatus === 'PENDING').length,  color: 'text-orange-500' },
                    { label: 'Ativos',           value: players.filter(p => p.accountStatus === 'ACTIVE').length,   color: 'text-emerald-500' },
                  ].map(s => (
                    <div key={s.label} className="p-4 bg-portal-bg/50 border border-portal-border rounded-2xl">
                      <p className="text-[9px] font-black uppercase tracking-widest text-portal-text-muted mb-1">{s.label}</p>
                      <h3 className={`text-2xl font-black ${s.color}`}>{s.value}</h3>
                    </div>
                  ))}
                </div>

                {/* Search + Filters + Sort */}
                <div className="flex flex-col md:flex-row gap-3">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-portal-text-muted" />
                    <input
                      type="text"
                      placeholder="Buscar por nome ou e-mail..."
                      className="w-full bg-portal-bg border-2 border-portal-border rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:border-portal-primary transition-all placeholder:text-portal-text-muted"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Status Filter chips */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="w-3.5 h-3.5 text-portal-text-muted shrink-0" />
                    {(['all', 'ACTIVE', 'PENDING', 'INACTIVE'] as PlayerFilter[]).map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setPlayerFilter(f)}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer ${
                          playerFilter === f
                            ? 'bg-portal-primary text-portal-primary-foreground border-portal-primary'
                            : 'bg-portal-bg border-portal-border text-portal-text-muted hover:border-portal-primary/40'
                        }`}
                      >
                        {f === 'all' ? 'Todos' : f === 'ACTIVE' ? 'Ativos' : f === 'PENDING' ? 'Pendentes' : 'Inativos'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort Bar */}
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-portal-text-muted">
                  <span>Ordenar:</span>
                  {([
                    { key: 'name' as SortKey,      label: 'Nome' },
                    { key: 'createdAt' as SortKey,  label: 'Data' },
                    { key: 'journeys' as SortKey,   label: 'Lendas' },
                  ]).map(s => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => toggleSort(s.key)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        sortKey === s.key
                          ? 'bg-portal-surface border-portal-border text-portal-text'
                          : 'border-transparent hover:border-portal-border'
                      }`}
                    >
                      {s.label}
                      {sortKey === s.key && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </button>
                  ))}
                </div>

                {/* Player List */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-portal-primary" />
                  </div>
                ) : filteredPlayers.length === 0 ? (
                  <div className="py-16 text-center text-portal-text-muted">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma alma encontrada.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {filteredPlayers.map(player => {
                        const isExpanded = expandedPlayerId === player.id;
                        return (
                          <motion.div
                            key={player.id}
                            layout
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-portal-bg/50 border border-portal-border hover:border-portal-border/80 rounded-3xl transition-all overflow-hidden"
                          >
                            {/* Card Row */}
                            <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-4 min-w-0">
                                {/* Avatar */}
                                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center relative shrink-0 ${statusColors[player.accountStatus] || 'text-zinc-500 bg-portal-surface border-portal-border'}`}>
                                  {player.role === 'ADMIN' ? <ShieldCheck className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                                  <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-portal-bg ${statusDot[player.accountStatus] || 'bg-zinc-500'}`} />
                                </div>

                                {/* Info */}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-base font-black text-portal-text truncate">{player.name || 'Sem Nome'}</h4>
                                    {player.role === 'ADMIN' && (
                                      <span className="px-2 py-0.5 bg-portal-primary/10 border border-portal-primary/20 text-portal-primary text-[7px] font-black uppercase rounded-full">Mestre</span>
                                    )}
                                    <span className={`px-2 py-0.5 border rounded-full text-[7px] font-black uppercase ${statusColors[player.accountStatus]}`}>
                                      {player.accountStatus === 'ACTIVE' ? 'Ativo' : player.accountStatus === 'PENDING' ? 'Pendente' : 'Inativo'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-portal-text-muted font-mono truncate">{player.email}</p>
                                  <div className="flex items-center gap-4 mt-1 text-[9px] uppercase font-black text-portal-text-muted">
                                    <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {new Date(player.createdAt).toLocaleDateString('pt-BR')}</span>
                                    <span className="flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> {player._count?.journeys || 0} Lendas</span>
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
                                {player.role !== 'ADMIN' && (
                                  <button
                                    onClick={() => handleSupervise(player)}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-portal-surface border border-portal-border text-portal-text-muted hover:text-white hover:bg-portal-surface-hover transition-all rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> Ver
                                  </button>
                                )}
                                {player.accountStatus !== 'ACTIVE' && (
                                  <button
                                    onClick={() => updatePlayerStatus(player.id, 'ACTIVE')}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-white text-zinc-950 hover:bg-emerald-500 hover:text-white transition-all rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                                  </button>
                                )}
                                {player.accountStatus === 'ACTIVE' && player.role !== 'ADMIN' && (
                                  <button
                                    onClick={() => updatePlayerStatus(player.id, 'INACTIVE')}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-portal-surface border border-portal-border text-portal-text-muted hover:text-red-500 hover:border-red-500/40 transition-all rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer"
                                  >
                                    <ShieldMinus className="w-3.5 h-3.5" /> Revogar
                                  </button>
                                )}
                                <button
                                  onClick={() => handleResetPassword(player.id, player.name)}
                                  className="p-2.5 bg-portal-surface border border-portal-border text-amber-500/50 hover:text-amber-400 hover:bg-amber-500/10 transition-all rounded-xl cursor-pointer"
                                  title="Resetar Senha"
                                >
                                  <Key className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deletePlayer(player.id)}
                                  className="p-2.5 bg-portal-surface border border-portal-border text-portal-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all rounded-xl cursor-pointer"
                                  title="Banir Alma"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setExpandedPlayerId(isExpanded ? null : player.id)}
                                  className="p-2.5 bg-portal-surface border border-portal-border text-portal-text-muted hover:text-portal-primary hover:border-portal-primary/30 transition-all rounded-xl cursor-pointer"
                                  title="Ver detalhes"
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden border-t border-portal-border/50"
                                >
                                  <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="p-3 bg-portal-bg rounded-2xl border border-portal-border/50">
                                      <p className="text-[8px] font-black uppercase tracking-widest text-portal-text-muted mb-1">ID</p>
                                      <p className="text-[9px] font-mono text-portal-text truncate">{player.id}</p>
                                    </div>
                                    <div className="p-3 bg-portal-bg rounded-2xl border border-portal-border/50">
                                      <p className="text-[8px] font-black uppercase tracking-widest text-portal-text-muted mb-1">Função</p>
                                      <p className="text-[9px] font-black text-portal-text uppercase">{player.role}</p>
                                    </div>
                                    <div className="p-3 bg-portal-bg rounded-2xl border border-portal-border/50">
                                      <p className="text-[8px] font-black uppercase tracking-widest text-portal-text-muted mb-1">Jornadas</p>
                                      <p className="text-[9px] font-black text-portal-text">{player._count?.journeys || 0}</p>
                                    </div>
                                    <div className="p-3 bg-portal-bg rounded-2xl border border-portal-border/50">
                                      <p className="text-[8px] font-black uppercase tracking-widest text-portal-text-muted mb-1">Membro desde</p>
                                      <p className="text-[9px] font-black text-portal-text">{new Date(player.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── TAB: CONTROLES ───────────────────────────────── */}
            {activeTab === 'controls' && (
              <motion.div
                key="controls"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="p-6 md:p-10 space-y-4"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Terminal className="w-4 h-4 text-portal-text-muted" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-portal-text-muted">Configurações Globais do Painel</span>
                </div>

                {/* Toggle: Painel Narrativo Admin */}
                <div className="p-5 bg-portal-bg/50 border-2 border-portal-border rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl transition-colors ${showAdminPanel ? 'bg-orange-500/10 text-orange-500' : 'bg-portal-surface text-portal-text-muted'}`}>
                      <LayoutPanelLeft className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-portal-text">Painel de Controle Narrativo</p>
                      <p className="text-[9px] text-portal-text-muted uppercase font-bold mt-0.5">
                        Botões de ação (Ação Aleatória, Regerar, Debug) {showAdminPanel ? 'visíveis' : 'ocultos'} no painel narrativo
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      toggleShowAdminPanel();
                      toast.success(showAdminPanel ? 'Botões ocultados no painel narrativo.' : 'Botões exibidos no painel narrativo.', {
                        icon: showAdminPanel ? '🙈' : '👁️'
                      });
                    }}
                    className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 cursor-pointer shrink-0 ${
                      showAdminPanel
                        ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-white hover:border-orange-500'
                        : 'bg-portal-bg border-portal-border text-portal-text-muted hover:border-portal-primary/40 hover:text-portal-primary'
                    }`}
                  >
                    <span className={`w-9 h-5 rounded-full relative flex items-center transition-colors ${showAdminPanel ? 'bg-orange-500' : 'bg-portal-surface-hover'}`}>
                      <span className={`absolute w-3 h-3 bg-white rounded-full shadow-md transition-all ${showAdminPanel ? 'left-[20px]' : 'left-[3px]'}`} />
                    </span>
                    {showAdminPanel ? <><Eye className="w-3.5 h-3.5" /> Visível</> : <><EyeOff className="w-3.5 h-3.5" /> Oculto</>}
                  </button>
                </div>

                {/* Placeholder cards for future controls */}
                {[
                  { icon: BookOpen, label: 'Modo Manutenção', desc: 'Exibe tela de manutenção para jogadores não-admin (em breve)', disabled: true },
                  { icon: Users,    label: 'Cadastro de Novos Jogadores', desc: 'Habilita ou bloqueia o registro de novas contas (em breve)', disabled: true },
                ].map(ctrl => (
                  <div key={ctrl.label} className="p-5 bg-portal-bg/30 border border-dashed border-portal-border/50 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 opacity-50">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-portal-surface text-portal-text-muted">
                        <ctrl.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-portal-text">{ctrl.label}</p>
                        <p className="text-[9px] text-portal-text-muted uppercase font-bold mt-0.5">{ctrl.desc}</p>
                      </div>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-portal-text-muted px-3 py-1.5 border border-portal-border rounded-xl shrink-0">Em Breve</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
