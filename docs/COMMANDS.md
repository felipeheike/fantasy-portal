# ⌨️ Comandos e Operação do Sistema

O projeto utiliza um `Makefile` na pasta `/app` para simplificar as operações recorrentes do desenvolvedor.

## 🚀 Docker & Lifecycle
*   `make dev`: Inicia o ambiente de desenvolvimento.
*   `make prd`: Inicia o ambiente de produção (build otimizado).
*   `make down`: Para e remove todos os containers.
*   `make status`: Lista o status dos containers do projeto.
*   `make clean`: Remove volumes, containers e limpa o sistema Docker (Cuidado!).
*   `make dev-logs`: Acompanha os logs em tempo real do Next.js.

## 🗄️ Banco de Dados (Prisma)
*   `make prisma-migrate`: Aplica novas migrações e sincroniza o schema.
*   `make prisma-gen`: Gera o cliente Prisma (necessário após mudar o schema).
*   `make prisma-seed`: Alimenta o banco com dados iniciais (opcional).
*   `make db-reset-dev`: Reseta o banco de dados de desenvolvimento completamente.

## 🛠️ Debug e Inspeção
*   `make sh-dev`: Abre um terminal interativo dentro do container do App.
*   `make pgadmin-down`: Para o serviço auxiliar de administração do Postgres.

---
**Dica:** Sempre execute os comandos de dentro da pasta `/app`.
