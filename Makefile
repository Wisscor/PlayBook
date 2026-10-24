COMPOSE = docker compose
ELK = $(COMPOSE) -f devops/docker-compose.yml
BACKEND = $(COMPOSE) -f back/docker-compose.yaml
FRONT_IMAGE = playbook-front
FRONT_CONTAINER = playbook-front-dev

.DEFAULT_GOAL := help

.PHONY: help up down restart status urls \
	elk-up elk-down elk-logs \
	backend-up backend-down backend-logs \
	frontend-build frontend-up frontend-down frontend-logs \
	traffic

help:
	@printf '%s\n' \
		'make up             Start ELK, the backend and the frontend' \
		'make down           Stop all services' \
		'make restart        Restart all services' \
		'make status         Show container status' \
		'make urls           Show application URLs' \
		'make elk-logs       Follow ELK logs' \
		'make backend-logs   Follow backend logs' \
		'make frontend-logs  Follow frontend logs' \
		'make traffic        Generate API traffic for Kibana'

up: elk-up backend-up frontend-up
	@$(MAKE) --no-print-directory urls

down: frontend-down backend-down elk-down

restart: down up

elk-up:
	$(ELK) up -d

elk-down:
	$(ELK) down

elk-logs:
	$(ELK) logs -f --tail=100

backend-up:
	$(BACKEND) up -d --build

backend-down:
	$(BACKEND) down

backend-logs:
	$(BACKEND) logs -f --tail=100

frontend-build:
	docker build -t $(FRONT_IMAGE) front/playbook-web

frontend-up: frontend-build
	@docker rm -f $(FRONT_CONTAINER) >/dev/null 2>&1 || true
	docker run -p 127.0.0.1:3000:3000 --detach --restart unless-stopped --name $(FRONT_CONTAINER) $(FRONT_IMAGE)

frontend-down:
	@docker stop $(FRONT_CONTAINER) >/dev/null 2>&1 || true

frontend-logs:
	docker logs -f --tail=100 $(FRONT_CONTAINER)

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
