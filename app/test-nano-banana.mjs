import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI('AIzaSyBjbg4IoGK5E6SON_E0X-Q2K_EEqM_zht8');

async function run() {
  console.log('--- TESTANDO NANO BANANA (GEMINI 2.5 FLASH IMAGE) ---');
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
    const prompt = 'Gere uma imagem de um dragão de gelo atacando uma aldeia medieval.';
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    const parts = response.candidates?.[0]?.content?.parts || [];
    console.log('PARTES_DA_RESPOSTA:', JSON.stringify(parts, null, 2));

  } catch (e) {
    console.log('ERRO:', e.message);
  }
}
run();
