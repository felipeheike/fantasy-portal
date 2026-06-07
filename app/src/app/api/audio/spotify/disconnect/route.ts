import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const player = await prisma.player.findUnique({
      where: { id: userId },
      select: { apiKeys: true }
    });

    if (!player) {
      return NextResponse.json({ error: "Jogador não encontrado" }, { status: 404 });
    }

    const currentKeys = (player.apiKeys as any) || {};
    const updatedKeys = { ...currentKeys };
    
    // Clear all Spotify keys
    delete updatedKeys.spotifyAccessToken;
    delete updatedKeys.spotifyRefreshToken;
    delete updatedKeys.spotifyTokenExpiresAt;

    await prisma.player.update({
      where: { id: userId },
      data: { apiKeys: updatedKeys }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
