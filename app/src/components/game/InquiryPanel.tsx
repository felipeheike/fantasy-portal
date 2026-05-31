'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  X, 
  Send, 
  Sparkles, 
  MessageSquare, 
  Eye,
  Loader2,
  Info,
  Droplets,
  FlaskConical,
  Zap,
  AlertCircle,
  RefreshCcw
} from 'lucide-react';
import { toast } from 'sonner';

interface InquiryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InquiryPanel({ isOpen, onClose }: InquiryPanelProps) {
  const { 
    status, 
    inventory,
    currentScene, 
    history, 
    useInsightPoint, 
    restoreInsightWithPotion, 
    restoreInsightWithSacrifice,
    addNotification 
  } = useGameStore();

  const [question, setQuestion] = useState('');
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);

  const wisdomItems = inventory.filter(i => 
    i.type === 'consumable' && 
    (i.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('sabedoria') || 
     i.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('visao') ||
     i.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('elixir'))
  );

  const handleSubmit = async (e?: React.FormEvent, retryText?: string) => {
    e?.preventDefault();
    const currentQ = retryText || question;
    if (!currentQ || status.insightPoints <= 0) return;

    setIsLoading(true);
    setAnswer(null);
    setLastQuestion(null);
    setInquiryError(null);

    try {
      const res = await fetch('/api/chat/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQ, currentScene, history }),
      });

      const data = await res.json();

      if (res.ok) {
        setAnswer(data.answer);
        setLastQuestion(currentQ);
        useInsightPoint();
        addNotification({
          type: 'info',
          title: '🔍 Questionamento Realizado',
          description: 'Um Ponto de Visão foi consumido para esclarecer seu caminho.'
        });
        setQuestion('');
      } else {
        if (data.error === 'LIMITE_COTA') {
          setInquiryError('LIMITE_COTA');
        } else {
          toast.error(data.error || 'O mestre se recusa a responder agora.');
        }
      }
    } catch (err) {
      toast.error('Erro de conexão com o mestre.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSacrifice = () => {
    if (status.hp < 5) {
      toast.error("Sua vitalidade está baixa demais para este sacrifício.");
      return;
    }

    if (confirm("Você deseja sacrificar -4 HP em troca de um vislumbre do destino?")) {
      const success = restoreInsightWithSacrifice();
      if (success) {
        toast.error("Sacrifício Realizado", {
          description: "O sangue foi derramado. Sua visão se expande brevemente. [-4 HP]",
          icon: <Droplets className="w-4 h-4 text-red-500" />
        });
        addNotification({
          type: 'status',
          title: '🩸 Sacrifício de Sangue',
          description: 'Você trocou parte de sua vida por um Ponto de Visão.'
        });
      }
    }
  };

  const handlePotion = (potionId: string, potionName: string) => {
    const success = restoreInsightWithPotion(potionId);
    if (success) {
      toast.success("Mente Expandida", {
        description: `Você consumiu ${potionName}. [+2 Pontos de Visão]`,
        icon: <Sparkles className="w-4 h-4 text-primary" />
      });
      addNotification({
        type: 'item',
        title: '🧪 Poção Consumida',
        description: `O ${potionName} restaurou suas cargas de visão.`
      });
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
            className="fixed inset-0 bg-black/60 z-[140]"
          />

          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-full max-w-md bg-zinc-950 border-r border-zinc-800 shadow-2xl z-[150] flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary animate-pulse">
                    <Eye className="w-6 h-6" />
                 </div>
                 <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter text-white">Sussurros do <span className="text-primary">Mestre</span></h2>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Questionamentos Contextuais</p>
                 </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-zinc-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {/* Insight Points Stats */}
              <div className="p-6 bg-primary/5 border border-primary/10 rounded-[32px] flex items-center justify-between relative overflow-hidden">
                 <div className="absolute right-0 top-0 p-6 opacity-5 rotate-12">
                   <Eye className="w-24 h-24 text-primary" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Pontos de Visão</p>
                    <h3 className="text-3xl font-black text-white">{status.insightPoints}</h3>
                 </div>
                 <div className="text-right max-w-[120px]">
                    <p className="text-[9px] text-zinc-600 font-serif italic leading-tight">Gaste pontos para obter intuições sobre a cena.</p>
                 </div>
              </div>

              {/* Chat Area */}
              <div className="space-y-6">
                 {/* Quota Error UI */}
                 {inquiryError === 'LIMITE_COTA' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 bg-red-950/40 border border-red-500/30 rounded-3xl backdrop-blur-md flex flex-col gap-4 text-red-200 shadow-xl"
                    >
                       <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                          <div className="flex-1">
                             <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-0.5">Mestre Exausto</p>
                             <p className="text-xs">O mestre está meditando. Aguarde alguns instantes para receber sua intuição.</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => handleSubmit(undefined, question)}
                         className="flex items-center justify-center gap-2 w-full py-3 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-400 transition-all active:scale-95"
                       >
                          <RefreshCcw className="w-3.5 h-3.5" /> Tentar Novamente
                       </button>
                    </motion.div>
                 )}

                 {lastQuestion && (
                   <motion.div 
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className="p-5 bg-zinc-900 border border-zinc-800 rounded-[24px] rounded-tr-none ml-8 text-xs text-zinc-400 relative"
                   >
                      <div className="absolute -top-3 right-6 px-3 py-1 bg-zinc-800 text-zinc-500 text-[8px] font-black uppercase tracking-widest rounded-full border border-zinc-700">Sua Dúvida</div>
                      "{lastQuestion}"
                   </motion.div>
                 )}

                 {answer && (
                   <motion.div 
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: 0.2 }}
                     className="p-6 bg-primary/5 border border-primary/20 rounded-[32px] rounded-tl-none mr-8 font-serif italic text-zinc-300 relative"
                   >
                      <div className="absolute -top-3 left-6 px-3 py-1 bg-primary text-zinc-950 text-[9px] font-black uppercase tracking-widest rounded-full">Intuição</div>
                      {answer}
                   </motion.div>
                 )}

                 {status.insightPoints <= 0 && !answer && !inquiryError && (
                   <div className="space-y-8">
                     <div className="p-10 border-2 border-dashed border-zinc-900 rounded-[40px] text-center space-y-4 opacity-50">
                        <HelpCircle className="w-12 h-12 text-zinc-700 mx-auto" />
                        <p className="text-zinc-500 font-serif italic">Suas cargas de visão se esgotaram. O mestre agora se cala...</p>
                     </div>

                     {/* Restoration Rituals */}
                     <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 ml-4">Rituais de Restauração</h3>
                        
                        {/* Sacrifice Ritual */}
                        <button 
                          onClick={handleSacrifice}
                          className="w-full p-6 bg-red-950/20 border border-red-900/30 hover:border-red-500 transition-all rounded-[32px] flex items-center justify-between group"
                        >
                           <div className="flex items-center gap-4 text-left">
                              <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 group-hover:scale-110 transition-transform">
                                 <Droplets className="w-5 h-5" />
                              </div>
                              <div>
                                 <h4 className="text-sm font-black text-zinc-100 uppercase tracking-tight">Sacrifício de Sangue</h4>
                                 <p className="text-[10px] text-zinc-500 font-bold uppercase">Custo: -4 Vitalidade</p>
                              </div>
                           </div>
                           <div className="text-[10px] font-black bg-red-500 text-white px-3 py-1 rounded-full">+1 Carga</div>
                        </button>

                        {/* Wisdom Potions Ritual */}
                        {wisdomItems.map(item => (
                          <button 
                            key={item.id}
                            onClick={() => handlePotion(item.id, item.name)}
                            className="w-full p-6 bg-primary/5 border border-primary/20 hover:border-primary transition-all rounded-[32px] flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-4 text-left">
                                <div className="p-3 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                                   <FlaskConical className="w-5 h-5" />
                                </div>
                                <div>
                                   <h4 className="text-sm font-black text-zinc-100 uppercase tracking-tight">{item.name}</h4>
                                   <p className="text-[10px] text-zinc-500 font-bold uppercase">Custo: 1 Unidade</p>
                                </div>
                            </div>
                            <div className="text-[10px] font-black bg-primary text-zinc-950 px-3 py-1 rounded-full">+2 Cargas</div>
                          </button>
                        ))}
                     </div>
                   </div>
                 )}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-8 bg-zinc-900/50 border-t border-zinc-800">
               <form onSubmit={handleSubmit} className="relative">
                  <textarea 
                    placeholder={status.insightPoints > 0 ? "O que deseja questionar ao mestre?" : "Sem cargas disponíveis..."}
                    className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-3xl p-6 pr-16 text-sm text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-primary transition-all resize-none h-32 disabled:opacity-50"
                    value={question}
                    onChange={(e) => {
                      setQuestion(e.target.value);
                      if (inquiryError) setInquiryError(null);
                    }}
                    disabled={isLoading || status.insightPoints <= 0}
                  />
                  <button 
                    type="submit"
                    disabled={isLoading || !question || status.insightPoints <= 0}
                    className="absolute bottom-4 right-4 p-4 bg-primary text-zinc-950 rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                  >
                     {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
               </form>
               <div className="mt-4 flex items-center gap-2 px-2">
                  <Info className="w-3 h-3 text-zinc-600" />
                  <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">Gasto: 1 Ponto de Visão por pergunta</p>
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
