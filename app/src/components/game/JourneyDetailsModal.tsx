'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Palette, 
  ScrollText, 
  Target, 
  BookOpen,
  Info,
  Clock,
  ShieldCheck,
  Volume2,
  Sparkles,
  Cpu,
  Activity,
  Zap,
  Type,
  Link,
  Crown,
  Share2,
  Copy,
  Ban,
  Check
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

interface JourneyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: any;
  historyCount: number;
  journeyId?: string;
}

interface ShareLink {
  id: string;
  createdAt: string;
  redeemedAt: string | null;
  sessionExpiresAt: string | null;
  status: 'aguardando_resgate' | 'ativo';
}

const shareStatusLabel: Record<ShareLink['status'], string> = {
  aguardando_resgate: 'Aguardando abertura',
  ativo: 'Sendo assistido',
};

interface AIStatus {
  text: {
    model: string;
    isCustom: boolean;
    status: string;
    latency: string;
  };
  image: {
    model: string;
    isCustom: boolean;
    status: string;
    latency: string;
  };
}

export default function JourneyDetailsModal({ isOpen, onClose, settings, historyCount, journeyId }: JourneyDetailsModalProps) {
  const { updateSettings } = useGameStore();
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [creatingLink, setCreatingLink] = useState(false);
  // URLs só existem em memória, nunca no banco (só o hash é persistido) — por isso só
  // dá pra oferecer "Copiar" para links gerados nesta mesma sessão do modal.
  const [linkUrls, setLinkUrls] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchShareLinks = () => {
    if (!journeyId) return;
    fetch(`/api/journey/${journeyId}/share`)
      .then(r => r.json())
      .then((data) => setShareLinks(Array.isArray(data) ? data : []))
      .catch(() => setShareLinks([]));
  };

  useEffect(() => {
    if (isOpen) {
      fetch('/api/ai-status')
        .then(r => r.json())
        .then(setAiStatus)
        .catch(() => setAiStatus(null));
      fetchShareLinks();
    } else {
      setLinkUrls({});
      setCopiedId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, journeyId]);

  const handleCreateShareLink = async () => {
    if (!journeyId || creatingLink) return;
    setCreatingLink(true);
    try {
      const res = await fetch(`/api/journey/${journeyId}/share`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setLinkUrls((prev) => ({ ...prev, [data.id]: data.url }));
        navigator.clipboard?.writeText(data.url).then(() => setCopiedId(data.id)).catch(() => {});
        fetchShareLinks();
      }
    } finally {
      setCreatingLink(false);
    }
  };

  const handleCopyLink = (id: string) => {
    const url = linkUrls[id];
    if (!url) return;
    navigator.clipboard?.writeText(url).then(() => setCopiedId(id)).catch(() => {});
  };

  const handleRevokeShareLink = async (shareId: string) => {
    if (!journeyId) return;
    setLinkUrls((prev) => {
      const { [shareId]: _removed, ...rest } = prev;
      return rest;
    });
    await fetch(`/api/journey/${journeyId}/share/${shareId}/revoke`, { method: 'POST' });
    fetchShareLinks();
  };

  if (!settings) return null;

  const journeyLengthMap: Record<string, string> = {
    preview: 'Jornada Preview (1-10)',
    short: 'Jornada Curta (11-50)',
    medium: 'Jornada Média (51-99)',
    long: 'Jornada Longa (100-249)',
    epic: 'Jornada Épica (250-499)',
    'life-long': 'Jornada Eterna (500+)'
  };

  const narrativeDetailMap: Record<string, string> = {
    short: 'Curto (1-2 parágrafos)',
    medium: 'Médio (3-4 parágrafos)',
    long: 'Longo (5-7 parágrafos)',
    epic: 'Épico (8+ parágrafos)'
  };

  const readStyleMap: Record<string, string> = {
    essential: 'Essencial',
    fast: 'Rápido',
    moderate: 'Médio',
    detailed: 'Detalhado',
    literary: 'Literário'
  };

  const stats = [
    { label: 'Protagonista', value: settings.playerName, icon: User },
    { label: 'Estilo Visual', value: settings.visualStyle, icon: Palette },
    { label: 'Gênero', value: settings.genre, icon: BookOpen },
    { label: 'Tom Narrativo', value: settings.tone, icon: Target },
    { label: 'Estilo Literário', value: readStyleMap[settings.readStyle] || settings.readStyle, icon: Type },
    { label: 'Magnitude', value: narrativeDetailMap[settings.narrativeDetail] || settings.narrativeDetail || 'Médio', icon: Zap },
    { label: 'Tamanho Base', value: journeyLengthMap[settings.journeyLength] || settings.journeyLength, icon: Clock },
    { label: 'Cenas no Registro', value: historyCount.toString(), icon: ScrollText },
    { label: 'Sistema de Punição', value: settings.punishSystem?.replace(/_/g, ' ') || 'Não definido', icon: ShieldCheck },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-3xl bg-portal-bg border border-portal-border rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-portal-border flex items-center justify-between bg-portal-surface/30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter text-portal-text">Configurações do Destino</h2>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Parâmetros da sua lenda atual</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-portal-surface-hover rounded-full transition-colors text-zinc-500 hover:text-zinc-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {stats.map((stat, i) => (
                  <div key={i} className="flex flex-col gap-1.5 p-3 bg-portal-surface/50 rounded-2xl border border-portal-border/50 hover:bg-portal-surface transition-colors">
                    <div className="flex items-center gap-2">
                      <stat.icon className="w-3 h-3 text-primary/70" />
                      <p className="text-[8px] text-zinc-500 uppercase font-black tracking-widest leading-none">{stat.label}</p>
                    </div>
                    <p className="text-[11px] font-bold text-zinc-200 uppercase truncate pl-5">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* AI Controls in Modal */}
              <div className="space-y-4 pt-4 border-t border-portal-border">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Configurações de IA e Cota</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-portal-surface rounded-3xl border border-portal-border">
                      <div className="flex items-center gap-3">
                        <Palette className="w-4 h-4 text-zinc-500" />
                        <span className="text-xs font-bold text-zinc-200">Ilustrações</span>
                      </div>
                      <button 
                        onClick={() => updateSettings({ enableImages: !settings.enableImages })}
                        className={`w-10 h-5 rounded-full transition-all relative p-1 ${settings.enableImages ? 'bg-primary' : 'bg-portal-surface-hover'}`}
                      >
                        <motion.div 
                          animate={{ x: settings.enableImages ? 20 : 0 }}
                          className="w-3 h-3 bg-white rounded-full shadow-md"
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-portal-surface rounded-3xl border border-portal-border">
                      <div className="flex items-center gap-3">
                        <Volume2 className="w-4 h-4 text-zinc-500" />
                        <span className="text-xs font-bold text-zinc-200">Narração</span>
                      </div>
                      <button 
                        onClick={() => updateSettings({ enableAudio: !settings.enableAudio })}
                        className={`w-10 h-5 rounded-full transition-all relative p-1 ${settings.enableAudio ? 'bg-primary' : 'bg-portal-surface-hover'}`}
                      >
                        <motion.div 
                          animate={{ x: settings.enableAudio ? 20 : 0 }}
                          className="w-3 h-3 bg-white rounded-full shadow-md"
                        />
                      </button>
                    </div>

                    <AnimatePresence>
                      {settings.enableAudio && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center justify-between p-4 bg-portal-surface rounded-3xl border border-portal-border"
                        >
                          <div className="flex items-center gap-3">
                            <Volume2 className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold text-zinc-200">Auto-Play</span>
                          </div>
                          <button 
                            onClick={() => updateSettings({ autoPlayAudio: !settings.autoPlayAudio })}
                            className={`w-10 h-5 rounded-full transition-all relative p-1 ${settings.autoPlayAudio ? 'bg-primary' : 'bg-portal-surface-hover'}`}
                          >
                            <motion.div 
                              animate={{ x: settings.autoPlayAudio ? 20 : 0 }}
                              className="w-3 h-3 bg-white rounded-full shadow-md"
                            />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                </div>
              </div>

              {/* Simplified AI Status Cards */}
              {aiStatus && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bloco de Texto (Mente) */}
                  <div className="flex items-center justify-between p-4 bg-portal-surface rounded-3xl border border-portal-border relative group overflow-hidden">
                    <div className="flex items-center gap-3 relative z-10">
                      <div className={`p-2 rounded-xl ${aiStatus.text.isCustom ? 'bg-primary/20 text-primary' : 'bg-portal-surface-hover text-zinc-500'}`}>
                         {aiStatus.text.isCustom ? <Crown className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Mente</p>
                           {aiStatus.text.isCustom && (
                             <span className="text-[7px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-black uppercase border border-primary/20 flex items-center gap-1">
                                <Link className="w-2 h-2" /> Vinculada à Alma
                             </span>
                           )}
                        </div>
                        <p className="text-xs font-bold text-zinc-300">{aiStatus.text.model}</p>
                      </div>
                    </div>
                    <div className="text-right relative z-10">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Activity className={`w-3 h-3 ${aiStatus.text.status === 'Operacional' ? 'text-green-500' : 'text-red-500'}`} />
                        <span className={`text-[9px] font-bold uppercase ${aiStatus.text.status === 'Operacional' ? 'text-green-500' : 'text-red-500'}`}>{aiStatus.text.status}</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-600">{aiStatus.text.latency}</span>
                    </div>
                    {/* Thematic Glow if custom */}
                    {aiStatus.text.isCustom && (
                      <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary/5 blur-2xl rounded-full group-hover:bg-primary/10 transition-all" />
                    )}
                  </div>

                  {/* Bloco de Imagem (Visão) */}
                  <div className="flex items-center justify-between p-4 bg-portal-surface rounded-3xl border border-portal-border relative group overflow-hidden">
                    <div className="flex items-center gap-3 relative z-10">
                      <div className={`p-2 rounded-xl ${aiStatus.image.isCustom ? 'bg-primary/20 text-primary' : 'bg-portal-surface-hover text-zinc-500'}`}>
                         {aiStatus.image.isCustom ? <Crown className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Visão</p>
                           {aiStatus.image.isCustom && (
                             <span className="text-[7px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-black uppercase border border-primary/20 flex items-center gap-1">
                                <Link className="w-2 h-2" /> Vinculada à Alma
                             </span>
                           )}
                        </div>
                        <p className="text-xs font-bold text-zinc-300">{aiStatus.image.model}</p>
                      </div>
                    </div>
                    <div className="text-right relative z-10">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Activity className={`w-3 h-3 ${aiStatus.image.status === 'Operacional' ? 'text-green-500' : 'text-red-500'}`} />
                        <span className={`text-[9px] font-bold uppercase ${aiStatus.image.status === 'Operacional' ? 'text-green-500' : 'text-red-500'}`}>{aiStatus.image.status}</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-600">{aiStatus.image.latency}</span>
                    </div>
                    {/* Thematic Glow if custom */}
                    {aiStatus.image.isCustom && (
                      <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary/5 blur-2xl rounded-full group-hover:bg-primary/10 transition-all" />
                    )}
                  </div>
                </div>
              )}

              {/* Compartilhamento (Modo Espectador) */}
              {journeyId && (
                <div className="space-y-3 pt-4 border-t border-portal-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Compartilhamento</h3>
                    <button
                      onClick={handleCreateShareLink}
                      disabled={creatingLink}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                    >
                      <Share2 className="w-3 h-3" />
                      Gerar link
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-600">
                    Cada link só pode ser aberto uma vez, por uma pessoa. Depois de aberto, o acesso de leitura fica valendo até você revogar.
                  </p>

                  {shareLinks.length > 0 && (
                    <div className="space-y-2">
                      {shareLinks.map((link) => (
                        <div key={link.id} className="flex items-center justify-between p-3 bg-portal-surface rounded-2xl border border-portal-border">
                          <span className="text-[11px] font-bold text-zinc-300">
                            {shareStatusLabel[link.status]}
                          </span>
                          <div className="flex items-center gap-3">
                            {linkUrls[link.id] && (
                              <button
                                onClick={() => handleCopyLink(link.id)}
                                className="flex items-center gap-1 text-[10px] font-black uppercase text-primary hover:text-primary/80 transition-colors"
                              >
                                {copiedId === link.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copiedId === link.id ? 'Copiado' : 'Copiar'}
                              </button>
                            )}
                            <button
                              onClick={() => handleRevokeShareLink(link.id)}
                              className="flex items-center gap-1 text-[10px] font-black uppercase text-red-400 hover:text-red-300 transition-colors"
                            >
                              <Ban className="w-3 h-3" />
                              Revogar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
