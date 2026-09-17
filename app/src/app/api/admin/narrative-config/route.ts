import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { NARRATIVE_DEFAULTS } from '@/lib/narrativeDefaults';
import { logAdminAction } from '@/lib/audit';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

    const config = await prisma.narrativeConfig.findUnique({ where: { id: 'global' } });
    return NextResponse.json(config || { id: 'global', ...NARRATIVE_DEFAULTS, updatedAt: null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

    const { persona, detailShort, detailMedium, detailLong, detailEpic, extraDirectives } = await req.json();

    const fields = { persona, detailShort, detailMedium, detailLong, detailEpic };
    for (const [key, value] of Object.entries(fields)) {
      if (!value || typeof value !== 'string' || !value.trim()) {
        return NextResponse.json({ error: `O campo "${key}" não pode ficar vazio.` }, { status: 400 });
      }
    }

    const config = await prisma.narrativeConfig.upsert({
      where: { id: 'global' },
      create: {
        id: 'global',
        persona: persona.trim(),
        detailShort: detailShort.trim(),
        detailMedium: detailMedium.trim(),
        detailLong: detailLong.trim(),
        detailEpic: detailEpic.trim(),
        extraDirectives: extraDirectives?.trim() || null,
      },
      update: {
        persona: persona.trim(),
        detailShort: detailShort.trim(),
        detailMedium: detailMedium.trim(),
        detailLong: detailLong.trim(),
        detailEpic: detailEpic.trim(),
        extraDirectives: extraDirectives?.trim() || null,
      },
    });

    await logAdminAction({
      actorId: session.user.id,
      actorName: session.user.name || session.user.email || 'Admin',
      action: 'NARRATIVE_CONFIG_UPDATED',
    });

    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

    await prisma.narrativeConfig.deleteMany({ where: { id: 'global' } });

    await logAdminAction({
      actorId: session.user.id,
      actorName: session.user.name || session.user.email || 'Admin',
      action: 'NARRATIVE_CONFIG_RESET',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
