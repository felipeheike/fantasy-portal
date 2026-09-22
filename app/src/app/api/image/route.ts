import { experimental_generateImage as generateImage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { getImageModel, hasOwnImageKey } from '@/lib/ai/providers';
import { uploadBuffer } from '@/lib/storage';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logger } from '@/lib/logger';
import { shouldUseLocal } from '@/lib/ai/localGeneration';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { prompt, journeyId, sceneId } = await req.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), { status: 400 });
    }
    
    // Fetch User AI Config (BYOK)
    let userConfig = undefined;
    if (session) {
      const player = await prisma.player.findUnique({
        where: { id: session.user.id },
        select: { apiKeys: true, aiPreferences: true, apiEnabled: true }
      });
      if (player) userConfig = player;
    }

    logger.log(`LOG: Generating Image [Prompt: ${prompt.substring(0, 50)}...]`);

    // Geração local (SD 1.5 + LCM-LoRA): mesmo endpoint /images/generations da
    // OpenAI, então basta trocar o model. Diferente do texto (que faz stream),
    // aqui dá pra tentar local e cair pra nuvem no mesmo pedido se falhar.
    let image;
    if (await shouldUseLocal('image', hasOwnImageKey(userConfig), session?.user.role)) {
      try {
        logger.log('LOG: Generating local image (SD 1.5 + LCM-LoRA)');
        const localOpenai = createOpenAI({ baseURL: `${process.env.LOCAL_IMAGE_URL}/v1`, apiKey: 'not-needed' });
        ({ image } = await generateImage({ model: localOpenai.image('dreamshaper'), prompt }));
      } catch (err) {
        // .error() de propósito (não .warn()): warn é silenciado em produção, e uma
        // falha local que cai pra nuvem é exatamente o tipo de coisa que precisa
        // aparecer no log de produção pra alguém notar antes de virar hábito.
        logger.error('LOCAL_IMAGE_FAILED_FALLBACK_TO_CLOUD:', err);
      }
    }
    if (!image) {
      ({ image } = await generateImage({ model: getImageModel(userConfig), prompt }));
    }

    // Caminho amigável no MinIO
    const timestamp = Date.now();
    const fileName = journeyId 
      ? `journeys/${journeyId}/${sceneId || timestamp}.png`
      : `temp/${timestamp}.png`;

    let assetUrl = null;

    try {
      // Upload para o MinIO
      assetUrl = await uploadBuffer(image.uint8Array, fileName, 'image/png');
      logger.log(`LOG: Image uploaded to MinIO: ${assetUrl}`);

      // Se tiver journeyId, salva no banco de dados
      if (journeyId) {
        await prisma.asset.create({
          data: {
            journeyId,
            url: assetUrl,
            type: 'AI_GENERATED',
            metadata: {
              prompt,
              sceneId,
              fileName
            }
          }
        });
        logger.log(`LOG: Asset record created for journey ${journeyId}`);
      }
    } catch (storageError) {
      logger.error('!!! STORAGE FAILURE !!!', storageError);
    }

    return new Response(Buffer.from(image.uint8Array), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Asset-URL': assetUrl || '',
      },
    });
  } catch (error: any) {
    logger.error('!!! IMAGE GENERATION FAILURE !!!', error);
    return new Response(JSON.stringify({ error: 'Falha ao ilustrar cena', details: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
