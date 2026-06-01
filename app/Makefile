SHELL := /bin/bash
PROJECT_NAME_DEV=fantasy_dev
PROJECT_NAME_PRD=fantasy-portal

# Compose commands with environment variables for isolation
COMPOSE_DEV=FP_ENV=dev docker compose -p $(PROJECT_NAME_DEV) -f docker-compose.yml -f docker-compose.dev.yml
COMPOSE_PRD=FP_ENV=prd docker compose -p $(PROJECT_NAME_PRD) -f docker-compose.yml -f docker-compose.prd.yml

ls:
	ls -la

# --- Development Commands ---
dev:
	$(COMPOSE_DEV) up -d

dev-build:
	$(COMPOSE_DEV) up -d --build

dev-logs:
	$(COMPOSE_DEV) logs -f

dev-down:
	$(COMPOSE_DEV) down

# --- Production Commands ---
prd:
	$(COMPOSE_PRD) up -d --build

prd-logs:
	$(COMPOSE_PRD) logs -f

prd-down:
	$(COMPOSE_PRD) down

# --- General Commands ---
up: dev

down: dev-down

stop:
	$(COMPOSE_DEV) stop

restart:
	$(COMPOSE_DEV) restart

status:
	docker ps --filter "name=fantasy"

# Execute into dev container
p:
	$(COMPOSE_DEV) exec node_app sh

# Execute into prd container
pp:
	$(COMPOSE_PRD) exec node_app sh

clean:
	$(COMPOSE_DEV) down -v
	$(COMPOSE_PRD) down -v
	docker system prune -af

# Next.js specific helpers (using dev by default)
prisma-gen:
	$(COMPOSE_DEV) exec node_app npx prisma generate

prisma-seed:
	$(COMPOSE_DEV) exec node_app npm run prisma:seed

prisma-migrate:
	$(COMPOSE_DEV) exec node_app npx prisma migrate dev
