'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mail, Lock, LogIn, ArrowRight, AlertCircle, Loader2, Eye, EyeOff, ShieldAlert, Smartphone, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Verificar saúde do banco ao carregar
    fetch('/api/health')
      .then(r => r.json())
      .then(data => {
        if (!data.ok) {
          setDbError(data.error);
        }
      })
      .catch(() => setDbError("Erro de conexão com o Portal"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || dbError) return;

    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        mfaToken,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === 'MFA_REQUIRED') {
          setRequiresMfa(true);
          toast.info('Escudo de Almas detectado. Insira seu código de 6 dígitos.');
        } else {
          toast.error('Erro de Acesso', { description: result.error });
        }
      } else {
        toast.success('Bem-vindo de volta, Aventureiro!');
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      toast.error('Erro inesperado no portal.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-portal-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-20 bg-[url('/noise.svg')] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <AnimatePresence>
        {dbError && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-6"
          >
             <div className="bg-red-950/80 border border-red-500/50 p-6 rounded-3xl backdrop-blur-xl flex items-center gap-4 text-red-200 shadow-2xl">
                <ShieldAlert className="w-8 h-8 shrink-0 text-red-500" />
                <div>
                   <h3 className="font-black uppercase tracking-widest text-xs mb-1">Masmorra Inacessível</h3>
                   <p className="text-xs opacity-80">
                     O banco de dados não está pronto ou as migrações não foram aplicadas. 
                     Peça ao Mestre para executar <code className="bg-black/40 px-1 rounded">prisma migrate deploy</code>.
                   </p>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-portal-surface/50 border border-portal-border p-10 rounded-[40px] backdrop-blur-xl shadow-2xl relative z-10"
      >
        <div className="text-center space-y-4 mb-10">
          <div className="inline-block p-4 bg-primary/10 rounded-[32px] border border-primary/20 mb-4 shadow-[0_0_50px_var(--portal-primary-glow-subtle)]">
             <Sparkles className="w-10 h-10 text-primary fill-primary/20" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter italic text-portal-text uppercase">
           Fantasy <span className="text-primary">Portal</span>
          </h1>

          <p className="text-zinc-500 font-body italic text-sm tracking-widest uppercase">
            {requiresMfa ? 'Escudo de Almas' : 'Identifique-se para cruzar o portal'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {!requiresMfa ? (
              <motion.div 
                key="login-fields"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="email" 
                    placeholder="Seu email de aventureiro"
                    className="w-full bg-portal-surface border-2 border-portal-border rounded-2xl p-4 pl-12 text-portal-text placeholder:text-zinc-600 focus:border-primary outline-none transition-all font-bold"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-primary transition-colors" />
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
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="mfa-field"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl mb-4 text-center">
                   <p className="text-[10px] text-primary font-black uppercase tracking-widest leading-relaxed">
                     Um escudo sagrado protege esta conta. Insira o código do seu oráculo de segurança (Authenticator).
                   </p>
                </div>
                <div className="relative group">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary transition-colors" />
                  <input 
                    type="text" 
                    maxLength={6}
                    placeholder="000 000"
                    className="w-full bg-portal-bg border-2 border-primary rounded-2xl p-5 pl-12 text-center text-2xl font-mono tracking-[0.5em] text-portal-text outline-none shadow-[0_0_20px_var(--portal-primary-glow-subtle)]"
                    value={mfaToken}
                    onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                    required
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => { setRequiresMfa(false); setMfaToken(''); }}
                  className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-[10px] font-black uppercase tracking-widest mx-auto"
                >
                  <ArrowLeft className="w-3 h-3" /> Voltar para Senha
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-portal-primary text-portal-primary-foreground px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_0_30px_var(--portal-primary-glow-medium)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <> <LogIn className="w-5 h-5" /> {requiresMfa ? 'Validar Escudo' : 'Entrar no Reino'} </>
            )}
          </button>
        </form>

        {!requiresMfa && (
          <div className="mt-8 pt-8 border-t border-portal-border text-center">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Novo por aqui?</p>
            <button 
              onClick={() => router.push('/register')}
              className="text-primary hover:text-portal-text transition-colors text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 mx-auto"
            >
              Solicitar Acesso <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </motion.div>
      
      {/* Footer Lore */}
      <p className="absolute bottom-10 text-[10px] text-zinc-700 font-black uppercase tracking-[0.5em] pointer-events-none">
        {requiresMfa ? 'A prova final de sua identidade' : 'Apenas as almas aprovadas pelo mestre podem prosseguir'}
      </p>
    </div>
  );
}
