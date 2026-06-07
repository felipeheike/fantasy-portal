import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL || "postgresql://fp_user:fp_password@localhost:5434/fantasy_portal_db?schema=public"
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const journeyId = "cmq3ekn4g000478qt4ewh23if";
  const journey = await prisma.journey.findUnique({
    where: { id: journeyId }
  });

  if (!journey) {
    console.error("Journey not found");
    return;
  }

  console.log(`=== HISTORY IMAGES FOR JOURNEY ${journeyId} ===`);
  const history = journey.history as any[];
  for (const s of history) {
    console.log(`SceneId: ${s.sceneId}`);
    console.log(`  imageUrl: ${s.imageUrl}`);
    console.log(`  imageError: ${s.imageError}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
