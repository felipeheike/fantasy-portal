SHELL := /bin/bash
DOCKER_CONTAINER=fantasy_portal_node
PROJECT_NAME=fantasy-portal

ls: ls -la

all: build up

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

stop:
	docker compose stop

restart:
	docker compose restart

status:
	docker compose ps

p:
	docker exec -it $(DOCKER_CONTAINER) sh

logs:
	docker compose logs -f

clean: down
	docker system prune -af
	docker volume prune -f

# Next.js specific helpers
init-next:
	docker exec -it $(DOCKER_CONTAINER) npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
