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

    const maintenance = await prisma.maintenanceMode.findUnique({ where: { id: 'global' } });
    return NextResponse.json(maintenance || { id: 'global', isActive: false, message: null, updatedAt: null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

    const { message } = await req.json();

    const maintenance = await prisma.maintenanceMode.upsert({
      where: { id: 'global' },
      create: { id: 'global', isActive: true, message: message?.trim() || null },
      update: { isActive: true, message: message?.trim() || null },
    });

    await logAdminAction({
      actorId: session.user.id,
      actorName: session.user.name || session.user.email || 'Admin',
      action: 'MAINTENANCE_ENABLED',
      metadata: message?.trim() ? { messagePreview: message.trim().slice(0, 80) } : undefined,
    });

    return NextResponse.json(maintenance);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

    await prisma.maintenanceMode.updateMany({ where: { id: 'global' }, data: { isActive: false } });

    await logAdminAction({
      actorId: session.user.id,
      actorName: session.user.name || session.user.email || 'Admin',
      action: 'MAINTENANCE_DISABLED',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
