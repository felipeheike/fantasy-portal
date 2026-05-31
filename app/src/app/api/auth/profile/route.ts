import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { name, email, currentPassword, newPassword } = body;

    // 1. Get current player data
    const player = await prisma.player.findUnique({
      where: { id: userId }
    });

    if (!player) {
      return NextResponse.json({ error: "Aventureiro não encontrado." }, { status: 404 });
    }

    const updates: any = {};

    // 2. Logic for sensitive changes (Email or Password)
    const isEmailChanging = email && email !== player.email;
    const isPasswordChanging = !!newPassword;

    if (isEmailChanging || isPasswordChanging) {
      if (!currentPassword) {
        return NextResponse.json({ error: "A senha atual é obrigatória para alterar e-mail ou senha." }, { status: 400 });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, player.passwordHash || "");
      if (!isPasswordValid) {
        return NextResponse.json({ error: "A senha atual está incorreta." }, { status: 403 });
      }

      if (isEmailChanging) {
        // Check if new email is already taken
        const existingEmail = await prisma.player.findUnique({ where: { email } });
        if (existingEmail) {
          return NextResponse.json({ error: "Este e-mail já está sendo usado por outra alma." }, { status: 400 });
        }
        updates.email = email;
      }

      if (isPasswordChanging) {
        updates.passwordHash = await bcrypt.hash(newPassword, 10);
      }
    }

    // 3. Logic for simple changes (Name)
    if (name && name !== player.name) {
      updates.name = name;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: "Nenhuma alteração necessária." });
    }

    // 4. Perform Update
    await prisma.player.update({
      where: { id: userId },
      data: updates
    });

    return NextResponse.json({ 
      success: true, 
      requiresLogout: isEmailChanging || isPasswordChanging,
      message: "Pergaminho de identidade atualizado com sucesso!" 
    });

  } catch (error: any) {
    console.error("PROFILE_UPDATE_ERR:", error);
    return NextResponse.json({ error: "Falha ao selar as alterações." }, { status: 500 });
  }
}
