"""Sidecar de imagem local (SD 1.5 + LCM-LoRA), GPU.

Implementa só o endpoint /v1/images/generations no formato que a própria
API da OpenAI usa — não por imitar terceiros por imitar, mas porque isso
deixa o `@ai-sdk/openai` (`createOpenAI(...).image(...)`) falar com esse
sidecar sem nenhum código novo no lado do app, reaproveitando o mesmo
`experimental_generateImage` que já existe pra nuvem.
"""
import base64
import io
import threading
import time

import torch
from diffusers import StableDiffusionPipeline, LCMScheduler
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()
_lock = threading.Lock()
_pipe = None

MODEL_ID = "Lykon/dreamshaper-8"
LCM_LORA_ID = "latent-consistency/lcm-lora-sdv1-5"
STEPS = 4
STYLE_SUFFIX = ", dark fantasy digital painting, dramatic cinematic lighting, highly detailed, no text"
NEGATIVE_PROMPT = "lowres, blurry, text, watermark, signature, deformed, extra limbs, cropped"


def get_pipe():
    global _pipe
    if _pipe is None:
        try:
            pipe = StableDiffusionPipeline.from_pretrained(
                MODEL_ID, torch_dtype=torch.float16, safety_checker=None, requires_safety_checker=False
            )
            pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)
            pipe.load_lora_weights(LCM_LORA_ID)
            pipe.fuse_lora()
            pipe.to("cuda")
            pipe.enable_attention_slicing()
            pipe.enable_vae_slicing()
            _pipe = pipe
        except Exception:
            # Um carregamento que falha no meio (ex.: OOM em .to("cuda")) pode deixar
            # tensores presos na GPU até o traceback ser descartado — sem isso, a
            # próxima tentativa falha de novo mesmo depois de liberar VRAM de outro
            # processo. Solta as referências e devolve a memória cacheada na hora.
            _pipe = None
            torch.cuda.empty_cache()
            raise
    return _pipe


def adapt_prompt(pipe, description: str) -> str:
    """Trunca a descrição pra caber no limite de 77 tokens do CLIP JUNTO com o
    sufixo de estilo — orçar os dois é o que faltou no benchmark original,
    que só truncava a descrição sem contar o espaço que o sufixo ia ocupar."""
    tokenizer = pipe.tokenizer
    budget = tokenizer.model_max_length - 2  # -2: tokens de início/fim (BOS/EOS)
    style_ids = tokenizer(STYLE_SUFFIX, add_special_tokens=False).input_ids
    description_budget = max(budget - len(style_ids), 0)
    description_ids = tokenizer(description, add_special_tokens=False).input_ids[:description_budget]
    return tokenizer.decode(description_ids) + STYLE_SUFFIX


class ImageRequest(BaseModel):
    prompt: str
    n: int | None = 1
    size: str | None = None
    response_format: str | None = None


@app.get("/health")
def health():
    return {"status": "ok", "loaded": _pipe is not None}


@app.post("/v1/images/generations")
def generate(req: ImageRequest):
    if not req.prompt.strip():
        raise HTTPException(400, "Prompt vazio")

    with _lock:  # um job de imagem por vez — a GPU de 4GB não segura mais que isso
        try:
            pipe = get_pipe()
            prompt = adapt_prompt(pipe, req.prompt)
            generator = torch.Generator("cuda")
            image = pipe(
                prompt, negative_prompt=NEGATIVE_PROMPT, num_inference_steps=STEPS,
                guidance_scale=1.5, height=512, width=512, generator=generator,
            ).images[0]
        except Exception as e:
            torch.cuda.empty_cache()
            raise HTTPException(500, f"Falha na geração de imagem: {e}") from None

    buf = io.BytesIO()
    image.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")

    return {"created": int(time.time()), "data": [{"b64_json": b64}]}
