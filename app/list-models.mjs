import { GoogleGenAI } from "@google/genai";

const apiKey = "AIzaSyBCBc4m_tVwLL03ZIrvbm4Lb2Z93f526qA";
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
