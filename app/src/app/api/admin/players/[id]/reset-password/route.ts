import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { logger } from '@/lib/logger';
import { logAdminAction } from '@/lib/audit';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    // Generate a secure random temporary password
    const tempPassword = "fp-" + crypto.randomBytes(3).toString("hex");
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const updatedPlayer = await prisma.player.update({
      where: { id },
      data: {
        passwordHash,
        forcePasswordChange: true
      }
    });

    // Nunca inclua a senha temporária no metadata do log — auditoria não é cofre de segredo.
    await logAdminAction({
      actorId: session.user.id,
      actorName: session.user.name || session.user.email || 'Admin',
      action: 'PASSWORD_RESET',
      targetPlayerId: id,
      targetPlayerName: updatedPlayer.name || undefined,
    });

    return NextResponse.json({
      success: true, 
      tempPassword,
      message: "Senha resetada com sucesso. Copie a senha temporária abaixo." 
    });
  } catch (error: any) {
    logger.error("ADMIN_RESET_PASSWORD_ERR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
