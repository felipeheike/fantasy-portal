import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const connectionString = "postgresql://fp_user:fp_password@db_postgres:5432/fantasy_portal_db?schema=public"

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const defaultPlayer = await prisma.player.upsert({
    where: { email: 'tester@duplecake.com' },
    update: {},
    create: {
      id: 'default-player-id',
      email: 'tester@duplecake.com',
      name: 'Tester Hero',
      status: {
        hp: 20,
        maxHp: 20,
        sp: 15,
        maxSp: 15,
        combatPower: 10,
        skills: []
      },
      inventory: []
    },
  })

  console.log({ defaultPlayer })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
