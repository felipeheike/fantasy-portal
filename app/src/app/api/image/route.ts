import { experimental_generateImage as generateImage } from 'ai';
import { getImageModel } from '@/lib/ai/providers';
import { uploadBuffer } from '@/lib/storage';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { prompt, journeyId, sceneId } = await req.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), { status: 400 });
    }
    
    console.log(`LOG: Generating Image [Prompt: ${prompt.substring(0, 50)}...]`);

    const { image } = await generateImage({
      model: getImageModel(),
      prompt,
    });

    // Caminho amigável no MinIO
    const timestamp = Date.now();
    const fileName = journeyId 
      ? `journeys/${journeyId}/${sceneId || timestamp}.png`
      : `temp/${timestamp}.png`;

    let assetUrl = null;

    try {
      // Upload para o MinIO
      assetUrl = await uploadBuffer(image.uint8Array, fileName, 'image/png');
      console.log(`LOG: Image uploaded to MinIO: ${assetUrl}`);

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
        console.log(`LOG: Asset record created for journey ${journeyId}`);
      }
    } catch (storageError) {
      console.error('!!! STORAGE FAILURE !!!', storageError);
      // Não falha a requisição inteira se o storage falhar, 
      // mas loga o erro e continua para retornar a imagem original
    }

    // Retornamos a imagem original (binário) para manter compatibilidade com o frontend atual
    // O frontend pode ser atualizado posteriormente para usar assetUrl se preferir
    return new Response(Buffer.from(image.uint8Array), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Asset-URL': assetUrl || '',
      },
    });
  } catch (error: any) {
    console.error('!!! IMAGE GENERATION FAILURE !!!', error);
    return new Response(JSON.stringify({ error: 'Falha ao ilustrar cena', details: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
