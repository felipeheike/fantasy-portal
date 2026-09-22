#!/usr/bin/env python3
"""Benchmark de imagem local: SD 1.5 fine-tune + LCM-LoRA numa GPU de 4 GB."""
import json, sys, time, pathlib, torch
from diffusers import StableDiffusionPipeline, LCMScheduler

MODEL = sys.argv[1] if len(sys.argv) > 1 else "Lykon/dreamshaper-8"
STEPS = [int(s) for s in (sys.argv[2] if len(sys.argv) > 2 else "4,6").split(",")]
WORK = pathlib.Path("/work"); OUT = WORK / "out/image"; OUT.mkdir(parents=True, exist_ok=True)
scenes = json.loads((WORK / "samples/scenes.json").read_text())

print("GPU:", torch.cuda.get_device_name(0), "| VRAM total GB:",
      round(torch.cuda.get_device_properties(0).total_memory / 1e9, 2), flush=True)

pipe = StableDiffusionPipeline.from_pretrained(MODEL, torch_dtype=torch.float16, safety_checker=None,
                                               requires_safety_checker=False)
pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)
pipe.load_lora_weights("latent-consistency/lcm-lora-sdv1-5")
pipe.fuse_lora()
pipe.to("cuda")
pipe.enable_attention_slicing()
pipe.enable_vae_slicing()

STYLE = ", dark fantasy digital painting, dramatic cinematic lighting, highly detailed, no text"
NEG = "lowres, blurry, text, watermark, signature, deformed, extra limbs, cropped"

def adapt(desc: str) -> str:
    ids = pipe.tokenizer(desc, truncation=False).input_ids[1:-1][:55]  # ~55 tokens + estilo cabem nos 77 do CLIP
    return pipe.tokenizer.decode(ids) + STYLE

results = []
gen = torch.Generator("cuda").manual_seed(7)
pipe(adapt(scenes[0]["visualDescription"]), num_inference_steps=2, guidance_scale=1.5,
     height=512, width=512, generator=gen)  # warm-up
for steps in STEPS:
    for i, s in enumerate(scenes):
        torch.cuda.reset_peak_memory_stats(); torch.cuda.synchronize(); t0 = time.time()
        img = pipe(adapt(s["visualDescription"]), negative_prompt=NEG, num_inference_steps=steps,
                   guidance_scale=1.5, height=512, width=512, generator=gen).images[0]
        torch.cuda.synchronize(); dt = time.time() - t0
        peak = round(torch.cuda.max_memory_allocated() / 1e9, 2)
        img.save(OUT / f"scene{i}_steps{steps}.png")
        r = {"scene": i, "steps": steps, "seconds": round(dt, 1), "peak_vram_gb": peak}
        print(json.dumps(r), flush=True); results.append(r)

for steps in STEPS:
    ts = sorted(r["seconds"] for r in results if r["steps"] == steps)
    print(f"steps={steps}: p50={ts[len(ts)//2]}s min={ts[0]}s max={ts[-1]}s")
(OUT / "results.json").write_text(json.dumps(results, indent=1))
