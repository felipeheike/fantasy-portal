'use client';

import { useState, useEffect } from 'react';
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
  CheckCircle2,
  Fingerprint,
  RefreshCcw,
  Sparkles,
  ShieldAlert,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { data: session, update: updateSession } = useSession();
  const { impersonatedPlayerId, impersonatedPlayerName } = useGameStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'identity' | 'security'>('identity');

  // Sync state with session or impersonation when modal opens
  useEffect(() => {
    if (isOpen) {
      if (impersonatedPlayerId) {
        setName(impersonatedPlayerName || 'Aventureiro Supervisionado');
        setEmail('E-mail oculto em supervisão');
      } else {
        setName(session?.user?.name || '');
        setEmail(session?.user?.email || '');
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
    }
  }, [isOpen, impersonatedPlayerId, impersonatedPlayerName, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (impersonatedPlayerId) return; // Block submission in supervision mode

    if (activeTab === 'security') {
      if (!currentPassword) {
        toast.error('Senha atual obrigatória.');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('As novas senhas não coincidem.');
        return;
      }
      if (newPassword.length < 6) {
        toast.error('A nova senha deve ter pelo menos 6 caracteres.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          currentPassword: activeTab === 'security' || (email !== session?.user?.email && !impersonatedPlayerId) ? currentPassword : undefined,
          newPassword: activeTab === 'security' ? newPassword : undefined
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        
        if (data.requiresLogout) {
          toast.info('Credenciais sensíveis alteradas. Reiniciando portal...');
          setTimeout(() => signOut(), 2000);
        } else {
          await updateSession();
          onClose();
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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-[40px] shadow-2xl z-[160] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
                    <Fingerprint className="w-6 h-6" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white italic">Sua <span className="text-primary">Alma</span></h2>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Identidade e Segurança no Portal</p>
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
            <div className="flex px-8 border-b border-zinc-800 bg-zinc-950">
               <button 
                 onClick={() => setActiveTab('identity')}
                 className={`px-6 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'identity' ? 'text-primary' : 'text-zinc-600 hover:text-zinc-400'}`}
               >
                 Identidade
                 {activeTab === 'identity' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
               </button>
               {!impersonatedPlayerId && (
                 <button 
                   onClick={() => setActiveTab('security')}
                   className={`px-6 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'security' ? 'text-primary' : 'text-zinc-600 hover:text-zinc-400'}`}
                 >
                   Segurança
                   {activeTab === 'security' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
                 </button>
               )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="space-y-6">
                {activeTab === 'identity' ? (
                  <>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Nome de Herói</label>
                       <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
                          <input 
                            type="text" 
                            className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 pl-12 text-sm text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-primary transition-all disabled:opacity-50"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={!!impersonatedPlayerId}
                            required
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Email de Acesso</label>
                       <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
                          <input 
                            type="email" 
                            className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 pl-12 text-sm text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-primary transition-all disabled:opacity-50"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={!!impersonatedPlayerId}
                            required
                          />
                       </div>
                       {email !== session?.user?.email && !impersonatedPlayerId && (
                         <p className="text-[9px] text-orange-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-1">
                           <AlertCircle className="w-3 h-3" /> Alterar e-mail exigirá confirmação de senha e novo login.
                         </p>
                       )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Senha Atual</label>
                       <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-red-500 transition-colors" />
                          <input 
                            type={showCurrentPassword ? "text" : "password"} 
                            placeholder="••••••••"
                            className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 pl-12 pr-12 text-sm text-zinc-100 outline-none focus:border-red-500 transition-all"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-primary transition-colors"
                          >
                            {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Nova Senha</label>
                          <div className="relative group">
                            <input 
                              type={showNewPassword ? "text" : "password"} 
                              className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 pr-10 text-sm text-zinc-100 outline-none focus:border-primary transition-all"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-primary transition-colors"
                            >
                              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Confirmar</label>
                          <input 
                            type={showNewPassword ? "text" : "password"} 
                            className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 text-sm text-zinc-100 outline-none focus:border-primary transition-all"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                       </div>
                    </div>
                  </>
                )}

                {/* If identity changing email, show password field too */}
                {activeTab === 'identity' && email !== session?.user?.email && !impersonatedPlayerId && (
                  <div className="space-y-2 pt-4 border-t border-zinc-900">
                    <label className="text-[10px] font-black uppercase tracking-widest text-orange-500 ml-4 italic">Confirme sua senha para validar o novo email</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
                        <input 
                          type={showCurrentPassword ? "text" : "password"} 
                          placeholder="Sua senha atual"
                          className="w-full bg-zinc-900 border-2 border-orange-900/30 rounded-2xl p-4 pl-12 pr-12 text-sm text-zinc-100 outline-none focus:border-orange-500 transition-all"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-primary transition-colors"
                        >
                          {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                  </div>
                )}
              </div>

              {!impersonatedPlayerId && (
                <div className="pt-4">
                   <button 
                     type="submit"
                     disabled={isLoading}
                     className="w-full flex items-center justify-center gap-3 bg-white text-zinc-950 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-primary transition-all disabled:opacity-50 disabled:grayscale"
                   >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Selar Alterações</>}
                   </button>
                </div>
              )}

              {impersonatedPlayerId && (
                <div className="pt-4 p-6 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                   <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest text-center flex items-center justify-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> Visualização restrita ao mestre
                   </p>
                </div>
              )}
            </form>

            {/* Footer Lore */}
            <div className="px-10 py-6 bg-zinc-900/50 border-t border-zinc-800 flex items-center gap-4">
               <div className="p-2 bg-zinc-800 rounded-lg">
                  <Sparkles className="w-4 h-4 text-zinc-500" />
               </div>
               <p className="text-[10px] text-zinc-500 font-serif italic leading-relaxed">
                  "Mudar sua face exige coragem, mas mudar sua essência exige o fogo da verdade." <br/>
                  <span className="text-zinc-600">— Ecos do Vazio</span>
               </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
