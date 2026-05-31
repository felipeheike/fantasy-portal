import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI('AIzaSyBjbg4IoGK5E6SON_E0X-Q2K_EEqM_zht8');

async function run() {
  console.log('--- TESTANDO GEMINI 2.5 FLASH ---');
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = 'Olá, responda em uma palavra: Sucesso.';
    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log('API_RESPONSE:', response.text());
  } catch (e) {
    console.log('ERRO:', e.message);
  }
}
run();
