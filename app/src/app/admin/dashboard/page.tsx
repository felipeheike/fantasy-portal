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
  Terminal,
  Megaphone,
  AlertTriangle,
  ShieldAlert,
  Send,
  X,
  Wand2,
  RotateCcw,
  Info,
  ScrollText,
  Radar,
  Heart,
  Zap,
  Wrench
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

type AdminTab = 'souls' | 'controls' | 'narrative' | 'audit' | 'live';
type PlayerFilter = 'all' | 'ACTIVE' | 'PENDING' | 'INACTIVE';
type SortKey = 'name' | 'createdAt' | 'journeys';

function formatTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'agora mesmo';
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}

const AUDIT_ACTION_LABELS: Record<string, string> = {
  PLAYER_STATUS_CHANGE: 'Alterou acesso',
  PLAYER_BANNED: 'Baniu permanentemente',
  PASSWORD_RESET: 'Resetou senha',
  IMPERSONATION_START: 'Iniciou supervisão',
  ANNOUNCEMENT_PUBLISHED: 'Publicou aviso global',
  ANNOUNCEMENT_CLEARED: 'Removeu aviso global',
  PLAYER_NOTICE_SENT: 'Enviou missiva individual',
  NARRATIVE_CONFIG_UPDATED: 'Editou prompt do narrador',
  NARRATIVE_CONFIG_RESET: 'Restaurou prompt do narrador',
  MAINTENANCE_ENABLED: 'Ativou modo manutenção',
  MAINTENANCE_DISABLED: 'Desativou modo manutenção',
};

function describeAuditLog(log: any): string {
  const meta = log.metadata || {};
  switch (log.action) {
    case 'PLAYER_STATUS_CHANGE':
      return `${meta.from || '?'} → ${meta.to || '?'}`;
    case 'PLAYER_BANNED':
      return meta.email || '';
    case 'ANNOUNCEMENT_PUBLISHED':
    case 'PLAYER_NOTICE_SENT':
      return `[${meta.variant || 'info'}] "${meta.messagePreview || ''}"`;
    case 'MAINTENANCE_ENABLED':
      return meta.messagePreview ? `"${meta.messagePreview}"` : '';
    default:
      return '';
  }
}

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
  const [announcement, setAnnouncement] = useState<{ message: string; variant: string; isActive: boolean } | null>(null);
  const [announcementDraft, setAnnouncementDraft] = useState('');
  const [announcementVariant, setAnnouncementVariant] = useState<'info' | 'warning' | 'critical'>('info');
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
  const [noticeDraft, setNoticeDraft] = useState('');
  const [noticeVariant, setNoticeVariant] = useState<'info' | 'warning' | 'critical'>('info');
  const [isSendingNotice, setIsSendingNotice] = useState(false);
  const [playerNotices, setPlayerNotices] = useState<Record<string, any[]>>({});
  const [narrativeConfig, setNarrativeConfig] = useState({
    persona: '', detailShort: '', detailMedium: '', detailLong: '', detailEpic: '', extraDirectives: ''
  });
  const [isNarrativeCustom, setIsNarrativeCustom] = useState(false);
  const [isSavingNarrative, setIsSavingNarrative] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(false);
  const [maintenance, setMaintenance] = useState<{ isActive: boolean; message: string | null } | null>(null);
  const [maintenanceDraft, setMaintenanceDraft] = useState('');
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [isLoadingLiveSessions, setIsLoadingLiveSessions] = useState(false);

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
      logger.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAnnouncement = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/announcement');
      if (res.ok) {
        const data = await res.json();
        setAnnouncement(data);
        if (data) {
          setAnnouncementDraft(data.message);
          setAnnouncementVariant(data.variant);
        }
      }
    } catch (e) {
      logger.error(e);
    }
  }, []);

  const fetchMaintenance = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/maintenance');
      if (res.ok) {
        const data = await res.json();
        setMaintenance(data);
        setMaintenanceDraft(data.message || '');
      }
    } catch (e) {
      logger.error(e);
    }
  }, []);

  const fetchNarrativeConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/narrative-config');
      if (res.ok) {
        const data = await res.json();
        setNarrativeConfig({
          persona: data.persona, detailShort: data.detailShort, detailMedium: data.detailMedium,
          detailLong: data.detailLong, detailEpic: data.detailEpic, extraDirectives: data.extraDirectives || ''
        });
        setIsNarrativeCustom(!!data.updatedAt);
      }
    } catch (e) {
      logger.error(e);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoadingAuditLogs(true);
    try {
      const res = await fetch('/api/admin/audit-log');
      if (res.ok) {
        setAuditLogs(await res.json());
      } else {
        toast.error('Falha ao consultar o registro de auditoria.');
      }
    } catch (e) {
      logger.error(e);
    } finally {
      setIsLoadingAuditLogs(false);
    }
  }, []);

  const fetchLiveSessions = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingLiveSessions(true);
    try {
      const res = await fetch('/api/admin/live-sessions');
      if (res.ok) {
        setLiveSessions(await res.json());
      } else if (!silent) {
        toast.error('Falha ao consultar sessões ao vivo.');
      }
    } catch (e) {
      logger.error(e);
    } finally {
      if (!silent) setIsLoadingLiveSessions(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated' || (session && session.user.role !== 'ADMIN')) {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchPlayers();
      fetchAnnouncement();
      fetchNarrativeConfig();
      fetchAuditLogs();
      fetchMaintenance();
    }
  }, [status, session, router, fetchPlayers, fetchAnnouncement, fetchNarrativeConfig, fetchAuditLogs, fetchMaintenance]);

  // Radar leve: só faz polling enquanto a aba "Ao Vivo" está aberta, pra não gerar
  // tráfego de fundo constante com o admin em outra aba do painel.
  useEffect(() => {
    if (activeTab !== 'live' || status !== 'authenticated') return;
    fetchLiveSessions();
    const interval = setInterval(() => fetchLiveSessions(true), 15000);
    return () => clearInterval(interval);
  }, [activeTab, status, fetchLiveSessions]);

  const handlePublishAnnouncement = async () => {
    if (!announcementDraft.trim()) {
      toast.error('Escreva uma mensagem antes de publicar.');
      return;
    }
    setIsSavingAnnouncement(true);
    try {
      const res = await fetch('/api/admin/announcement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: announcementDraft.trim(), variant: announcementVariant })
      });
      if (res.ok) {
        toast.success('Aviso publicado para todos os jogadores.');
        fetchAnnouncement();
      } else {
        toast.error('Falha ao publicar o aviso.');
      }
    } catch (e) {
      toast.error('Erro de conexão com o mestre.');
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const handleClearAnnouncement = async () => {
    setIsSavingAnnouncement(true);
    try {
      const res = await fetch('/api/admin/announcement', { method: 'DELETE' });
      if (res.ok) {
        toast.success('Aviso removido.');
        fetchAnnouncement();
      } else {
        toast.error('Falha ao remover o aviso.');
      }
    } catch (e) {
      toast.error('Erro de conexão com o mestre.');
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const handleEnableMaintenance = async () => {
    if (!confirm('Ativar o modo manutenção? Todo jogador não-admin verá a tela de manutenção até você desativar.')) return;
    setIsSavingMaintenance(true);
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: maintenanceDraft.trim() })
      });
      if (res.ok) {
        toast.success('Modo manutenção ativado.');
        fetchMaintenance();
      } else {
        toast.error('Falha ao ativar o modo manutenção.');
      }
    } catch (e) {
      toast.error('Erro de conexão com o mestre.');
    } finally {
      setIsSavingMaintenance(false);
    }
  };

  const handleDisableMaintenance = async () => {
    setIsSavingMaintenance(true);
    try {
      const res = await fetch('/api/admin/maintenance', { method: 'DELETE' });
      if (res.ok) {
        toast.success('Modo manutenção desativado.');
        fetchMaintenance();
      } else {
        toast.error('Falha ao desativar o modo manutenção.');
      }
    } catch (e) {
      toast.error('Erro de conexão com o mestre.');
    } finally {
      setIsSavingMaintenance(false);
    }
  };

  const fetchPlayerNotices = async (playerId: string) => {
    try {
      const res = await fetch(`/api/admin/players/${playerId}/notices`);
      if (res.ok) {
        const data = await res.json();
        setPlayerNotices((prev) => ({ ...prev, [playerId]: data }));
      }
    } catch (e) {
      logger.error(e);
    }
  };

  const handleSendNotice = async (playerId: string) => {
    if (!noticeDraft.trim()) {
      toast.error('Escreva uma mensagem antes de enviar.');
      return;
    }
    setIsSendingNotice(true);
    try {
      const res = await fetch(`/api/admin/players/${playerId}/notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: noticeDraft.trim(), variant: noticeVariant })
      });
      if (res.ok) {
        toast.success('Aviso enviado pra essa alma.');
        setNoticeDraft('');
        fetchPlayerNotices(playerId);
      } else {
        toast.error('Falha ao enviar o aviso.');
      }
    } catch (e) {
      toast.error('Erro de conexão com o mestre.');
    } finally {
      setIsSendingNotice(false);
    }
  };

  const handleSaveNarrativeConfig = async () => {
    const { persona, detailShort, detailMedium, detailLong, detailEpic } = narrativeConfig;
    if (![persona, detailShort, detailMedium, detailLong, detailEpic].every(v => v.trim())) {
      toast.error('Persona e as 4 magnitudes não podem ficar vazias.');
      return;
    }
    setIsSavingNarrative(true);
    try {
      const res = await fetch('/api/admin/narrative-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(narrativeConfig)
      });
      if (res.ok) {
        toast.success('Prompt narrativo atualizado — vale já na próxima cena gerada.');
        setIsNarrativeCustom(true);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Falha ao salvar.');
      }
    } catch (e) {
      toast.error('Erro de conexão com o mestre.');
    } finally {
      setIsSavingNarrative(false);
    }
  };

  const handleResetNarrativeConfig = async () => {
    if (!confirm('Restaurar os textos padrão do prompt narrativo? Suas edições atuais serão perdidas.')) return;
    setIsSavingNarrative(true);
    try {
      const res = await fetch('/api/admin/narrative-config', { method: 'DELETE' });
      if (res.ok) {
        toast.success('Prompt narrativo restaurado ao padrão.');
        fetchNarrativeConfig();
      } else {
        toast.error('Falha ao restaurar.');
      }
    } catch (e) {
      toast.error('Erro de conexão com o mestre.');
    } finally {
      setIsSavingNarrative(false);
    }
  };

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

  const handleSupervise = async (player: any) => {
    try {
      await fetch(`/api/admin/players/${player.id}/impersonate`, { method: 'POST' });
    } catch (e) {
      logger.error(e);
    }
    startImpersonation(player.id, player.name);
    toast.success(`Iniciando supervisão de ${player.name}`);
    router.push('/');
  };

  // Igual ao handleSupervise, mas pulando a listagem de lendas: como o radar já
  // sabe em qual jornada o jogador está, carrega ela direto no store e cai na cena atual.
  const handleSuperviseSession = async (s: any) => {
    try {
      await fetch(`/api/admin/players/${s.playerId}/impersonate`, { method: 'POST' });
    } catch (e) {
      logger.error(e);
    }
    startImpersonation(s.playerId, s.playerName);
    try {
      const res = await fetch(`/api/journey?userId=${s.playerId}`);
      if (res.ok) {
        const journeys = await res.json();
        const journey = journeys.find((j: any) => j.id === s.journeyId);
        if (journey) {
          useGameStore.getState().loadJourney(journey.id, journey);
        }
      }
    } catch (e) {
      logger.error(e);
    }
    toast.success(`Entrando na sessão de ${s.playerName}`);
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
              { id: 'live',     label: 'Ao Vivo',   icon: Radar,             badge: null },
              { id: 'controls', label: 'Controles', icon: SlidersHorizontal, badge: null },
              { id: 'narrative', label: 'Narrativa', icon: Wand2,            badge: null },
              { id: 'audit',    label: 'Auditoria',  icon: ScrollText,       badge: null },
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
                                  onClick={() => {
                                    const next = isExpanded ? null : player.id;
                                    setExpandedPlayerId(next);
                                    setNoticeDraft('');
                                    setNoticeVariant('info');
                                    if (next && !playerNotices[next]) fetchPlayerNotices(next);
                                  }}
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

                                  {/* Aviso Individual */}
                                  <div className="px-5 pb-5 space-y-3">
                                    <div className="flex items-center gap-2">
                                      <Megaphone className="w-3.5 h-3.5 text-portal-text-muted" />
                                      <span className="text-[9px] font-black uppercase tracking-widest text-portal-text-muted">Enviar Aviso Individual</span>
                                    </div>
                                    <textarea
                                      value={noticeDraft}
                                      onChange={(e) => setNoticeDraft(e.target.value)}
                                      placeholder={`Ex: Sua conta foi verificada, ${player.name || 'aventureiro'}.`}
                                      rows={2}
                                      maxLength={280}
                                      className="w-full bg-portal-bg border-2 border-portal-border rounded-2xl p-3 text-xs text-portal-text placeholder:text-portal-text-muted focus:border-portal-primary outline-none transition-all resize-none"
                                    />
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                      <div className="flex p-1 bg-portal-bg rounded-2xl border border-portal-border">
                                        {([
                                          { id: 'info', label: 'Info', icon: Megaphone },
                                          { id: 'warning', label: 'Atenção', icon: AlertTriangle },
                                          { id: 'critical', label: 'Crítico', icon: ShieldAlert }
                                        ] as const).map((v) => (
                                          <button
                                            key={v.id}
                                            type="button"
                                            onClick={() => setNoticeVariant(v.id)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                              noticeVariant === v.id ? 'bg-portal-surface text-portal-text shadow-sm' : 'text-portal-text-muted hover:text-portal-text'
                                            }`}
                                          >
                                            <v.icon className="w-3 h-3" /> {v.label}
                                          </button>
                                        ))}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleSendNotice(player.id)}
                                        disabled={isSendingNotice}
                                        className="flex items-center gap-2 px-4 py-2 bg-portal-primary text-portal-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shrink-0"
                                      >
                                        <Send className="w-3.5 h-3.5" /> Enviar
                                      </button>
                                    </div>

                                    {(playerNotices[player.id]?.length || 0) > 0 && (
                                      <div className="space-y-1.5 pt-2 border-t border-portal-border/50">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-portal-text-muted">Últimos avisos enviados</p>
                                        {playerNotices[player.id].map((n) => (
                                          <div key={n.id} className="flex items-center justify-between gap-3 p-2.5 bg-portal-bg rounded-xl border border-portal-border/50">
                                            <p className="text-[10px] text-portal-text-muted truncate flex-1">{n.message}</p>
                                            <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${n.readAt ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                              {n.readAt ? 'Lido' : 'Não lido'}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
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

            {/* ── TAB: AO VIVO ───────────────────────────────── */}
            {activeTab === 'live' && (
              <motion.div
                key="live"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="p-6 md:p-10 space-y-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Radar className="w-4 h-4 text-portal-text-muted" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-portal-text-muted">Radar de Sessões Ativas</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchLiveSessions()}
                    disabled={isLoadingLiveSessions}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-portal-surface border border-portal-border text-portal-text-muted hover:text-portal-primary hover:border-portal-primary/30 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-30"
                  >
                    <RefreshCcw className={`w-3 h-3 ${isLoadingLiveSessions ? 'animate-spin' : ''}`} /> Atualizar
                  </button>
                </div>

                {isLoadingLiveSessions && liveSessions.length === 0 ? (
                  <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-portal-primary" /></div>
                ) : liveSessions.length === 0 ? (
                  <p className="text-center py-16 text-[11px] text-portal-text-muted uppercase font-bold">Nenhuma jornada ativa no momento.</p>
                ) : (
                  <div className="space-y-2">
                    {liveSessions.map((s) => (
                      <div key={s.journeyId} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-4 bg-portal-surface border border-portal-border rounded-2xl">
                        <div className="flex items-center gap-2 shrink-0 md:w-40">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${s.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-portal-text-muted/40'}`} />
                          <span className="text-[11px] text-portal-text font-bold truncate">{s.playerName}</span>
                        </div>
                        <span className="text-[9px] text-portal-primary font-black uppercase tracking-wide shrink-0 md:w-28">{s.genre}</span>
                        <span className="text-[9px] text-portal-text-muted font-bold uppercase shrink-0 md:w-20">{s.sceneCount} cenas</span>
                        <div className="flex items-center gap-3 shrink-0 md:w-28">
                          {s.hp !== null && (
                            <span className="flex items-center gap-1 text-[9px] text-red-400 font-bold"><Heart className="w-3 h-3" /> {s.hp}/{s.maxHp}</span>
                          )}
                          {s.sp !== null && (
                            <span className="flex items-center gap-1 text-[9px] text-sky-400 font-bold"><Zap className="w-3 h-3" /> {s.sp}/{s.maxSp}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-portal-text-muted italic truncate flex-1">{s.narrationPreview || '—'}</p>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[9px] text-portal-text-muted font-bold uppercase">{formatTimeAgo(s.updatedAt)}</span>
                          <button
                            type="button"
                            onClick={() => handleSuperviseSession(s)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-portal-bg border border-portal-border text-portal-text-muted hover:text-white hover:bg-portal-surface-hover transition-all rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer"
                          >
                            <Eye className="w-3 h-3" /> Ver
                          </button>
                        </div>
                      </div>
                    ))}
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

                {/* Aviso Global (MOTD) */}
                <div className="p-5 bg-portal-bg/50 border-2 border-portal-border rounded-3xl space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl transition-colors ${announcement?.isActive ? 'bg-portal-primary/10 text-portal-primary' : 'bg-portal-surface text-portal-text-muted'}`}>
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-portal-text">Aviso Global</p>
                      <p className="text-[9px] text-portal-text-muted uppercase font-bold mt-0.5">
                        {announcement?.isActive ? 'Ativo — visível pra todo jogador ao abrir o portal' : 'Nenhum aviso publicado no momento'}
                      </p>
                    </div>
                  </div>

                  <textarea
                    value={announcementDraft}
                    onChange={(e) => setAnnouncementDraft(e.target.value)}
                    placeholder="Ex: Manutenção agendada para hoje às 22h — o portal ficará fora do ar por ~15 minutos."
                    rows={3}
                    maxLength={280}
                    className="w-full bg-portal-surface border-2 border-portal-border rounded-2xl p-4 text-xs text-portal-text placeholder:text-portal-text-muted focus:border-portal-primary outline-none transition-all resize-none"
                  />

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex p-1 bg-portal-surface rounded-2xl border border-portal-border">
                      {([
                        { id: 'info', label: 'Info', icon: Megaphone },
                        { id: 'warning', label: 'Atenção', icon: AlertTriangle },
                        { id: 'critical', label: 'Crítico', icon: ShieldAlert }
                      ] as const).map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setAnnouncementVariant(v.id)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                            announcementVariant === v.id ? 'bg-portal-bg text-portal-text shadow-sm' : 'text-portal-text-muted hover:text-portal-text'
                          }`}
                        >
                          <v.icon className="w-3 h-3" /> {v.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      {announcement?.isActive && (
                        <button
                          type="button"
                          onClick={handleClearAnnouncement}
                          disabled={isSavingAnnouncement}
                          className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" /> Remover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handlePublishAnnouncement}
                        disabled={isSavingAnnouncement}
                        className="flex items-center gap-2 px-5 py-2.5 bg-portal-primary text-portal-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" /> Publicar
                      </button>
                    </div>
                  </div>
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

                {/* Modo Manutenção */}
                <div className="p-5 bg-portal-bg/50 border-2 border-portal-border rounded-3xl space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl transition-colors ${maintenance?.isActive ? 'bg-red-500/10 text-red-500' : 'bg-portal-surface text-portal-text-muted'}`}>
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-portal-text">Modo Manutenção</p>
                      <p className="text-[9px] text-portal-text-muted uppercase font-bold mt-0.5">
                        {maintenance?.isActive ? 'Ativo — jogadores não-admin veem a tela de manutenção' : 'Desativado — o portal funciona normalmente'}
                      </p>
                    </div>
                  </div>

                  <textarea
                    value={maintenanceDraft}
                    onChange={(e) => setMaintenanceDraft(e.target.value)}
                    placeholder="Ex: Estamos ajustando algo por trás das cortinas. Volte em ~15 minutos."
                    rows={2}
                    maxLength={200}
                    disabled={!!maintenance?.isActive}
                    className="w-full bg-portal-surface border-2 border-portal-border rounded-2xl p-4 text-xs text-portal-text placeholder:text-portal-text-muted focus:border-portal-primary outline-none transition-all resize-none disabled:opacity-50"
                  />

                  <div className="flex justify-end">
                    {maintenance?.isActive ? (
                      <button
                        type="button"
                        onClick={handleDisableMaintenance}
                        disabled={isSavingMaintenance}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Desativar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleEnableMaintenance}
                        disabled={isSavingMaintenance}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                      >
                        <Wrench className="w-3.5 h-3.5" /> Ativar Manutenção
                      </button>
                    )}
                  </div>
                </div>

                {/* Placeholder cards for future controls */}
                {[
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

            {/* ── TAB: NARRATIVA ───────────────────────────────── */}
            {activeTab === 'narrative' && (
              <motion.div
                key="narrative"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="p-6 md:p-10 space-y-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Wand2 className="w-4 h-4 text-portal-text-muted" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-portal-text-muted">Prompt do Narrador — sem deploy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isNarrativeCustom && (
                      <span className="px-2.5 py-1 bg-portal-primary/10 border border-portal-primary/20 text-portal-primary text-[8px] font-black uppercase rounded-full">Personalizado</span>
                    )}
                    <button
                      type="button"
                      onClick={handleResetNarrativeConfig}
                      disabled={isSavingNarrative || !isNarrativeCustom}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-portal-surface border border-portal-border text-portal-text-muted hover:text-red-400 hover:border-red-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-30"
                    >
                      <RotateCcw className="w-3 h-3" /> Restaurar Padrão
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-portal-primary/5 border border-portal-primary/20 rounded-2xl flex items-start gap-3">
                  <Info className="w-4 h-4 text-portal-primary mt-0.5 shrink-0" />
                  <p className="text-[9px] font-body italic text-portal-text-muted leading-relaxed">
                    Só o conteúdo de tom/estilo do narrador fica editável aqui. As regras técnicas ligadas ao contrato de dados da cena (dado, puzzle, combate, memória do mundo) continuam fixas no código, pra nenhuma edição aqui quebrar o JSON que o app espera.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-portal-text-muted">Persona do Narrador</label>
                  <textarea
                    value={narrativeConfig.persona}
                    onChange={(e) => setNarrativeConfig(prev => ({ ...prev, persona: e.target.value }))}
                    rows={2}
                    className="w-full bg-portal-bg border-2 border-portal-border rounded-2xl p-4 text-xs text-portal-text focus:border-portal-primary outline-none transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {([
                    { key: 'detailShort' as const, label: 'Magnitude — Curto' },
                    { key: 'detailMedium' as const, label: 'Magnitude — Médio' },
                    { key: 'detailLong' as const, label: 'Magnitude — Longo' },
                    { key: 'detailEpic' as const, label: 'Magnitude — Épico' },
                  ]).map((f) => (
                    <div key={f.key} className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-portal-text-muted">{f.label}</label>
                      <textarea
                        value={narrativeConfig[f.key]}
                        onChange={(e) => setNarrativeConfig(prev => ({ ...prev, [f.key]: e.target.value }))}
                        rows={2}
                        className="w-full bg-portal-bg border-2 border-portal-border rounded-2xl p-3 text-[11px] text-portal-text focus:border-portal-primary outline-none transition-all resize-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-portal-text-muted">Diretrizes Extras (opcional)</label>
                  <textarea
                    value={narrativeConfig.extraDirectives}
                    onChange={(e) => setNarrativeConfig(prev => ({ ...prev, extraDirectives: e.target.value }))}
                    placeholder="Ex: Dê mais ênfase a subtramas de romance esta semana. Reduza a frequência de combates."
                    rows={3}
                    maxLength={600}
                    className="w-full bg-portal-bg border-2 border-portal-border rounded-2xl p-4 text-xs text-portal-text placeholder:text-portal-text-muted focus:border-portal-primary outline-none transition-all resize-none"
                  />
                  <p className="text-[9px] text-portal-text-muted uppercase font-bold">Guia de tom livre — nunca peça campos que não existem no contrato JSON.</p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveNarrativeConfig}
                    disabled={isSavingNarrative}
                    className="flex items-center gap-2 px-6 py-3.5 bg-portal-primary text-portal-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" /> Salvar Prompt
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'audit' && (
              <motion.div
                key="audit"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="p-6 md:p-10 space-y-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <ScrollText className="w-4 h-4 text-portal-text-muted" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-portal-text-muted">Trilha de Ações Administrativas</span>
                  </div>
                  <button
                    type="button"
                    onClick={fetchAuditLogs}
                    disabled={isLoadingAuditLogs}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-portal-surface border border-portal-border text-portal-text-muted hover:text-portal-primary hover:border-portal-primary/30 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-30"
                  >
                    <RefreshCcw className={`w-3 h-3 ${isLoadingAuditLogs ? 'animate-spin' : ''}`} /> Atualizar
                  </button>
                </div>

                {isLoadingAuditLogs && auditLogs.length === 0 ? (
                  <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-portal-primary" /></div>
                ) : auditLogs.length === 0 ? (
                  <p className="text-center py-16 text-[11px] text-portal-text-muted uppercase font-bold">Nenhuma ação administrativa registrada ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-4 p-3.5 bg-portal-surface border border-portal-border rounded-2xl">
                        <span className="text-[9px] text-portal-text-muted font-bold uppercase shrink-0 md:w-36">
                          {new Date(log.createdAt).toLocaleString('pt-BR')}
                        </span>
                        <span className="text-[11px] text-portal-text font-bold shrink-0 md:w-32 truncate">{log.actorName}</span>
                        <span className="text-[10px] text-portal-primary font-black uppercase tracking-wide shrink-0 md:w-44">
                          {AUDIT_ACTION_LABELS[log.action] || log.action}
                        </span>
                        {log.targetPlayerName && (
                          <span className="text-[10px] text-portal-text-muted shrink-0">→ {log.targetPlayerName}</span>
                        )}
                        <span className="text-[10px] text-portal-text-muted italic truncate">{describeAuditLog(log)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
