import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("🌱 CRIANDO LEONELSON LENDÁRIO (COM LOGS)...");

    const leonelsonId = "default-player-id";

    // 1. Upsert do Player
    await prisma.player.upsert({
      where: { id: leonelsonId },
      update: {
        name: "Leonelson",
        status: {
          hp: 18,
          maxHp: 20,
          sp: 12,
          maxSp: 15,
          combatPower: 15,
          moral: 8,
          skills: [
            { id: "skill_tracking", name: "Rastreamento Arcano", description: "Capacidade de ler rastros mágicos.", level: 2, maxLevel: 5 },
            { id: "skill_medicina", name: "Medicina de Campo", description: "Conhecimento de ervas.", level: 1, maxLevel: 3 }
          ],
          reputations: { "Vila de Alvorada": 15, "Guilda dos Mercadores": 5 }
        },
        inventory: [
          { id: "rusted_sword", name: "Espada de Ferro Desgastada", type: "weapon", quantity: 1, description: "Uma lâmina confiável.", durability: 8, maxDurability: 20 },
          { id: "minor_healing", name: "Frasco de Essência Vital", type: "consumable", quantity: 2, description: "Recupera 5 HP." }
        ]
      },
      create: {
        id: leonelsonId,
        email: "tester@duplecake.com",
        name: "Leonelson",
        status: { hp: 20, maxHp: 20, sp: 15, maxSp: 15, combatPower: 10, moral: 0, skills: [], reputations: {} },
        inventory: []
      }
    });

    // 2. Criar Jornada com Histórico de Status
    await prisma.journey.deleteMany({ where: { playerId: leonelsonId } });
    
    await prisma.journey.create({
      data: {
        id: "journey-leonelson-seed",
        playerId: leonelsonId,
        genre: "fantasy",
        status: "active",
        history: [{ sceneId: "scene_1", narration: "Leonelson desperta...", isGameOver: false }],
        flags: { playerName: "Leonelson", journeyLength: "medium", enableImages: true, enableAudio: true },
        settings: {
          enableImages: true,
          enableAudio: true,
          statusHistory: [
            { id: "hlog-1", type: "hp", amount: -2, source: "Garras do Espectro", timestamp: Date.now() - 500000 },
            { id: "slog-1", type: "sp", amount: -3, source: "Salto Acrobático", timestamp: Date.now() - 400000 },
            { id: "hlog-2", type: "hp", amount: 5, source: "Frasco de Essência Vital", timestamp: Date.now() - 300000 }
          ],
          notificationHistory: [
            { id: "n-1", type: "item", title: "✨ Item: Espada de Ferro", timestamp: Date.now() - 1000000, read: true }
          ]
        }
      }
    });

    console.log("✅ Seed Leonelson Concluído!");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
main();
