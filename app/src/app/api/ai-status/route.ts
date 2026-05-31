import { NextResponse } from 'next/server';
import { getAIConfigMetadata } from '@/lib/ai/providers';

async function checkGoogleStatus(model: string) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
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

async function checkOpenAIStatus(model: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { status: 'Sem Chave', latency: 'N/A' };
  
  const start = Date.now();
  try {
    // Ping models endpoint to check API health/connectivity
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
    const config = getAIConfigMetadata();
    
    let textInfo = { status: 'Configurado', latency: 'N/A' };
    let imageInfo = { status: 'Configurado', latency: 'N/A' };

    // Text Provider Check
    if (config.text.provider === 'google') {
      textInfo = await checkGoogleStatus(config.text.model);
    } else if (config.text.provider === 'openai') {
      textInfo = await checkOpenAIStatus(config.text.model);
    } else if (config.text.provider === 'anthropic') {
      // Anthropic ping is more restricted, simulating for now if key exists
      textInfo = { 
        status: process.env.ANTHROPIC_API_KEY ? 'Operacional' : 'Sem Chave', 
        latency: '---' 
      };
    }

    // Image Provider Check
    if (config.image.provider === 'google') {
      imageInfo = await checkGoogleStatus(config.image.model);
    } else if (config.image.provider === 'openai') {
      imageInfo = await checkOpenAIStatus(config.image.model);
    }

    return NextResponse.json({
      text: {
        model: config.text.model,
        provider: config.text.provider,
        ...textInfo
      },
      image: {
        model: config.image.model,
        provider: config.image.provider,
        ...imageInfo
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
