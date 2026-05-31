const apiKey = "AIzaSyBCBc4m_tVwLL03ZIrvbm4Lb2Z93f526qA";
const model = "imagen-4.0-fast-generate-001";
const url = `https://generativelanguage.googleapis.com/v1/models/${model}:predict?key=${apiKey}`;

async function run() {
  console.log(`--- TESTANDO IMAGEN 4 (DEBUG v1) ---`);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instances: [{ prompt: "test" }],
      }),
    });

    console.log("STATUS:", response.status);
    const text = await response.text();
    console.log("RESPONSE:", text);
  } catch (e) {
    console.log("ERRO:", e.message);
  }
}

run();
