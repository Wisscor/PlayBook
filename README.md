*This project has been created as part of the 42 curriculum by melayyad, zouazrou, wazadou, mbrouk.*

# PlayBook

## Description

PlayBook is a sports social network built for ft_transcendence at 42. Its goal is to help people find players and arrange sports matches. Users can find people who share their sports interests, publish posts, organize matches, and message each other.

The main features are user profiles, a social feed, follows, match announcements, join requests, and live chat. The interface is available in English, French, and Arabic, with right-to-left layouts for Arabic.

## Contents

- [Description](#description)
- [Team Information](#team-information)
- [Project Management](#project-management)
- [Features List](#features-list)
- [Instructions](#instructions)
- [Technical Stack](#technical-stack)
- [Project structure](#project-structure)
- [Database Schema](#database-schema)
- [Modules](#modules)
- [Individual Contributions](#individual-contributions)
- [Resources](#resources)

## Team Information

| Member | Assigned roles | Responsibilities |
| :--- | :--- | :--- |
| **melayyad** | Tech Lead, Developer | Backend architecture, WebSockets, Docker, and integration |
| **zouazrou** | Backend Developer | REST API, database models, authentication, pagination, and errors |
| **wazadou** | Full-stack Developer | UI, components, translations, frontend integration, and builds |
| **mbrouk** | Frontend Developer | Chat UI, notifications, followers, and profile navigation |

The repository documents development responsibilities, but does not identify who held the Product Owner and Project Manager roles required by subject section II.1.1. Those assignments cannot be inferred from commit authorship.

## Project Management

Work was split across backend, frontend, and real-time features. Git history records work on `Core-Dev`, `Realtime-Dev`, and frontend branches such as `UPGRADE`, followed by integration through `develop` and integration branches.

The team used Git and GitHub branches and pull requests to integrate changes. For example, pull requests #13–#16 merged backend work from `Core-Dev`; later commits merged frontend updates and resolved integration conflicts. Commit messages record feature work, fixes, and integration steps.

GitHub pull requests and commit messages provide a record of technical coordination. The repository contains no record of a separate task board, meeting schedule, or external chat channel, so none is claimed here.

## Features List

| Feature | Functionality | Contributors |
| :--- | :--- | :--- |
| Accounts and sessions | Register, log in, and log out using email/password accounts and database sessions. Passwords use Argon2 hashing; the session ID is stored in an HTTP-only cookie. | zouazrou, melayyad |
| Profiles | Edit profile details, upload an avatar, select favorite sports, and view other users' profiles. | zouazrou, wazadou |
| Account deletion | Delete the current user's account and its associated data. | zouazrou, melayyad |
| Social posts | Create and delete text posts, browse community posts, and read a feed from followed users. | zouazrou, wazadou |
| Follows | Follow/unfollow users and browse follower and following lists. | zouazrou, mbrouk |
| Sports catalog | Browse available sports and link them to profiles and match announcements. | zouazrou |
| Match announcements | Create, update, and delete announcements with a sport, time range, and available player slots. | zouazrou, melayyad, wazadou |
| Play requests | Request to join a match; organizers can accept or decline requests. | zouazrou, melayyad, wazadou |
| History | View your posts and matches and manage their details. | wazadou |
| User search | Find users and open their profiles. | zouazrou, wazadou |
| Direct messaging | Send and receive messages through WebSockets, with conversation history, read receipts, and online presence. | melayyad, mbrouk |
| Offline message delivery | Queue messages for users who are offline and deliver them when they reconnect. | melayyad |
| Notifications | Receive activity notifications and see unread badges across pages. | melayyad, mbrouk |
| Languages | Use the interface in English, French, or Arabic, including RTL layouts. | wazadou |
| Container setup | Build and run the frontend, API, and PostgreSQL with Docker Compose. | melayyad, wazadou |

## Instructions

### Requirements

| Requirement | Version or configuration |
| :--- | :--- |
| Git | Needed to clone the repository |
| Docker Engine or Docker Desktop | Running, with support for Docker Compose v2 |
| Docker Compose | v2 (`docker compose`) |
| Make | Optional; direct Compose commands are provided below |
| Local ports | 3000 and 8000 must be available, or use the custom-port instructions |
| Environment file | Copy `.env.example` to `.env` and configure the database credentials |

Node.js 22, Python 3.14, and PostgreSQL 16 run inside the containers. No local installation of these runtimes is required.

### Run locally

**1. Clone the repository and create the environment file.**

```bash
git clone https://github.com/Wisscor/PlayBook.git
cd PlayBook
cp .env.example .env
```

**2. Configure the database connection.**

Edit `.env` before starting. If you change the database credentials, update `DATABASE_URL` to match. Keep `postgres` as the database hostname: it is the Compose service name.

```dotenv
POSTGRES_USER=playbook_user
POSTGRES_PASSWORD=change-me
POSTGRES_DB=playbook_db
DATABASE_URL=postgresql+asyncpg://playbook_user:change-me@postgres:5432/playbook_db
```

**3. Build and start the application.**

```bash
make up
```

Or, without Make:

```bash
docker compose up --build -d
```

The API creates missing tables and seeds the sports catalog on startup. The first build also downloads the images and installs dependencies.

**4. Open the application.**

| Service | Local URL |
| :--- | :--- |
| Frontend | [http://localhost:3000/en](http://localhost:3000/en) |
| API documentation | [http://localhost:8000/docs](http://localhost:8000/docs) |
| API health check | [http://localhost:8000/health](http://localhost:8000/health) |

Create an account through the sign-up form, then log in to use the community, match, and messaging pages.

The supplied Compose setup serves HTTP on the local machine. Both published ports bind to `127.0.0.1`.

### Environment variables

These root `.env` values are used by the Compose setup:

| Variable | Purpose | Value in `.env.example` |
| :--- | :--- | :--- |
| `POSTGRES_USER` | Database username | `playbook_user` |
| `POSTGRES_PASSWORD` | Database password | `change-me` |
| `POSTGRES_DB` | Database name | `playbook_db` |
| `DATABASE_URL` | API connection string; credentials must match PostgreSQL | `postgresql+asyncpg://playbook_user:change-me@postgres:5432/playbook_db` |
| `API_PORT` | API port on the host | `8000` |
| `FRONTEND_PORT` | Frontend port on the host | `3000` |
| `NEXT_PUBLIC_API_URL` | API address used by the browser | `http://localhost:8000` |
| `CORS_ORIGINS` | Allowed frontend origins, as a JSON array | `["http://localhost:3000"]` |

Other backend settings in the example file, including `SESSION_EXPIRE_DAYS` and the session cookie options, are not forwarded by the root Compose file. To override them in Docker, add them to the API service's `environment` mapping in [docker-compose.yaml](docker-compose.yaml). The backend defaults are defined in [config.py](back/app/core/config.py).

### Custom ports

Change the browser API URL and allowed frontend origin along with the published ports:

```bash
FRONTEND_PORT=3001 \
API_PORT=8001 \
NEXT_PUBLIC_API_URL=http://localhost:8001 \
CORS_ORIGINS='["http://localhost:3001"]' \
docker compose up --build -d
```

Then open `http://localhost:3001/en`. API documentation is at `http://localhost:8001/docs`.

`NEXT_PUBLIC_API_URL` is included in the frontend at build time, so rebuild after changing it. `make urls` prints the default ports even when you use custom values.

### Logs and cleanup

```bash
make app-logs  # Follow service logs
make down      # Stop and remove containers; keep stored data
make clean     # Also delete the database and uploaded files
```

Without Make, use `docker compose logs -f`, `docker compose down`, and `docker compose down --volumes --remove-orphans`, respectively.

| Command | Action |
| :--- | :--- |
| `make up` | Build and start the application |
| `make down` | Stop and remove application containers |
| `make restart` | Stop, rebuild, and start the application |
| `make status` | List running Docker containers |
| `make app-logs` | Follow service logs |
| `make urls` | Print the default application URLs |
| `make clean` | Remove application containers and volumes, including database and uploads |

## Technical Stack

| Layer | Tools |
| :--- | :--- |
| Frontend | Next.js 16.3.4, React 19.2.8, TypeScript 5 |
| UI | Tailwind CSS 4, MUI 9, date-fns |
| Translations | next-intl, English/French/Arabic message files |
| HTTP client | Axios |
| Backend | FastAPI, Pydantic, Uvicorn |
| Database | PostgreSQL 16, SQLAlchemy 2, asyncpg |
| Authentication | Argon2-cffi, database sessions, HTTP-only cookies |
| API utilities | SlowAPI, fastapi-pagination, structlog |
| Build and runtime | Docker Compose, Yarn 4.12.0, uv |

Dependency versions are declared in [package.json](front/playbook-web/package.json) and [pyproject.toml](back/pyproject.toml), with resolved versions in their lockfiles.

### Technical choices

- **Next.js and React:** Page routing, layouts, and shared UI components live in one frontend application. TypeScript describes API responses and component props.
- **next-intl:** Translation files keep text separate from components and support the three interface languages. Arabic pages also use RTL layouts.
- **FastAPI:** REST endpoints and WebSocket handlers share the same Python application. Pydantic validates request data and defines response schemas.
- **PostgreSQL:** Users, follows, match requests, and conversations have relational data. Foreign keys and unique constraints enforce those relationships, while transactions and row locks protect player slots when requests are accepted concurrently.
- **SQLAlchemy and asyncpg:** SQLAlchemy defines the database models and queries; asyncpg connects them to PostgreSQL without blocking async request handlers.
- **Docker Compose:** The same command builds and starts all three application services. Health checks order startup: database first, then API, then frontend. Named volumes retain the database and uploaded files between restarts.

## Project structure

| Path | Contents |
| :--- | :--- |
| `front/playbook-web/` | Next.js application, UI components, translations, and API clients |
| `back/app/routers/` | REST endpoints for accounts, posts, follows, sports, and matches |
| `back/app/models/` | SQLAlchemy models for accounts and social/match data |
| `back/app/realtime/` | WebSocket handlers, messaging, presence, and notifications |
| `back/tests/` | Backend tests |
| `devops/` | Separate Elasticsearch, Logstash, Kibana, and Filebeat setup |
| `docker-compose.yaml` | Local application services and persistent volumes |
| `Makefile` | Commands for starting, stopping, and inspecting the application |

The separate logging stack is described in [devops/README.md](devops/README.md). Those notes refer to an older backend Compose file; the current application uses the root `docker-compose.yaml`. Its API service does not carry the `co.elastic.logs/enabled=true` label expected by Filebeat, so the current root setup does not enable automatic API log collection.

Git history attributes the ELK setup to `ImadLhannouni` / `Imadlhannouni`. That work is not attributed to the four members listed above.

## Database Schema

```mermaid
erDiagram
    users {
        UUID id PK
        VARCHAR firstname
        VARCHAR lastname
        VARCHAR username UK
        VARCHAR email UK
        VARCHAR avatar
        TEXT bio
        VARCHAR hashed_password
        TIMESTAMPTZ created_at
    }

    sessions {
        UUID id PK
        UUID user_id FK
        TIMESTAMPTZ expires_at
        TIMESTAMPTZ created_at
    }

    posts {
        UUID id PK
        UUID user_id FK
        TEXT caption
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    followers {
        UUID follower_id "PK, FK"
        UUID following_id "PK, FK"
        TIMESTAMPTZ created_at
    }

    sports {
        UUID id PK
        VARCHAR name UK
        INTEGER max_players
    }

    user_sports {
        UUID user_id "PK, FK"
        UUID sport_id "PK, FK"
    }

    match_announcements {
        UUID id PK
        UUID organizer_id FK
        UUID sport_id FK
        VARCHAR title
        INTEGER remaining_player_slots
        ENUM match_status
        TIMESTAMPTZ start_time
        TIMESTAMPTZ end_time
        TIMESTAMPTZ created_at
    }

    play_requests {
        UUID id PK
        UUID announcement_id FK
        UUID sender_id FK
        ENUM status
        TIMESTAMPTZ created_at
    }

    conversations {
        UUID id PK
        TIMESTAMPTZ created_at
    }

    conversation_participants {
        UUID id PK
        UUID conversation_id FK
        UUID user_id FK
        UUID last_read_message_id
    }

    messages {
        UUID id PK
        UUID conversation_id FK
        UUID sender_id FK
        TEXT body
        TIMESTAMPTZ created_at
    }

    pending_messages {
        UUID id PK
        UUID user_id FK
        UUID message_id FK
        TIMESTAMPTZ delivered_at
        TIMESTAMPTZ created_at
    }

    notifications {
        UUID id PK
        UUID user_id FK
        UUID actor_id FK
        VARCHAR event_type
        UUID target_id
        TIMESTAMPTZ match_time
        TIMESTAMPTZ read_at
        TIMESTAMPTZ delivered_at
        TIMESTAMPTZ created_at
    }

    users ||--o{ sessions : owns
    users ||--o{ posts : writes
    users ||--o{ followers : follower_id
    users ||--o{ followers : following_id
    users ||--o{ user_sports : selects
    sports ||--o{ user_sports : selected_by
    users ||--o{ match_announcements : organizes
    sports ||--o{ match_announcements : categorizes
    match_announcements ||--o{ play_requests : receives
    users ||--o{ play_requests : sends
    conversations ||--o{ conversation_participants : includes
    users ||--o{ conversation_participants : joins
    conversations ||--o{ messages : contains
    users ||--o{ messages : sends
    messages ||--o{ pending_messages : queues
    users ||--o{ pending_messages : receives
    users ||--o{ notifications : receives
    users ||--o{ notifications : triggers
```

The models live in [back/app/models](back/app/models) and [back/app/realtime/models](back/app/realtime/models).

- `followers` and `user_sports` use composite primary keys. Other tables use a single UUID primary key.
- Timestamps are timezone-aware.
- Match status is `upcoming`, `live`, or `finished`.
- Play request status is `pending`, `accepted`, or `declined`.
- Usernames, email addresses, and sport names are unique. Each user can request to join a given match only once.
- `conversation_participants.last_read_message_id` tracks read position. `pending_messages` tracks message delivery, while `notifications` stores activity events.

## Modules

The mapping below uses the supplied **ft_transcendence — Surprise., version 21.2** subject, sections IV.1–IV.7. The subject requires **14 points**, with **2 points per Major** and **1 point per Minor** module. Frontend and backend frameworks are counted together as one Major module.

### Modules supported by the source

These modules have implementation evidence in the current checkout. This is a source review, not a completed evaluation: runtime behavior, translation coverage, and layout mirroring still need demonstration.

| Module | Type | Points | Purpose and implementation | Contributors |
| :--- | :--- | :--- | :--- | :--- |
| Use a framework for both the frontend and backend | Major | 2 | Next.js/React provides the pages and UI; FastAPI handles REST and WebSocket endpoints. This keeps routing, validation, and request handling within established frameworks. | wazadou, mbrouk, zouazrou, melayyad |
| Implement real-time features using WebSockets | Major | 2 | Players exchange messages and receive presence, read, and notification events without refreshing. The backend registers connections, sends events to recipients, cleans up disconnected sockets, and queues offline messages. | melayyad, mbrouk |
| Use an ORM for the database | Minor | 1 | SQLAlchemy models define accounts, follows, matches, conversations, and messages. Services query these models through async database sessions. | zouazrou, melayyad |
| Support for multiple languages | Minor | 1 | next-intl loads English, French, and Arabic messages and exposes a language switcher. Each language file contains the same 251 keys; matching keys alone do not establish that every visible string is translated. | wazadou; chat translation updates by mbrouk and melayyad |
| Right-to-left language support | Minor | 1 | The locale layout sets `dir="rtl"` for Arabic. Logical alignment and positioning utilities adapt shared UI to the reading direction. Complete mirroring needs a visual walkthrough. | wazadou |

**Source-based subtotal: 2 Major × 2 + 3 Minor × 1 = 7 points.** This is the implementation mapping, not a guarantee of awarded points. It does not establish the required 14 points.

### Implementations that do not yet establish a complete module

| Subject module | Type / points | Current implementation and missing evidence | Contributors |
| :--- | :--- | :--- | :--- |
| Allow users to interact with other users | Major / 2 | Direct chat and public profiles are implemented. The social model provides one-way follows; the subject explicitly requires a friends system. This requirement is not established by the current follow implementation. | melayyad, mbrouk, zouazrou, wazadou |
| Standard user management and authentication | Major / 2 | Accounts, profile editing, avatars, a default avatar, and online presence exist. The same friends requirement remains unresolved. | zouazrou, melayyad, wazadou, mbrouk |
| Server-Side Rendering (SSR) | Minor / 1 | Next.js has an async server locale layout and translated metadata, while application pages load account data in client effects. The use of Next.js alone does not demonstrate the subject's performance and SEO improvement. | wazadou |
| Custom-made design system | Minor / 1 | Shared buttons, inputs, labels, text, lists, modals, and date pickers use a common palette and font. The subject requires at least 10 reusable components; a complete qualifying component inventory has not been established. | wazadou |
| Infrastructure for log management using ELK | Major / 2 | Elasticsearch, Logstash, Kibana, and Filebeat configurations exist. Retention and archiving policies are absent, Elasticsearch authentication is disabled, and the root API service lacks the collection label. The full module is incomplete. | ImadLhannouni / Imadlhannouni, as recorded in Git history |

These entries are **excluded from the subtotal**. Their listed points are the subject's values, not points claimed by this README.

### Other features excluded from module points

- Notifications cover selected events, including follows, new posts, match updates/cancellations, and play requests. The notification module requires coverage of **all creation, update, and deletion actions**.
- User search has text matching and pagination, but does not provide the full filtering and sorting required by the advanced-search module.
- Avatar uploads support JPEG, PNG, and WebP with server-side size and MIME-type checks. They do not establish the broader file-management requirements, including secure access control, format validation, progress indicators, and file deletion controls.
- Persistent chat history and read receipts do not satisfy all advanced-chat requirements, including blocking and typing indicators.
- Match announcements schedule real-world sports events. They do not implement a playable game, game statistics, or a tournament module.
- Local email/password authentication is not OAuth 2.0 remote authentication.
- No custom module is assigned points without the justification required by section IV.10.

## Individual Contributions

### melayyad — Mohamed El-ayyady

Built the WebSocket system: connection management, message handlers, presence tracking, pending delivery, and notification dispatch. Set up the application Compose workflow and Dockerfiles, integrated frontend and backend branches, and worked on play requests, match announcements, and session authentication.

**Challenge:** Connections can become stale after a disconnect or session expiry. Connection cleanup, session checks, and send limits handle these cases in the real-time layer.

### zouazrou — Zakaria Ouazrou

Built the REST API for authentication, users, posts, followers, sports, match announcements, and play requests. Defined the database models and relationships, added Argon2 password hashing and session cookies, and worked on validation, structured errors, and pagination.

**Challenge:** Two requests can be accepted at the same time. Database row locks protect the remaining player count during acceptance.

### wazadou — Wissam Azadou

Built page layouts and shared components with Next.js, Tailwind CSS, and MUI. Added next-intl translations for English, French, and Arabic, including RTL layouts. Worked on community, search, match history, and profile editing pages, along with route access redirects and the frontend Docker build.

**Challenge:** Arabic and the other two languages use different reading directions. RTL layouts and component adjustments support both directions.

### mbrouk — Marouane Brouk

Built the conversation list, message composer, chat scrolling, and incoming message display. Added notification popups, unread badges, read receipts, online indicators, and profile links. Connected the followers list to chat so users can start conversations from it.

**Challenge:** Unread counts and conversation state need to survive page navigation. Shared chat context keeps these values available across pages.

## Resources

- **Project specification:** the supplied *ft_transcendence — Surprise., version 21.2* subject, particularly II.1 (team roles), IV (module requirements and points), and VI (README requirements).
- [FastAPI documentation](https://fastapi.tiangolo.com/), including the [WebSocket tutorial](https://fastapi.tiangolo.com/advanced/websockets/)
- [Next.js App Router documentation](https://nextjs.org/docs/app)
- [SQLAlchemy documentation](https://docs.sqlalchemy.org/)
- [PostgreSQL documentation](https://www.postgresql.org/docs/)
- [Docker Compose documentation](https://docs.docker.com/compose/)
- [uv documentation](https://docs.astral.sh/uv/)
- [next-intl documentation](https://next-intl.dev/docs)
- [MUI documentation](https://mui.com/material-ui/)
- [WebSocket API reference](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [Argon2-cffi documentation](https://argon2-cffi.readthedocs.io/)

### AI usage

AI tools were used for:

- **Backend and frontend code:** Debugging issues, drafting boilerplate, and suggesting refactors for services and components.
- **Real-time and database design:** Discussing WebSocket connection handling and database schema choices.
- **Documentation:** Drafting and revising this README, API docstrings, and code comments.

Team members reviewed and adapted the generated code before integrating it.
