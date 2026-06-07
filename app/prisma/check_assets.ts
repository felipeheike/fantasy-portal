import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL || "postgresql://fp_user:fp_password@localhost:5434/fantasy_portal_db?schema=public"
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const journeyId = "cmq3ekn4g000478qt4ewh23if";
  const assets = await prisma.asset.findMany({
    where: { journeyId }
  });

  console.log(`=== ASSETS IN DATABASE FOR JOURNEY ${journeyId} ===`);
  console.log(`Total assets: ${assets.length}`);
  for (const a of assets) {
    console.log(`Asset ID: ${a.id}, URL: ${a.url}, Type: ${a.type}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
