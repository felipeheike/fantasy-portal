const apiKey = "AIzaSyBCBc4m_tVwLL03ZIrvbm4Lb2Z93f526qA";
const model = "imagen-4.0-generate-001";
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;

async function run() {
  console.log(`--- TESTANDO IMAGEN 4 GENERATE (NON-FAST) ---`);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instances: [{ prompt: "A dragon in the clouds" }],
      }),
    });

    const data = await response.json();
    console.log("STATUS:", response.status);
    console.log("RESPONSE:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.log("ERRO:", e.message);
  }
}

run();
