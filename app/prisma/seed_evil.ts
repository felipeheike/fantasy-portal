import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("🌑 CRIANDO FELIPELSON INFAME (COM LOGS)...");

    const felipelsonId = "evil-player-id";

    // 1. Upsert do Vilão
    await prisma.player.upsert({
      where: { id: felipelsonId },
      update: {
        name: "Felipelson",
        status: {
          hp: 12,
          maxHp: 20,
          sp: 5,
          maxSp: 15,
          combatPower: 25,
          moral: -25,
          skills: [
            { id: "skill_intimidacao", name: "Aura de Pavor", description: "Instila terror profundo.", level: 3, maxLevel: 5 }
          ],
          reputations: { "Vila de Alvorada": -30, "Culto das Sombras": 20 }
        },
        inventory: [
          { id: "cursed_dagger", name: "Adaga Dente de Basilisco", type: "weapon", quantity: 1, description: "Lâmina envenenada.", durability: 15, maxDurability: 15 }
        ]
      },
      create: {
        id: felipelsonId,
        email: "vilao@duplecake.com",
        name: "Felipelson",
        status: { hp: 12, maxHp: 20, sp: 5, maxSp: 15, combatPower: 25, moral: -25, skills: [], reputations: {} },
        inventory: []
      }
    });

    // 2. Criar Jornada com Histórico de Violência
    await prisma.journey.deleteMany({ where: { playerId: felipelsonId } });
    
    await prisma.journey.create({
      data: {
        id: "journey-felipelson-evil",
        playerId: felipelsonId,
        genre: "gothic-horror",
        status: "active",
        history: [{ sceneId: "scene_1", narration: "Felipelson caminha entre as chamas...", isGameOver: false }],
        flags: { playerName: "Felipelson", journeyLength: "epic", enableImages: true, enableAudio: true },
        settings: {
          enableImages: true,
          enableAudio: true,
          statusHistory: [
            { id: "eh-1", type: "hp", amount: -8, source: "Contra-ataque do Paladino", timestamp: Date.now() - 500000 },
            { id: "es-1", type: "sp", amount: -10, source: "Invocação de Sombras", timestamp: Date.now() - 400000 }
          ],
          notificationHistory: [
            { id: "en-1", type: "moral", title: "🌑 Ato de Crueldade", timestamp: Date.now() - 1000000, read: true }
          ]
        }
      }
    });

    console.log("✅ Seed Felipelson Concluído!");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
main();
