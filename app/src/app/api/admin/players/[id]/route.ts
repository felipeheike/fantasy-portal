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
    const { id } = await params;
    
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const body = await req.json();
    const { accountStatus, role } = body;

    const updatedPlayer = await prisma.player.update({
      where: { id },
      data: {
        accountStatus: accountStatus || undefined,
        role: role || undefined
      }
    });

    return NextResponse.json(updatedPlayer);
  } catch (error: any) {
    console.error("ADMIN_PATCH_PLAYER_ERR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    // Safety: prevent self-deletion
    if ((session.user as any).id === id) {
      return NextResponse.json({ error: "Você não pode banir a si mesmo do portal." }, { status: 400 });
    }

    await prisma.player.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
