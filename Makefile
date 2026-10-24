COMPOSE = docker compose
ELK = $(COMPOSE) -f devops/docker-compose.yml
FULLSTACK = $(COMPOSE) -f docker-compose.yaml

.DEFAULT_GOAL := help

.PHONY: help up down restart status urls \
	elk-up elk-down \
	backend-up backend-down  \
	frontend-build frontend-up frontend-down \
	traffic

help:
	@printf '%s\n' \
		'make up             Start ELK, the backend and the frontend' \
		'make down           Stop all services' \
		'make restart        Restart all services' \
		'make status         Show container status' \
		'make urls           Show application URLs' \
		'make traffic        Generate API traffic for Kibana'

up: elk-up fullstack-up
	@$(MAKE) --no-print-directory urls

down: fullstack-down elk-down

restart: down up

elk-up:
	$(ELK) up -d

elk-down:
	$(ELK) down

fullstack-up:
	$(FULLSTACK) up -d --build

fullstack-down:
	$(FULLSTACK) down

status:
	docker ps

urls:
	@printf '\n%s\n' 'PlayBook is available at:'
	@printf '  %-18s %s\n' 'Frontend:'      'http://localhost:3000/en'
	@printf '  %-18s %s\n' 'API:'           'http://localhost:8000'
	@printf '  %-18s %s\n' 'API docs:'      'http://localhost:8000/docs'
	@printf '  %-18s %s\n' 'Kibana:'        'http://localhost:5601'
	@printf '  %-18s %s\n' 'Elasticsearch:' 'http://localhost:9200'
	@printf '\n'

traffic:
	./devops/generate-traffic.sh
