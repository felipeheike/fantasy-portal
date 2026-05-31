import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

async function run() {
  console.log('--- TESTANDO GEMINI 2.5 FLASH MULTIMODAL ---');
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = 'Gere uma narração curta de um dragão e uma descrição visual para uma imagem. Tente retornar um JSON com campos: texto, visual.';
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log('TEXTO_RETORNADO:', response.text());
    
    console.log('\n--- TESTANDO GERAÇÃO DE IMAGEM (MODALITY) ---');
    const imgPrompt = 'Gere uma imagem de um guerreiro em uma floresta de cristal.';
    // In some SDK versions/models, you might need to check for generated images in candidates
    const imgResult = await model.generateContent(imgPrompt);
    const imgResponse = await imgResult.response;
    
    // Check for inlineData or other modalities in the response parts
    const parts = imgResponse.candidates?.[0]?.content?.parts || [];
    console.log('PARTES_DA_RESPOSTA:', JSON.stringify(parts, null, 2));

  } catch (e) {
    console.log('ERRO:', e.message);
    console.log('STACK:', e.stack);
  }
}
run();
