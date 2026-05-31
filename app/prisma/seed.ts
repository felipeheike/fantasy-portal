import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL || "postgresql://fp_user:fp_password@db_postgres:5432/fantasy_portal_db?schema=public"

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const adminHash = await bcrypt.hash('adminportal', 10);
  const playerHash = await bcrypt.hash('adventure123', 10);

  const admin = await prisma.player.upsert({
    where: { email: 'admin@fantasyportal.com' },
    update: {
      passwordHash: adminHash,
      role: 'ADMIN',
      accountStatus: 'ACTIVE'
    },
    create: {
      email: 'admin@fantasyportal.com',
      name: 'Mestre do Portal',
      passwordHash: adminHash,
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      status: { hp: 20, maxHp: 20, sp: 15, maxSp: 15, combatPower: 30, moral: 0, skills: [], reputations: {} },
      inventory: []
    },
  });

  const defaultPlayer = await prisma.player.upsert({
    where: { email: 'tester@duplecake.com' },
    update: {
      passwordHash: playerHash,
      accountStatus: 'ACTIVE'
    },
    create: {
      id: 'default-player-id',
      email: 'tester@duplecake.com',
      name: 'Leonelson',
      passwordHash: playerHash,
      role: 'PLAYER',
      accountStatus: 'ACTIVE',
      status: {
        hp: 20,
        maxHp: 20,
        sp: 15,
        maxSp: 15,
        combatPower: 10,
        moral: 0,
        skills: [],
        reputations: {}
      },
      inventory: []
    },
  })

  console.log({ admin, defaultPlayer })
}

main()
  .then(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    await pool.end()
    process.exit(1)
  })
