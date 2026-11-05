*This project has been created as part of the 42 curriculum by melayyad, zouazrou, wazadou, mbrouk.*

# PlayBook

## Description

PlayBook is a sports social network that helps people find teammates and organize games. Users can create profiles, share posts, follow other players, announce matches, send join requests, and chat in real time. The interface supports English, French, and Arabic.

## Features List

- Email/password accounts, editable profiles, avatars, and backend session controls.
- Sports feed, player profiles, follows, match announcements, and join requests.
- Direct chat, online presence, read receipts, offline message delivery, and notifications.
- English, French, and Arabic interface, with RTL support for Arabic.

## Team Information

| Member | Role and main contribution |
| --- | --- |
| melayyad | Tech Lead / Developer — backend architecture, WebSockets, Docker, and integration |
| zouazrou | Backend Developer — API, database models, authentication, and validation |
| wazadou | Full-stack Developer — pages, shared UI, translations, and frontend integration |
| mbrouk | Frontend Developer — chat, notifications, follows, and profile navigation |

The repository does not record who was assigned Product Owner or Project Manager. Add the team's agreed assignments before submission.

## Project Management

Work was divided across backend, frontend, and real-time features. The team used Git branches, GitHub pull requests, and commits to coordinate and integrate work. Google Meet was used for meetings, with Discord and WhatsApp for day-to-day communication. GitHub was used for code collaboration and project coordination.

## Instructions

### Requirements

- Docker Engine or Docker Desktop with Docker Compose v2.
- Git; Make is optional.
- Ports 80, 443, and 8443 available for the local HTTPS proxy.

Node.js, Python, and PostgreSQL run in containers; they do not need to be installed locally.

### Run the project

1. Clone the repository and enter its folder:

	```bash
	git clone https://github.com/Wisscor/PlayBook.git
	cd PlayBook
	cp .env.example .env
	```

2. Set the database values in `.env` if needed, and keep `postgres` as the database host in `DATABASE_URL`.
3. Start the services with `make up`, or run `docker compose up --build -d`.
4. Open [https://localhost/en](https://localhost/en). API docs are at [https://localhost:8443/docs](https://localhost:8443/docs).

### Useful commands

| Command | What it does |
| --- | --- |
| `make down` | Stops the application services. |
| `make app-logs` | Shows and follows application logs. |
| `make clean` | Stops the services and deletes stored database and upload data. |

## Technical Stack

| Area | Main technologies |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS, next-intl |
| Backend | FastAPI, Pydantic, Uvicorn, WebSockets, Argon2 |
| Database | PostgreSQL, SQLAlchemy ORM, asyncpg |
| Deployment | Docker, Docker Compose, Caddy (HTTPS reverse proxy) |

Next.js and FastAPI provide the application frameworks. PostgreSQL stores the relational data, and SQLAlchemy maps application models to database tables. Docker Compose runs the services together, while Caddy provides HTTPS endpoints for browser connections.

## Database Schema

The database uses UUID primary keys and timezone-aware timestamps. Main tables are `users`, `sessions`, `posts`, `followers`, `sports`, `user_sports`, `match_announcements`, `play_requests`, and chat/notification tables (`conversations`, `conversation_participants`, `messages`, `pending_messages`, `notifications`). Users own posts and sessions, follow other users, select sports, organize matches, and participate in conversations. Match announcements belong to a sport and receive play requests.

## Modules

The subject awards 2 points for each Major and 1 for each Minor. The list below records the selected modules and the current implementation honestly; a listed target score is not a claim that every module is complete or validated.

| Selected module | Type / points | Implementation status | Contributors |
| --- | --- | --- | --- |
| Frontend and backend frameworks | Major / 2 | Implemented with Next.js/React and FastAPI. | All four |
| Real-time features | Major / 2 | WebSocket chat, presence, delivery, and connection cleanup are implemented. | melayyad, mbrouk |
| User interaction (chat, profiles, friends) | Major / 2 | Chat and public profiles exist; one-way follows do not yet provide the required friends system. | All four |
| Public API secured by API key | Major / 2 | FastAPI docs, rate limiting, and REST routes exist; API-key protection and the full required CRUD endpoint set are not confirmed. | zouazrou, melayyad |
| ORM | Minor / 1 | SQLAlchemy models and database sessions are used. | zouazrou, melayyad |
| Complete notifications | Minor / 1 | Notifications cover selected events, but not every create, update, and delete action yet. | melayyad, mbrouk |
| Custom design system (10+ reusable components) | Minor / 1 | Shared UI components and styling exist; the required qualifying inventory of 10 components still needs confirmation. | wazadou |
| Advanced search | Minor / 1 | Match search supports filters, sorting, and pagination; user search is more limited. | zouazrou, wazadou |
| Multiple languages | Minor / 1 | English, French, and Arabic catalogs and a language switcher exist; full translation coverage needs review. | wazadou, mbrouk |
| RTL support | Minor / 1 | Arabic sets RTL direction and has RTL-specific adjustments; full layout mirroring needs visual testing. | wazadou |
| Additional browsers | Minor / 1 | Compatibility with two additional browsers is not yet documented or validated. | Not documented |
| Standard user management and authentication | Major / 2 | Signup/login, profile editing, avatar upload, and online presence exist; the required friends feature remains missing. | zouazrou, melayyad, wazadou |
| Session-management custom module | Minor / 1 | Backend endpoints list and revoke sessions. The frontend still uses mock session data, so the feature is not complete end to end. It helps users review and revoke sessions for better account control. | zouazrou; frontend integration pending |

**Selected target: 18 points** (5 Major and 8 Minor). Several modules above are incomplete or unverified, so the project must finish and demonstrate them before claiming those points.

## Individual Contributions

- **melayyad:** WebSocket infrastructure, presence and offline delivery, notifications, Docker setup, and integration. Connection cleanup and session checks address stale sockets.
- **zouazrou:** REST API, database models, authentication, validation, and pagination. Database row locks protect match slots from concurrent requests.
- **wazadou:** Frontend pages and components, localization, RTL layouts, and frontend integration. RTL-specific adjustments support Arabic layouts.
- **mbrouk:** Chat interface, notifications, read receipts, online indicators, and profile links. Shared chat state preserves unread counts across navigation.

## Resources

### Frontend and localization

- [Next.js](https://nextjs.org/docs)
- [next-intl](https://next-intl.dev/docs)

### Backend and real-time communication

- [FastAPI](https://fastapi.tiangolo.com/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

### Database and deployment

- [SQLAlchemy](https://docs.sqlalchemy.org/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Docker Compose](https://docs.docker.com/compose/)

### AI use

AI tools helped with code debugging, boilerplate and refactoring suggestions, WebSocket and database design discussions, and drafting documentation. Team members reviewed and adapted generated suggestions before using them.
