import { NextResponse } from 'next/server';
import { getAIConfigMetadata } from '@/lib/ai/providers';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function checkGoogleStatus(model: string, customKey?: string) {
  const apiKey = customKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const start = Date.now();
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${apiKey}`);
    return {
      status: res.ok ? 'Operacional' : 'Erro/Cota',
      latency: `${Date.now() - start}ms`
    };
  } catch {
    return { status: 'Indisponível', latency: 'N/A' };
  }
}

async function checkOpenAIStatus(model: string, customKey?: string) {
  const apiKey = customKey || process.env.OPENAI_API_KEY;
  if (!apiKey) return { status: 'Sem Chave', latency: 'N/A' };
  
  const start = Date.now();
  try {
    const res = await fetch(`https://api.openai.com/v1/models/${model}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    return {
      status: res.ok ? 'Operacional' : 'Erro/Cota',
      latency: `${Date.now() - start}ms`
    };
  } catch {
    return { status: 'Indisponível', latency: 'N/A' };
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    let userConfig: any = undefined;

    if (session) {
      const player = await prisma.player.findUnique({
        where: { id: (session.user as any).id },
        select: { apiKeys: true, apiEnabled: true, aiPreferences: true }
      });
      if (player) userConfig = player;
    }

    const config = getAIConfigMetadata(userConfig);
    
    let textInfo = { status: 'Configurado', latency: 'N/A' };
    let imageInfo = { status: 'Configurado', latency: 'N/A' };

    // Text Provider Check
    if (config.text.model.startsWith('gpt')) {
      textInfo = await checkOpenAIStatus(config.text.model, userConfig?.apiKeys?.openai);
    } else {
      textInfo = await checkGoogleStatus(config.text.model, userConfig?.apiKeys?.gemini);
    }

    // Image Provider Check
    if (config.image.model.startsWith('dall-e')) {
      imageInfo = await checkOpenAIStatus(config.image.model, userConfig?.apiKeys?.openai);
    } else {
      imageInfo = await checkGoogleStatus(config.image.model, userConfig?.apiKeys?.gemini);
    }

    return NextResponse.json({
      text: {
        model: config.text.model,
        isCustom: config.text.isCustomKey,
        ...textInfo
      },
      image: {
        model: config.image.model,
        isCustom: config.image.isCustomKey,
        ...imageInfo
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
