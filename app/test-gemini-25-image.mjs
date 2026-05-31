import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI('AIzaSyBCBc4m_tVwLL03ZIrvbm4Lb2Z93f526qA');

async function run() {
  console.log('--- TESTANDO GEMINI 2.5 FLASH IMAGE ---');
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
    const prompt = 'Generate an image of a red cat.';
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log('RESPOSTA:', response.text());
  } catch (e) {
    console.log('ERRO:', e.message);
  }
}
run();
