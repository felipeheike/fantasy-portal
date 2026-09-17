import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import type { Prisma } from '@prisma/client';

export type AdminAction =
  | 'PLAYER_STATUS_CHANGE'
  | 'PLAYER_BANNED'
  | 'PASSWORD_RESET'
  | 'IMPERSONATION_START'
  | 'ANNOUNCEMENT_PUBLISHED'
  | 'ANNOUNCEMENT_CLEARED'
  | 'PLAYER_NOTICE_SENT'
  | 'NARRATIVE_CONFIG_UPDATED'
  | 'NARRATIVE_CONFIG_RESET';

interface LogAdminActionInput {
  actorId: string;
  actorName: string;
  action: AdminAction;
  targetPlayerId?: string;
  targetPlayerName?: string;
  metadata?: Record<string, unknown>;
}

// Nunca deve derrubar a ação administrativa em si — se a escrita do log falhar,
// só registramos o erro e seguimos, em vez de propagar e reverter uma ação real.
export async function logAdminAction(input: LogAdminActionInput) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        actorName: input.actorName,
        action: input.action,
        targetPlayerId: input.targetPlayerId,
        targetPlayerName: input.targetPlayerName,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    logger.error('AUDIT_LOG_WRITE_ERR:', error);
  }
}
