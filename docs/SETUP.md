# 🛠️ Guia de Configuração e Instalação

Siga os passos abaixo para configurar o ambiente e rodar o **Fantasy Portal** localmente.

## 📋 Pré-requisitos
*   **Docker & Docker Compose** (v2.0+)
*   **Node.js** (v20+) - Para comandos auxiliares se necessário
*   **Chaves de API:**
    *   [Google AI Studio](https://aistudio.google.com/) (Para o Gemini)
    *   [OpenAI Platform](https://platform.openai.com/) (Para DALL-E e TTS)

## 🚀 Passo a Passo

### 1. Clonar o Repositório
```bash
git clone <url-do-repositorio>
cd fantasy-portal/app
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na pasta `/app` baseado no `.env.example`:
```bash
cp .env.example .env
```
Preencha as seguintes chaves essenciais:
*   `GOOGLE_AI_API_KEY`: Sua chave do Gemini.
*   `OPENAI_API_KEY`: Sua chave da OpenAI.
*   `DATABASE_URL`: URL de conexão com o PostgreSQL (o padrão do Docker é `postgresql://fp_user:fp_password@db_postgres_dev:5432/fantasy_portal_db`).

### 3. Subir a Infraestrutura (Docker)
Utilize o Makefile na raiz da pasta `/app`:
```bash
make dev
```
Este comando subirá os containers do:
*   **App (Next.js)** em modo desenvolvimento.
*   **PostgreSQL** para o banco de dados.
*   **MinIO** para armazenamento de mídia (S3 Local).
*   **Redis** para filas e cache (se habilitado).

### 4. Sincronizar o Banco de Dados
Com os containers rodando, execute as migrações do Prisma:
```bash
make prisma-migrate
```

### 5. Acesso ao Sistema
O portal estará disponível em:
*   **App:** `http://localhost:25035`
*   **MinIO Console:** `http://localhost:9001` (Usuário: `minioadmin`, Senha: `minioadmin`)

---
**Dica:** Para rodar em produção, utilize `make prd`.
