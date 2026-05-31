import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI('AIzaSyBCBc4m_tVwLL03ZIrvbm4Lb2Z93f526qA');

async function run() {
  console.log('--- LISTANDO MODELOS (SDK GENERATIVE-AI) ---');
  try {
    // List models is not directly on genAI in the new SDK version sometimes, 
    // but we can use the REST API via fetch.
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyBCBc4m_tVwLL03ZIrvbm4Lb2Z93f526qA`);
    const data = await res.json();
    console.log('MODELOS:', JSON.stringify(data.models.map(m => m.name), null, 2));
  } catch (e) {
    console.log('ERRO:', e.message);
  }
}
run();
