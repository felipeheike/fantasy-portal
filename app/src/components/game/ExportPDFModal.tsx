'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Image as ImageIcon, Type, Sparkles, Download, Check } from 'lucide-react';

interface ExportPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (includeImages: boolean) => void;
  playerName: string;
}

export default function ExportPDFModal({ isOpen, onClose, onExport, playerName }: ExportPDFModalProps) {
  const [includeImages, setIncludeImages] = useState(true);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-portal-bg border border-portal-border rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-portal-border flex items-center justify-between bg-portal-surface/30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter text-portal-text">Forjar Livro</h2>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Exportação das Crônicas</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-portal-surface-hover rounded-full transition-colors text-zinc-500 hover:text-portal-text"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              <div className="text-center space-y-2">
                 <p className="text-zinc-400 font-body italic text-lg">"Como as crônicas de {playerName} devem ser imortalizadas?"</p>
              </div>

              <div className="space-y-4">
                {/* Image Toggle Option */}
                <button 
                  onClick={() => setIncludeImages(true)}
                  className={`w-full p-5 rounded-3xl border-2 text-left transition-all flex items-center justify-between group ${
                    includeImages ? 'border-primary bg-primary/5' : 'border-portal-border bg-portal-surface/50 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${includeImages ? 'bg-primary text-zinc-950' : 'bg-portal-surface-hover text-zinc-500'}`}>
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`font-black uppercase tracking-tight ${includeImages ? 'text-portal-text' : 'text-zinc-400'}`}>Livro de Arte Completo</h3>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">Inclui todas as ilustrações geradas</p>
                    </div>
                  </div>
                  {includeImages && <Check className="w-5 h-5 text-primary" />}
                </button>

                <button 
                  onClick={() => setIncludeImages(false)}
                  className={`w-full p-5 rounded-3xl border-2 text-left transition-all flex items-center justify-between group ${
                    !includeImages ? 'border-primary bg-primary/5' : 'border-portal-border bg-portal-surface/50 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${!includeImages ? 'bg-primary text-zinc-950' : 'bg-portal-surface-hover text-zinc-500'}`}>
                      <Type className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`font-black uppercase tracking-tight ${!includeImages ? 'text-portal-text' : 'text-zinc-400'}`}>Apenas Crônicas</h3>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">Texto puro, otimizado para leitura</p>
                    </div>
                  </div>
                  {!includeImages && <Check className="w-5 h-5 text-primary" />}
                </button>
              </div>

              <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-3">
                 <Sparkles className="w-4 h-4 text-primary shrink-0" />
                 <p className="text-[9px] text-zinc-500 uppercase font-bold leading-relaxed">
                   O manuscrito será processado no backend e salvo no seu MinIO pessoal para consultas futuras instantâneas.
                 </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-portal-border bg-portal-surface/30 flex gap-3">
               <button 
                onClick={onClose}
                className="flex-1 py-4 text-zinc-500 font-black uppercase tracking-widest text-[10px] hover:text-portal-text transition-all"
               >
                 Cancelar
               </button>
               <button 
                onClick={() => {
                  onExport(includeImages);
                  onClose();
                }}
                className="flex-[2] py-4 bg-primary text-zinc-950 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
               >
                 <Download className="w-4 h-4" /> Manifestar PDF
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
