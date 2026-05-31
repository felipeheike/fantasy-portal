import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI("AIzaSyAJy7rVyO-tsJifzmwrRHA6V2aJzwA7-Ic");

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-pro-preview' });
    const result = await model.generateContent('Diga OK se você está ativo e pronto para narrar o Fantasy Portal.');
    const response = await result.response;
    console.log('API_RESPONSE:' + response.text());
  } catch (e) {
    console.error('API_ERROR:' + e.message);
  }
}
run();
