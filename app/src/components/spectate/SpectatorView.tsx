'use client';

import { Heart, Flame, Scale, Eye } from 'lucide-react';
import type { NarrativeScene, PlayerStatus } from '@/types';

interface SpectatorData {
  playerName: string;
  genre: string;
  history: NarrativeScene[];
  status: PlayerStatus | null;
  isGameOver: boolean;
}

export default function SpectatorView({ data }: { data: SpectatorData }) {
  const { playerName, genre, history, status, isGameOver } = data;
  const hpPercentage = status ? (status.hp / status.maxHp) * 100 : 0;
  const spPercentage = status ? (status.sp / status.maxSp) * 100 : 0;

  return (
    <div className="min-h-screen bg-portal-bg text-portal-text">
      <header className="sticky top-0 z-10 bg-portal-bg/90 backdrop-blur-xl border-b border-portal-border px-4 py-3 md:px-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Eye className="w-4 h-4 text-portal-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-black uppercase tracking-tight truncate">{playerName}</p>
              <p className="text-[10px] text-portal-text-muted uppercase tracking-widest">{genre} · modo espectador</p>
            </div>
          </div>

          {status && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-red-400" />
                <div className="w-16 h-2 bg-portal-surface rounded-full border border-portal-border overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${hpPercentage}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-blue-400" />
                <div className="w-16 h-2 bg-portal-surface rounded-full border border-portal-border overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${spPercentage}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono text-portal-text-muted">
                <Scale className="w-3.5 h-3.5" />
                {status.moral}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 md:px-8 space-y-8">
        {history.length === 0 && (
          <p className="text-center text-portal-text-muted py-20">A jornada ainda não começou.</p>
        )}

        {history.map((scene, i) => (
          <article key={scene.sceneId || i} className="border-b border-portal-border/50 pb-8">
            {scene.imageUrl && (
              <img
                src={scene.imageUrl}
                alt=""
                className="w-full rounded-lg border border-portal-border mb-4 object-cover"
              />
            )}
            <p className="whitespace-pre-wrap leading-relaxed text-portal-text/90">{scene.narration}</p>
            {scene.selectedOption && (
              <p className="mt-3 text-sm italic text-portal-primary">→ {scene.selectedOption}</p>
            )}
          </article>
        ))}

        {isGameOver && (
          <p className="text-center text-portal-text-muted uppercase tracking-widest text-xs py-6">Fim da jornada</p>
        )}
      </main>
    </div>
  );
}
