import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Diga OK se você está funcionando.');
    const response = await result.response;
    console.log('RESULTADO_API:' + response.text());
  } catch (e) {
    console.log('ERRO_API:' + e.message);
  }
}
run();
