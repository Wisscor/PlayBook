*This project has been created as part of the 42 curriculum by \<melayyad\>, \<mbrouk\>, \<wazadou\>, \<zouazrou\>*

# <img src="front/playbook-web/public/logos/app-logo.png" alt="PlayBook logo" width="64" align="right" /> PlayBook

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)](https://docs.sqlalchemy.org/)
[![Caddy](https://img.shields.io/badge/Caddy-1F88C0?style=for-the-badge&logo=caddy&logoColor=white)](https://caddyserver.com/)

**Find your people. Make the game happen.**

## Table of contents

- [Description](#description)
- [Features](#features)
- [Instructions](#instructions)
  - [Requirements](#requirements)
  - [Install and run](#install-and-run)
- [Resources](#resources)
- [Configuration](#configuration)
- [Development commands](#development-commands)
- [Project structure](#project-structure)
- [Team Information](#team-information)
- [Project Management](#project-management)
- [Technical Stack](#technical-stack)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [Database](#database)
  - [Additional technologies](#additional-technologies)
  - [Justification for major technical choices](#justification-for-major-technical-choices)
- [Database Schema](#database-schema)
- [Features List](#features-list)
- [Modules](#modules)
  - [Module summary](#module-summary)
  - [Total points achieved](#total-points-achieved)
  - [Notes on the selected modules](#notes-on-the-selected-modules)
- [Individual Contributions](#individual-contributions)

## Description

PlayBook is a sports social network where users can announce a match, find the required number of players, and organize games with teammates in any supported sport. Players can also browse available matches and apply to join one whenever they find a game they would like to play. It also helps users connect with other sports enthusiasts and stay in touch before and after the game.

## Features

- **Player profiles** — Create an account, manage your profile and avatar, select sports and control active sessions.
- **Social feed** — Publish posts, follow players, and browse player activity.
- **Matchmaking** — Announce matches, filter and browse opportunities, and send join requests.
- **Realtime communication** — Chat with live presence, read receipts, notifications, and offline message delivery.
- **Multilingual interface** — Use English, French, or Arabic, including RTL layout support for Arabic.

## Instructions

### Requirements

- [Docker Engine](https://docs.docker.com/engine/install/) or [Docker Desktop](https://www.docker.com/products/docker-desktop/) with [Docker Compose v2](https://docs.docker.com/compose/install/)
- [Make](https://www.gnu.org/software/make/) (recommended; it provides the project commands)
- Local ports `3443` and `8443` available

### Install and run

1. From the repository root, create the environment file:

	```bash
	cp .env.example .env
	```

2. Open `.env` and set the database credentials. Keep `postgres` as the host in `DATABASE_URL`, because it is the Docker Compose service name. For local HTTPS, keep `NEXT_PUBLIC_API_URL=https://localhost:8443` and `CORS_ORIGINS=["https://localhost:3443"]` unless your setup uses different URLs.
3. Build and start the complete application:

	```bash
	make up
	```

	The first build may take a few minutes. The command starts PostgreSQL, the FastAPI backend, the Next.js frontend, and Caddy.
4. Open the application using one of these URLs:

| Service | URL |
| --- | --- |
| Web app | [https://localhost:3443/en](https://localhost:3443/en) |
| API | [https://localhost:8443](https://localhost:8443) |
| OpenAPI docs | [https://localhost:8443/docs](https://localhost:8443/docs) |
| Health check | [https://localhost:8443/health](https://localhost:8443/health) |

The proxy uses local HTTPS certificates. Your browser may require accepting the local certificate the first time you open the application.

5. Stop the services when finished:

	```bash
	make down
	```

Use `make clean` only when you also want to delete the database, uploaded files, and Docker volumes.

## Resources

- [Next.js documentation](https://nextjs.org/docs)
- [next-intl documentation](https://next-intl.dev/docs)
- [FastAPI documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy documentation](https://docs.sqlalchemy.org/)
- [Docker Compose documentation](https://docs.docker.com/compose/)
- [Python API Development with FastAPI](https://notes.kodekloud.com/docs/Python-API-Development-with-FastAPI )

## Configuration

The root `.env` file is loaded by Docker Compose. Start with [.env.example](.env.example) and change credentials before using the stack beyond local experimentation.

| Variable | Purpose |
| --- | --- |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | PostgreSQL credentials and database name |
| `DATABASE_URL` | Async SQLAlchemy connection string; use `postgres` as the Compose database host |
| `CORS_ORIGINS` | JSON list of browser origins allowed by the API |
| `SESSION_COOKIE_*` | Session cookie name, lifetime, security, and SameSite behavior |
| `NEXT_PUBLIC_API_URL` | Browser-facing API URL; changing it requires rebuilding the frontend image |

## Development commands

| Command | Description |
| --- | --- |
| `make up` | Build and start all services, then print local URLs |
| `make down` | Stop the services |
| `make restart` | Stop and start the full stack |
| `make status` | Show running containers |
| `make app-logs` | Follow backend and frontend logs |
| `make urls` | Print application URLs |
| `make clean` | Stop services and delete database, upload, and proxy volumes |

For local development without a containerized API, start PostgreSQL with `docker compose up -d postgres`, install backend dependencies with `uv sync`, and run `uv run uvicorn app.main:app --reload` from `back/`. The frontend can be run from `front/playbook-web/` with `yarn install` and `yarn dev`.

## Project structure
```text
.
├── back/                 # FastAPI application and database models
│   └── app/
│       ├── core/         # Settings, security, limits, and error handling
│       ├── database/     # Database configuration, sessions, and seed data
│       ├── main.py        # FastAPI application entry point
│       ├── models/       # SQLAlchemy application models
│       ├── realtime/     # WebSocket protocol and realtime services
│       ├── routers/      # REST route modules
│       ├── schemas/      # Pydantic request and response schemas
│       └── services/     # Application business logic and service functions
├── front/playbook-web/   # Next.js application
├── docs/                 # Architecture notes and diagrams
├── Caddyfile             # Local HTTPS reverse-proxy routes
├── docker-compose.yaml   # PostgreSQL, API, frontend, and Caddy services
└── Makefile              # Common development commands
```

## Team Information

- **melayyad** — PO, Developer
  - Defines the product vision, priorities, and user requirements; helps validate the feature set and ensures the project matches the target user needs.
- **mbrouk** — Tech Lead, Developer
  - Leads the technical direction, architecture decisions, and code quality; coordinates implementation and helps guide the team through technical challenges.
- **wazadou** — PM, Developer
  - Manages planning, coordination, and delivery milestones; tracks progress, organizes tasks, and supports smooth execution across the team.
- **zouazrou** — Developer
  - Contributes to implementation across the application, supports feature development, and helps maintain the project’s codebase and functionality.

## Project Management

- **How the team organized the work**: 
	- Meetings were organized by the Scrum Master / PM, wazadou focused on the front-end UI, zouazrou worked on the core backend API endpoints and database schema, melayyad handled realtime features and WebSocket implementation, and mbrouk managed the front-end and back-end integration.
- **Tools used for project management**: GitHub.
- **Communication channels used**: Discord, Google Meet.

## Technical Stack

### Frontend
- **Next.js** — Used for the app shell, routing, and server/client rendering in a modern React environment.
- **React** — Provides a component-based UI architecture for building reusable screens and interactive flows.
- **TypeScript** — Improves maintainability, type safety, and developer productivity during frontend integration.
- **Tailwind CSS** — Used for rapid styling, consistent design patterns, and responsive layout management.
- **Axios** — Handles HTTP requests to the backend and manages authenticated API calls with cookies.

### Backend
- **FastAPI** — Chosen for its high performance, automatic OpenAPI documentation, and clean Python-based API development.
- **SQLAlchemy** — Provides ORM-based database access and easier schema management for application models.
- **Pydantic** — Validates request and response schemas and helps keep backend contracts consistent.
- **WebSockets** — Implemented for live messaging, presence, notifications, and read receipts in real time.

### Database
- **PostgreSQL** — Selected for reliability, relational modeling, transactional consistency, and support for structured app data.
- **Why this choice**: the project requires user data, social relationships, match announcements, posts, and realtime-related state to be stored consistently and queried efficiently.


### Additional technologies
- **Docker & Docker Compose** — Simplify local development and ensure the app runs consistently across environments.
- **Caddy** — Acts as a reverse proxy and TLS terminator for local HTTPS setup.
- **PostgreSQL + SQLAlchemy** — Combined to produce a robust relational data layer with Python-friendly development workflows.
- **WebSocket + background notification flow** — Used to support live communication without constant polling.

### Justification for major technical choices
- **Next.js + React** were chosen to build a responsive, modern frontend with reusable components and strong ecosystem support.
- **FastAPI** was selected because it fits the project’s need for a fast API layer with clear validation, typed schemas, and good developer ergonomics.
- **PostgreSQL** was preferred over NoSQL alternatives because the application relies on relational data, joins, and consistent transactions.
- **Docker Compose** was used to standardize the environment and reduce setup issues for backend, frontend, database, and proxy services.
- **WebSockets** were included to support live user interactions such as messaging, notifications, and presence updates that a normal REST-only design would not handle efficiently.

## Database Schema

[![Database schema](docs/diagram.jpg)](https://lucid.app/lucidspark/ac32ef46-637c-48e6-a741-365b5170ab9a/edit?invitationId=inv_1912247b-3c80-4990-b56c-b6e6f153a189&page=0_0#)

## Features List

| Feature | Team member(s) | Brief description |
| --- | --- | --- |
| User authentication and session management | zouazrou, mbrouk | Secure sign up, sign in, logout, and session-based access control for protected routes and API requests. |
| User profile management | wazadou, mbrouk | Users can view and edit their profile information, manage avatars, and maintain account details. |
| Social feed and posts | wazadou, mbrouk, zouazrou | Users can create posts, publish media, view the feed, and browse community activity. |
| Follow / unfollow system | zouazrou, mbrouk | Users can discover other players and follow or unfollow them to build a social network. |
| Match announcement creation | wazadou, zouazrou, mbrouk | Players can create match announcements with sport information, date, location, and participant requirements. |
| Match browsing and filtering | wazadou | Users can view available matches, search by criteria, and choose games they want to join. |
| Play request flow | zouazrou, wazadou | Players can request to join a match, and organizers can review and accept or reject requests. |
| Realtime messaging | melayyad | Users can exchange direct chat messages in real time within conversations and receive live updates. |
| Read receipts and message status | melayyad | Participants can mark messages as read and see whether the other user has read their content. |
| Presence and online status | melayyad | The app tracks whether contacts are online and updates presence in real time. |
| Notifications system | melayyad, zouazrou, mbrouk | Users receive live notifications for follow actions, post updates, match changes, and request outcomes. |
| Community and discovery pages | wazadou, mbrouk | Users can explore people, posts, and match opportunities through dedicated community views. |
| Multilingual support | wazadou | The interface supports English, French, and Arabic, including localized content and layout adjustments. |
| Responsive UI and navigation | wazadou, mbrouk | The interface is designed for desktop and mobile use with clear navigation, headers, and action flows. |




## Modules

The following module selection reflects the actual work completed in the project and the required grading criteria used in the 42 evaluation.

- Major module = 2 points
- Minor module = 1 point

### Module summary

| Requirement | Type | Points | Status | Justification | Implementation | Team member(s) |
| --- | --- | ---: | --- | --- | --- | --- |
| Use a framework for both the frontend and backend | Major | 2 | Implemented | Modern full-stack architecture is required for a scalable web application. | Next.js/React on the frontend and FastAPI on the backend. | mbrouk, wazadou, zouazrou |
| Real-time features using WebSockets | Major | 2 | Implemented | The product requires live messaging, presence, and notification updates. | WebSocket server, connection registry, message delivery, and realtime event broadcasting. | melayyad, zouazrou |
| Allow users to interact with other users (chat, profile, friends) | Major | 2 | Implemented | Social interaction is a core requirement of the app. | User profiles, follow/friends-style social connections, and live messaging support. | wazadou, zouazrou, mbrouk |
| Standard user management and authentication | Major | 2 | Implemented | Secure access control is essential for every user-facing feature. | Sign-up, login, logout, session cookies, protected routes, and profile management. | mbrouk, zouazrou, wazadou |
| Custom module: session management in the user profile menu | Major | 2 | Implemented | Session management is a substantial product feature because it improves security and user control inside the authenticated experience. | Logout flow integrated into the profile menu, session-aware UI behavior, protected route consistency, and safe redirect handling after sign-out. | mbrouk, wazadou |
| Public API with documentation, rate limiting, and key-based access | Major | 2 | Implemented | This is a major backend requirement was part of the final scope implemented. | Included in the current project implementation. | zouazrou melayyad |
| Use an ORM for the database | Minor | 1 | Implemented | ORM simplifies schema management and data access. | SQLAlchemy models and database abstraction for the backend. | zouazrou |
| Complete notification system | Minor | 1 | Implemented | Notifications are needed for social and match events. | Event-driven notifications for follows, posts, match updates, and requests. | melayyad, zouazrou, mbrouk |
| Custom design system with reusable UI components | Minor | 1 | Implemented | A consistent visual system improves usability and code reuse. | Reusable Next.js components, shared styles, color palette, and icon-driven UI patterns. | wazadou, mbrouk |
| Advanced search with filters, sorting, and pagination | Minor | 1 | Implemented | Search functionality is required for match discovery and community browsing. | Search and filter logic in discovery pages and paginated results. | wazadou, mbrouk |
| Multiple languages support (i18n) | Minor | 1 | Implemented | The app supports a multilingual audience. | English, French, and Arabic translations with a language switcher. | wazadou, mbrouk |
| RTL support | Minor | 1 | Implemented | Arabic support requires mirrored layout behavior. | RTL-aware layout adjustments and language-specific UI direction handling. | wazadou, mbrouk |
| Support for additional browsers | Minor | 1 | Implemented | The app targets modern browser compatibility, especially Chromium and Firefox-based environments. | Frontend compatibility checks and cross-browser UI adjustments. | wazadou, mbrouk |

### Total points achieved
- Major modules implemented: 6 × 2 = 12 points
- Minor modules implemented: 7 × 1 = 7 points
- Total: 19 points

### Notes on the selected modules
The team focused on the modules that were central to the main product value: full-stack architecture, real-time communication, user interaction, authentication, notifications, and multilingual UX. These were the most important pieces for delivering a working sports social network experience, while the public API module and browser-compatibility expansion were not part of the final implementation scope.


## Individual Contributions

### wazadou — Front-end UI/UX (PM, Developer)

**Contributions**
- Designed and built the user interface of the Next.js app: layouts, navigation, headers, and action flows.
- Built the custom design system: shared color palette, Tailwind styles, and reusable components.
- Implemented profile pages, the social feed UI, match announcement forms, and community/discovery pages.
- Built match browsing with search, filters, sorting, and pagination.
- Implemented multilingual support (English, French, Arabic) with next-intl, including RTL layout for Arabic.
- Organized meetings, planning, and task tracking as PM.

**Challenges**
1. **Keeping the UI consistent across many pages.** Each page started with its own styling, so colors and spacing drifted apart.
   *Solution:* We defined one shared palette in the Tailwind config and a set of reusable components (buttons, cards, modals, forms), then rebuilt every page on top of them.
2. **RTL layout for Arabic.** Switching to Arabic left icons, margins, and menus on the wrong side.
   *Solution:* The `dir` attribute is set from the active locale, and we replaced left/right utilities with logical ones (`ms-*`, `me-*`, `start`, `end`) so the layout mirrors automatically.
3. **Responsive layouts for feed, matches, and chat.** Multi-column pages broke on small screens.
   *Solution:* We designed mobile-first with flex and grid. On mobile, side panels collapse into separate views, and navigation moves to a compact menu.
4. **Keeping search filters and pagination usable.** Filters were lost on refresh or when using the back button.
   *Solution:* Filters, sorting, and the current page are stored in the URL query parameters, so results can be shared, refreshed, and navigated with the browser history.

### mbrouk — Front-end/back-end integration (Tech Lead, Developer)

**Contributions**
- Connected the Next.js front end to the FastAPI back end with Axios and cookie-based sessions.
- Integrated authentication, protected routes, and the session management custom module in the profile menu.
- Integrated the WebSocket client for chat, presence, and notifications.
- Supported the feed, profiles, matches, discovery, i18n, and responsive UI with API integration.
- Led technical direction and architecture decisions.

**Challenges**
1. **Session cookies not sent with API calls.** Requests reached the API without the session cookie, so the user looked logged out.
   *Solution:* We created one shared Axios instance with `withCredentials: true`. An interceptor catches 401 responses (expired session) and redirects to the sign-in page.
2. **CORS and cookies across origins.** The front end (`:3443`) and the API (`:8443`) are different origins, so browsers blocked requests or rejected the cookie.
   *Solution:* The API allows only the origins in `CORS_ORIGINS` with credentials enabled, the session cookie uses `Secure` and the right `SameSite` setting, and Caddy serves both over local HTTPS.
3. **Keeping realtime events in sync with REST data.** WebSocket events and REST responses sometimes disagreed (duplicate messages, wrong unread counts).
   *Solution:* Both sources update one client-side state, messages are deduplicated by ID, and after a reconnect the client fetches missed data over REST.
4. **Safe sign-out and protected routes.** After logging out, cached pages could still be shown, and redirect parameters could send users anywhere.
   *Solution:* Logout clears the session on the server and the client state, protected routes check the session before rendering, and redirects after sign-in/sign-out only accept internal paths.

### zouazrou — Core back-end API and database (Developer)

**Contributions**
- Designed the PostgreSQL database schema and the SQLAlchemy models.
- Implemented the core REST endpoints: authentication and sessions, profiles, posts, follow/unfollow, match announcements, and play requests.
- Built the Pydantic request/response schemas and the error handling in `core/`.

**Challenges**
1. **Secure session-based authentication.** Passwords had to be stored safely and sessions had to be revocable.
   *Solution:* Passwords are hashed before storage. Sessions are stored on the server, the browser only holds a random session ID in an `HttpOnly` cookie, and protected routes check the session through a FastAPI dependency. Logging out or revoking a session deletes it server-side.
2. **Lazy loading with async SQLAlchemy.** Accessing relationships (author of a post, match participants) raised errors outside the async context.
   *Solution:* We load the needed relationships explicitly in the queries (`selectinload` / `joinedload`) and return Pydantic schemas instead of raw ORM objects.
3. **Consistent validation and error responses.** Invalid payloads produced unclear errors that the front end could not handle.
   *Solution:* Every endpoint uses Pydantic schemas, and shared exception handlers return one JSON error format with clear status codes.

### melayyad — Realtime features and WebSockets (PO, Developer)

**Contributions**
- Built the WebSocket server, the connection registry, and the realtime protocol in `realtime/`.
- Implemented realtime messaging, read receipts, presence/online status, and offline message delivery.
- Implemented live notification delivery with mbrouk.
- Defined the product vision and user requirements as PO.

**Challenges**
1. **Authenticating WebSocket connections.** The server had to know which user opened each socket.
   *Solution:* The browser sends the session cookie during the WebSocket handshake. The server checks that session before accepting the connection and closes it with a clear code if it is invalid.
2. **One user with several tabs or devices.** Messages reached only one tab, and closing a tab disconnected the user everywhere.
   *Solution:* The connection registry maps each user to a set of sockets. Events go to all of them, and only the closed socket is removed.
3. **Offline message delivery.** Messages and notifications sent while a user was offline were lost.
   *Solution:* Every message and notification is saved in the database first, then pushed live if the user is connected. Unread items are delivered when the user comes back online.
4. **Accurate presence and read receipts.** Users stayed "online" after closing the app, and read status was not updated for the sender.
   *Solution:* Disconnects (normal or failed heartbeat) are handled in one place, and a user goes offline only when their last socket closes. When a message is read, a read event is saved and sent to the sender in real time.
