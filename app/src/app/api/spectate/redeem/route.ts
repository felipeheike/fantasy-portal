import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken, hashToken } from '@/lib/shareToken';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Link inválido' }, { status: 400 });
    }

    const link = await prisma.journeyShareLink.findUnique({
      where: { shareTokenHash: hashToken(token) },
    });

    if (!link) {
      return NextResponse.json({ error: 'Link inválido' }, { status: 404 });
    }

    const now = new Date();

    if (link.redeemedAt) {
      return NextResponse.json({ error: 'Link já utilizado' }, { status: 409 });
    }

    if (link.redeemExpiresAt <= now) {
      return NextResponse.json({ error: 'Link expirado ou revogado' }, { status: 410 });
    }

    const sessionToken = generateToken();

    // Update condicional (redeemedAt ainda null) evita corrida entre duas requisições
    // resgatando o mesmo token ao mesmo tempo — só uma pode vencer.
    // sessionExpiresAt fica null: o acesso não expira sozinho, só por revogação manual do dono.
    const { count } = await prisma.journeyShareLink.updateMany({
      where: { id: link.id, redeemedAt: null, redeemExpiresAt: { gt: now } },
      data: {
        sessionTokenHash: hashToken(sessionToken),
        redeemedAt: now,
        sessionExpiresAt: null,
      },
    });

    if (count === 0) {
      return NextResponse.json({ error: 'Link já utilizado' }, { status: 409 });
    }

    return NextResponse.json({
      sessionToken,
      journeyId: link.journeyId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
