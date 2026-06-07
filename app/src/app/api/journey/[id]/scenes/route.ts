import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/journey/[id]/scenes
 * Retorna as cenas paginadas para suporte ao Scroll Infinito.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id: journeyId } = await params;
    const { searchParams } = new URL(req.url);
    
    const limit = parseInt(searchParams.get("limit") || "10");
    const beforeOrder = searchParams.get("beforeOrder") ? parseInt(searchParams.get("beforeOrder")!) : null;

    const scenes = await prisma.scene.findMany({
      where: {
        journeyId,
        order: beforeOrder ? { lt: beforeOrder } : undefined,
      },
      orderBy: { order: "desc" },
      take: limit,
    });

    return NextResponse.json(scenes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/journey/[id]/scenes
 * Salva apenas a ÚLTIMA cena gerada (Append-Only).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id: journeyId } = await params;
    const body = await req.json();
    const { scene, playerStatus, inventory, impersonatedPlayerId } = body;

    const targetUserId = (session.user as any).role === "ADMIN" && impersonatedPlayerId 
      ? impersonatedPlayerId 
      : (session.user as any).id;

    // Verificar se a jornada pertence ao usuário
    const journey = await prisma.journey.findUnique({
      where: { id: journeyId, playerId: targetUserId },
      select: { _count: { select: { scenes: true } } }
    });

    if (!journey) return NextResponse.json({ error: "Jornada não encontrada" }, { status: 404 });

    const nextOrder = journey._count.scenes + 1;

    // Criar a cena e atualizar o status do jogador em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // --- Verificação de Idempotência no Servidor ---
      const existingScene = await tx.scene.findFirst({
        where: { journeyId, sceneId: scene.sceneId }
      });

      if (existingScene) {
        console.log(`LOG: Scene [${scene.sceneId}] already exists. Skipping duplication.`);
        return existingScene;
      }

      const newScene = await tx.scene.create({
        data: {
          journeyId,
          sceneId: scene.sceneId,
          order: nextOrder,
          narration: scene.narration,
          visualDescription: scene.visualDescription,
          audioDescription: scene.audioDescription,
          imageUrl: scene.imageUrl,
          audioUrl: scene.audioUrl,
          options: scene.options || [],
          tacticalOptions: scene.tacticalOptions || {},
          puzzle: scene.puzzle || {},
          selectedOption: scene.selectedOption,
          statusChanges: scene.statusChanges || {},
          inventoryChanges: scene.inventoryChanges || {},
          skillChanges: scene.skillChanges || [],
          worldUpdate: scene.worldUpdate || {},
          isGameOver: !!scene.isGameOver,
          createdAt: new Date(),
        }
      });

      if (playerStatus || inventory) {
        await tx.journey.update({
          where: { id: journeyId },
          data: {
            playerStatus: playerStatus || undefined,
            playerInventory: inventory || undefined
          }
        });
      }

      // --- LEGACY SNAPSHOT (Cofre da Lenda) ---
      if (scene.isGameOver) {
        console.log(`LOG: Capture total legacy snapshot for journey ${journeyId}`);

        await tx.journey.update({
          where: { id: journeyId },
          data: {
            status: 'completed',
            finalStatus: playerStatus || undefined,
            finalInventory: inventory || undefined,
            finalSkills: playerStatus?.skills || [],
            // O histórico de status é extraído das settings/flags da jornada se estiver lá
            finalStatusHistory: body.statusHistory || []
          }
        });
      }

      // IMPORTANTE: Manter compatibilidade com a coluna 'history' legada
      const currentJourney = await tx.journey.findUnique({ where: { id: journeyId }, select: { history: true } });
      const currentHistory = (currentJourney?.history as any[]) || [];
      
      // Só adiciona se não estiver no array de history
      const alreadyInHistory = currentHistory.some(s => s.sceneId === scene.sceneId);
      if (!alreadyInHistory) {
        await tx.journey.update({
          where: { id: journeyId },
          data: {
            history: [...currentHistory, scene]
          }
        });
      }

      return newScene;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
