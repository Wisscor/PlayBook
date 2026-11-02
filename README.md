# PlayBook

## Run the application with Docker Compose

From the repository root, start Postgres, the backend, and the frontend together:

```bash
cp .env.example .env
docker compose up --build
```

Open the frontend at `http://localhost:3000/en` and the API docs at
`http://localhost:8000/docs`.

The root Compose file provides Postgres, the API, and the frontend. Stop the
stack with `docker compose down`.

If the default host ports are already in use, override them when starting the
stack:

```bash
FRONTEND_PORT=3001 API_PORT=8001 docker compose up --build
```

The `Makefile` also provides `make app-up`, `make app-down`, and
`make app-logs` shortcuts.
