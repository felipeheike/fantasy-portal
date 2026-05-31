import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { 
      history, 
      playerStatus, 
      inventory,
      flags,
      memories,
      settings
    } = body;

    const journey = await prisma.journey.update({
      where: { id, playerId: (session.user as any).id },
      data: {
        history: history || undefined,
        flags: flags || undefined,
        memories: memories || undefined,
        settings: settings || undefined
      },
    });

    if (playerStatus || inventory) {
      await prisma.player.update({
        where: { id: (session.user as any).id },
        data: {
          status: playerStatus || undefined,
          inventory: inventory || undefined
        }
      });
    }

    return NextResponse.json(journey);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    await prisma.journey.delete({ 
      where: { id, playerId: (session.user as any).id } 
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
