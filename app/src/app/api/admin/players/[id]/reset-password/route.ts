import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";
import crypto from "crypto";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    // Generate a secure random temporary password
    const tempPassword = "fp-" + crypto.randomBytes(3).toString("hex");
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await prisma.player.update({
      where: { id },
      data: {
        passwordHash,
        forcePasswordChange: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      tempPassword,
      message: "Senha resetada com sucesso. Copie a senha temporária abaixo." 
    });
  } catch (error: any) {
    console.error("ADMIN_RESET_PASSWORD_ERR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
