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

    const journey = await prisma.journey.create({
      data: {
        playerId: targetUserId,
        genre: genre || 'fantasy',
        status: 'active',
        history: [],
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
