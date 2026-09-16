import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/shareToken';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const sessionToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!sessionToken) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const link = await prisma.journeyShareLink.findUnique({
      where: { sessionTokenHash: hashToken(sessionToken) },
    });

    // sessionExpiresAt null = acesso ativo indefinidamente; setado (pela revogação) e no
    // passado = acesso encerrado.
    if (!link || (link.sessionExpiresAt && link.sessionExpiresAt <= new Date())) {
      return NextResponse.json({ error: 'Acesso revogado ou sessão inválida' }, { status: 401 });
    }

    const journey = await prisma.journey.findUnique({
      where: { id: link.journeyId },
      include: { player: true },
    });

    if (!journey) {
      return NextResponse.json({ error: 'Jornada não encontrada' }, { status: 404 });
    }

    const flags = (journey.flags as any) || {};
    const isCompleted = journey.status === 'completed';

    return NextResponse.json({
      playerName: flags.playerName || journey.player?.name || 'Viajante',
      genre: journey.genre,
      history: journey.history,
      status: isCompleted ? journey.finalStatus : journey.playerStatus,
      isGameOver: isCompleted,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
