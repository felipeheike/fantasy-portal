'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, User, UserPlus, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        setIsSuccess(true);
        toast.success('Solicitação Enviada!', { description: 'Aguarde a aprovação do mestre.' });
      } else {
        const data = await res.json();
        toast.error('Erro no Cadastro', { description: data.error || 'Não foi possível solicitar acesso.' });
      }
    } catch (err) {
      toast.error('Erro de conexão com o portal.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen w-full bg-portal-bg flex items-center justify-center p-6 relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-portal-surface/50 border border-portal-border p-10 rounded-[40px] backdrop-blur-xl text-center space-y-6"
        >
          <div className="flex justify-center">
            <div className="p-4 bg-green-500/10 rounded-full border border-green-500/20">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-portal-text uppercase italic">Inscrição Concluída</h2>
          <p className="text-zinc-400 font-body italic leading-relaxed">
            Sua alma foi registrada no pergaminho de espera. <br/>
            O mestre analisará sua solicitação em breve.
          </p>
          <button 
            onClick={() => router.push('/login')}
            className="w-full py-4 bg-portal-surface-hover text-zinc-300 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-700 transition-all"
          >
            Voltar ao Início
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-portal-bg flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 bg-[url('/noise.svg')] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-portal-surface/50 border border-portal-border p-10 rounded-[40px] backdrop-blur-xl shadow-2xl relative z-10"
      >
        <div className="text-center space-y-4 mb-10">
          <h1 className="text-3xl font-black tracking-tighter italic text-portal-text uppercase">Solicitar <span className="text-primary">Acesso</span></h1>
          <p className="text-zinc-500 font-body italic text-sm tracking-widest">A lenda aguarda sua assinatura</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Seu nome de herói"
                className="w-full bg-portal-surface border-2 border-portal-border rounded-2xl p-4 pl-12 text-portal-text placeholder:text-zinc-600 focus:border-primary outline-none transition-all font-bold"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
              <input 
                type="email" 
                placeholder="Seu email"
                className="w-full bg-portal-surface border-2 border-portal-border rounded-2xl p-4 pl-12 text-portal-text placeholder:text-zinc-600 focus:border-primary outline-none transition-all font-bold"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Sua senha secreta"
                className="w-full bg-portal-surface border-2 border-portal-border rounded-2xl p-4 pl-12 pr-12 text-portal-text placeholder:text-zinc-600 focus:border-primary outline-none transition-all font-bold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-primary transition-colors"
                title={showPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-portal-primary text-portal-primary-foreground px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_0_30px_var(--portal-primary-glow-medium)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-5 h-5" /> Criar Registro</>}
          </button>
        </form>

        <button 
          onClick={() => router.push('/login')}
          className="mt-6 w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-xs font-black uppercase tracking-widest"
        >
          <ArrowLeft className="w-3 h-3" /> Já possuo conta
        </button>
      </motion.div>
    </div>
  );
}
