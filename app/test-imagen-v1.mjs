const apiKey = "AIzaSyBCBc4m_tVwLL03ZIrvbm4Lb2Z93f526qA";
const model = "imagen-4.0-fast-generate-001";
// Try v1 instead of v1beta
const url = `https://generativelanguage.googleapis.com/v1/models/${model}:predict?key=${apiKey}`;

async function run() {
  console.log(`--- TESTANDO IMAGEN 4 (API v1) ---`);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: "A futuristic city in the style of cyberpunk",
          },
        ],
        parameters: {
          sampleCount: 1,
        },
      }),
    });

    const data = await response.json();
    if (response.ok) {
      console.log("SUCESSO: Imagem gerada via API v1!");
    } else {
      console.log("ERRO API:", JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.log("ERRO FETCH:", e.message);
  }
}

run();
