COMPOSE = docker compose
APP = $(COMPOSE) -f docker-compose.yaml

.DEFAULT_GOAL := help

.PHONY: help up down restart status urls app-up app-down app-logs

help:
	@printf '%s\n' \
		'make up             Start the backend and the frontend' \
		'make down           Stop all services' \
		'make restart        Restart all services' \
		'make status         Show container status' \
		'make app-logs       Follow backend and frontend logs' \
		'make urls           Show application URLs'

up: app-up
	@$(MAKE) --no-print-directory urls

down: app-down

restart: down up

app-up:
	$(APP) up -d --build

app-down:
	$(APP) down

app-logs:
	$(APP) logs -f --tail=100

status:
	docker ps

urls:
	@printf '\n%s\n' 'PlayBook is available at:'
	@printf '  %-18s %s\n' 'Frontend:'      'http://localhost:3000/en'
	@printf '  %-18s %s\n' 'API:'           'http://localhost:8000'
	@printf '  %-18s %s\n' 'API docs:'      'http://localhost:8000/docs'
	@printf '\n'
