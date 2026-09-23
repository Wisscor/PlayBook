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
├── app/
│   ├── api/          # Route handlers & API routers
│   ├── core/         # Core settings, security, and configurations
│   ├── database/     # DB connections & engine initialization
│   ├── db/           # Migrations & database session management
│   ├── models/       # ORM / Database models
│   ├── realtime/     # WebSockets / Real-time handlers
│   └── schemas/      # Pydantic data schemas / validation
└── .env              # Environment configuration
```

### Recommended App Module Layout

```text
back/
└── app/
    ├── models/
    │   ├── user.py
    │   ├── post.py
    │   ├── comment.py
    │   └── message.py
    ├── schemas/
    │   ├── user.py
    │   └── post.py
    ├── api/
    ├── realtime/
    └── database/
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

### Running the Project via Docker

Start the containerized stack in detached mode:

```bash
# Build and start services in the background
docker compose up --build -d

# Stream logs in real-time
docker compose logs -f

# Check container health status
docker compose ps

# Stop and remove containers
docker compose down
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