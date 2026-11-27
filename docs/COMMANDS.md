# ⌨️ Comandos e Operação do Sistema

O projeto utiliza um `Makefile` na pasta `/app` para simplificar as operações recorrentes do desenvolvedor.

## 🚀 Docker & Lifecycle
*   `make dev`: Inicia o ambiente de desenvolvimento.
*   `make prd`: Inicia o ambiente de produção (build otimizado).
*   `make down`: Para e remove todos os containers.
*   `make status`: Lista o status dos containers do projeto.
*   `make test`: Roda a suíte de testes (Vitest) dentro do container de dev.
*   `make clean`: Remove volumes, containers e limpa o sistema Docker (Cuidado!).
*   `make dev-logs`: Acompanha os logs em tempo real do Next.js.

## 🖥️ IA Local (recurso plus)
*   `make local-ai-up`: Sobe os sidecars de texto, imagem e voz (profile `local-ai`). O primeiro start baixa os modelos.
*   `make local-ai-logs`: Acompanha os logs dos sidecars.
*   `make local-ai-down`: Desliga os sidecars.
*   Depois de subir, ative cada tipo em **Admin → Dashboard → Geração Local**. Veja [IA Local](./LOCAL_AI.md).

## 🗄️ Banco de Dados (Prisma)
*   `make prisma-migrate`: Aplica novas migrações e sincroniza o schema.
*   `make prisma-gen`: Gera o cliente Prisma (necessário após mudar o schema).
*   `make prisma-seed`: Alimenta o banco com dados iniciais (opcional).
*   `make db-reset-dev`: Reseta o banco de dados de desenvolvimento completamente.

## 🛠️ Debug e Inspeção
*   `make sh-dev`: Abre um terminal interativo dentro do container do App.
*   `make pgadmin-up`: Sobe o pgAdmin. Ele fica no profile `tools` e não sobe junto com as stacks.
*   `make pgadmin-down`: Para e remove o pgAdmin.

---
**Dica:** Sempre execute os comandos de dentro da pasta `/app`.

**Atenção:** rode só uma stack por vez (`dev` ou `prd`). Elas compartilham o mesmo projeto Docker Compose (`fantasy-portal`) e algumas dependências, então subir as duas juntas gera containers órfãos e consumo de recursos desnecessário.
