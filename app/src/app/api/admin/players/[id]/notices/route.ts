import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

    const { id } = await params;
    const notices = await prisma.playerNotice.findMany({
      where: { playerId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json(notices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

    const { id } = await params;
    const { message, variant } = await req.json();
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'A mensagem não pode ficar vazia.' }, { status: 400 });
    }
    if (!['info', 'warning', 'critical'].includes(variant)) {
      return NextResponse.json({ error: 'Tipo de aviso inválido.' }, { status: 400 });
    }

    const player = await prisma.player.findUnique({ where: { id } });
    if (!player) return NextResponse.json({ error: 'Aventureiro não encontrado.' }, { status: 404 });

    const notice = await prisma.playerNotice.create({
      data: { playerId: id, message: message.trim(), variant },
    });

    await logAdminAction({
      actorId: session.user.id,
      actorName: session.user.name || session.user.email || 'Admin',
      action: 'PLAYER_NOTICE_SENT',
      targetPlayerId: id,
      targetPlayerName: player.name || undefined,
      metadata: { variant, messagePreview: message.trim().slice(0, 80) },
    });

    return NextResponse.json(notice);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
