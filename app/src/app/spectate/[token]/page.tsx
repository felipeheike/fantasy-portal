'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { Eye, AlertTriangle } from 'lucide-react';
import SpectatorView from '@/components/spectate/SpectatorView';

const POLL_INTERVAL_MS = 20000;

interface StoredSession {
  sessionToken: string;
}

function storageKey(token: string) {
  return `spectate:${token}`;
}

// Cache em nível de módulo (não um ref/estado do componente): garante que o resgate do
// token — de uso único — só dispare uma vez mesmo se o componente montar mais de uma
// vez para o mesmo token (Strict Mode em dev, Fast Refresh, etc.).
const inFlightRedeems = new Map<string, Promise<StoredSession>>();

// localStorage (não sessionStorage): o acesso não é mais restrito à aba que resgatou o
// link — fica disponível a quem redimiu, em qualquer aba/sessão do navegador, até o
// dono da jornada revogar.
function getOrRedeemSession(token: string): Promise<StoredSession> {
  try {
    const raw = localStorage.getItem(storageKey(token));
    if (raw) return Promise.resolve(JSON.parse(raw));
  } catch {
    // localStorage indisponível ou corrompida — cai no resgate abaixo
  }

  let promise = inFlightRedeems.get(token);
  if (!promise) {
    promise = (async () => {
      const res = await fetch('/api/spectate/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Link inválido');

      const session: StoredSession = { sessionToken: body.sessionToken };
      localStorage.setItem(storageKey(token), JSON.stringify(session));
      return session;
    })();
    inFlightRedeems.set(token, promise);
    promise.finally(() => inFlightRedeems.delete(token));
  }
  return promise;
}

export default function SpectatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const fetchSession = useCallback(async (sessionToken: string) => {
    const res = await fetch('/api/spectate/session', {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Sessão expirada');
    }
    return res.json();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    async function run() {
      let session: StoredSession;
      try {
        session = await getOrRedeemSession(token);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Link inválido');
        return;
      }

      const poll = async () => {
        try {
          const journeyData = await fetchSession(session.sessionToken);
          if (!cancelled) setData(journeyData);
        } catch (e: any) {
          if (!cancelled) {
            setError(e.message || 'Sessão expirada');
            if (intervalId) clearInterval(intervalId);
          }
        }
      };

      await poll();
      if (!cancelled) {
        intervalId = setInterval(poll, POLL_INTERVAL_MS);
      }
    }

    run();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [token, fetchSession]);

  if (error) {
    return (
      <div className="min-h-screen bg-portal-bg text-portal-text flex items-center justify-center px-4">
        <div className="max-w-sm text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-portal-primary mx-auto" />
          <p className="font-black uppercase tracking-tight">Não foi possível abrir este link</p>
          <p className="text-sm text-portal-text-muted">{error}</p>
          <p className="text-xs text-portal-text-muted">Peça ao dono da jornada um novo link de compartilhamento.</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-portal-bg text-portal-text flex items-center justify-center">
        <Eye className="w-6 h-6 text-portal-primary animate-pulse" />
      </div>
    );
  }

  return <SpectatorView data={data} />;
}
