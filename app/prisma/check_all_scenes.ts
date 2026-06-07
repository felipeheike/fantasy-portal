import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL || "postgresql://fp_user:fp_password@localhost:5434/fantasy_portal_db?schema=public"
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const scenes = await prisma.scene.findMany({
    include: { journey: { include: { player: true } } },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Total scenes in DB: ${scenes.length}`);
  for (const s of scenes) {
    console.log(`Scene ID: ${s.id}, Order: ${s.order}`);
    console.log(`  Journey ID: ${s.journeyId}, Genre: ${s.journey?.genre}`);
    console.log(`  Player Name: ${s.journey?.player?.name}`);
    console.log(`  imageUrl: ${s.imageUrl}`);
    console.log(`  visualDescription: ${s.visualDescription ? s.visualDescription.substring(0, 60) : 'None'}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
