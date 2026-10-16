# PlayBook / Backend

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)](https://docs.sqlalchemy.org/)
[![uv](https://img.shields.io/badge/uv-DE5FE9?style=for-the-badge&logo=uv&logoColor=white)](https://astral.sh/uv)

A scalable, modular backend API service built with FastAPI, SQLAlchemy, Docker, and uv for fast Python package and virtual environment management.

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
├── alembic/
│   ├── versions/
│   └── env.py
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── logging_conf.py
│   ├── core/
│   ├── database/
│   ├── models/
│   ├── realtime/
│   ├── routers/
│   └── schemas/
├── tests/
├── alembic.ini
├── docker-compose.yaml
├── Dockerfile.api
├── Dockerfile.db
├── entrypoint.sh
├── pyproject.toml
├── uv.lock
├── README.md
└── .env
```

---

## API Endpoints

### Authentication
| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/signup` | Register a new user account |
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

### Option A — Full Docker Stack (Recommended)

Build and run both the API and PostgreSQL with Docker Compose (database migrations run automatically on startup via `entrypoint.sh`):

```bash
# Build and start services (migrations are applied automatically)
docker compose up --build -d

# View logs
docker compose logs -f api

# Stop services
docker compose down
```

### Option B — Local Development with uv

Run PostgreSQL via Docker and start the API locally with hot-reloading:

```bash
# 1. Start database
docker compose up -d postgres

# 2. Sync dependencies
uv sync

# 3. Apply database migrations
uv run alembic upgrade head

# 4. Run API with hot-reload
uv run uvicorn app.main:app --reload

# 5. Run tests
uv run pytest
```

---

## Testing Endpoints

Execute these CLI calls via [HTTPie](https://httpie.io/) to verify your instance:

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

- [uv Documentation](https://docs.astral.sh/uv/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Docker Documentation](https://docs.docker.com/)