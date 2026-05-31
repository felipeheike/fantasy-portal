import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI("AIzaSyAJy7rVyO-tsJifzmwrRHA6V2aJzwA7-Ic");

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    
    const prompt = `
    Você é o Narrador do Fantasy Portal. Responda APENAS com um objeto JSON válido seguindo este schema:
    {
      "sceneId": "string",
      "narration": "string",
      "visualDescription": "string",
      "recommendedInputType": "binary | multiple | combined | interpretative",
      "isGameOver": boolean,
      "options": [{"id": "string", "label": "string"}]
    }
    
    USER: Inicie a jornada para um herói chamado "Teste".
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log('--- RAW AI RESPONSE ---');
    console.log(text);
    
    // Try parsing
    const jsonStr = text.replace(/\`\`\`json|\`\`\`/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    console.log('--- PARSED JSON ---');
    console.log(JSON.stringify(parsed, null, 2));
    
  } catch (e) {
    console.error('DIAGNOSIS_ERROR:' + e.message);
  }
}
run();
