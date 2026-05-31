import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const apiKey = "AIzaSyBCBc4m_tVwLL03ZIrvbm4Lb2Z93f526qA";
const ai = new GoogleGenAI({
  apiKey: apiKey,
});

async function run() {
  console.log("--- TESTANDO IMAGEN 4.0 GENERATE (SDK) ---");
  try {
    const response = await ai.models.generateImages({
      model: "imagen-4.0-generate-001",
      prompt: "A beautiful golden dragon flying over a medieval castle",
    });

    if (response.images && response.images.length > 0) {
      console.log("SUCESSO: Imagem gerada!");
      fs.writeFileSync("test-sdk-4.png", response.images[0].uint8Array);
    } else {
      console.log("AVISO: Nenhuma imagem.");
    }
  } catch (e) {
    console.log("ERRO SDK:", e.message);
  }
}

run();
