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
      settings,
      impersonatedPlayerId
    } = body;

    // `settings.genre` é a fonte viva (lida pelo prompt da IA e pelo sync do Spotify);
    // a coluna top-level `genre` só existe pro card da lista de jornadas (MainMenu.tsx)
    // e precisa ser mantida em sincronia manualmente aqui.
    const genre = settings?.genre;

    // SECURITY: ADMIN can patch anyone, PLAYER can only patch themselves
    const targetUserId = session.user.role === "ADMIN" && impersonatedPlayerId 
      ? impersonatedPlayerId 
      : session.user.id;

    const journey = await prisma.journey.update({
      where: { id, playerId: targetUserId },
      data: {
        history: history || undefined,
        flags: flags || undefined,
        memories: memories || undefined,
        settings: settings || undefined,
        playerStatus: playerStatus || undefined,
        playerInventory: inventory || undefined,
        genre: genre || undefined
      },
    });

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
    const { searchParams } = new URL(req.url);
    const impersonatedPlayerId = searchParams.get("impersonatedPlayerId");

    const targetUserId = session.user.role === "ADMIN" && impersonatedPlayerId 
      ? impersonatedPlayerId 
      : session.user.id;

    await prisma.journey.delete({ 
      where: { id, playerId: targetUserId } 
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
