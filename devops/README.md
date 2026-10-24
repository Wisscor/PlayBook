# Elasticsearch and centralized logging

## 1. How it works

```text
FastAPI -> stdout JSON -> Filebeat -> Logstash -> Elasticsearch -> Kibana
```

- FastAPI writes one JSON object per line to the container output.
- The `co.elastic.logs/enabled=true` label tells Filebeat to read this container.
- Filebeat sends events to Logstash on port 5044.
- Logstash creates `app-log-yyyy.MM.dd` indexes in Elasticsearch.
- Kibana is used to explore these indexes.

## 2. Start the services

Start the logging stack:

```sh
cd devops
cp .env.example .env
# Replace every change-me-* value before continuing.
docker compose up -d
docker compose ps
```

The one-shot `setup-security` service configures the existing
`kibana_system` account, then creates the restricted `logstash_writer` role
and `logstash_internal` user. It is safe to run again because the Elasticsearch
security APIs create or update the same resources.

Then start the backend:

```sh
cd ../back
docker compose up -d --build
docker compose ps
```

The default log level is `INFO`. It can be changed with:

```sh
LOG_LEVEL=DEBUG docker compose up -d --build api
```

## 3. Healthchecks

The healthchecks run in this order:

1. Elasticsearch waits until the cluster is available.
2. Logstash waits until Elasticsearch is healthy.
3. Filebeat waits until Logstash is healthy.
4. The backend checks its `/health` endpoint.

Status commands:

```sh
docker compose -f devops/docker-compose.yml ps
docker compose -f back/docker-compose.yaml ps
curl -fsS --user "elastic:${ELASTIC_PASSWORD}" \
  'http://localhost:9200/_cluster/health?pretty'
```

## 4. Test the complete logging pipeline

Create a log, then check that it reaches Elasticsearch:

```sh
curl -fsS 'http://localhost:8000/check-logging'
curl -fsS --user "elastic:${ELASTIC_PASSWORD}" \
  'http://localhost:9200/_cat/indices/app-log-*?v'
docker compose -f devops/docker-compose.yml logs --tail=50 filebeat logstash
```

In Kibana (`http://localhost:5601`), create an `app-log-*` Data View to explore
the events in Discover.

To continuously generate traffic during a demonstration:

```sh
./devops/generate-traffic.sh
```

The script generates 200, 404 and 500 responses until it is stopped with
`Ctrl+C`. Its frequency can be changed, for example:

```sh
DELAY_SECONDS=0.2 ./devops/generate-traffic.sh
```

## 5. Basic security

Elasticsearch, Kibana and the API only listen on `127.0.0.1`. Logstash,
Filebeat and PostgreSQL remain on the private Docker network.

For an externally accessible server, also add:

1. Elasticsearch and Kibana authentication;
2. a dedicated Logstash user with access restricted to `app-log-*`;
3. HTTPS/TLS in front of Kibana and the API through a reverse proxy;
4. a firewall that does not expose ports 9200, 5044 and 5432.

Do not enable only `xpack.security.enabled=true` without configuring Kibana,
Logstash and the healthchecks. Otherwise, the components will no longer be able
to connect. This change must be configured and tested separately.

## 6. Server deployment

- The API, Elasticsearch and Kibana ports are bound to `127.0.0.1`.
- PostgreSQL and Logstash are not published on the host.
- Containers restart automatically with `restart: unless-stopped`.
- Passwords remain in `back/.env`, which is not tracked by Git.
- An HTTPS reverse proxy must be placed in front of a public API.

This simple architecture is suitable for a single-server deployment.

## 7. Important files for the presentation

- `back/app/logging_conf.py`: converts Python logs to JSON.
- `back/app/main.py`: writes one structured HTTP log per request, except `/health`.
- `back/docker-compose.yaml`: enables API log collection with a label.
- `devops/filebeat/filebeat.yml`: reads Docker logs.
- `devops/elasticsearch/logstash.conf`: receives and indexes events.
- `devops/docker-compose.yml`: starts and monitors the Elastic stack.

Elasticsearch authentication is enabled. HTTP traffic inside the local Docker
network is not encrypted, so Elasticsearch and Kibana must remain bound to
`127.0.0.1`. TLS is required before exposing either service beyond the host.
