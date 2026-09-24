# PlayBook / Backend

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)](https://docs.sqlalchemy.org/)

A scalable, modular backend API service built with FastAPI, SQLAlchemy, Docker, and real-time support.

---

## Table of Contents

- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Getting Started](#getting-started)
- [Testing Endpoints](#testing-endpoints)
- [Resources & References](#resources--references)

---

## Project Structure

### Current Layout


```text
back/
├── app
│   ├── __init__.py
│   ├── main.py
│   ├── logging_conf.py
│   ├── core/
│   ├── database/
│   ├── models/
│   ├── realtime/
│   ├── routers/
│   └── schemas/
├── docker-compose.yaml
├── Dockerfile.api
├── Dockerfile.db
├── README.md
└── requirements.txt
```

---

## API Endpoints

### Authentication
| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new user account |
| `POST` | `/auth/login` | Authenticate credentials and retrieve access token |
| `GET` | `/auth/me` | Fetch profile for current authenticated user |

### Users
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/users` | List all users |
| `GET` | `/users/{user_id}` | Retrieve specific user details |
| `GET` | `/users/{user_id}/posts` | Get all posts authored by a user |
| `PUT` | `/users/{user_id}` | Update existing user profile |
| `DELETE`| `/users/{user_id}` | Remove user account |

### Posts
| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/posts` | Create a new post |
| `GET` | `/posts` | List posts |
| `GET` | `/posts/{post_id}` | Get post by ID |
| `PUT` | `/posts/{post_id}` | Update an existing post |
| `DELETE`| `/posts/{post_id}` | Delete a post |

### Comments
| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/posts/{post_id}/comments` | Post a comment on a specific post |
| `GET` | `/posts/{post_id}/comments` | Retrieve comments for a specific post |
| `PUT` | `/comments/{comment_id}` | Edit an existing comment |
| `DELETE`| `/comments/{comment_id}` | Delete a comment |

### Reactions (Likes & Dislikes)
| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/posts/{post_id}/like` | Like a post |
| `DELETE`| `/posts/{post_id}/like` | Remove like from a post |
| `GET` | `/posts/{post_id}/likes` | Retrieve likes for a post |

### Conversations & Messages
| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/conversations` | Start a new conversation thread |
| `GET` | `/conversations` | List user conversations |
| `GET` | `/conversations/{conversation_id}` | View single conversation |
| `DELETE`| `/conversations/{conversation_id}` | Delete conversation thread |
| `POST` | `/conversations/{conversation_id}/messages` | Send message in conversation |
| `GET` | `/conversations/{conversation_id}/messages` | List messages in conversation |
| `GET` | `/messages/{message_id}` | Retrieve specific message |
| `DELETE`| `/messages/{message_id}` | Delete specific message |

### Media Uploads
| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/upload/image` | Upload image file |

---

## Getting Started

### Environment Variables
 
The `DATABASE_URL` differs depending on where Postgres is reached from. Keep your local `.env` pointed at the **local** URL — the **docker** URL is injected directly by `docker-compose.yml` for the `api` service, so you never need to edit `.env` when switching contexts.
 
```bash
# .env (local development)
DATABASE_URL=postgresql+asyncpg://ziko:1234pass@0.0.0.0:5432/my-postgres
```
 
```yaml
# docker-compose.yml (used only inside the containerized stack)
services:
  api:
    environment:
      DATABASE_URL: postgresql+asyncpg://ziko:1234pass@postgres:5432/my-postgres
```
 
> `environment:` in Compose overrides anything from `env_file:`, so the container always gets the `postgres` hostname regardless of what's in your local `.env`.
 
### Option A — Local Development (recommended for coding)
 
Run Postgres in Docker, but run the API directly on your machine so `--reload` works reliably.
 
```bash
# 1. Start only the database
docker compose up -d postgres
 
# 2. Run the API locally (from the back/ directory, so relative imports resolve)
uvicorn app.main:app --reload
 
# 3. When done for the day
docker compose stop postgres
```
 
- No `--host`/`--port` needed locally — uvicorn defaults to `127.0.0.1:8000`.
- Make sure the `postgres` service in `docker-compose.yml` exposes its port to the host (`ports: ["5432:5432"]`), otherwise `0.0.0.0:5432` won't be reachable from your machine.
### Option B — Full Docker Stack (for DevOps / integration testing)
 
Build and run the entire stack (API + Postgres) in containers, as DevOps will run it in staging/production.
 
```bash
# Build and start every service in the background
docker compose up --build -d
 
# Stream logs in real-time
docker compose logs -f
 
# Check container health status
docker compose ps
 
# Stop and remove containers
docker compose down
```
 
Inside the container, the API's `CMD` binds to all interfaces so it's reachable from outside the container:
 
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
 
---
 
## Testing Endpoints
 
Execute these CLI calls via [HTTPie](https://httpie.io/) to verify your local instance:
 
### 1. User Registration (`/auth/signup`)
```bash
http -v POST localhost:8000/auth/signup \
  username=zakaria \
  email=zakaria@example.com \
  password=pass1234
```
 
### 2. User Login (`/auth/login`)
```bash
http -v POST localhost:8000/auth/login \
  username_or_email=zakaria \
  password=pass1234
```
---

## Testing Endpoints

Execute these CLI calls via [HTTPie](https://httpie.io/) to verify your local instance:

### 1. User Registration (`/auth/signup`)
```bash
http -v POST localhost:8000/auth/signup \
  username=zakaria \
  email=zakaria@example.com \
  password=pass1234
```

### 2. User Login (`/auth/login`)
```bash
http -v POST localhost:8000/auth/login \
  username_or_email=zakaria \
  password=pass1234
```

---

## Resources & References

- [SQLAlchemy Database URLs & Engine Documentation](https://docs.sqlalchemy.org/en/21/core/engines.html#database-urls)

- [A complete guide to logging in FastAPI](https://apitally.io/blog/fastapi-logging-guide)