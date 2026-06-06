import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { discoverAllModels } from "@/lib/ai/discovery";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');
    const isAdmin = (session.user as any).role === 'ADMIN';

    const userId = (requestedUserId && isAdmin) ? requestedUserId : (session.user as any).id;

    const player = await prisma.player.findUnique({
      where: { id: userId },
      select: { apiKeys: true, apiEnabled: true }
    });

    if (!player) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const userKeys = (player.apiKeys as any) || {};
    const apiEnabled = (player.apiEnabled as any) || {};
    
    // Filtrar apenas chaves que estão habilitadas (default true se a chave existir)
    const activeKeys: Record<string, string> = {};
    Object.entries(userKeys).forEach(([provider, key]) => {
      if (apiEnabled[provider] !== false) {
        activeKeys[provider] = key as string;
      }
    });

    if (Object.keys(activeKeys).length === 0) {
      return NextResponse.json([]);
    }

    const models = await discoverAllModels(activeKeys);

    return NextResponse.json(models);
  } catch (error: any) {
    console.error('MODELS_DISCOVERY_API_ERR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
