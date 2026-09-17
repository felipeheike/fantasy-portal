import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

    const announcement = await prisma.announcement.findUnique({ where: { id: 'global' } });
    return NextResponse.json(announcement);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

    const { message, variant } = await req.json();
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'A mensagem não pode ficar vazia.' }, { status: 400 });
    }
    if (!['info', 'warning', 'critical'].includes(variant)) {
      return NextResponse.json({ error: 'Tipo de aviso inválido.' }, { status: 400 });
    }

    const announcement = await prisma.announcement.upsert({
      where: { id: 'global' },
      create: { id: 'global', message: message.trim(), variant, isActive: true },
      update: { message: message.trim(), variant, isActive: true },
    });

    await logAdminAction({
      actorId: session.user.id,
      actorName: session.user.name || session.user.email || 'Admin',
      action: 'ANNOUNCEMENT_PUBLISHED',
      metadata: { variant, messagePreview: message.trim().slice(0, 80) },
    });

    return NextResponse.json(announcement);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

    await prisma.announcement.updateMany({ where: { id: 'global' }, data: { isActive: false } });

    await logAdminAction({
      actorId: session.user.id,
      actorName: session.user.name || session.user.email || 'Admin',
      action: 'ANNOUNCEMENT_CLEARED',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
