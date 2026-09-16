import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { logger } from '@/lib/logger';

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const connectionString = process.env.DATABASE_URL || "postgresql://fp_user:fp_password@db_postgres:5432/fantasy_portal_db?schema=public"

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  })

// Helper para verificar saúde do banco e dar avisos claros
export async function checkDatabaseHealth() {
  try {
    await prisma.player.findFirst();
    return { ok: true };
  } catch (error: any) {
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      logger.error("\n" + "=".repeat(60));
      logger.error("🚨 ERRO DE BANCO DE DADOS: Tabela 'Player' não encontrada.");
      logger.error("Isso geralmente significa que as migrações não foram aplicadas.");
      logger.error("Execute: npx prisma migrate deploy (Produção) ou prisma migrate dev (Dev)");
      logger.error("=".repeat(60) + "\n");
      return { ok: false, error: "Database not initialized" };
    }
    return { ok: false, error: error.message };
  }
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
