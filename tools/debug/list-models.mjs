import { GoogleGenAI } from "@google/genai";

// Lê a chave do ambiente (nunca deixe a chave escrita no código: este repo é público).
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!apiKey) throw new Error("Defina GOOGLE_GENERATIVE_AI_API_KEY no ambiente.");
const ai = new GoogleGenAI({
  apiKey: apiKey,
});

async function run() {
  console.log("--- LISTANDO MODELOS DISPONÍVEIS ---");
  try {
    // Note: The @google/genai SDK might not have a direct listModels method like the older SDK, 
    // or it might be models.list()
    // Let's check the older SDK instead for listing as it's more standard for listing.
  } catch (e) {
    console.log("ERRO:", e.message);
  }
}
run();
