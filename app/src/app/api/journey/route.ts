import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const journeys = await prisma.journey.findMany({
      where: { playerId: (session.user as any).id },
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
    const { genre, journeyLength, punishSystem, visualStyle, narrativeStyle, tone, readStyle, playerName } = body;

    const journey = await prisma.journey.create({
      data: {
        playerId: (session.user as any).id,
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
