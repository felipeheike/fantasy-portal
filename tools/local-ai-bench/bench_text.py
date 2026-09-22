#!/usr/bin/env python3
"""Benchmark de texto local (llama.cpp): usa o system prompt e o JSON Schema reais do app."""
import json, os, sys, time, urllib.request, pathlib

BASE = "http://127.0.0.1:8081"
HERE = pathlib.Path(__file__).parent
system = (HERE / "samples/system_prompt.txt").read_text()
schema = json.loads((HERE / "samples/scene.schema.json").read_text())
scenes = json.loads((HERE / "samples/scenes.json").read_text())
RUNS = int(sys.argv[1]) if len(sys.argv) > 1 else 2
MODE = sys.argv[2] if len(sys.argv) > 2 else "schema"  # schema | json_object
TAG = sys.argv[3] if len(sys.argv) > 3 else MODE  # rótulo do arquivo de saída (ex: nome do modelo)
OUT = HERE / f"out/text_{TAG}.jsonl"

history = "\n\n".join(f"CENA {i+1}: {s['narration']}" for i, s in enumerate(scenes[:3]))
user = (f"HISTÓRICO RECENTE:\n{history}\n\n"
        "AÇÃO DO JOGADOR: Avanço com cautela em direção à luz e examino o que há no fundo da câmara.\n"
        "Gere a próxima cena seguindo as regras.")

def call():
    if MODE == "schema":
        rf = {"type": "json_schema", "json_schema": {"name": "scene", "strict": True, "schema": schema}}
    else:
        rf = {"type": "json_object"}
    body = {"messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
            "stream": True, "max_tokens": int(os.environ.get("MAX_TOKENS", "1800")), "temperature": 0.8,
            "response_format": rf, "cache_prompt": True}
    req = urllib.request.Request(BASE + "/v1/chat/completions", json.dumps(body).encode(),
                                 {"Content-Type": "application/json"})
    t0 = time.time(); ttft = None; text = ""; timings = None
    with urllib.request.urlopen(req, timeout=3600) as r:
        for line in r:
            line = line.decode().strip()
            if not line.startswith("data:") or line.endswith("[DONE]"):
                continue
            ch = json.loads(line[5:])
            if ch.get("timings"): timings = ch["timings"]
            delta = (ch.get("choices") or [{}])[0].get("delta", {}).get("content")
            if delta:
                if ttft is None: ttft = time.time() - t0
                text += delta
    total = time.time() - t0
    try:
        obj = json.loads(text); valid = True
        missing = [k for k in schema.get("required", []) if k not in obj]
    except Exception as e:
        obj = None; valid = False; missing = [str(e)[:80]]
    return {"mode": MODE, "ttft_s": round(ttft or -1, 1), "total_s": round(total, 1),
            "json_valid": valid, "missing_required": missing, "chars": len(text),
            "prompt_tps": round((timings or {}).get("prompt_per_second", -1), 1),
            "gen_tps": round((timings or {}).get("predicted_per_second", -1), 2),
            "prompt_tokens": (timings or {}).get("prompt_n"), "gen_tokens": (timings or {}).get("predicted_n"),
            "narration": (obj or {}).get("narration", "")[:300]}

for i in range(RUNS):
    res = call()
    print(json.dumps(res, ensure_ascii=False), flush=True)
    with open(OUT, "a") as f: f.write(json.dumps(res, ensure_ascii=False) + "\n")
