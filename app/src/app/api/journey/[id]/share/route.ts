import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { generateToken, hashToken } from '@/lib/shareToken';

const REDEEM_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias para alguém abrir o link

function shareStatus(link: { redeemedAt: Date | null; redeemExpiresAt: Date; sessionExpiresAt: Date | null }) {
  const now = new Date();
  if (link.redeemedAt) {
    // sessionExpiresAt null = acesso ativo sem prazo; setado no passado = revogado.
    return !link.sessionExpiresAt || link.sessionExpiresAt > now ? 'ativo' : 'revogado';
  }
  return link.redeemExpiresAt > now ? 'aguardando_resgate' : 'expirado';
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const journey = await prisma.journey.findUnique({ where: { id } });
    if (!journey) return NextResponse.json({ error: 'Jornada não encontrada' }, { status: 404 });
    if (journey.playerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const rawToken = generateToken();
    const link = await prisma.journeyShareLink.create({
      data: {
        journeyId: id,
        shareTokenHash: hashToken(rawToken),
        redeemExpiresAt: new Date(Date.now() + REDEEM_WINDOW_MS),
      },
    });

    const origin = req.headers.get('origin') || new URL(req.url).origin;
    return NextResponse.json({
      id: link.id,
      url: `${origin}/spectate/${rawToken}`,
      expiresAt: link.redeemExpiresAt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const journey = await prisma.journey.findUnique({ where: { id } });
    if (!journey) return NextResponse.json({ error: 'Jornada não encontrada' }, { status: 404 });
    if (journey.playerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const links = await prisma.journeyShareLink.findMany({
      where: { journeyId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      links
        .map((link) => ({
          id: link.id,
          createdAt: link.createdAt,
          redeemedAt: link.redeemedAt,
          sessionExpiresAt: link.sessionExpiresAt,
          status: shareStatus(link),
        }))
        // Links mortos (expirados sem uso ou revogados) ficam no banco para auditoria,
        // mas não fazem sentido continuar aparecendo pro dono como opção de gestão.
        .filter((link) => link.status !== 'expirado' && link.status !== 'revogado')
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
