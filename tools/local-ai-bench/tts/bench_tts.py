#!/usr/bin/env python3
"""Benchmark de TTS na CPU: XTTS-v2 vs Kokoro, com narrações reais. Gera WAVs em out/tts/."""
import json, sys, time, pathlib, os
import soundfile as sf, numpy as np, torch
torch.set_num_threads(int(os.environ.get("THREADS", "4")))
WORK = pathlib.Path("/work"); OUT = WORK / "out/tts"; OUT.mkdir(parents=True, exist_ok=True)
scenes = json.loads((WORK / "samples/scenes.json").read_text())[:3]
results = []

def rec(engine, i, secs_gen, audio_len, extra=""):
    r = {"engine": engine, "scene": i, "gen_seconds": round(secs_gen, 1), "audio_seconds": round(audio_len, 1),
         "rtf": round(secs_gen / audio_len, 2), "chars": len(scenes[i]["narration"])}
    print(json.dumps(r), flush=True); results.append(r)

which = sys.argv[1] if len(sys.argv) > 1 else "both"

if which in ("xtts", "both"):
    from TTS.api import TTS
    os.environ["COQUI_TOS_AGREED"] = "1"
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
    speakers = ["Damien Black", "Claribel Dervla"]  # masculino / feminino embutidos no XTTS
    tts.tts_to_file(text="Aquecendo o modelo.", speaker=speakers[0], language="pt", file_path=str(OUT / "warm.wav"))
    for i, s in enumerate(scenes):
        for spk in speakers:
            t0 = time.time()
            tts.tts_to_file(text=s["narration"], speaker=spk, language="pt", file_path=str(OUT / f"xtts_{spk.split()[0]}_{i}.wav"))
            dt = time.time() - t0
            w, sr = sf.read(OUT / f"xtts_{spk.split()[0]}_{i}.wav")
            rec(f"xtts:{spk}", i, dt, len(w) / sr)

if which in ("kokoro", "both"):
    from kokoro import KPipeline
    pipe = KPipeline(lang_code="p")  # português brasileiro
    for voice, tag in (("pm_alex", "male"), ("pf_dora", "female")):
        list(pipe("Aquecendo o modelo.", voice=voice))
        for i, s in enumerate(scenes):
            t0 = time.time()
            chunks = [a for _, _, a in pipe(s["narration"], voice=voice)]
            audio = np.concatenate([np.asarray(c) for c in chunks]); dt = time.time() - t0
            sf.write(OUT / f"kokoro_{tag}_{i}.wav", audio, 24000)
            rec(f"kokoro:{voice}", i, dt, len(audio) / 24000)

(OUT / "results.json").write_text(json.dumps(results, indent=1))
