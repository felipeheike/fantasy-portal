import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL || "postgresql://fp_user:fp_password@localhost:5434/fantasy_portal_db?schema=public"
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Aplicando dados complexos de alma em TODAS as jornadas...");

  // Encontrar todas as jornadas
  const journeys = await prisma.journey.findMany({
    include: { player: true }
  });

  if (journeys.length === 0) {
    console.error("Nenhuma jornada encontrada no banco de dados.");
    return;
  }

  // Atualizar status com dados complexos de alma
  const updatedStatus = {
    hp: 15,
    maxHp: 20,
    sp: 10,
    maxSp: 15,
    combatPower: 12,
    moral: 17, // Karma positivo
    skills: [],
    reputations: {
      'Vila de Alvorada': 12,
      'Guilda dos Sábios': 8,
      'Valak, o Sussurrador': -5,
      'Ordem da Luz': 15,
      'O Mundo': 2
    },
    insightPoints: 3,
    deathCount: 0,
    activeBlessings: [
      {
        id: 'bless-1',
        name: 'Resplendor Primordial',
        effect: '+5 HP Máximo',
        type: 'hp_max',
        value: 5
      }
    ],
    activeCurses: [
      {
        id: 'curse-1',
        name: 'Ecos do Vazio',
        effect: '-1 Moral por turno',
        remainingScenes: 3,
        type: 'moral_hit'
      },
      {
        id: 'curse-2',
        name: 'Olhar do Abismo',
        effect: 'Visão limitada',
        remainingScenes: 'permanent',
        type: 'blindness'
      }
    ]
  };

  for (const journey of journeys) {
    await prisma.journey.update({
      where: { id: journey.id },
      data: {
        playerStatus: updatedStatus as any
      }
    });
    console.log(`✅ Jornada ${journey.id} de "${journey.player?.name}" atualizada com sucesso.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
