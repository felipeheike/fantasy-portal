import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const announcement = await prisma.announcement.findUnique({ where: { id: 'global' } });
    if (!announcement || !announcement.isActive) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      message: announcement.message,
      variant: announcement.variant,
      updatedAt: announcement.updatedAt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
