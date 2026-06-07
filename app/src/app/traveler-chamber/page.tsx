'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useGameStore } from '@/store/gameStore';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Fingerprint,
  RefreshCcw,
  Sparkles,
  ShieldAlert,
  Eye,
  EyeOff,
  Zap,
  Terminal,
  Smartphone,
  Shield,
  Bot,
  Volume2,
  Wand2,
  Cpu,
  Power,
  PowerOff,
  Music,
  X
} from 'lucide-react';
import { toast } from 'sonner';

type ProfileTab = 'identity' | 'security' | 'apikeys' | 'preferences' | 'spotify';

interface DiscoveredModel {
  id: string;
  name: string;
  provider: 'google' | 'openai' | 'anthropic';
  type: 'text' | 'image' | 'audio';
}

export default function TravelerChamberPage() {
  const router = useRouter();
  const { data: session, update: updateSession, status: authStatus } = useSession();
  const { impersonatedPlayerId } = useGameStore();

  const [activeTab, setActiveTab] = useState<ProfileTab>('identity');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // API Keys State
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [apiEnabled, setApiEnabled] = useState<Record<string, boolean>>({});

  // Preferences State
  const [aiPreferences, setAiPreferences] = useState<any>(null);

  // Discovery State
  const [discoveredModels, setDiscoveredModels] = useState<DiscoveredModel[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);

  // MFA State
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaQrCode, setMfaQrCode] = useState<string | null>(null);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaStep, setMfaStep] = useState<'idle' | 'setup' | 'verify'>('idle');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  // Spotify Connection States & Handlers
  const [isSpotifyDisconnecting, setIsSpotifyDisconnecting] = useState(false);

  // Redireciona se não estiver autenticado após carregar
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [authStatus, router]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'spotify-connected') {
        toast.success("Spotify conectado com sucesso!");
        fetchProfile();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnectSpotify = () => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(
      '/api/audio/spotify/connect',
      'Spotify Connect',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  const handleDisconnectSpotify = async () => {
    setIsSpotifyDisconnecting(true);
    try {
      const res = await fetch('/api/audio/spotify/disconnect', { method: 'POST' });
      if (res.ok) {
        toast.success("Spotify desconectado.");
        fetchProfile();
      } else {
        toast.error("Falha ao desconectar do Spotify.");
      }
    } catch (err) {
      toast.error("Erro ao desconectar do Spotify.");
    } finally {
      setIsSpotifyDisconnecting(false);
    }
  };

  // Computed: Do we have personal keys that are ENABLED?
  const hasPersonalKeys = useMemo(() => {
    return Object.entries(apiKeys).some(([provider, key]) => 
      key && key !== '' && provider !== 'spotifyAccessToken' && apiEnabled[provider] !== false
    );
  }, [apiKeys, apiEnabled]);

  // Fetch complete profile data
  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchProfile();
    }
  }, [authStatus, impersonatedPlayerId]);

  // Discover models when Oráculo tab is active and we have enabled keys
  useEffect(() => {
    if (activeTab === 'preferences' && hasPersonalKeys && authStatus === 'authenticated') {
      fetchDiscoveredModels();
    }
  }, [activeTab, hasPersonalKeys, impersonatedPlayerId, authStatus]);

  const fetchProfile = async () => {
    setIsInitialLoading(true);
    setLoadError(false);
    try {
      const url = impersonatedPlayerId 
        ? `/api/auth/profile?userId=${impersonatedPlayerId}` 
        : '/api/auth/profile';

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setName(data.name || '');
        setEmail(data.email || '');
        setApiKeys(data.apiKeys || {});
        setApiEnabled(data.apiEnabled || { gemini: true, openai: true, anthropic: true });
        setAiPreferences(data.aiPreferences || {
          textModel: '',
          imageModel: '',
          ttsVoice: 'gemini-audio'
        });
        setMfaEnabled(data.mfaEnabled);
      } else {
        throw new Error('Falha ao ler pergaminhos');
      }
    } catch (err) {
      setLoadError(true);
      toast.error('Erro ao ler pergaminhos do perfil.');
    } finally {
      setIsInitialLoading(false);
    }
  };

  const fetchDiscoveredModels = async () => {
    setIsDiscovering(true);
    try {
      const url = impersonatedPlayerId 
        ? `/api/auth/profile/models?userId=${impersonatedPlayerId}` 
        : '/api/auth/profile/models';

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDiscoveredModels(data);
      }
    } catch (err) {
      console.error('DISCOVERY_FETCH_ERR:', err);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isInitialLoading || loadError) return;

    if (activeTab === 'security' && newPassword) {
      if (newPassword !== confirmPassword) {
        toast.error('As novas senhas não coincidem.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          currentPassword: (newPassword || email !== session?.user?.email) ? currentPassword : undefined,
          newPassword: newPassword || undefined,
          apiKeys,
          apiEnabled,
          aiPreferences,
          targetUserId: impersonatedPlayerId || undefined
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Alterações seladas com sucesso.');
        
        // Se for o próprio admin alterando seus dados sensíveis, desloga
        if (!impersonatedPlayerId && (newPassword || email !== session?.user?.email)) {
          toast.info('Credenciais sensíveis alteradas. Reiniciando portal...');
          setTimeout(() => signOut(), 2000);
        } else if (!impersonatedPlayerId) {
          // Se for o próprio admin alterando dados normais, atualiza a sessão
          await updateSession();
          fetchProfile();
        } else {
          // Se for admin alterando player supervisionado, apenas fecha ou recarrega
          fetchProfile();
        }
      } else {
        toast.error('Erro ao atualizar', { description: data.error });
      }
    } catch (err) {
      toast.error('Erro de conexão com o mestre.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSetup = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mfaAction: 'SETUP',
          targetUserId: impersonatedPlayerId || undefined
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMfaQrCode(data.qrCode);
        setMfaStep('verify');
      }
    } catch (err) {
      toast.error('Falha ao preparar escudo de almas.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaVerify = async (action: 'ENABLE' | 'DISABLE') => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mfaAction: action, 
          mfaToken,
          targetUserId: impersonatedPlayerId || undefined
        }),
      });
      if (res.ok) {
        toast.success(action === 'ENABLE' ? 'Escudo de Almas ativado!' : 'Escudo desativado.');
        setMfaEnabled(action === 'ENABLE');
        setMfaStep('idle');
        setMfaQrCode(null);
        setMfaToken('');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Falha na validação do código.');
      }
    } catch (err) {
      toast.error('Erro de conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleApiProvider = (provider: string) => {
    setApiEnabled(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
    toast.info(`${provider.toUpperCase()} ${!apiEnabled[provider] ? 'ativada' : 'desativada'} temporariamente.`);
  };

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen w-full bg-portal-bg flex items-center justify-center text-zinc-500">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-portal-bg text-portal-text p-6 md:p-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[url('/noise.svg')] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="space-y-4">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-portal-text-muted hover:text-portal-text transition-colors text-[10px] font-black uppercase tracking-widest cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Retornar ao Portal
          </button>
          
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-portal-primary/10 rounded-[24px] border border-portal-primary/20 text-portal-primary shadow-[0_0_20px_var(--portal-primary-glow-weak)]">
                <Fingerprint className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-black uppercase tracking-tighter italic">Câmara do <span className="text-portal-primary">Viajante</span></h1>
                  {impersonatedPlayerId && (
                    <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                      <Eye className="w-2.5 h-2.5" /> Supervisão
                    </span>
                  )}
                </div>
                <p className="text-portal-text-muted font-body italic">
                  {impersonatedPlayerId ? `Observando Essência de: ${name || 'Aventureiro'}` : 'Gerencie sua essência, chaves de poder e conexões com o mundo exterior'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Outer Panel Container */}
        <div className="bg-portal-surface border-2 border-portal-border rounded-[40px] shadow-2xl flex flex-col overflow-hidden">
          
          {/* Tabs Selector */}
          <div className="flex p-2 bg-portal-bg/50 border-b border-portal-border overflow-x-auto custom-scrollbar gap-2">
            {[
              { id: 'identity', label: 'Essência', icon: User },
              { id: 'security', label: 'Escudo', icon: Shield },
              { id: 'apikeys', label: 'Canalização', icon: Zap },
              { id: 'preferences', label: 'Oráculo', icon: Bot },
              { id: 'spotify', label: 'Sinfonia', icon: Music },
            ].map(tab => (
              <button 
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as ProfileTab);
                  setMfaStep('idle');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-portal-surface text-portal-primary border border-portal-border shadow-md shadow-black/20' 
                    : 'text-portal-text-muted hover:text-portal-text hover:bg-portal-surface/30'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-portal-primary' : 'text-portal-text-muted'}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form Content Area */}
          <div className="p-8 md:p-12 min-h-[350px]">
            {isInitialLoading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-4 text-zinc-500">
                <Loader2 className="w-8 h-8 animate-spin text-portal-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest italic text-portal-text-muted">Lendo pergaminhos de registro...</p>
              </div>
            ) : loadError ? (
              <div className="h-64 flex flex-col items-center justify-center gap-4 text-red-500">
                <ShieldAlert className="w-12 h-12" />
                <p className="text-[10px] font-black uppercase tracking-widest italic">O Mestre não conseguiu ler seu registro.</p>
                <button type="button" onClick={fetchProfile} className="flex items-center gap-2 px-4 py-2 bg-portal-bg border border-portal-border rounded-xl text-zinc-400 hover:text-portal-text transition-all cursor-pointer">
                  <RefreshCcw className="w-3 h-3" /> Tentar Novamente
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* TAB: IDENTITY */}
                {activeTab === 'identity' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-portal-text-muted ml-4">Nome de Herói</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-portal-text-muted group-focus-within:text-portal-primary transition-colors" />
                        <input 
                          type="text" 
                          className="w-full bg-portal-bg border-2 border-portal-border rounded-2xl p-4 pl-12 text-sm text-portal-text outline-none focus:border-portal-primary transition-all disabled:opacity-50"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-portal-text-muted ml-4">Pergaminho de E-mail</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-portal-text-muted" />
                        <input 
                          type="email" 
                          disabled
                          className="w-full bg-portal-bg/40 border-2 border-portal-border rounded-2xl p-4 pl-12 text-sm text-portal-text-muted cursor-not-allowed"
                          value={email}
                        />
                      </div>
                      <p className="text-[9px] text-portal-text-muted uppercase font-bold ml-4">O e-mail é a âncora de sua alma e não pode ser alterado diretamente.</p>
                    </div>
                  </div>
                )}

                {/* TAB: SECURITY / MFA */}
                {activeTab === 'security' && (
                  <div className="space-y-8">
                    {/* MFA Configuration Card */}
                    <div className="p-6 bg-portal-bg/50 border border-portal-border rounded-3xl space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-2xl ${mfaEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-portal-surface text-portal-text-muted'}`}>
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest text-portal-text">Escudo de Almas (2FA)</p>
                            <p className="text-[9px] text-portal-text-muted uppercase font-bold">{mfaEnabled ? 'Proteção Ativa' : 'Proteção Desativada'}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => mfaEnabled ? setMfaStep('verify') : handleMfaSetup()}
                          className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${mfaEnabled ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-portal-primary text-portal-primary-foreground hover:scale-105 shadow-md shadow-portal-primary/10'}`}
                        >
                          {mfaEnabled ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>

                      {mfaStep === 'verify' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-4 border-t border-portal-border">
                          {mfaQrCode && (
                            <div className="flex flex-col items-center gap-4 bg-white p-4 rounded-2xl w-fit mx-auto shadow-inner">
                              <img src={mfaQrCode} alt="QR Code MFA" className="w-32 h-32" />
                              <p className="text-[8px] text-zinc-800 font-black uppercase text-center max-w-[120px]">Escaneie com Google Authenticator ou Authy</p>
                            </div>
                          )}
                          <div className="space-y-2 text-center max-w-sm mx-auto">
                            <label className="text-[10px] font-black uppercase tracking-widest text-portal-primary">Insira o Código de 6 Dígitos</label>
                            <input 
                              type="text"
                              maxLength={6}
                              placeholder="000000"
                              className="w-full max-w-[200px] mx-auto block bg-portal-bg border-2 border-portal-primary rounded-xl p-3 text-center text-xl font-mono tracking-[0.3em] text-portal-text outline-none focus:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                              value={mfaToken}
                              onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, ''))}
                            />
                            <div className="flex gap-2 justify-center pt-4">
                              <button 
                                type="button"
                                onClick={() => handleMfaVerify(mfaEnabled ? 'DISABLE' : 'ENABLE')}
                                className="px-5 py-2.5 bg-white text-zinc-950 rounded-xl text-[10px] font-black uppercase hover:bg-portal-primary transition-colors cursor-pointer"
                              >
                                Confirmar Vínculo
                              </button>
                              <button 
                                type="button"
                                onClick={() => setMfaStep('idle')}
                                className="px-5 py-2.5 bg-portal-surface hover:bg-portal-surface-hover text-portal-text rounded-xl text-[10px] font-black uppercase transition-colors cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Change Password Form */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-portal-text-muted ml-4">Nova Senha (Opcional)</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input 
                            type="password" 
                            placeholder="Nova Senha"
                            className="bg-portal-bg border-2 border-portal-border rounded-2xl p-4 text-sm text-portal-text outline-none focus:border-portal-primary transition-all placeholder:text-portal-text-muted"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                          <input 
                            type="password" 
                            placeholder="Confirmar Nova Senha"
                            className="bg-portal-bg border-2 border-portal-border rounded-2xl p-4 text-sm text-portal-text outline-none focus:border-portal-primary transition-all placeholder:text-portal-text-muted"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      {newPassword && !impersonatedPlayerId && (
                        <div className="space-y-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                          <label className="text-[10px] font-black uppercase tracking-widest text-red-400 ml-4">Senha Atual (Para Validar Alteração)</label>
                          <input 
                            type="password" 
                            className="w-full bg-portal-bg border-2 border-red-950/30 rounded-xl p-4 text-sm text-portal-text outline-none focus:border-red-500"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                          />
                        </div>
                      )}
                      
                      {newPassword && impersonatedPlayerId && (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                          <p className="text-[9px] text-amber-200/70 font-bold uppercase leading-relaxed">
                            Como Admin, você está alterando a senha de outro jogador sem precisar da senha atual dele. Use com responsabilidade.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB: API KEYS */}
                {activeTab === 'apikeys' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-portal-primary/5 border border-portal-primary/10 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-portal-primary shrink-0 mt-0.5" />
                      <p className="text-[10px] text-portal-text-muted leading-relaxed uppercase font-bold tracking-wider">
                        Suas chaves são criptografadas localmente. Use o <span className="text-portal-primary">Toggle</span> para ativar/desativar o uso de cada uma sem precisar removê-la.
                      </p>
                    </div>

                    {[
                      { id: 'gemini', label: 'Google Gemini API', icon: Zap },
                      { id: 'openai', label: 'OpenAI API (GPT/DALL-E)', icon: Terminal },
                      { id: 'anthropic', label: 'Anthropic API (Claude)', icon: Bot }
                    ].map(provider => {
                      const hasKey = apiKeys[provider.id] && apiKeys[provider.id] !== '';
                      const isMasked = apiKeys[provider.id]?.includes('...');
                      const isEnabled = apiEnabled[provider.id] !== false;

                      return (
                        <div key={provider.id} className="space-y-2">
                          <div className="flex justify-between items-center ml-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-portal-text-muted">{provider.label}</label>
                            {hasKey && (
                              <button 
                                type="button"
                                onClick={() => toggleApiProvider(provider.id)}
                                className={`flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase transition-all border cursor-pointer ${isEnabled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-portal-bg border-portal-border text-portal-text-muted'}`}
                              >
                                {isEnabled ? <><Power className="w-2.5 h-2.5" /> Canalização Ativa</> : <><PowerOff className="w-2.5 h-2.5" /> Canalização Inativa</>}
                              </button>
                            )}
                          </div>
                          <div className="relative group flex items-center gap-2">
                            <div className={`relative flex-1 transition-opacity ${isEnabled ? 'opacity-100' : 'opacity-40'}`}>
                              <provider.icon className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isEnabled ? 'text-portal-text-muted group-focus-within:text-portal-primary' : 'text-zinc-700'}`} />
                              <input 
                                type="text" 
                                placeholder={isMasked ? "" : "Insira sua chave"}
                                value={apiKeys[provider.id] || ''}
                                disabled={!isEnabled}
                                className="w-full bg-portal-bg border-2 border-portal-border rounded-2xl p-4 pl-12 text-sm text-portal-text outline-none focus:border-portal-primary transition-all font-mono disabled:cursor-not-allowed placeholder:text-portal-text-muted"
                                onChange={(e) => setApiKeys({ ...apiKeys, [provider.id]: e.target.value })}
                              />
                            </div>
                            {hasKey && (
                              <button 
                                type="button"
                                onClick={() => {
                                  setApiKeys({ ...apiKeys, [provider.id]: '' });
                                  toast.info(`${provider.label} preparada para remoção.`);
                                }}
                                className="p-4 bg-red-500/10 border-2 border-red-500/20 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-xl cursor-pointer"
                                title="Remover Chave"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* TAB: PREFERENCES (ORACLE) */}
                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    {!hasPersonalKeys ? (
                      <div className="p-8 bg-portal-bg/40 border border-portal-border rounded-[32px] flex flex-col items-center text-center gap-4">
                        <div className="p-4 bg-portal-bg rounded-full text-portal-text-muted">
                          <ShieldAlert className="w-10 h-10" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-widest text-portal-text">Padrão do Reino Ativo</h4>
                          <p className="text-[10px] text-portal-text-muted uppercase font-bold mt-2 max-w-md leading-relaxed">
                            A customização de oráculos exige que você canalize sua própria fonte de poder. 
                            Cadastre uma chave de API na aba <span className="text-portal-primary">Canalização</span> e garanta que ela esteja <span className="text-emerald-500">Ativa</span>.
                          </p>
                        </div>
                      </div>
                    ) : isDiscovering ? (
                      <div className="h-64 flex flex-col items-center justify-center gap-4 text-zinc-500">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                          <Wand2 className="w-8 h-8 text-portal-primary animate-pulse" />
                        </motion.div>
                        <p className="text-[10px] font-black uppercase tracking-widest italic animate-pulse text-portal-text-muted">Sintonizando com o Plano Astral...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-6">
                        {/* Text Models */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-portal-text-muted ml-4">Modelo do Oráculo (Texto)</label>
                          <div className="relative group">
                            <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-portal-text-muted group-focus-within:text-portal-primary pointer-events-none" />
                            <select 
                              className="w-full bg-portal-bg border-2 border-portal-border rounded-2xl p-4 pl-12 text-sm text-portal-text outline-none focus:border-portal-primary appearance-none cursor-pointer"
                              value={aiPreferences?.textModel || ''}
                              onChange={(e) => setAiPreferences({ ...aiPreferences, textModel: e.target.value })}
                            >
                              <option value="">Padrão do Reino (Usar .env)</option>
                              <optgroup label="Descobertos via sua Chave">
                                {discoveredModels.filter(m => m.type === 'text').length > 0 ? (
                                  discoveredModels.filter(m => m.type === 'text').map(model => (
                                    <option key={model.id} value={model.id}>{model.provider.toUpperCase()}: {model.name}</option>
                                  ))
                                ) : (
                                  <option value="" disabled>Nenhum modelo de texto encontrado</option>
                                )}
                              </optgroup>
                            </select>
                          </div>
                        </div>

                        {/* Image Models */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-portal-text-muted ml-4">Artesão de Imagens (Imagens)</label>
                          <div className="relative group">
                            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-portal-text-muted group-focus-within:text-portal-primary pointer-events-none" />
                            <select 
                              className="w-full bg-portal-bg border-2 border-portal-border rounded-2xl p-4 pl-12 text-sm text-portal-text outline-none focus:border-portal-primary appearance-none cursor-pointer"
                              value={aiPreferences?.imageModel || ''}
                              onChange={(e) => setAiPreferences({ ...aiPreferences, imageModel: e.target.value })}
                            >
                              <option value="">Padrão do Reino (Usar .env)</option>
                              <optgroup label="Descobertos via sua Chave">
                                {discoveredModels.filter(m => m.type === 'image').length > 0 ? (
                                  discoveredModels.filter(m => m.type === 'image').map(model => (
                                    <option key={model.id} value={model.id}>{model.provider.toUpperCase()}: {model.name}</option>
                                  ))
                                ) : (
                                  <option value="" disabled>Nenhum artesão de imagens encontrado</option>
                                )}
                              </optgroup>
                            </select>
                          </div>
                        </div>

                        {/* TTS Models */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-portal-text-muted ml-4">Voz do Destino (TTS)</label>
                          <div className="relative group">
                            <Volume2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-portal-text-muted group-focus-within:text-portal-primary pointer-events-none" />
                            <select 
                              className="w-full bg-portal-bg border-2 border-portal-border rounded-2xl p-4 pl-12 text-sm text-portal-text outline-none focus:border-portal-primary appearance-none cursor-pointer"
                              value={aiPreferences?.ttsVoice || ''}
                              onChange={(e) => setAiPreferences({ ...aiPreferences, ttsVoice: e.target.value })}
                            >
                              <option value="gemini-audio">Padrão do Sistema (Gemini)</option>
                              {discoveredModels.filter(m => m.type === 'audio').map(model => (
                                <option key={model.id} value={model.id === 'tts-1' ? 'openai-alloy' : model.id}>{model.provider.toUpperCase()}: {model.name}</option>
                              ))}
                              {apiKeys.openai && apiEnabled.openai !== false && (
                                <optgroup label="Vozes OpenAI">
                                  <option value="openai-alloy">Alloy (Versátil)</option>
                                  <option value="openai-onyx">Onyx (Épica)</option>
                                  <option value="openai-shimmer">Shimmer (Suave)</option>
                                </optgroup>
                              )}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: SPOTIFY (SINFONIA) */}
                {activeTab === 'spotify' && (
                  <div className="space-y-6">
                    {/* Spotify Connection Panel */}
                    <div className="p-8 bg-portal-bg/50 border-2 border-portal-border rounded-[32px] space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className={`p-3.5 rounded-2xl ${apiKeys.spotifyAccessToken ? 'bg-[#1DB954]/10 text-[#1DB954]' : 'bg-portal-surface text-portal-text-muted'}`}>
                            <Music className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-portal-text">Sinfonia Adaptativa (Spotify)</h3>
                            <p className="text-[10px] text-portal-text-muted uppercase font-bold mt-1">
                              Status: {apiKeys.spotifyAccessToken ? <span className="text-[#1DB954]">Conectado (Premium)</span> : <span className="text-zinc-500">Não conectado</span>}
                            </p>
                          </div>
                        </div>
                        {apiKeys.spotifyAccessToken ? (
                          <button
                            type="button"
                            onClick={handleDisconnectSpotify}
                            disabled={isSpotifyDisconnecting}
                            className="px-6 py-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {isSpotifyDisconnecting ? 'Desconectando...' : 'Desconectar'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleConnectSpotify}
                            className="px-6 py-4 bg-[#1DB954] text-black hover:scale-105 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all font-bold shadow-lg shadow-[#1db954]/10 cursor-pointer"
                          >
                            Conectar Spotify
                          </button>
                        )}
                      </div>
                      
                      <p className="text-[10px] text-portal-text-muted uppercase font-bold leading-relaxed border-t border-portal-border/50 pt-4">
                        Conecte sua conta do Spotify Premium para liberar a Sinfonia Adaptativa. A trilha sonora e os efeitos sonoros se ajustarão dinamicamente em tempo real de acordo com as circunstâncias e gênero de sua narrativa.
                      </p>
                    </div>

                    {/* Future configuration space placeholder */}
                    <div className="p-6 bg-portal-bg/20 border border-dashed border-portal-border rounded-3xl flex items-start gap-4">
                      <Sparkles className="w-5 h-5 text-portal-primary shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-portal-text">Sinfonia Customizada (Em Breve)</h4>
                        <p className="text-[9px] text-portal-text-muted uppercase font-bold leading-normal">
                          Futuramente nesta câmara você poderá vincular suas próprias playlists para cada atmosfera de jogo (Exploração, Tensão, Combate Épico, Taberna, etc.), permitindo controle absoluto sobre a identidade auditiva da sua aventura.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit button bar */}
                {activeTab !== 'spotify' && (
                  <div className="pt-8 border-t border-portal-border/50 flex justify-end">
                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full md:w-auto flex items-center justify-center gap-3 bg-white text-zinc-950 px-10 py-4.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-portal-primary hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale shadow-xl cursor-pointer"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldCheck className="w-4 h-4" /> Selar Alterações</>}
                    </button>
                  </div>
                )}

              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
