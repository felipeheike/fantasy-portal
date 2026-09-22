FROM python:3.11-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg libsndfile1 espeak-ng git && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir torch==2.5.1 torchaudio==2.5.1 --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir coqui-tts==0.25.3 "transformers<4.50" kokoro==0.9.4 soundfile
RUN pip install --no-cache-dir click typer
WORKDIR /work
COPY bench_tts.py /work/bench_tts.py
