import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL || "postgresql://fp_user:fp_password@localhost:5434/fantasy_portal_db?schema=public"

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const playerHash = await bcrypt.hash('adventure123', 10);

  // 1. Create/Find Player
  let loveHealt = await prisma.player.findUnique({
    where: { email: 'lovehealt@fantasyportal.com' },
  });

  if (!loveHealt) {
    console.log('Player não encontrado, criando novo...');
    loveHealt = await prisma.player.create({
      data: {
        email: 'lovehealt@fantasyportal.com',
        name: 'LoveHealt',
        passwordHash: playerHash,
        role: 'PLAYER',
        accountStatus: 'ACTIVE',
      },
    });
  } else {
    console.log('Player encontrado:', loveHealt.name);
  }

  // 2. Find or Create Journey
  let journey = await prisma.journey.findFirst({
    where: { playerId: loveHealt.id },
  });

  if (!journey) {
    console.log('Jornada não encontrada, criando nova...');
    journey = await prisma.journey.create({
      data: {
        playerId: loveHealt.id,
        genre: 'Fantasia Épica',
        history: {},
        flags: {},
      }
    });
  }

  // 3. Update Journey with complete Status
  await prisma.journey.update({
    where: { id: journey.id },
    data: {
      playerStatus: {
        hp: 18,
        maxHp: 20,
        sp: 12,
        maxSp: 15,
        combatPower: 25,
        moral: 12, // Benevolente
        skills: ['Cura Suave', 'Visão Noturna'],
        reputations: {
          'Vila dos Sussurros': 18,     // Local (Vila)
          'Reino de Alvorada': 6,       // Mundo/Região
          'Elara, a Erudita': 20,      // NPC
          'Clã das Sombras': -12,      // Facção
          'Mercador Kael': -8,         // NPC
          'Guardião das Montanhas': 4  // NPC
        },
        activeBlessings: [
          { id: 'b1', name: 'Benção de Elara', effect: 'Recupera +2 HP ao final de cada cena.' },
          { id: 'b2', name: 'Aura de Luz', effect: 'Dano reduzido em 10% contra mortos-vivos.' }
        ],
        activeCurses: [
          { id: 'c1', name: 'Marca do Clã', effect: 'Sempre que encontrar um membro do Clã das Sombras, perde -1 SP.', remainingScenes: 3 }
        ]
      },
      playerInventory: [{ name: 'Adaga de Luz', type: 'weapon' }]
    }
  });

  console.log('Dados de reputação, bênçãos e maldições atualizados na jornada de LoveHealt.');
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
