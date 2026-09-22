import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';
import { invalidateLocalGenerationCache } from '@/lib/ai/localGeneration';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

    const config = await prisma.localGenerationConfig.findUnique({ where: { id: 'global' } });
    return NextResponse.json(config || { id: 'global', imageEnabled: false, textEnabled: false, ttsEnabled: false, ttsEngine: 'kokoro' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const TOGGLE_FIELDS = ['imageEnabled', 'textEnabled', 'ttsEnabled'] as const;

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

    const body = await req.json();
    const previous = await prisma.localGenerationConfig.findUnique({ where: { id: 'global' } });

    const data: Record<string, boolean | string> = {};
    for (const field of TOGGLE_FIELDS) {
      if (typeof body[field] === 'boolean') data[field] = body[field];
    }
    if (body.ttsEngine === 'kokoro' || body.ttsEngine === 'xtts') data.ttsEngine = body.ttsEngine;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido enviado.' }, { status: 400 });
    }

    const config = await prisma.localGenerationConfig.upsert({
      where: { id: 'global' },
      create: { id: 'global', imageEnabled: false, textEnabled: false, ttsEnabled: false, ttsEngine: 'kokoro', ...data },
      update: data,
    });
    invalidateLocalGenerationCache();

    for (const field of TOGGLE_FIELDS) {
      if (field in data && data[field] !== (previous?.[field] ?? false)) {
        await logAdminAction({
          actorId: session.user.id,
          actorName: session.user.name || session.user.email || 'Admin',
          action: 'LOCAL_GEN_TOGGLED',
          metadata: { kind: field.replace('Enabled', ''), enabled: data[field] },
        });
      }
    }
    if ('ttsEngine' in data && data.ttsEngine !== (previous?.ttsEngine ?? 'kokoro')) {
      await logAdminAction({
        actorId: session.user.id,
        actorName: session.user.name || session.user.email || 'Admin',
        action: 'LOCAL_TTS_ENGINE_CHANGED',
        metadata: { engine: data.ttsEngine },
      });
    }

    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
