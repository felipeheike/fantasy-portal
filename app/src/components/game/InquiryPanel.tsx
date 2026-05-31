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
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface InquiryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InquiryPanel({ isOpen, onClose }: InquiryPanelProps) {
  const { status, currentScene, history, useInsightPoint, addNotification } = useGameStore();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || status.insightPoints <= 0) return;

    setIsLoading(true);
    setAnswer(null);

    try {
      const res = await fetch('/api/chat/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, currentScene, history }),
      });

      const data = await res.json();

      if (res.ok) {
        setAnswer(data.answer);
        useInsightPoint();
        addNotification({
          type: 'info',
          title: '🔍 Questionamento Realizado',
          description: 'Um Ponto de Visão foi consumido para esclarecer seu caminho.'
        });
        setQuestion('');
      } else {
        toast.error(data.error || 'O mestre se recusa a responder agora.');
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
                    <h3 className="text-3xl font-black text-white">{status.insightPoints} / 3</h3>
                 </div>
                 <div className="text-right max-w-[120px]">
                    <p className="text-[9px] text-zinc-600 font-serif italic leading-tight">Gaste pontos para obter intuições sobre a cena.</p>
                 </div>
              </div>

              {/* Chat Area */}
              <div className="space-y-6">
                 {answer && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="p-6 bg-zinc-900/50 border border-primary/20 rounded-[32px] font-serif italic text-zinc-300 relative"
                   >
                      <div className="absolute -top-3 left-6 px-3 py-1 bg-primary text-zinc-950 text-[9px] font-black uppercase tracking-widest rounded-full">Intuição</div>
                      {answer}
                   </motion.div>
                 )}

                 {status.insightPoints <= 0 && !answer && (
                   <div className="p-10 border-2 border-dashed border-zinc-900 rounded-[40px] text-center space-y-4 opacity-50">
                      <HelpCircle className="w-12 h-12 text-zinc-700 mx-auto" />
                      <p className="text-zinc-500 font-serif italic">Suas cargas de visão se esgotaram. O mestre agora se cala diante de suas dúvidas...</p>
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
                    onChange={(e) => setQuestion(e.target.value)}
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
