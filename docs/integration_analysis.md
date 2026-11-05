# PlayBook — Frontend ↔ Backend Integration Analysis

## 1. Stack Overview

| | Frontend | Backend |
|---|---|---|
| **Framework** | Next.js 16 (App Router) + TypeScript | FastAPI (Python, async) |
| **HTTP client** | Axios | — |
| **Auth** | Cookie-based session (`session_id`) | Cookie-based session (HttpOnly) |
| **i18n** | `next-intl` (en / fr / ar) | — |
| **Real-time** | — (not wired yet) | WebSocket at `/ws` |
| **File uploads** | — (not wired yet) | Static served at `/uploads/*` |

---

## 2. Authentication — The Most Critical Integration Point

### How the backend works
- **Login** → `POST /auth/login` → sets an **HttpOnly cookie** named `session_id` (configured in `.env`)
- **Auth guard** → `get_curr_user` dependency reads `session_id` from the cookie and validates the session in DB
- **Logout** → `POST /auth/logout` → deletes the session from DB and clears the cookie
- **Me** → `GET /auth/me` → returns the current user via `UserResponse`

### ⚠️ Cookie name mismatch — needs fixing immediately
The backend sets cookie name `session_id` (from `SESSION_COOKIE_NAME` in `.env`).  
The frontend middleware reads `user_session`:

```ts
// src/middleware.ts  line 31
const sessionToken = request.cookies.get("user_session")?.value;
```

**Fix**: Either rename the backend cookie or update the frontend to read `"session_id"`.

### ⚠️ `withCredentials` missing from Axios
The backend uses HttpOnly cookies, so the browser must send cookies on every request.  
The current `api.ts` does **not** set `withCredentials: true`:

```ts
// src/services/api.ts  — needs withCredentials
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,          // ← MISSING
  headers: { "Content-Type": "application/json" },
});
```

Without this, the browser will **never** send the `session_id` cookie, and every protected route will return 401.

### CORS is already aligned
Backend `cors_origins` includes `https://localhost` and `allow_credentials=True` — matches the frontend origin. The API is on HTTPS port 8443.

---

## 3. TypeScript Types vs Backend Schemas — Gaps

The frontend `User` type is minimal. Here's what the backend actually returns:

| Field | Backend `UserResponse` | Frontend `User` type |
|---|---|---|
| `id` | `UUID` (required) | `string?` (optional) |
| `firstname` | `str` (required) | `string` ✅ |
| `lastname` | `str` (required) | `string` ✅ |
| `username` | `str` (required) | `string` ✅ |
| `email` | `EmailStr` (required) | `string?` (optional) |
| `phone` | `str?` | ❌ missing |
| `avatar` | `str?` | ❌ missing |
| `bio` | `str?` | `string?` ✅ |
| `created_at` | `datetime` | ❌ missing |

For profile pages the backend returns `UserProfileResponse` which also has:
`followers_count`, `following_count`, `posts_count`, `is_following`.

**All of these types need to be created/updated in the frontend.**

---

## 4. API Endpoints Summary (what to integrate)

### Auth (`/auth`)
| Method | Path | Auth required | Frontend equivalent |
|---|---|---|---|
| `POST` | `/auth/signup` | No | Signup page form |
| `POST` | `/auth/login` | No | Signin page form |
| `POST` | `/auth/logout` | Yes (cookie) | Logout button |
| `GET` | `/auth/me` | Yes | Bootstrap current user |

### Users (`/users`)
| Method | Path | Auth required | Frontend equivalent |
|---|---|---|---|
| `GET` | `/users/me` | Yes | Own profile page |
| `PATCH` | `/users/me` | Yes | Edit profile page |
| `POST` | `/users/me/avatar` | Yes | Avatar upload (multipart) |
| `DELETE` | `/users/me` | Yes | Account deletion |
| `GET` | `/users?search=&limit=&offset=` | No | Search users |
| `GET` | `/users/{id}` | Yes | Other user's profile |
| `GET` | `/users/{id}/posts` | Yes | User's post history |

### Posts
| Method | Path | Auth required | Notes |
|---|---|---|---|
| `POST` | `/media` | Yes | Upload image first (multipart) |
| `POST` | `/posts` | Yes | Create post with media URLs |
| `GET` | `/feed` | Yes | Home feed |
| `GET` | `/posts` | Optional | All posts / filtered |
| `GET` | `/posts/{id}` | Optional | Single post |
| `PATCH` | `/posts/{id}` | Yes | Edit post |
| `DELETE` | `/posts/{id}` | Yes | Delete post |

### Match Announcements (`/match-announcements`)
| Method | Path | Auth required |
|---|---|---|
| `POST` | `/match-announcements` | Yes |
| `GET` | `/match-announcements` | Yes |
| `GET` | `/match-announcements/{id}` | Yes |
| `PATCH` | `/match-announcements/{id}` | Yes |
| `DELETE` | `/match-announcements/{id}` | Yes |

### Other
- `GET/POST /play-request` — Play requests for match announcements
- `POST/DELETE /followers/{id}` — Follow/unfollow
- `POST/DELETE /like/{post_id}` — Like/unlike
- `GET/POST /comments/{post_id}` — Comments
- `GET /sports` — Sports list (for match forms)
- `WebSocket /ws` — Realtime (cookie auth via `ws_auth.py`)

---

## 5. File Uploads — Two-Step Flow

For posts the backend uses a **two-step upload**:
1. `POST /media` (multipart/form-data) → get back `{ media_url, media_type }`
2. `POST /posts` (JSON) → include `{ caption, media: [{ media_url, media_type, position }] }`

For avatars:
- `POST /users/me/avatar` (multipart/form-data, field name: `file`)

The Axios instance needs to support `multipart/form-data` for these calls (don't set `Content-Type` manually for FormData — let the browser set the boundary).

Static files (avatars, post images) are served at:
```
https://localhost:8443/uploads/<filename>
```
So a stored URL like `/uploads/abc.jpg` needs the backend base URL prepended.

---

## 6. Real-time WebSocket

The backend has a WebSocket at `wss://localhost:8443/ws`.
Authentication uses the same `session_id` cookie (read via `ws_auth.py`).

The frontend and API use the same hostname and HTTPS scheme, so the secure
session cookie is sent with authenticated WebSocket connections.

Current status: the WS connection is in echo mode only — no real business logic yet.

---

## 7. Route Protection (Middleware)

Frontend middleware handles auth redirects, but it only checks for the cookie *presence* — it doesn't validate the session against the backend. This is fine for UX, but the real gate is the backend's `get_curr_user` dependency.

The protected routes defined in the middleware:
```
/home, /edit-profile, /profile, /history?type=posts, /history?type=matches
```

---

## 8. Missing Infrastructure to Build

Before writing feature code, these foundational pieces are needed:

1. **Fix the cookie name** in middleware (`"user_session"` → `"session_id"`)
2. **Fix Axios instance** — add `withCredentials: true`
3. **Create a proper TypeScript types file** — align with all backend Pydantic schemas
4. **Auth service** — `src/services/auth.ts` is currently empty; needs `login`, `signup`, `logout`, `me` functions
5. **User context / provider** — a React context to store the current user after login, callable throughout the app
6. **Error handling interceptor** on Axios — intercept 401s and redirect to signin
7. **Image URL helper** — prefix `/uploads/*` URLs with `NEXT_PUBLIC_API_URL`

---

## 9. Suggested Integration Order

```
1. Fix cookie name mismatch
2. Fix Axios (withCredentials)
3. Expand TS types (User, Post, MatchAnnouncement, etc.)
4. Implement auth service (login / signup / logout / me)
5. Add UserContext provider
6. Wire signin/signup forms → auth service
7. Add 401 interceptor
8. Wire profile page (GET /users/me)
9. Wire edit-profile page (PATCH /users/me + POST /users/me/avatar)
10. Wire home feed (GET /feed)
11. Wire PostModal (POST /media → POST /posts)
12. Wire MatchModal (GET /sports + POST /match-announcements)
13. Wire history pages (GET /users/{id}/posts, GET /match-announcements?organizer_id=me)
14. WebSocket integration
```
