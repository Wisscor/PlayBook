#!/usr/bin/env bash
set -euo pipefail

ES_URL="http://elasticsearch:9200"
AUTH=(--user "elastic:${ELASTIC_PASSWORD}" --header "Content-Type: application/json")

echo "Configuring the Kibana system user..."
curl --fail --silent "${AUTH[@]}" \
  --request POST "${ES_URL}/_security/user/kibana_system/_password" \
  --data "{\"password\":\"${ELASTICSEARCH_PASSWORD}\"}" >/dev/null

echo "Creating the Logstash role..."
curl --fail --silent "${AUTH[@]}" \
  --request PUT "${ES_URL}/_security/role/logstash_writer" \
  --data '{
    "cluster": ["monitor", "manage_index_templates"],
    "indices": [{
      "names": ["app-log-*"],
      "privileges": ["write", "create", "create_index"]
    }]
  }' >/dev/null

echo "Creating the Logstash user..."
curl --fail --silent "${AUTH[@]}" \
  --request PUT "${ES_URL}/_security/user/${LOGSTASH_USERNAME}" \
  --data "{
    \"password\": \"${LOGSTASH_PASSWORD}\",
    \"roles\": [\"logstash_writer\"]
  }" >/dev/null

echo "ELK security setup completed."
