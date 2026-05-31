import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const journeys = await prisma.journey.findMany({
      where: { playerId: 'default-player-id' },
      include: {
        player: true // CRITICAL: Include player status and inventory
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
    const body = await req.json();
    console.log("POST /api/journey - Request Body:", JSON.stringify(body, null, 2));
    
    const { genre, journeyLength, punishSystem, visualStyle, narrativeStyle, tone, readStyle, playerName } = body;

    console.log("POST /api/journey - Creating journey for player:", playerName);

    const journey = await prisma.journey.create({
      data: {
        playerId: 'default-player-id',
        genre: genre || 'fantasy',
        status: 'active',
        history: [],
        flags: { 
          playerName: playerName || 'Desconhecido',
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

    console.log("POST /api/journey - Success! ID:", journey.id);
    return NextResponse.json(journey);
  } catch (error: any) {
    console.error('!!! FAILED TO CREATE JOURNEY !!!', error);
    return NextResponse.json({ 
      error: 'Failed to create journey', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
