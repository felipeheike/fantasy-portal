SHELL := /bin/bash
PROJECT_NAME=fantasy-portal

# Base commands
COMPOSE_BASE=docker compose -p $(PROJECT_NAME)
COMPOSE_DEV=$(COMPOSE_BASE) -f docker-compose.yml -f docker-compose.dev.yml
COMPOSE_PRD=$(COMPOSE_BASE) -f docker-compose.yml -f docker-compose.prd.yml
COMPOSE_LOCAL_AI=$(COMPOSE_BASE) -f docker-compose.local-ai.yml --profile local-ai

.PHONY: dev dev-restart prd down status clean db-reset-dev db-reset-prd prisma-seed pgadmin-down test local-ai-up local-ai-down local-ai-logs

# --- Development ---
dev:
	$(COMPOSE_DEV) up -d

dev-restart:
	$(COMPOSE_DEV) down
	$(COMPOSE_DEV) up -d

dev-logs:
	$(COMPOSE_DEV) logs -f

test:
	$(COMPOSE_DEV) exec node_app_dev npx vitest run

# --- Production ---
prd:
	$(COMPOSE_PRD) up -d --build

prd-logs:
	$(COMPOSE_PRD) logs -f

# --- Geração local (GPU/CPU do servidor) ---
local-ai-up:
	$(COMPOSE_LOCAL_AI) up -d --build

local-ai-down:
	$(COMPOSE_LOCAL_AI) down

local-ai-logs:
	$(COMPOSE_LOCAL_AI) logs -f

# --- Management ---
down:
	$(COMPOSE_BASE) -f docker-compose.dev.yml -f docker-compose.prd.yml -f docker-compose.yml down

pgadmin-down:
	$(COMPOSE_BASE) -f docker-compose.yml stop pgadmin
	$(COMPOSE_BASE) -f docker-compose.yml rm -f pgadmin

status:
	docker ps --filter "name=fantasy_portal"

clean:
	$(COMPOSE_BASE) -f docker-compose.dev.yml -f docker-compose.prd.yml -f docker-compose.yml down -v
	docker system prune -f

# --- Database & Prisma ---
prisma-gen:
	$(COMPOSE_DEV) exec node_app_dev npx prisma generate

prisma-migrate:
	$(COMPOSE_DEV) exec node_app_dev npx prisma migrate dev

prisma-seed:
	$(COMPOSE_DEV) exec node_app_dev npx prisma db seed

db-reset-dev:
	$(COMPOSE_DEV) stop db_postgres_dev
	$(COMPOSE_DEV) rm -f db_postgres_dev
	sudo rm -rf database/dev/postgres
	$(COMPOSE_DEV) up -d db_postgres_dev
	@echo "Aguardando banco inicializar..."
	@sleep 5
	$(COMPOSE_DEV) exec node_app_dev npx prisma migrate dev --name reset
	$(COMPOSE_DEV) exec node_app_dev npx prisma db seed

db-reset-prd:
	$(COMPOSE_PRD) stop db_postgres_prd
	$(COMPOSE_PRD) rm -f db_postgres_prd
	sudo rm -rf database/prd/postgres
	$(COMPOSE_PRD) up -d db_postgres_prd
	@echo "Aguardando banco inicializar..."
	@sleep 5
	$(COMPOSE_PRD) exec node_app_prd npx prisma migrate deploy
	$(COMPOSE_PRD) exec node_app_prd npx prisma db seed

# --- Shell ---
sh-dev:
	$(COMPOSE_DEV) exec node_app_dev sh

sh-prd:
	$(COMPOSE_PRD) exec node_app_prd sh
