'use client';

import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  ShieldAlert, 
  Loader2, 
  CheckCircle2,
  Sparkles,
  LogOut,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

export default function ForcePasswordChangeModal() {
  const { data: session } = useSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);

  // If the flag is not set, we don't show anything
  if (!(session?.user as any)?.forcePasswordChange) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos.');
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

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentPassword,
          newPassword
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Senha atualizada com sucesso! Reiniciando sessão...');
        setTimeout(() => signOut(), 2000);
      } else {
        toast.error('Erro ao atualizar', { description: data.error });
      }
    } catch (err) {
      toast.error('Erro de conexão com o portal.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[999] flex items-center justify-center p-6">
      <div className="absolute inset-0 opacity-20 bg-[url('/noise.svg')] pointer-events-none" />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-zinc-900 border-2 border-primary/30 rounded-[40px] shadow-[0_0_100px_rgba(245,158,11,0.1)] overflow-hidden relative z-10"
      >
        {/* Header */}
        <div className="p-10 border-b border-zinc-800 text-center space-y-4 bg-zinc-900/50">
          <div className="inline-block p-4 bg-primary/10 rounded-3xl border border-primary/20 text-primary mb-2">
             <ShieldAlert className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white italic">Troca de Senha <span className="text-primary">Obrigatória</span></h2>
          <p className="text-zinc-500 font-serif italic text-sm">Sua conta foi resetada pelo mestre. Por segurança, você deve definir uma nova senha secreta antes de prosseguir.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <div className="space-y-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Senha Temporária (Recebida do Mestre)</label>
                <div className="relative group">
                  <input 
                    type={showCurrentPassword ? "text" : "password"} 
                    className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl p-4 pr-12 text-sm text-zinc-100 outline-none focus:border-primary transition-all"
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

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Nova Senha</label>
                   <div className="relative group">
                      <input 
                        type={showNewPassword ? "text" : "password"} 
                        className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl p-4 pr-10 text-sm text-zinc-100 outline-none focus:border-primary transition-all"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
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
                     className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl p-4 text-sm text-zinc-100 outline-none focus:border-primary transition-all"
                     value={confirmPassword}
                     onChange={(e) => setConfirmPassword(e.target.value)}
                     required
                   />
                </div>
             </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-primary text-zinc-950 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
             {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Lock className="w-5 h-5" /> Definir Nova Identidade</>}
          </button>

          <button 
            type="button"
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 text-zinc-600 hover:text-red-500 transition-colors text-[10px] font-black uppercase tracking-widest"
          >
             <LogOut className="w-3 h-3" /> Sair da Conta
          </button>
        </form>

        {/* Footer */}
        <div className="px-10 py-6 bg-zinc-950 border-t border-zinc-800 flex items-center gap-4">
           <div className="p-2 bg-zinc-900 rounded-lg">
              <Sparkles className="w-4 h-4 text-zinc-500" />
           </div>
           <p className="text-[9px] text-zinc-500 font-serif italic uppercase tracking-wider">
              "O segredo é a armadura da alma. Não a compartilhe com ninguém."
           </p>
        </div>
      </motion.div>
    </div>
  );
}
