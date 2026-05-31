import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyBCBc4m_tVwLL03ZIrvbm4Lb2Z93f526qA";
// Note: We need a different approach to list models as it's not in the main SDK easily
// We'll use fetch directly on the v1beta endpoint.

async function listAllModels() {
  console.log("📡 Consultando ModelService do Google...");
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("❌ Erro da API:", data.error.message);
      return;
    }

    const models = data.models || [];
    console.log(`✅ Encontrados ${models.length} modelos.\n`);

    const results = [];
    for (const m of models) {
      if (m.supportedGenerationMethods.includes("generateContent")) {
        const shortName = m.name.replace("models/", "");
        results.push({
          name: shortName,
          displayName: m.displayName,
          version: m.version,
          description: m.description
        });
      }
    }

    console.table(results.map(r => ({ Modelo: r.name, Nome: r.displayName })));
    
    console.log("\n🧪 Testando validade de cota para os principais...");
    const genAI = new GoogleGenerativeAI(API_KEY);
    const topCandidates = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp", "gemini-2.0-flash"];
    
    for (const modelId of topCandidates) {
      if (!results.find(r => r.name === modelId)) continue;
      
      process.stdout.write(`Testando ${modelId}... `);
      try {
        const model = genAI.getGenerativeModel({ model: modelId });
        const result = await model.generateContent("Responder com 'OK'");
        const resp = await result.response;
        console.log("✅ VÁLIDO");
      } catch (e) {
        if (e.message.includes("429")) console.log("❌ SEM COTA (429)");
        else console.log(`❗ ERRO: ${e.message.substring(0, 30)}`);
      }
    }

  } catch (err) {
    console.error("Erro ao listar modelos:", err);
  }
}

listAllModels();
