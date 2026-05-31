import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const apiKey = "AIzaSyBCBc4m_tVwLL03ZIrvbm4Lb2Z93f526qA";
const ai = new GoogleGenAI({
  apiKey: apiKey,
});

async function run() {
  console.log("--- TESTANDO IMAGEN 4.0 GENERATE ---");
  try {
    const response = await ai.models.generateImages({
      model: "imagen-3.0-generate-001", // Provaremos com 3 primeiro para ver se a cota do user bate, ou trocamos para 4
      prompt: "Um dragão dourado sobre São Paulo, estilo pintura a óleo",
    });

    if (response.images && response.images.length > 0) {
      console.log("SUCESSO: Imagem gerada com sucesso!");
      const img = response.images[0];
      if (img.uint8Array) {
        fs.writeFileSync("test-output.png", img.uint8Array);
        console.log("ARQUIVO: test-output.png salvo.");
      }
    } else {
      console.log("AVISO: Nenhuma imagem na resposta.");
    }
  } catch (e) {
    console.log("ERRO:", e.message);
    if (e.message.includes("not found")) {
        console.log("Tentando com imagen-4.0-generate-001...");
        try {
            const res2 = await ai.models.generateImages({
                model: "imagen-4.0-generate-001",
                prompt: "Um dragão dourado sobre São Paulo, estilo pintura a óleo",
            });
            console.log("SUCESSO (V4): Imagem gerada!");
        } catch (e2) {
            console.log("ERRO (V4):", e2.message);
        }
    }
  }
}

run();
