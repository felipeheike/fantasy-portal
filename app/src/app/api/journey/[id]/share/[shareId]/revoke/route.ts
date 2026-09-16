import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; shareId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id, shareId } = await params;
    const journey = await prisma.journey.findUnique({ where: { id } });
    if (!journey) return NextResponse.json({ error: 'Jornada não encontrada' }, { status: 404 });
    if (journey.playerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const link = await prisma.journeyShareLink.findUnique({ where: { id: shareId } });
    if (!link || link.journeyId !== id) {
      return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 });
    }

    const now = new Date();
    await prisma.journeyShareLink.update({
      where: { id: shareId },
      data: { redeemExpiresAt: now, sessionExpiresAt: now },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
