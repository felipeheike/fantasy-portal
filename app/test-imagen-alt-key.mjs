const apiKey = "AIzaSyAJy7rVyO-tsJifzmwrRHA6V2aJzwA7-Ic";
const model = "imagen-4.0-fast-generate-001";
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;

async function run() {
  console.log(`--- TESTANDO IMAGEN 4 COM CHAVE ALTERNATIVA ---`);
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
      console.log("SUCESSO: Imagem gerada com a chave alternativa!");
      if (data.predictions && data.predictions.length > 0) {
        console.log("DADOS: Imagem encontrada!");
      }
    } else {
      console.log("ERRO API:", JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.log("ERRO FETCH:", e.message);
  }
}

run();
