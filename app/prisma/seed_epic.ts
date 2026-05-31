import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("🔥 LIMPANDO DADOS ANTIGOS...");
    await prisma.journey.deleteMany({});
    await prisma.player.deleteMany({});

    console.log("🌱 CRIANDO LEONELSON LENDÁRIO...");

    const leonelsonId = "default-player-id";

    // 1. Criar o Player do Zero
    const player = await prisma.player.create({
      data: {
        id: leonelsonId,
        email: "tester@duplecake.com",
        name: "Leonelson",
        status: {
          hp: 18,
          maxHp: 20,
          sp: 12,
          maxSp: 15,
          combatPower: 15,
          moral: 8,
          skills: [
            { id: "skill_tracking", name: "Rastreamento Arcano", description: "Capacidade de ler rastros mágicos e prever movimentos de feras.", level: 2, maxLevel: 5 },
            { id: "skill_medicina", name: "Medicina de Campo", description: "Conhecimento de ervas para estancar sangramentos.", level: 1, maxLevel: 3 }
          ],
          reputations: {
            "Vila de Alvorada": 15,
            "Guilda dos Mercadores": 5,
            "Sombra Rastejante": -10,
            "Lorde Isanelson": -2
          }
        },
        inventory: [
          { id: "rusted_sword", name: "Espada de Ferro Desgastada", type: "weapon", quantity: 1, description: "Uma lâmina confiável, apesar da idade.", durability: 8, maxDurability: 20 },
          { id: "leather_armor", name: "Couraça de Couro", type: "armor", quantity: 1, description: "Proteção leve para batedores.", durability: 12, maxDurability: 15 },
          { id: "minor_healing", name: "Frasco de Essência Vital", type: "consumable", quantity: 2, description: "Recupera 5 HP instantaneamente." },
          { id: "brass_key", name: "Chave de Latão Retorcida", type: "quest", quantity: 1, description: "Abre o portão leste da capela." }
        ]
      }
    });

    // 2. Criar a Jornada com Histórico Válido
    const journey = await prisma.journey.create({
      data: {
        id: "journey-leonelson-seed",
        playerId: leonelsonId,
        genre: "fantasy",
        status: "active",
        history: [
          {
            sceneId: "initial_scene",
            narration: "Leonelson, o herói da lenda, despertou nas ruínas da Capela das Almas Cinzentas. Seu inventário está repleto e suas habilidades despertas.",
            visualDescription: "Guerreiro gótico nas ruínas",
            options: [
              { id: "opt1", label: "Explorar as ruínas" },
              { id: "opt2", label: "Sair pelo portão" }
            ],
            recommendedInputType: "multiple",
            isGameOver: false
          }
        ],
        flags: {
          playerName: "Leonelson",
          journeyLength: "medium",
          punishSystem: "fail_tolerance_3",
          visualStyle: "dark-realism",
          narrativeStyle: "epic",
          tone: "dark",
          readStyle: "moderate",
          enableImages: true,
          enableAudio: true
        },
        memories: [
          "Leonelson poupou a vida de um sentinela corrompido.",
          "A chave de latão foi encontrada sob um altar quebrado."
        ],
        settings: {
          enableImages: true,
          enableAudio: true,
          notificationHistory: [
            {
              id: "notif-1",
              type: "item",
              title: "✨ Item Encontrado: Espada de Ferro",
              description: "Uma lâmina robusta encontrada nas ruínas.",
              timestamp: Date.now() - 3600000,
              read: true
            },
            {
              id: "notif-2",
              type: "skill",
              title: "🔥 Habilidade Despertada: Rastreamento",
              description: "Você agora pode sentir a presença de feras.",
              timestamp: Date.now() - 1800000,
              read: false
            },
            {
              id: "notif-3",
              type: "reputation",
              title: "⚖️ Fama aumentada em Vila de Alvorada",
              description: "Os camponeses agora confiam na sua lâmina. [+15]",
              timestamp: Date.now() - 600000,
              read: false
            },
            {
              id: "notif-4",
              type: "moral",
              title: "🌟 Ato de Bondade",
              description: "Sua alma brilha ao ajudar os necessitados.",
              timestamp: Date.now() - 300000,
              read: false
            }
          ]
        }
      }
    });

    console.log("✅ SEED ÉPICO FINALIZADO!");
    console.log("Player ID:", player.id, "| Nome:", player.name);
    console.log("Jornada ID:", journey.id, "| Status:", journey.status);

  } catch (e) {
    console.error("❌ ERRO NO SEED:", e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
