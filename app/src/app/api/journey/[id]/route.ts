import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const { 
      history, 
      playerStatus, 
      inventory,
      flags,
      memories
    } = body;

    console.log("PATCH Journey ID:", id);

    // Atomic update for Journey and Player in a single transaction if possible, 
    // but here we update them sequentially for simplicity.
    const journey = await prisma.journey.update({
      where: { id },
      data: {
        history: history || undefined,
        flags: flags || undefined,
        memories: memories || undefined,
      },
    });

    if (playerStatus || inventory) {
      await prisma.player.update({
        where: { id: 'default-player-id' },
        data: {
          status: playerStatus || undefined,
          inventory: inventory || undefined,
        },
      });
    }

    return NextResponse.json(journey);
  } catch (error: any) {
    console.error('DATABASE SYNC ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.journey.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
