'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  X,
  User,
  Palette,
  ScrollText,
  Target,
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
  Check,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { useGameStore } from '@/store/gameStore';
import { OptionPicker } from './OptionPicker';
import {
  GENRE_OPTIONS,
  VISUAL_STYLE_OPTIONS,
  READ_STYLE_OPTIONS,
  MAGNITUDE_OPTIONS,
  JOURNEY_LENGTH_OPTIONS,
} from '@/lib/journeyOptions';

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
  const [hasBYOK, setHasBYOK] = useState(false);
  // Só uma seção de parâmetros aberta por vez — mantém o modal compacto por padrão
  // (edição é ocasional, diferente do wizard de criação, que exibe tudo expandido).
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
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
      fetch('/api/auth/profile')
        .then(r => r.json())
        .then(data => {
          const keys = data.apiKeys || {};
          const enabled = data.apiEnabled || {};
          setHasBYOK(Object.entries(keys).some(([p, k]) => k && k !== '' && enabled[p] !== false));
        })
        .catch(() => setHasBYOK(false));
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

  // Fecha o acordeão um instante depois da escolha, só pra dar tempo do
  // destaque da opção selecionada aparecer antes de recolher.
  const pickAndCollapse = (apply: () => void) => {
    apply();
    setTimeout(() => setExpandedSection(null), 350);
  };

  const handleJourneyLengthChange = (id: string) => {
    const target = JOURNEY_LENGTH_OPTIONS.find(o => o.id === id);
    if (target && target.sceneLimit < historyCount) {
      toast.error(`Já são ${historyCount} cenas — não dá pra encolher a jornada pra "${target.label}".`);
      return;
    }
    pickAndCollapse(() => updateSettings({ journeyLength: id as any }));
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

  const genreLabel = GENRE_OPTIONS.find(o => o.id === settings.genre)?.label || settings.genre;
  const visualStyleLabel = VISUAL_STYLE_OPTIONS.find(o => o.id === settings.visualStyle)?.label || settings.visualStyle;
  const readStyleLabel = READ_STYLE_OPTIONS.find(o => o.id === settings.readStyle)?.label || settings.readStyle;
  const magnitudeLabel = MAGNITUDE_OPTIONS.find(o => o.id === (settings.narrativeDetail || 'medium'))?.label || 'Médio';
  const journeyLengthLabel = JOURNEY_LENGTH_OPTIONS.find(o => o.id === settings.journeyLength)?.label || settings.journeyLength;

  const stats = [
    { label: 'Protagonista', value: settings.playerName, icon: User },
    { label: 'Tom Narrativo', value: settings.tone, icon: Target },
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

              {/* Parâmetros editáveis da jornada (acordeão — só uma seção expandida por vez) */}
              <div className="space-y-2 pt-4 border-t border-portal-border">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1">Parâmetros da Jornada</h3>

                {/* Estética do Mundo */}
                <div className="rounded-2xl border border-portal-border/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedSection(s => s === 'aesthetics' ? null : 'aesthetics')}
                    className="w-full flex items-center justify-between p-3 bg-portal-surface/50 hover:bg-portal-surface transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Palette className="w-3 h-3 text-primary/70" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Estética do Mundo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-300 uppercase truncate max-w-[160px]">{genreLabel} · {visualStyleLabel}</span>
                      <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform shrink-0 ${expandedSection === 'aesthetics' ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedSection === 'aesthetics' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 pt-1 space-y-3">
                          <div className="max-h-32 overflow-y-auto custom-scrollbar pr-2">
                            <OptionPicker
                              options={GENRE_OPTIONS}
                              value={settings.genre}
                              onChange={(id) => pickAndCollapse(() => updateSettings({ genre: id as any }))}
                              hasBYOK={hasBYOK}
                              variant="pills"
                              accent="neutral"
                            />
                          </div>
                          <div className="max-h-32 overflow-y-auto custom-scrollbar pr-2 border-t border-portal-border/50 pt-3">
                            <OptionPicker
                              options={VISUAL_STYLE_OPTIONS}
                              value={settings.visualStyle}
                              onChange={(id) => pickAndCollapse(() => updateSettings({ visualStyle: id as any }))}
                              hasBYOK={hasBYOK}
                              variant="pills"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Estilo Literário */}
                <div className="rounded-2xl border border-portal-border/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedSection(s => s === 'readStyle' ? null : 'readStyle')}
                    className="w-full flex items-center justify-between p-3 bg-portal-surface/50 hover:bg-portal-surface transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Type className="w-3 h-3 text-primary/70" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Estilo Literário</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-300 uppercase">{readStyleLabel}</span>
                      <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform shrink-0 ${expandedSection === 'readStyle' ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedSection === 'readStyle' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 pt-1">
                          <OptionPicker
                            options={READ_STYLE_OPTIONS}
                            value={settings.readStyle}
                            onChange={(id) => pickAndCollapse(() => updateSettings({ readStyle: id as any }))}
                            hasBYOK={hasBYOK}
                            variant="list"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Magnitude Narrativa */}
                <div className="rounded-2xl border border-portal-border/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedSection(s => s === 'magnitude' ? null : 'magnitude')}
                    className="w-full flex items-center justify-between p-3 bg-portal-surface/50 hover:bg-portal-surface transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-primary/70" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Magnitude Narrativa</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-300 uppercase">{magnitudeLabel}</span>
                      <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform shrink-0 ${expandedSection === 'magnitude' ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedSection === 'magnitude' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 pt-1">
                          <OptionPicker
                            options={MAGNITUDE_OPTIONS}
                            value={settings.narrativeDetail || 'medium'}
                            onChange={(id) => pickAndCollapse(() => updateSettings({ narrativeDetail: id as any }))}
                            hasBYOK={hasBYOK}
                            variant="list"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Tamanho da Jornada */}
                <div className="rounded-2xl border border-portal-border/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedSection(s => s === 'length' ? null : 'length')}
                    className="w-full flex items-center justify-between p-3 bg-portal-surface/50 hover:bg-portal-surface transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-primary/70" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tamanho da Jornada</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-300 uppercase">{journeyLengthLabel}</span>
                      <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform shrink-0 ${expandedSection === 'length' ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedSection === 'length' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 pt-1">
                          <OptionPicker
                            options={JOURNEY_LENGTH_OPTIONS}
                            value={settings.journeyLength}
                            onChange={handleJourneyLengthChange}
                            hasBYOK={hasBYOK}
                            variant="cards"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
