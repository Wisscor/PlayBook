# PlayBook

## Run the application with Docker Compose

From the repository root, start Postgres, the backend, and the frontend together:

```bash
cp .env.example .env
docker compose up --build
```

Open the frontend at `https://localhost/en`. The API and its docs are available
through Caddy at `https://localhost:8443` and `https://localhost:8443/docs`.
The frontend and API containers are not published directly to the host;
browser requests and WebSockets go through Caddy over HTTPS.

The root Compose file provides Postgres, the API, Caddy, and the frontend. Caddy
uses its local certificate authority for localhost. To trust its certificate
on Linux, copy the root certificate from the running container and add it to
the system trust store:

```bash
docker compose cp caddy:/data/caddy/pki/authorities/local/root.crt /tmp/playbook-caddy-root.crt
sudo cp /tmp/playbook-caddy-root.crt /usr/local/share/ca-certificates/playbook-caddy-root.crt
sudo update-ca-certificates
rm /tmp/playbook-caddy-root.crt
```

Browsers with their own certificate store may need the root certificate
imported there as well. Stop the stack with `docker compose down`.

The `Makefile` also provides `make app-up`, `make app-down`, and
`make app-logs` shortcuts.
