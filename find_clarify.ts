import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const journeys = await prisma.journey.findMany();
  const clarifyJourney = journeys.find(j => (j.flags as any)?.playerName === 'Clarify');
  if (clarifyJourney) {
    console.log(JSON.stringify(clarifyJourney, null, 2));
  } else {
    console.log('Clarify not found');
  }
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
