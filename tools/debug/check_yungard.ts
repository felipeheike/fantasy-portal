import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const connectionString = "postgresql://fp_user:fp_password@localhost:5434/fantasy_portal_db?schema=public"

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function main() {
  // Search in all Journeys where flags or history contain 'Yungard'
  const journeys = await prisma.journey.findMany({
    where: {
      OR: [
        { flags: { path: [], string_contains: 'Yungard' } },
        { history: { path: [], string_contains: 'Yungard' } }
      ]
    }
  });

  if (journeys.length === 0) {
    console.log("Still no specific match found for Yungard in Journey flags or history.");
    // Search in Scenes
    const scenes = await (prisma as any).scene.findMany({
      where: {
        OR: [
          { narration: { contains: 'Yungard', mode: 'insensitive' } },
          { visualDescription: { contains: 'Yungard', mode: 'insensitive' } }
        ]
      },
      include: { journey: true }
    });
    
    if (scenes.length > 0) {
      console.log(`Found ${scenes.length} scenes matching Yungard.`);
      scenes.forEach((s: any) => {
        console.log(`Scene ID: ${s.id}, Order: ${s.order}, Journey ID: ${s.journeyId}, ImageURL: ${s.imageUrl}`);
        console.log(`Narration start: ${s.narration.substring(0, 50)}...`);
      });
    } else {
      console.log("No scenes found matching Yungard either.");
      // Last try: list all journeys to see if I missed something
      const all = await prisma.journey.findMany({ select: { id: true, genre: true, flags: true } });
      console.log("All journeys:", JSON.stringify(all, null, 2));
    }
  } else {
    console.log(`Found ${journeys.length} journeys matching Yungard.`);
    console.log(JSON.stringify(journeys, null, 2));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
