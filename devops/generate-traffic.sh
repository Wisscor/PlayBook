#!/bin/sh
set -u

api_url="${API_URL:-http://localhost:8000}"
delay_seconds="${DELAY_SECONDS:-1}"
request_count=0

stop_traffic() {
  printf '\nArrêt demandé. %s requêtes envoyées.\n' "$request_count"
  exit 0
}

send_request() {
  method="$1"
  path="$2"

  if status_code="$(curl \
    --silent \
    --output /dev/null \
    --write-out '%{http_code}' \
    --max-time 5 \
    --request "$method" \
    "${api_url}${path}")"; then
    :
  else
    status_code="000"
  fi

  request_count=$((request_count + 1))
  printf '#%-5s %-4s %-35s -> %s\n' \
    "$request_count" "$method" "$path" "$status_code"
}

trap stop_traffic INT TERM

printf 'Génération de trafic vers %s\n' "$api_url"
printf 'Une série toutes les %s seconde(s). Appuie sur Ctrl+C pour arrêter.\n\n' \
  "$delay_seconds"

while :; do
  send_request GET '/docs'
  send_request GET '/openapi.json'
  send_request GET '/route-inexistante'
  send_request GET '/api/fail'
  send_request POST '/api/games'

  sleep "$delay_seconds"
done
