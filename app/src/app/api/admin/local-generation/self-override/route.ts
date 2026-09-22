import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Override pessoal do admin: ignora a própria chave BYOK e força geração local
// mesmo tendo chave própria configurada. Só existe pra ADMIN, e só mexe na
// própria linha (session.user.id) — nunca na de outro jogador.
const FIELDS = ['forceLocalImage', 'forceLocalText', 'forceLocalTts'] as const;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

  const player = await prisma.player.findUnique({ where: { id: session.user.id }, select: { aiPreferences: true } });
  const prefs = (player?.aiPreferences as any) || {};
  return NextResponse.json({
    forceLocalImage: !!prefs.forceLocalImage,
    forceLocalText: !!prefs.forceLocalText,
    forceLocalTts: !!prefs.forceLocalTts,
  });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

  const body = await req.json();
  const player = await prisma.player.findUnique({ where: { id: session.user.id }, select: { aiPreferences: true } });
  const prefs = { ...(player?.aiPreferences as any || {}) };

  for (const field of FIELDS) {
    if (typeof body[field] === 'boolean') prefs[field] = body[field];
  }

  const updated = await prisma.player.update({
    where: { id: session.user.id },
    data: { aiPreferences: prefs },
    select: { aiPreferences: true },
  });
  const result = (updated.aiPreferences as any) || {};
  return NextResponse.json({
    forceLocalImage: !!result.forceLocalImage,
    forceLocalText: !!result.forceLocalText,
    forceLocalTts: !!result.forceLocalTts,
  });
}
