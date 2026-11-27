# 🖥️ IA Local (recurso plus)

Recurso **opcional**: o Fantasy Portal gera **texto, imagem e voz no próprio servidor**, sem chamar as APIs de nuvem. Serve para cortar custo de API, testar sem chave e manter tudo dentro de casa.

O portal funciona normalmente sem ele. A IA local roda em containers à parte (*sidecars*), que só sobem quando pedidos, e qualquer falha volta sozinha para a nuvem.

---

## O que roda localmente

| Tipo | Container | Modelo | Hardware |
|---|---|---|---|
| **Texto** (narrador) | `local_text` | Qwen2.5-3B Instruct (GGUF Q4_K_M, contexto de 8192) via llama.cpp | GPU NVIDIA |
| **Imagem** | `local_image` | Stable Diffusion 1.5 + LCM-LoRA (poucos passos, rápido), uma geração por vez | GPU NVIDIA |
| **Voz** (TTS) | `local_tts` | **Kokoro** (velocidade) ou **XTTS-v2** (qualidade), escolhido no painel admin | CPU |

> Referência de hardware: GTX 1050 Ti com 4 GB de VRAM. Com **texto e imagem locais ligados ao mesmo tempo**, os dois disputam a VRAM. Se faltar memória, a geração volta para a nuvem (o painel avisa).

O texto local segue o mesmo contrato do narrador (`sceneSchema`), então a cena chega no mesmo formato. Um modelo de 3B é bem mais simples que o Gemini, então espere narrativas menos ricas.

---

## Como ligar

### 1. Subir os sidecars
Na pasta `app/`:
```bash
make local-ai-up      # build e start dos 3 containers (profile "local-ai")
make local-ai-logs    # acompanhar (o primeiro start baixa os modelos)
make local-ai-down    # desligar
```
Eles ficam no profile `local-ai` do Docker Compose e **nunca sobem junto com `make dev` ou `make prd`**.

**Onde ficam os modelos:** por padrão em `app/local-ai-models/`. Para guardá-los em outro disco (um HDD, por exemplo), defina no `app/.env`:
```env
LOCAL_AI_MODELS_DIR=/caminho/para/modelos
```

### 2. Ativar no painel admin
Em **Admin → Dashboard → Geração Local**:
- Um toggle para cada tipo: **Imagem**, **Texto** e **Voz**.
- A escolha do motor de voz: **Kokoro** ou **XTTS-v2**.
- Um indicador de saúde de cada sidecar: online, offline ou não configurado.

Os toggles são globais, gravados na tabela `LocalGenerationConfig`. Toda mudança fica no log de auditoria do admin.

As URLs dos sidecars (`LOCAL_TEXT_URL`, `LOCAL_IMAGE_URL`, `LOCAL_TTS_URL`) já vêm definidas nos compose de dev e prd. Se uma delas faltar, o tipo correspondente aparece como "não configurado" e usa a nuvem.

---

## Quem usa a IA local

| Jogador | Com o toggle ligado |
|---|---|
| **Jogador comum sem chave própria** | Usa a IA local |
| **Jogador comum com chave própria (BYOK)** | Continua com a própria chave: o BYOK **sempre vence** |
| **ADMIN** | Usa a IA local mesmo tendo chave própria (ligar o toggle já indica essa intenção) |

## Fallback para a nuvem
- **Imagem e voz:** tenta local e, se falhar (erro, timeout ou sem VRAM), refaz o mesmo pedido na nuvem.
- **Texto:** a resposta é em *streaming*, então não dá para trocar no meio. Antes de cada cena, o portal faz um *health check* de 2 s no `local_text` e, se ele não responder, usa a nuvem desde o início.
- As falhas ficam registradas como erro no log (`LOCAL_*_FALLBACK_TO_CLOUD`).

---

## Para desenvolvedores
- Regra de decisão: `app/src/lib/ai/localGeneration.ts` (`resolveLocalUsage` é pura e testada).
- Pontos de uso: `api/chat/route.ts` (texto), `api/image/route.ts` (imagem), `lib/audio.ts` (voz).
- Health check do painel: `api/admin/local-generation/health`.
- Código dos sidecars: `local-ai/tts/` e `local-ai/image/` (FastAPI). O texto usa a imagem oficial do llama.cpp (`server-cuda`), que já fala o protocolo da OpenAI.
