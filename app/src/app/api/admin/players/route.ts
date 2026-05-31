import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const players = await prisma.player.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { journeys: true }
        }
      }
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error("ADMIN_GET_PLAYERS_ERR:", error);
    return NextResponse.json({ error: "Falha ao consultar aventureiros." }, { status: 500 });
  }
}
