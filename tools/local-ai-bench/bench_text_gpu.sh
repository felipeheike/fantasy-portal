#!/bin/bash
# Uso: bench_text_gpu.sh <arquivo.gguf> <tag> [ngl]
set -e
MODEL=$1; TAG=$2; NGL=${3:-99}
docker rm -f bench_llama_gpu >/dev/null 2>&1 || true
docker run -d --name bench_llama_gpu --gpus all \
  -v "$PWD/models/text/$MODEL:/models/model.gguf:ro" \
  -p 127.0.0.1:8081:8080 \
  ghcr.io/ggml-org/llama.cpp:server-cuda \
  -m /models/model.gguf -c 8192 -ngl $NGL --host 0.0.0.0 --port 8080 >/dev/null
for i in $(seq 1 60); do
  s=$(curl -s -m 2 -o /dev/null -w '%{http_code}' localhost:8081/health || true)
  [ "$s" = 200 ] && break
  sleep 2
done
echo "--- carregamento ($TAG) ---"
docker logs bench_llama_gpu 2>&1 | grep -iE "error|CUDA0 |offloaded|VRAM" | tail -8
python3 bench_text.py 2 schema "$TAG" 2>&1 | tee -a out/text_gpu_$TAG.log
docker rm -f bench_llama_gpu >/dev/null 2>&1
