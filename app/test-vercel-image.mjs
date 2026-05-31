import { experimental_generateImage as generateImage } from "ai";
import { google } from "@ai-sdk/google";
import fs from "fs";

// Use the key from .env
process.env.GOOGLE_GENERATIVE_AI_API_KEY = "AIzaSyBCBc4m_tVwLL03ZIrvbm4Lb2Z93f526qA";

async function run() {
  console.log("--- TESTANDO VERCEL AI SDK COM IMAGEN 4 ---");
  try {
    const { image } = await generateImage({
      model: google.image("imagen-3.0-fast-generate-001"), // Vercel SDK internally might map this
      prompt: "A futuristic city in the style of cyberpunk",
    });

    fs.writeFileSync("test-vercel.png", image.uint8Array);
    console.log("SUCESSO: Imagem gerada via Vercel AI SDK!");
  } catch (e) {
    console.log("ERRO VERCEL SDK:", e.message);
    
    console.log("Tentando com imagen-4.0-generate-001...");
    try {
        const { image } = await generateImage({
          model: google.image("imagen-4.0-generate-001"),
          prompt: "A futuristic city in the style of cyberpunk",
        });
        console.log("SUCESSO (V4): Imagem gerada!");
    } catch (e2) {
        console.log("ERRO (V4):", e2.message);
    }
  }
}

run();
