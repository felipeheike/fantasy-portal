# torch 2.5.1 + CUDA 12.1: ainda inclui kernels sm_61 (Pascal); builds cu128+ removem essa arquitetura.
FROM pytorch/pytorch:2.5.1-cuda12.1-cudnn9-runtime
RUN pip install --no-cache-dir diffusers==0.31.0 transformers==4.46.3 accelerate==1.1.1 peft==0.13.2 \
    safetensors fastapi "uvicorn[standard]"
WORKDIR /app
COPY app.py /app/app.py
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
