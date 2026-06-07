import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // SECURITY: Only ADMIN can impersonate other users
    const targetUserId = (session.user as any).role === 'ADMIN' && userId 
      ? userId 
      : (session.user as any).id;

    const journeys = await prisma.journey.findMany({
      where: { playerId: targetUserId },
      include: {
        player: true
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(journeys);
  } catch (error) {
    console.error('Failed to fetch journeys:', error);
    return NextResponse.json({ error: 'Failed to fetch journeys' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { genre, journeyLength, punishSystem, visualStyle, narrativeStyle, tone, readStyle, playerName, impersonatedPlayerId } = body;

    // SECURITY: Only ADMIN can create journeys for others
    const targetUserId = (session.user as any).role === 'ADMIN' && impersonatedPlayerId 
      ? impersonatedPlayerId 
      : (session.user as any).id;

    // --- LIMIT VALIDATION (Tier System) ---
    const player = await prisma.player.findUnique({
      where: { id: targetUserId },
      select: { 
        apiKeys: true, 
        apiEnabled: true,
        _count: { select: { journeys: true } }
      }
    });

    if (!player) return NextResponse.json({ error: "Aventureiro não encontrado" }, { status: 404 });

    const userKeys = (player.apiKeys as any) || {};
    const apiEnabled = (player.apiEnabled as any) || {};
    const hasBYOK = Object.entries(userKeys).some(([p, k]) => k && k !== '' && apiEnabled[p] !== false);

    // Limit to 3 journeys if no personal keys are enabled
    if (!hasBYOK && player._count.journeys >= 3) {
      return NextResponse.json({ 
        error: "LIMIT_EXCEEDED", 
        message: "O Portal está exausto. Como aventureiro do reino, você pode ter no máximo 3 crônicas ativas. Vincule sua própria fonte de poder (API Key) para criar jornadas ilimitadas." 
      }, { status: 403 });
    }

    const initialStatus = {
      hp: 20,
      maxHp: 20,
      sp: 15,
      maxSp: 15,
      combatPower: 10,
      luck: 1,
      agility: 5,
      moral: 0,
      skills: [],
      reputations: {},
      insightPoints: 5,
      deathCount: 0
    };

    const initialInventory: any[] = [];

    const journey = await prisma.journey.create({
      data: {
        playerId: targetUserId,
        genre: genre || 'fantasy',
        status: 'active',
        history: [],
        playerStatus: initialStatus,
        playerInventory: initialInventory,
        flags: { 
          playerName: playerName || session.user?.name || 'Aventureiro',
          journeyLength,
          punishSystem,
          visualStyle,
          narrativeStyle,
          tone,
          readStyle
        },
        settings: {
          enableImages: body.enableImages ?? true,
          enableAudio: body.enableAudio ?? true,
        },
        memories: [],
      },
    });

    return NextResponse.json(journey);
  } catch (error: any) {
    console.error('!!! FAILED TO CREATE JOURNEY !!!', error);
    return NextResponse.json({ error: 'Failed to create journey' }, { status: 500 });
  }
}
