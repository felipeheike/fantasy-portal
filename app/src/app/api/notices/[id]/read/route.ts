import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const notice = await prisma.playerNotice.findUnique({ where: { id } });
    if (!notice || notice.playerId !== session.user.id) {
      return NextResponse.json({ error: 'Aviso não encontrado.' }, { status: 404 });
    }

    await prisma.playerNotice.update({ where: { id }, data: { readAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
