import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyBCBc4m_tVwLL03ZIrvbm4Lb2Z93f526qA";
const genAI = new GoogleGenerativeAI(API_KEY);

async function identifyModels() {
  console.log("🔍 Investigando modelos disponíveis e cotas...");
  
  try {
    // Para listar modelos, geralmente usamos o endpoint v1beta direto via fetch ou ModelService
    // No entanto, vamos testar os modelos mais comuns do Gemini para verificar cota real.
    const candidates = [
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-1.0-pro",
      "gemini-2.0-flash-exp",
      "gemini-2.0-flash",
      "gemma-2b-it",
      "gemma-7b-it"
    ];

    const results = [];

    for (const modelName of candidates) {
      process.stdout.write(`Testing ${modelName}... `);
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Olá, responda apenas com a palavra 'OK'.");
        const response = await result.response;
        const text = response.text().trim();
        
        if (text.includes("OK")) {
          console.log("✅ VÁLIDO");
          results.push({ model: modelName, status: "VÁLIDO" });
        } else {
          console.log("⚠️ RESPOSTA INESPERADA");
          results.push({ model: modelName, status: "RESPOSTA INESPERADA" });
        }
      } catch (error) {
        if (error.message.includes("429") || error.message.includes("quota")) {
          console.log("❌ COTA EXCEDIDA");
          results.push({ model: modelName, status: "COTA EXCEDIDA" });
        } else if (error.message.includes("404") || error.message.includes("not found")) {
          console.log("🚫 NÃO ENCONTRADO");
        } else {
          console.log(`❗ ERRO: ${error.message.substring(0, 50)}...`);
          results.push({ model: modelName, status: "ERRO", details: error.message });
        }
      }
    }

    console.log("\n--- RESULTADO FINAL DA INVESTIGAÇÃO ---");
    console.table(results);
    
    const validModels = results.filter(r => r.status === "VÁLIDO").map(r => r.model);
    console.log("\nModelos sugeridos para o seu .env:");
    validModels.forEach(m => console.log(`TEXT_MODEL="${m}"`));

  } catch (globalError) {
    console.error("Erro crítico na execução do script:", globalError);
  }
}

identifyModels();
