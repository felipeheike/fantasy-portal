'use client';

import { Lock } from 'lucide-react';
import { JourneyOption } from '@/lib/journeyOptions';

interface OptionPickerProps {
  options: JourneyOption[];
  value: string;
  onChange: (id: string) => void;
  hasBYOK: boolean;
  /** pills: pastilhas compactas em grade, só o rótulo (gênero, estilo visual).
   *  list: lista empilhada com descrição (estilo literário, punição).
   *  cards: como "list", mas em grade 2 colunas com tooltip de bloqueio (tamanho, magnitude). */
  variant: 'pills' | 'list' | 'cards';
  accent?: 'primary' | 'red' | 'neutral';
  /** Mostra um indicador circular de seleção à direita (usado nas regras de punição). */
  showRadio?: boolean;
}

/**
 * Seletor de opção único, usado tanto na criação quanto na edição de jornada —
 * mesmas variantes visuais já estabelecidas no wizard de criação, agora num só
 * lugar pra nunca divergir entre os dois fluxos.
 */
export function OptionPicker({ options, value, onChange, hasBYOK, variant, accent = 'primary', showRadio = false }: OptionPickerProps) {
  if (variant === 'pills') {
    const selectedClass = accent === 'red'
      ? 'bg-red-500/10 text-red-400 border-red-500/50'
      : accent === 'neutral'
      ? 'bg-zinc-100 text-zinc-900 border-zinc-100'
      : 'bg-portal-primary text-portal-primary-foreground border-portal-primary';
    return (
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const isLocked = !hasBYOK && opt.restricted;
          const isSelected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={isLocked}
              onClick={() => onChange(opt.id)}
              title={opt.label}
              className={`py-2 px-3 rounded-xl border text-[10px] font-black uppercase transition-all whitespace-nowrap overflow-hidden text-ellipsis flex items-center justify-center gap-1 ${
                isSelected ? selectedClass
                : isLocked ? 'border-zinc-900 text-zinc-700 opacity-40 cursor-not-allowed'
                : 'border-portal-border text-zinc-500'
              }`}
            >
              {opt.label}
              {isLocked && <Lock className="w-2.5 h-2.5 shrink-0" />}
            </button>
          );
        })}
      </div>
    );
  }

  const selectedCardClass = accent === 'red'
    ? 'border-red-500/50 bg-red-500/5'
    : 'border-primary bg-primary/10';

  return (
    <div className={variant === 'cards' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
      {options.map((opt) => {
        const isLocked = !hasBYOK && opt.restricted;
        const isSelected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={isLocked}
            onClick={() => onChange(opt.id)}
            className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group flex items-center justify-between ${variant === 'list' ? 'w-full' : ''} ${
              isSelected ? selectedCardClass
              : isLocked ? 'border-zinc-900 bg-portal-bg opacity-40 cursor-not-allowed'
              : 'border-portal-border bg-portal-surface/50 hover:border-zinc-700'
            }`}
          >
            <div>
              <div className={`font-black uppercase tracking-tighter text-xs mb-1 ${isSelected ? (accent === 'red' ? 'text-red-400' : 'text-primary') : 'text-zinc-400'}`}>{opt.label}</div>
              {opt.desc && <div className="text-[10px] text-zinc-500 font-bold uppercase">{opt.desc}</div>}
            </div>
            {isLocked ? (
              <Lock className="w-3 h-3 text-zinc-600 shrink-0" />
            ) : showRadio ? (
              <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${isSelected ? `${accent === 'red' ? 'border-red-500 bg-red-500' : 'border-primary bg-primary'}` : 'border-zinc-700'}`} />
            ) : null}
            {isLocked && variant === 'cards' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[7px] font-black uppercase text-zinc-400 bg-black/60 px-2 py-1 rounded text-center">Exige Canalização Pessoal</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
