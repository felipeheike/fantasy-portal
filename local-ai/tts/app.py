"""Sidecar de TTS local (Kokoro + XTTS-v2), CPU-only.

Contrato simples e próprio (não é a API da OpenAI): esse sidecar só é chamado
pelo Fantasy Portal, então não há motivo pra imitar um formato de terceiros.
Os dois motores ficam com carregamento preguiçoso (o primeiro pedido de cada
um paga o custo de load) e permanecem quentes na RAM depois disso.
"""
import os
import subprocess
import tempfile
import threading

import numpy as np
import soundfile as sf
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

app = FastAPI()
_lock = threading.Lock()
_engines: dict = {}

KOKORO_VOICES = {"male": "pm_alex", "female": "pf_dora"}
XTTS_SPEAKERS = {"male": "Damien Black", "female": "Claribel Dervla"}


def _load_kokoro():
    from kokoro import KPipeline
    return KPipeline(lang_code="p")  # português brasileiro


def _load_xtts():
    from TTS.api import TTS
    os.environ.setdefault("COQUI_TOS_AGREED", "1")
    return TTS("tts_models/multilingual/multi-dataset/xtts_v2")


def get_engine(name: str):
    with _lock:
        if name not in _engines:
            _engines[name] = _load_kokoro() if name == "kokoro" else _load_xtts()
        return _engines[name]


def pcm_to_mp3(audio: np.ndarray, sample_rate: int) -> bytes:
    pcm16 = (np.clip(audio, -1.0, 1.0) * 32767).astype(np.int16).tobytes()
    proc = subprocess.run(
        ["ffmpeg", "-f", "s16le", "-ar", str(sample_rate), "-ac", "1", "-i", "pipe:0",
         "-codec:a", "libmp3lame", "-b:a", "128k", "-f", "mp3", "pipe:1"],
        input=pcm16, capture_output=True, check=True,
    )
    return proc.stdout


class SpeechRequest(BaseModel):
    text: str
    engine: str = "kokoro"  # "kokoro" | "xtts"
    gender: str = "male"    # "male" | "female"


@app.get("/health")
def health():
    return {"status": "ok", "engines_loaded": list(_engines.keys())}


@app.post("/v1/speech")
def synthesize(req: SpeechRequest):
    if req.engine not in ("kokoro", "xtts"):
        raise HTTPException(400, f"Engine desconhecida: {req.engine}")
    if not req.text.strip():
        raise HTTPException(400, "Texto vazio")

    try:
        engine = get_engine(req.engine)
        if req.engine == "kokoro":
            voice = KOKORO_VOICES.get(req.gender, KOKORO_VOICES["male"])
            chunks = [audio for _, _, audio in engine(req.text, voice=voice)]
            audio = np.concatenate([np.asarray(c) for c in chunks])
            mp3 = pcm_to_mp3(audio, 24000)
        else:
            # tts_to_file + releitura em vez de assumir a sample rate do modelo:
            # é o mesmo método usado no benchmark (tools/local-ai-bench/tts/bench_tts.py).
            speaker = XTTS_SPEAKERS.get(req.gender, XTTS_SPEAKERS["male"])
            with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
                engine.tts_to_file(text=req.text, speaker=speaker, language="pt", file_path=tmp.name)
                audio, sample_rate = sf.read(tmp.name)
            mp3 = pcm_to_mp3(audio, sample_rate)
    except Exception as e:
        raise HTTPException(500, f"Falha na síntese ({req.engine}): {e}")

    return Response(content=mp3, media_type="audio/mpeg")
