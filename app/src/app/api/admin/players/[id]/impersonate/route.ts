import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';

// A supervisão em si é puramente client-side (gameStore.startImpersonation) — esta
// rota existe só para deixar rastro de auditoria de quando um admin passou a ver
// a jornada de outro jogador, já que o acesso real de leitura passa por /api/journey.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

    const { id } = await params;
    const targetPlayer = await prisma.player.findUnique({ where: { id }, select: { name: true } });
    if (!targetPlayer) return NextResponse.json({ error: 'Aventureiro não encontrado.' }, { status: 404 });

    await logAdminAction({
      actorId: session.user.id,
      actorName: session.user.name || session.user.email || 'Admin',
      action: 'IMPERSONATION_START',
      targetPlayerId: id,
      targetPlayerName: targetPlayer.name || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
