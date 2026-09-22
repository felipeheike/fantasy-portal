import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// null = servidor local ainda não configurado (env var ausente) — diferente de
// "false" (configurado mas offline/não respondeu), pra a UI distinguir os dois casos.
async function ping(url: string | undefined): Promise<boolean | null> {
  if (!url) return null;
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

  const [image, text, tts] = await Promise.all([
    ping(process.env.LOCAL_IMAGE_URL),
    ping(process.env.LOCAL_TEXT_URL),
    ping(process.env.LOCAL_TTS_URL),
  ]);

  return NextResponse.json({ image, text, tts });
}
