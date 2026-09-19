import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Lido por todo cliente autenticado (não só admin) pra decidir se mostra a tela de
// manutenção — por isso não tem checagem de role, só de sessão.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const maintenance = await prisma.maintenanceMode.findUnique({ where: { id: 'global' } });
    return NextResponse.json({
      isActive: maintenance?.isActive || false,
      message: maintenance?.message || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
