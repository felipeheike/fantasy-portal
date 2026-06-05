'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  X, 
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
  PowerOff
} from 'lucide-react';
import { toast } from 'sonner';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ProfileTab = 'identity' | 'security' | 'apikeys' | 'preferences';

interface DiscoveredModel {
  id: string;
  name: string;
  provider: 'google' | 'openai' | 'anthropic';
  type: 'text' | 'image' | 'audio';
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { data: session, update: updateSession } = useSession();
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

  // Computed: Do we have personal keys that are ENABLED?
  const hasPersonalKeys = useMemo(() => {
    return Object.entries(apiKeys).some(([provider, key]) => 
      key && key !== '' && apiEnabled[provider] !== false
    );
  }, [apiKeys, apiEnabled]);

  // Fetch complete profile data
  useEffect(() => {
    if (isOpen && !impersonatedPlayerId) {
      fetchProfile();
    }
  }, [isOpen, impersonatedPlayerId]);

  // Discover models when Oráculo tab is active and we have enabled keys
  useEffect(() => {
    if (activeTab === 'preferences' && hasPersonalKeys) {
      fetchDiscoveredModels();
    }
  }, [activeTab, hasPersonalKeys]);

  const fetchProfile = async () => {
    setIsInitialLoading(true);
    setLoadError(false);
    try {
      const res = await fetch('/api/auth/profile');
      if (res.ok) {
        const data = await res.json();
        setName(data.name || '');
        setEmail(data.email || '');
        setApiKeys(data.apiKeys || {});
        setApiEnabled(data.apiEnabled || { gemini: true, openai: true, anthropic: true });
        setAiPreferences(data.aiPreferences || {
          textModel: 'gemini-1.5-flash',
          imageModel: 'imagen-3.0-fast-generate-001',
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
      const res = await fetch('/api/auth/profile/models');
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
    if (impersonatedPlayerId || isInitialLoading || loadError) return;

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
          aiPreferences
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Alterações seladas com sucesso.');
        if (newPassword || email !== session?.user?.email) {
          toast.info('Credenciais sensíveis alteradas. Reiniciando portal...');
          setTimeout(() => signOut(), 2000);
        } else {
          await updateSession();
          if (activeTab === 'identity') onClose();
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
        body: JSON.stringify({ mfaAction: 'SETUP' }),
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
        body: JSON.stringify({ mfaAction: action, mfaToken }),
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150]"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-[40px] shadow-2xl z-[160] flex flex-col overflow-hidden max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
                    <Fingerprint className="w-6 h-6" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white italic">Câmara do <span className="text-primary">Viajante</span></h2>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Gerencie sua Essência e Poderes de IA</p>
                 </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-zinc-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-4 border-b border-zinc-800 bg-zinc-950 overflow-x-auto custom-scrollbar">
               {[
                 { id: 'identity', label: 'Essência', icon: User },
                 { id: 'security', label: 'Escudo', icon: Shield },
                 { id: 'apikeys', label: 'Canalização', icon: Zap },
                 { id: 'preferences', label: 'Oráculo', icon: Bot },
               ].map(tab => (
                 <button 
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as ProfileTab)}
                   className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'text-primary' : 'text-zinc-600 hover:text-zinc-400'}`}
                 >
                   <tab.icon className="w-3.5 h-3.5" />
                   {tab.label}
                   {activeTab === tab.id && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
                 </button>
               ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              {isInitialLoading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4 text-zinc-500">
                   <Loader2 className="w-8 h-8 animate-spin text-primary" />
                   <p className="text-[10px] font-black uppercase tracking-widest italic">Lendo pergaminhos de registro...</p>
                </div>
              ) : loadError ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4 text-red-500">
                   <ShieldAlert className="w-12 h-12" />
                   <p className="text-[10px] font-black uppercase tracking-widest italic">O Mestre não conseguiu ler seu registro.</p>
                   <button onClick={fetchProfile} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all">
                      <RefreshCcw className="w-3 h-3" /> Tentar Novamente
                   </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* TAB: IDENTITY */}
                  {activeTab === 'identity' && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Nome de Herói</label>
                         <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
                            <input 
                              type="text" 
                              className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 pl-12 text-sm text-zinc-100 outline-none focus:border-primary transition-all disabled:opacity-50"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              disabled={!!impersonatedPlayerId}
                            />
                         </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: SECURITY / MFA */}
                  {activeTab === 'security' && (
                    <div className="space-y-10">
                      <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-6">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className={`p-2 rounded-xl ${mfaEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}>
                                  <Smartphone className="w-5 h-5" />
                               </div>
                               <div>
                                  <p className="text-xs font-black uppercase tracking-widest text-white">Escudo de Almas (2FA)</p>
                                  <p className="text-[9px] text-zinc-500 uppercase font-bold">{mfaEnabled ? 'Proteção Ativa' : 'Proteção Desativada'}</p>
                               </div>
                            </div>
                            <button
                              onClick={() => mfaEnabled ? setMfaStep('verify') : handleMfaSetup()}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mfaEnabled ? 'bg-red-500/10 text-red-500 hover:bg-red-500' : 'bg-primary text-zinc-950 hover:scale-105'}`}
                            >
                               {mfaEnabled ? 'Desativar' : 'Ativar'}
                            </button>
                         </div>

                         {mfaStep === 'verify' && (
                           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-4 border-t border-zinc-800">
                              {mfaQrCode && (
                                <div className="flex flex-col items-center gap-4 bg-white p-4 rounded-2xl w-fit mx-auto">
                                   <img src={mfaQrCode} alt="QR Code MFA" className="w-32 h-32" />
                                   <p className="text-[8px] text-black font-black uppercase text-center max-w-[120px]">Escaneie com Google Authenticator ou Authy</p>
                                </div>
                              )}
                              <div className="space-y-2 text-center">
                                 <label className="text-[10px] font-black uppercase tracking-widest text-primary">Insira o Código de 6 Dígitos</label>
                                 <input 
                                   type="text"
                                   maxLength={6}
                                   placeholder="000 000"
                                   className="w-full max-w-[200px] mx-auto block bg-zinc-950 border-2 border-primary rounded-xl p-3 text-center text-xl font-mono tracking-[0.5em] text-white outline-none"
                                   value={mfaToken}
                                   onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, ''))}
                                 />
                                 <div className="flex gap-2 justify-center pt-2">
                                    <button 
                                      onClick={() => handleMfaVerify(mfaEnabled ? 'DISABLE' : 'ENABLE')}
                                      className="px-6 py-2 bg-white text-zinc-950 rounded-lg text-[10px] font-black uppercase"
                                    >
                                      Confirmar Vínculo
                                    </button>
                                    <button 
                                      onClick={() => setMfaStep('idle')}
                                      className="px-6 py-2 bg-zinc-800 text-zinc-400 rounded-lg text-[10px] font-black uppercase"
                                    >
                                      Cancelar
                                    </button>
                                 </div>
                              </div>
                           </motion.div>
                         )}
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Nova Senha (Opcional)</label>
                           <div className="grid grid-cols-2 gap-4">
                              <input 
                                type="password" 
                                placeholder="Nova Senha"
                                className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 text-sm text-zinc-100 outline-none focus:border-primary transition-all"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                              />
                              <input 
                                type="password" 
                                placeholder="Confirmar"
                                className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 text-sm text-zinc-100 outline-none focus:border-primary transition-all"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                              />
                           </div>
                        </div>
                        {newPassword && (
                          <div className="space-y-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                             <label className="text-[10px] font-black uppercase tracking-widest text-red-400 ml-4">Senha Atual (Para Validar Alteração)</label>
                             <input 
                               type="password" 
                               className="w-full bg-zinc-950 border-2 border-red-900/30 rounded-xl p-4 text-sm text-white outline-none focus:border-red-500"
                               value={currentPassword}
                               onChange={(e) => setCurrentPassword(e.target.value)}
                               required
                             />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB: API KEYS */}
                  {activeTab === 'apikeys' && (
                    <div className="space-y-6">
                       <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-3">
                          <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-blue-300/80 leading-relaxed uppercase font-bold tracking-wider">
                             Suas chaves são criptografadas. Use o <span className="text-primary">Toggle</span> para ativar/desativar o uso de cada uma sem precisar deletá-la.
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
                                 <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{provider.label}</label>
                                 {hasKey && (
                                   <button 
                                     onClick={() => toggleApiProvider(provider.id)}
                                     className={`flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase transition-all border ${isEnabled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}
                                   >
                                      {isEnabled ? <><Power className="w-2.5 h-2.5" /> Canalização Ativa</> : <><PowerOff className="w-2.5 h-2.5" /> Canalização Inativa</>}
                                   </button>
                                 )}
                              </div>
                              <div className="relative group flex items-center gap-2">
                                 <div className={`relative flex-1 transition-opacity ${isEnabled ? 'opacity-100' : 'opacity-40'}`}>
                                    <provider.icon className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isEnabled ? 'text-zinc-600 group-focus-within:text-primary' : 'text-zinc-700'}`} />
                                    <input 
                                      type="text" 
                                      placeholder={isMasked ? "" : "Insira sua chave"}
                                      value={apiKeys[provider.id] || ''}
                                      disabled={!isEnabled}
                                      className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 pl-12 text-sm text-zinc-100 outline-none focus:border-primary transition-all font-mono disabled:cursor-not-allowed"
                                      onChange={(e) => setApiKeys({ ...apiKeys, [provider.id]: e.target.value })}
                                    />
                                 </div>
                                 {hasKey && (
                                   <button 
                                     onClick={() => {
                                       setApiKeys({ ...apiKeys, [provider.id]: '' });
                                       toast.info(`${provider.label} preparada para remoção.`);
                                     }}
                                     className="p-4 bg-red-500/10 border-2 border-red-500/20 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-xl"
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

                  {/* TAB: PREFERENCES */}
                  {activeTab === 'preferences' && (
                    <div className="space-y-6">
                       {!hasPersonalKeys ? (
                         <div className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-[32px] flex flex-col items-center text-center gap-4">
                            <div className="p-4 bg-zinc-800 rounded-full text-zinc-600">
                               <ShieldAlert className="w-10 h-10" />
                            </div>
                            <div>
                               <h4 className="text-sm font-black uppercase tracking-widest text-zinc-400">Padrão do Reino Ativo</h4>
                               <p className="text-[10px] text-zinc-600 uppercase font-bold mt-1 max-w-sm">
                                  A customização de oráculos exige que você canalize sua própria fonte de poder. 
                                  Cadastre uma chave de API e garanta que ela esteja <span className="text-emerald-500">Ativa</span>.
                               </p>
                            </div>
                         </div>
                       ) : isDiscovering ? (
                         <div className="h-64 flex flex-col items-center justify-center gap-4 text-zinc-500">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                               <Wand2 className="w-8 h-8 text-primary" />
                            </motion.div>
                            <p className="text-[10px] font-black uppercase tracking-widest italic animate-pulse">Sintonizando com o Plano Astral...</p>
                         </div>
                       ) : (
                         <div className="grid grid-cols-1 gap-6">
                            {/* Text Models */}
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Modelo do Oráculo (Texto)</label>
                               <div className="relative group">
                                  <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary pointer-events-none" />
                                  <select 
                                    className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 pl-12 text-sm text-zinc-100 outline-none focus:border-primary appearance-none cursor-pointer"
                                    value={aiPreferences?.textModel || ''}
                                    onChange={(e) => setAiPreferences({ ...aiPreferences, textModel: e.target.value })}
                                  >
                                     <optgroup label="Descobertos via sua Chave">
                                        {discoveredModels.filter(m => m.type === 'text').length > 0 ? (
                                          discoveredModels.filter(m => m.type === 'text').map(model => (
                                            <option key={model.id} value={model.id}>{model.provider.toUpperCase()}: {model.name}</option>
                                          ))
                                        ) : (
                                          <option value="">Nenhum modelo de texto encontrado</option>
                                        )}
                                     </optgroup>
                                  </select>
                               </div>
                            </div>

                            {/* Image Models */}
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Artesão de Imagens</label>
                               <div className="relative group">
                                  <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary pointer-events-none" />
                                  <select 
                                    className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 pl-12 text-sm text-zinc-100 outline-none focus:border-primary appearance-none cursor-pointer"
                                    value={aiPreferences?.imageModel || ''}
                                    onChange={(e) => setAiPreferences({ ...aiPreferences, imageModel: e.target.value })}
                                  >
                                     <optgroup label="Descobertos via sua Chave">
                                        {discoveredModels.filter(m => m.type === 'image').length > 0 ? (
                                          discoveredModels.filter(m => m.type === 'image').map(model => (
                                            <option key={model.id} value={model.id}>{model.provider.toUpperCase()}: {model.name}</option>
                                          ))
                                        ) : (
                                          <option value="">Nenhum artesão de imagens encontrado</option>
                                        )}
                                     </optgroup>
                                  </select>
                               </div>
                            </div>

                            {/* TTS Models */}
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Voz do Destino (TTS)</label>
                               <div className="relative group">
                                  <Volume2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary pointer-events-none" />
                                  <select 
                                    className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 pl-12 text-sm text-zinc-100 outline-none focus:border-primary appearance-none cursor-pointer"
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
                </div>
              )}
            </div>

            {/* Actions */}
            {!impersonatedPlayerId && !isInitialLoading && !loadError && (
              <div className="p-8 bg-zinc-900/30 border-t border-zinc-800">
                 <button 
                   onClick={() => handleSubmit()}
                   disabled={isLoading}
                   className="w-full flex items-center justify-center gap-3 bg-white text-zinc-950 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-primary transition-all disabled:opacity-50 disabled:grayscale"
                 >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Selar Alterações</>}
                 </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
