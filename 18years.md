# PlayBook's Architecture: A Practical Guide

This guide explains how the PlayBook frontend, backend, Caddy, Docker, and
database work together in the current local setup.

## The big picture

PlayBook has four main services:

1. **Frontend** — the Next.js application that sends web pages to your browser.
2. **Backend API** — the FastAPI application that handles requests, applies
   application rules, and reads or writes data.
3. **PostgreSQL** — the database that stores application data.
4. **Caddy** — the reverse proxy that accepts browser traffic, provides HTTPS,
   and forwards requests to the right service.

Docker Compose starts these services as separate containers and connects them
to a private Docker network.

```text
Browser
  |
  | https://localhost (HTTPS, port 443)
  v
Caddy -----------------------> Frontend (container port 3000)
  |
  | https://localhost:8443 (HTTPS, port 8443)
  v
Caddy -----------------------> Backend API (container port 8000)
                                  |
                                  | PostgreSQL protocol over Docker network
                                  v
                              PostgreSQL (container port 5432)
```

The lines from Caddy to the frontend and API are **inside Docker's private
network**. The browser does not connect directly to those container ports.
The backend-to-database connection is also private and is not HTTPS; it does
not leave the Docker network.

## What is a port?

A port is a numbered network endpoint: a way to deliver traffic to the right
service on a computer. Think of an IP address as a building address and a port
as a numbered door in that building.

These are the ports used by this setup:

| Port | Service | What it means in this setup |
| --- | --- | --- |
| **80** | Caddy | Receives ordinary HTTP and redirects it to HTTPS. |
| **443** | Caddy | Standard HTTPS entry point for the frontend at `https://localhost`. |
| **8443** | Caddy | HTTPS entry point for browser requests to the backend API. |
| **3000** | Frontend | Next.js listens here inside its container. Caddy forwards website traffic here. |
| **8000** | Backend | FastAPI listens here inside its container. Caddy forwards API traffic here. |
| **5432** | PostgreSQL | PostgreSQL listens here inside its container. The backend connects here. |

You may have meant **443** when you wrote “433”: **443** is the HTTPS port.

### Host ports and container ports

The left side of a Docker Compose port mapping is the port on your computer;
the right side is the port inside a container. For example:

```yaml
- "127.0.0.1:443:443"
```

This publishes Caddy's container port 443 as port 443 on your computer. The
`127.0.0.1` part means it is only reachable from your own computer, not from
other computers on your network.

Ports **3000**, **8000**, and **5432** are not published to your computer in
this Compose setup. They are still used by services on the private Docker
network:

- Caddy reaches the frontend at `frontend:3000`.
- Caddy reaches the API at `api:8000`.
- The API reaches PostgreSQL at `postgres:5432`.

Names such as `frontend`, `api`, and `postgres` are Compose service names. Docker
provides name lookup for them on the private network. Inside a container,
`localhost` means that same container, not another service.

## What happens when you use the app?

### 1. Your browser loads the website

You open:

```text
https://localhost/en
```

The browser makes an HTTPS connection to Caddy on port 443. Caddy decrypts the
incoming HTTPS connection and forwards the website request over Docker's
private network to `frontend:3000`. The Next.js frontend returns the page.

### 2. The frontend asks for data

The frontend's API URL is configured as:

```text
https://localhost:8443
```

For example, a request for sports data goes to a URL like
`https://localhost:8443/sports`. The browser makes an HTTPS connection to Caddy
on port 8443. Caddy forwards it over Docker's private network to `api:8000`.
FastAPI handles the request and returns a response through Caddy to the
browser.

The API port is not exposed directly on the host. A browser or local script
should use the HTTPS address through Caddy rather than connecting to port 8000.

### 3. The backend accesses saved data

If the API needs database information, it connects to PostgreSQL using the
Compose service name `postgres` and container port 5432. The database is not
published to the host either.

## What does Caddy do?

Caddy is a **reverse proxy**. A proxy receives a request on behalf of another
service and forwards it. A reverse proxy sits in front of services like this
website and API.

The [Caddyfile](./Caddyfile) tells Caddy what to do:

```caddyfile
localhost {
    tls internal
    reverse_proxy frontend:3000
}

https://localhost:8443 {
    tls internal
    reverse_proxy api:8000
}
```

- The first block handles the `localhost` website. Caddy uses HTTPS and sends
  requests to the frontend.
- The second block handles the API on HTTPS port 8443 and sends requests to
  the backend.
- `tls internal` tells Caddy to create certificates using its own local
  certificate authority.
- `reverse_proxy` names the service and its **container port** to forward to.

Caddy also redirects HTTP on port 80 to HTTPS. This keeps the browser-facing
website/API traffic encrypted, while the internal connections between
containers can use ordinary HTTP as allowed by the project requirement.

Caddy keeps its certificate data in Docker volumes. These volumes help its
local certificates and configuration survive container recreation.

## Why use both port 443 and port 8443?

Port 443 is the standard HTTPS port, so browsers leave it out of the address:

```text
https://localhost
```

This address serves the frontend. Port 8443 is an additional HTTPS port for
the API, so the frontend calls:

```text
https://localhost:8443
```

The API has a different **origin** from the frontend because the port differs.
That is why the backend's CORS settings allow `https://localhost`. CORS is a
browser rule controlling which website origins may read responses from an API.

The frontend's Axios client enables credentials, so the browser can include
the login cookie in API requests. The backend is configured to mark that
cookie `Secure` and `HttpOnly`; the browser only sends a `Secure` cookie over
HTTPS, and frontend JavaScript cannot read an `HttpOnly` cookie.

The frontend also uses the API address to construct its WebSocket URL. An
HTTPS API URL becomes a secure WebSocket URL (`wss://localhost:8443/ws`), which
Caddy forwards to the backend's `/ws` endpoint.

## HTTPS certificates for localhost

Public certificate providers normally verify that you control a real domain.
For local development on `localhost`, Caddy instead creates a certificate
using its **local certificate authority**.

The connection is encrypted, but your operating system or browser may not
trust that local authority automatically. If it does not, the browser will
show a certificate warning. Follow the certificate trust instructions in the
main [README](./README.md). Do not use a command that skips certificate checks
as a replacement for trusting the certificate.

This local certificate setup is for local development. A deployed app with a
real domain needs an appropriate domain, DNS, reachable ports, and a
production certificate setup.

## What does Docker Compose do?

The root [docker-compose.yaml](./docker-compose.yaml) describes how to build
and run the services:

- It starts PostgreSQL, the API, Caddy, and the frontend.
- It connects them to a private network.
- It starts PostgreSQL before the API is considered ready.
- It waits for the API health check before Caddy/frontend depend on it.
- It publishes only Caddy's ports 80, 443, and 8443 to localhost.
- It attaches persistent volumes for database data, uploads, and Caddy data.

The API's health check calls `http://localhost:8000/health` **inside the API
container**. This internal health-check request is not a browser connection and
does not pass through Caddy. That is why it uses HTTP and port 8000.

## What does `.env` configure?

The root `.env` file supplies values to Docker Compose and the API. It contains
database settings, session-cookie settings, CORS origins, and the frontend's
API URL. The actual `.env` can contain secrets, so keep it private and do not
paste credentials into logs, screenshots, or source control. The tracked
`.env.example` is a template, not the live configuration.

The frontend's `NEXT_PUBLIC_API_URL` is also passed as a Docker build argument.
Next.js embeds public environment values into the built browser files. If you
change that URL, rebuild the frontend:

```bash
docker compose up -d --build frontend
```

It is safe for the API base URL to be public; it must not contain passwords or
other secrets.

## Persistent data and stopping the app

Docker volumes keep important data outside the lifetime of a container:

- `postgres_data` stores the database.
- `uploads_data` stores uploaded files.
- `caddy_data` and `caddy_config` store Caddy's certificate/configuration
  state.

Recreating a container does not normally erase these volumes. A plain
`docker compose down` stops and removes the containers but preserves the
volumes. Be careful with `docker compose down --volumes`: that also deletes the
stored database, uploaded files, and Caddy state.

## Useful commands

Run these commands from the repository root:

```bash
# Start/rebuild the complete stack in the background
docker compose up -d --build

# See whether services are running
docker compose ps

# Follow logs from every service
docker compose logs -f

# Follow only the Caddy or API logs
docker compose logs -f caddy
docker compose logs -f api

# Stop containers while keeping persistent volumes
docker compose down
```

If a page fails to load, check `docker compose ps` first, then inspect the logs
of the service involved. For example, Caddy errors suggest checking its
Caddyfile and logs; database connection errors suggest checking the API logs
and the database URL in `.env`.

## Quick recap

```text
Browser -> HTTPS to Caddy on 443 -> frontend on Docker port 3000
Browser -> HTTPS to Caddy on 8443 -> backend on Docker port 8000
Backend -> PostgreSQL on Docker port 5432
```

Only Caddy's ports are published on your computer, and only on `127.0.0.1`.
The browser uses HTTPS for both the website and API. The services communicate
with each other over Docker's private network.
