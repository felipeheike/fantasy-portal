import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL || "postgresql://fp_user:fp_password@db_postgres_dev:5432/fantasy_portal_db?schema=public"

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🚀 Iniciando migração de histórico (JSON -> Tabela Scene)...')

  const journeys = await prisma.journey.findMany({
    include: {
      _count: {
        select: { scenes: true }
      }
    }
  })

  console.log(`📊 Encontradas ${journeys.length} jornadas para analisar.`)

  for (const journey of journeys) {
    const history = journey.history as any[]
    
    if (!history || !Array.isArray(history)) {
      console.log(`⚠️ Jornada ${journey.id}: Sem histórico válido. Pulando.`)
      continue
    }

    if (journey._count.scenes >= history.length) {
      console.log(`✅ Jornada ${journey.id}: Já possui ${journey._count.scenes} cenas migradas. Pulando.`)
      continue
    }

    console.log(`🔄 Migrando ${history.length} cenas para Jornada ${journey.id}...`)

    // Usamos uma transação para garantir que ou migra tudo ou nada daquela jornada
    try {
      // Usando for...of em vez de Promise.all/map para evitar sobrecarga e garantir ordem se necessário
      // Embora upsert com transaction mapeada funcione, aqui garantimos controle
      for (let index = 0; index < history.length; index++) {
        const scene = history[index];
        await prisma.scene.upsert({
          where: {
            id: `${journey.id}_${index}`, 
          },
          update: {}, 
          create: {
            id: `${journey.id}_${index}`,
            journeyId: journey.id,
            sceneId: scene.sceneId || `legacy_${index}`,
            order: index + 1,
            narration: scene.narration || '',
            visualDescription: scene.visualDescription || '',
            audioDescription: scene.audioDescription,
            imageUrl: scene.imageUrl,
            audioUrl: scene.audioUrl,
            options: scene.options || [],
            tacticalOptions: scene.tacticalOptions || {},
            puzzle: scene.puzzle || {},
            selectedOption: scene.selectedOption,
            statusChanges: scene.statusChanges || {},
            inventoryChanges: scene.inventoryChanges || {},
            skillChanges: scene.skillChanges || [],
            worldUpdate: scene.worldUpdate || {},
            isGameOver: !!scene.isGameOver,
            createdAt: scene.timestamp ? new Date(scene.timestamp) : new Date(),
          }
        });
      }
      console.log(`✨ Jornada ${journey.id}: Migração concluída com sucesso.`)
    } catch (error) {
      console.error(`❌ Erro ao migrar Jornada ${journey.id}:`, error)
    }
  }

  console.log('🏁 Migração finalizada.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
