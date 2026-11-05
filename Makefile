COMPOSE = docker compose
APP = $(COMPOSE) -f docker-compose.yaml

.PHONY: help up down clean restart status urls app-up app-down app-logs

help:
	@printf '%s\n' \
		'make up             Start the backend and the frontend' \
		'make down           Stop all services' \
		'make clean          Stop services and delete volumes (database/uploads)' \
		'make restart        Restart all services' \
		'make status         Show container status' \
		'make app-logs       Follow backend and frontend logs' \
		'make urls           Show application URLs'

up: app-up
	@$(MAKE) --no-print-directory urls

down: app-down

clean:
	$(APP) down --volumes --remove-orphans

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
	@printf '  %-18s %s\n' 'Frontend:'      'https://localhost:3443/en'
	@printf '  %-18s %s\n' 'API:'           'https://localhost:8443'
	@printf '  %-18s %s\n' 'API docs:'      'https://localhost:8443/docs'
	@printf '\n'*

fclean:
	@printf '\n%s\n' 'Cleaning up...'
	@$(MAKE) --no-print-directory app-down
	@$(MAKE) --no-print-directory clean
