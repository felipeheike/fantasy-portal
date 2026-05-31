import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
    }

    const existingUser = await prisma.player.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Este email já está registrado no pergaminho." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newPlayer = await prisma.player.create({
      data: {
        name,
        email,
        passwordHash,
        role: "PLAYER",
        accountStatus: "PENDING",
        status: {
          hp: 20,
          maxHp: 20,
          sp: 15,
          maxSp: 15,
          combatPower: 10,
          moral: 0,
          skills: [],
          reputations: {}
        },
        inventory: []
      }
    });

    return NextResponse.json({ success: true, id: newPlayer.id });
  } catch (error: any) {
    console.error("REGISTRATION_ERROR:", error);
    return NextResponse.json({ error: "Erro interno ao selar o registro." }, { status: 500 });
  }
}
