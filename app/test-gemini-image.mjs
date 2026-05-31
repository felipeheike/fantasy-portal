import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI('AIzaSyBjbg4IoGK5E6SON_E0X-Q2K_EEqM_zht8');

async function run() {
  console.log('--- TESTANDO GERAÇÃO MULTIMODAL ---');
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = 'Gere um objeto JSON para uma cena de RPG. Inclua uma narração e, no campo "imageUrl", gere uma imagem da cena codificada em base64 (data:image/png;base64,...).';
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log('API_RESPONSE_LENGTH:', text.length);
    console.log('API_RESPONSE_PREVIEW:', text.substring(0, 500));
  } catch (e) {
    console.log('ERRO:', e.message);
  }
}
run();
