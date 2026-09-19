import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Sem nova cena por esse tempo, a jornada sai de "ao vivo" pra "última atividade há X"
// — jornada "active" só vira "abandonada" no sentido de deixar de badge, nunca muda de status.
const LIVE_THRESHOLD_MS = 5 * 60 * 1000;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

    const journeys = await prisma.journey.findMany({
      where: { status: 'active' },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      include: { player: { select: { id: true, name: true, email: true } } },
    });

    const now = Date.now();
    const sessions = journeys.map((journey) => {
      const flags = (journey.flags as any) || {};
      const history = Array.isArray(journey.history) ? (journey.history as any[]) : [];
      const lastScene = history[history.length - 1];
      const status = (journey.playerStatus as any) || {};

      return {
        journeyId: journey.id,
        playerId: journey.playerId,
        playerName: flags.playerName || journey.player?.name || 'Viajante',
        playerEmail: journey.player?.email || null,
        genre: journey.genre,
        sceneCount: history.length,
        narrationPreview: lastScene?.narration ? String(lastScene.narration).slice(0, 140) : null,
        hp: typeof status.hp === 'number' ? status.hp : null,
        maxHp: typeof status.maxHp === 'number' ? status.maxHp : null,
        sp: typeof status.sp === 'number' ? status.sp : null,
        maxSp: typeof status.maxSp === 'number' ? status.maxSp : null,
        updatedAt: journey.updatedAt,
        isLive: now - new Date(journey.updatedAt).getTime() < LIVE_THRESHOLD_MS,
      };
    });

    return NextResponse.json(sessions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
