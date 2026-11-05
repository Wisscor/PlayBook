# Frontend–backend REST integration: oral evaluation guide

This guide describes the REST calls I found in the current frontend and their matching FastAPI routes. It excludes WebSockets, realtime endpoints, and notification endpoints.

## 1. Overall architecture

The browser UI does not call FastAPI routes directly from each component. The usual path is:

```text
Page/component
    ↓ calls
Feature service/controller (src/services/*.ts)
    ↓ calls
Shared Axios client (src/services/api.ts)
    ↓ HTTP request with session cookie
FastAPI router → dependency/auth checks → database
    ↓ JSON response or error
Axios promise → service updates React state/calls callback → UI rerenders
```

### Axios configuration

`src/services/api.ts` creates and exports one Axios instance:

- `baseURL` is `NEXT_PUBLIC_API_URL`, or `http://localhost:8000` if it is not set.
- `withCredentials: true` allows the browser to send cookies to the API and accept cookies set by the API.
- The default `Content-Type` is `application/json`. Avatar upload overrides it with `multipart/form-data`.
- A response interceptor handles errors. It redirects browser requests to sign-in on a `401` (except while already on an auth page or making an `/auth` API request), and rejects with a shared error shape containing `status`, `errorCode`, `message`, and `data`.
- Axios resolves successful requests with a response object; JSON data is in `response.data`. Non-2xx responses reject the promise and reach `.catch()` or `catch`.

The frontend does not use a bearer token in an `Authorization` header. The backend creates a database session and puts its ID in an `HttpOnly` cookie named `session_id`. JavaScript cannot read or manually delete an HttpOnly cookie. The browser sends it automatically because Axios uses `withCredentials`.

Backend CORS is configured in `back/app/main.py` using `settings.cors_origins`, with `allow_credentials=True`. Credentialed CORS requires explicit allowed origins rather than `*`. Cookie defaults in `back/app/core/config.py` are seven days, HttpOnly, SameSite `lax`, and `Secure=false` (the last setting should be changed to true in HTTPS production).

## 2. Connected REST endpoints

All paths below are relative to the Axios `baseURL`. “Page” means a paginated object shaped like `{ items, total, page, size, pages }`.

### Authentication and sessions

| Method and URL | Request and response | Frontend caller and behavior |
|---|---|---|
| `POST /auth/signup` | JSON: `firstname`, `lastname`, `username`, `email`, `password`. Returns a user profile. Backend validates fields and creates the account. | `src/services/auth.ts` → `signUp`, used by the sign-up form. On success it calls `signIn` with the returned email and entered password; signup itself does not set the session cookie. |
| `POST /auth/login` | JSON: `email`, `password`. Returns a user profile and sets the `session_id` cookie. | `src/services/auth.ts` → `signIn`, used by the sign-in form. The frontend stores the returned user in `AuthContext` and navigates to the sign-in route; because the cookie now exists, the proxy redirects that auth route to `/home`. The form has a waiting state and displays an error. |
| `POST /auth/logout` | No body. Uses the cookie; returns a success message and clears the cookie. | `src/services/auth.ts` → `signOut`, called by the private layout and burger menu. It clears the connected user and calls the success callback; the layout reloads and navigates to sign-in. |
| `GET /auth/sessions` | No body. Returns an array of sessions with `id`, `created_at`, `expires_at`, `ip_address`, `platform`, `browser`, `user_agent`, and `is_current`. Requires a valid session. | `src/services/session.ts` → `getSessions` / `useSession`, called when the profile sessions modal opens. The modal displays the returned metadata and loading/error/empty states. |
| `DELETE /auth/sessions/{session_id}` | Session UUID in the path; no body. Returns a success message. Requires a valid session and verifies the selected session belongs to the same user. Deleting the current session also clears its cookie. | `src/services/session.ts` → `revoke`, triggered by the existing per-session confirmation dialog. On success the removed item is filtered from local state; on failure the modal displays an error. |
| `DELETE /auth/sessions` | No body. Deletes all of the current user’s sessions, clears the cookie, and returns a success message. | `src/services/session.ts` → `revokeAll`, connected to the “log out all devices” confirmation in `sessionModal.tsx`. On success the UI clears the current user and navigates to sign-in; on failure it shows an error. |

### User profiles and account

| Method and URL | Request and response | Frontend caller and behavior |
|---|---|---|
| `GET /users/me` | No body. Returns the current user profile and counts. Requires a valid cookie. | Called when `AuthProvider` mounts (`src/hooks/contexts/authContext.tsx`) and by `useProfileController.fetchUser` (`src/services/profile.ts`). The returned profile becomes shared `connectedUser` state; failures clear it. |
| `PATCH /users/me` | JSON of changed profile fields (for example `firstname`, `lastname`, `username`, `email`, `bio`). Returns the updated profile. | `src/services/profile.ts` → `updateProfile`, used by the edit-profile page. On success the UI gets the updated profile in a callback; on failure it receives an error code. |
| `POST /users/me/avatar` | Multipart form with field `file`. Returns the updated profile. | `src/services/profile.ts` → `uploadAvatar`, used on the profile page. It updates `connectedUser` on success; on failure it passes an error code to the component. |
| `DELETE /users/me` | No body. Deletes the current account and returns `204 No Content`; backend also clears the cookie. | `src/services/profile.ts` → `deleteUser`, used by the delete-account confirmation in the profile. On `204`, local auth state is cleared and the page reloads. |
| `GET /users?page=…&size=…&search=…` | Query parameters: page and size; optional search string. Returns a `Page` of user summaries. | `src/services/user.ts` → `loadUsers`, used by search. Sets users and pagination state; the service sets the shared loading flag and can call an error callback. |
| `GET /users/{user_id}` | User UUID in the path. Returns a profile. | `src/services/user.ts` → `getUser`, used by user-profile display and by follower loading to enrich users. It is also used to fetch peer avatars in the messages UI; that individual profile request is REST and included here, while realtime calls are excluded. |

### Following

| Method and URL | Request and response | Frontend caller and behavior |
|---|---|---|
| `POST /users/{user_id}/follow` | Target user UUID in the path; no body. Returns `{ following: true, user_id }` with `201`. | `src/services/follower.ts` → `follow`, called by follow cards and profile actions. The UI updates after `201`. |
| `DELETE /users/{user_id}/follow` | Target user UUID in the path; no body. Returns `204 No Content`. | `src/services/follower.ts` → `unfollow`, called by the same UI. The UI updates after `204`. |
| `GET /users/{user_id}/followers?page=…&size=…` | User UUID and pagination query. Returns a `Page` of user summaries. | `src/services/follower.ts` → `loadUsers` with the followers view, used by the followers page. It loads user details, updates pagination/count state, and sets the shared loading flag. |
| `GET /users/{user_id}/following?page=…&size=…` | User UUID and pagination query. Returns a `Page` of user summaries. | Same service and page, using the following view. |

### Sports and match announcements

| Method and URL | Request and response | Frontend caller and behavior |
|---|---|---|
| `GET /sports` | No body. Returns an array of `{ id, name, max_players }`. | `src/services/match.ts` → `getSports`, used by match creation and filtering modals. Saves the list for selection; it exposes success and error callbacks. |
| `POST /match-announcements` | JSON: `title`, `sport_id`, `remaining_player_slots`, `start_time`, `end_time`. Times are converted to ISO strings. Returns an announcement with `201`. | `src/services/match.ts` → `addMatch`, called by the home-page match creation modal. On success the modal closes. |
| `GET /match-announcements?...` | Query can include page, size, sorting, organizer, sport/status, and time filters. Returns a `Page` of announcements. The frontend defaults sorting to `start_time` ascending and may append filter values. | `src/services/match.ts` → `loadMatches`, used by the community and match history UI. Updates match and pagination state; sets shared loading and can call an error callback. |
| `GET /match-announcements/{id}` | Announcement UUID in the path. Returns one announcement. | `src/services/match.ts` → `getMatch`, used by play-request cards to load their announcement details. Passes response data to success callback and error code to error callback. |
| `PATCH /match-announcements/{id}` | Announcement UUID and JSON fields to update (title, sport, slots, status, times). Returns the updated announcement. | `src/services/match.ts` → `updateMatch`, used by match editing in history. Calls success when status is `200`; current catch block silently ignores failures. |
| `DELETE /match-announcements/{id}` | Announcement UUID; no body. Returns `204 No Content`. Backend allows only the owner to delete. | `src/services/match.ts` → `deleteMatch`, used in match history. Calls success on `204`; current catch block silently ignores failures. |

### Play requests

| Method and URL | Request and response | Frontend caller and behavior |
|---|---|---|
| `POST /match-announcements/{id}/play-requests` | Announcement UUID in path; no body. Returns a play request with `201`. | Called by `usePlayRequestsController.joinMatch` (community match card) and `useMatchController.requestToJoinMatch`. On success the UI callback runs; the first controller has an `isJoining` loading flag. Errors are generally swallowed by the service or passed to the caller. |
| `GET /play-requests?role=sent\|received&status=…&page=…&size=…` | Query selects requests sent by the user or received for their announcements; status and pagination are optional. Returns a `Page` of requests. | `src/services/playRequest.ts` → `loadRequests`, used by the play-requests page. It stores request and page state; its catch block currently ignores errors. |
| `GET /match-announcements/{id}/play-requests` | Announcement UUID in path. Returns a paginated list of requests for an announcement owned by the current user. | `src/services/playRequest.ts` → `loadAnnouncementRequests`, used while editing/viewing a match. Saves the returned items; errors are swallowed. |
| `PATCH /play-requests/{id}` | Request UUID and JSON `{ status: "accepted" }` or `{ status: "declined" }`. Returns the updated request. Only the announcement owner can decide a pending request. | `src/services/match.ts` → `decide`, used by the player-request UI. On `200` it reloads the page; errors are swallowed. |

### Posts

| Method and URL | Request and response | Frontend caller and behavior |
|---|---|---|
| `POST /posts` | JSON `{ caption }`. Returns the created post with `201`. | `src/services/post.ts` → `addPost`, used by the post modal. It sets shared loading, invokes success on `201`, and passes an error code/fallback to the form. |
| `GET /posts?page=…&size=…&user_id=…` | Pagination plus optional author UUID. Returns a `Page` of posts. | `src/services/post.ts` → `loadPosts`, used by the history/posts page. Saves post and pagination state and toggles shared loading. Errors are swallowed. |
| `GET /feed?page=…&size=…` | Pagination query. Returns a `Page` of followed users’ posts. | `src/services/post.ts` → `loadFeeds`, used for the community feed. Saves feed and pagination state and toggles shared loading. Errors are swallowed. |
| `DELETE /posts/{id}` | Post UUID; no body. Returns `204 No Content`. Backend checks ownership. | `src/services/post.ts` → `deletePost`, called by post history actions. Calls success on `204`; errors are swallowed. |

## 3. Code and data flow

### Important files

- `src/services/api.ts`: shared Axios instance and response interceptor. Feature services import this instead of creating their own clients.
- `src/services/auth.ts`: signup, login, and logout requests. Coordinates auth state and navigation.
- `src/hooks/contexts/authContext.tsx`: keeps the current user and a shared loading flag. It calls `GET /users/me` on mount.
- `src/services/profile.ts`, `user.ts`, `follower.ts`, `match.ts`, `playRequest.ts`, `post.ts`, `session.ts`: endpoint-specific request logic and component-facing state/callbacks.
- `src/types/api.ts` and `src/types/user.ts`: TypeScript shapes for request/response data. These help catch mistakes during development but do not validate server data at runtime.
- `src/proxy.ts`: checks whether a session cookie exists before serving protected paths. This is a convenience gate; it does not prove that the session still exists or is unexpired.
- Backend `back/app/main.py`: registers routers, CORS, exception handling, and pagination.
- Backend routers in `back/app/routers/`: define URLs, methods, validation, authorization, and database behavior. Pydantic response/request schemas live in `back/app/schemas/`.
- Backend `back/app/core/deps.py`: reads the `session_id` cookie, finds the DB session, rejects missing/expired sessions, and resolves the user.

### Example: loading sessions

1. The profile component opens `SessionsModal`.
2. The modal calls `useSession(isOpen)`.
3. `src/services/session.ts` sends `api.get("/auth/sessions")`.
4. Axios uses the configured base URL and sends the cookie.
5. FastAPI's session dependency validates the cookie, then the auth router returns the user's active sessions.
6. The hook stores response data in React state; the modal displays skeletons, a list, an empty state, or an error.

### Example: logging out all sessions

1. The user clicks the shared `PlayButton.Secondary` button and confirms in the dialog.
2. `revokeAll` sends `api.delete("/auth/sessions")`.
3. The backend deletes the user's sessions and returns a response that expires the current cookie.
4. On success, the service empties the local session list; the modal clears `connectedUser` and navigates to sign-in.
5. On failure, it sets an error key shown by the dialog. The browser itself handles the cookie deletion response.

### Authentication and authorization

- **Authentication** answers “who is making the request?” Here, the browser sends an opaque session UUID cookie. The backend checks that it matches a live database session and then loads the user.
- **Authorization** answers “may this authenticated user do this?” The backend checks ownership for actions such as deleting a post, editing/deleting an announcement, deciding a request, or deleting a session belonging to another user.
- The proxy only tests cookie presence. It can allow a stale/revoked cookie through; the API is the authoritative validator. A `401` triggers the Axios redirect to sign-in. The `sessionExpired=1` query flag lets that sign-in page pass the proxy even if a stale cookie remains.
- Cookies are preferable here to storing an access token in JavaScript because `HttpOnly` prevents normal frontend scripts from reading the session ID. Cookie-based auth still needs careful CORS, HTTPS, and CSRF configuration.

## 4. REST and Axios concepts to explain

- **REST** uses resource-oriented URLs and standard HTTP methods. This project uses paths such as `/posts/{id}` and `/match-announcements`.
- **GET** reads data; **POST** creates or triggers an operation; **PATCH** partially updates a resource; **DELETE** removes a resource. There are no frontend `PUT` calls in the inspected services.
- **Axios vs Fetch:** both send HTTP requests and return promises. Axios parses JSON into `response.data`, supports configured instances and interceptors, and rejects non-2xx responses by default. Fetch is built into browsers but requires checking `response.ok` and parsing the body separately. This project uses Axios for REST calls.
- **Promises and async/await:** a request takes time. `await` pauses the current async function until it succeeds or throws; `try/catch/finally` is used in the session hook so loading ends on both success and failure. Some other services use `.then().catch().finally()`, which is the same promise pattern.
- **Status codes:** `200` means success with a response; `201` means created; `204` means success with no response body; `401` means unauthenticated; `403` means authenticated but forbidden; `404` means not found; `422` means request validation failed; `429` means rate limit exceeded; `500` means server error.
- **Request body vs query vs path:** credentials and create/update fields go in JSON bodies; pagination and filters go in query parameters; a specific resource UUID goes in the URL path.
- **CORS:** browsers enforce cross-origin rules. Since the frontend and API may use different ports/origins, FastAPI must allow the frontend's exact origin and credentials. `withCredentials` alone does not bypass CORS.

## 5. Gaps and implementation details worth mentioning

These are observations from the inspected source, not assumptions:

1. The backend also has `GET /posts/{post_id}` and `PATCH /posts/{post_id}`, but the frontend services do not call them.
2. The backend has `GET /users/{user_id}/posts`, but the frontend loads profile posts with `GET /posts?user_id=…` instead.
3. Backend routes for listing a user's sports and adding/removing a sport (`/users/{id}/sports`, `/users/me/sports/{sport_id}`) are not called by the inspected frontend services.
4. Error handling is inconsistent. Some services show an error or use a callback, but several use `.catch(() => {})`, so a failed action can appear to do nothing.
5. The backend error handler returns an envelope like `{ "error": { "code": "...", "message": "..." } }`. The interceptor reads `errorCode` from that nested object correctly, but reads `message` from `data.message` rather than `data.error.message`. Also, login's catch reads `error.response` even though the interceptor rejects a normalized `ApiError`; the login form can therefore fall back to its generic credential error.
6. `AuthProvider` calls `GET /users/me` on mount, including on public pages. The interceptor redirects a `401` to sign-in when the current page is not already `/auth`. Therefore, an unauthenticated visitor opening the public landing page may be redirected to sign-in; this is a behavior to verify/fix.
7. Query strings are often assembled by concatenating strings. Axios's `params` option or `URLSearchParams` would encode user-entered search/filter values more safely and reliably.
8. The backend defaults the session cookie's `Secure` flag to false. Production deployments should use HTTPS and set `Secure=true`; CORS should allow only trusted frontend origins.
9. No bearer-token refresh flow exists in the frontend. The browser sends the session cookie and a failed session is handled as a `401` sign-in redirect.

## 6. Potential oral evaluation questions

**Q: How does the browser know where the API is?**  
A: The shared Axios instance uses `NEXT_PUBLIC_API_URL`; if that environment variable is absent, it uses `http://localhost:8000`.

**Q: Where is the login session stored?**  
A: FastAPI sets an HttpOnly `session_id` cookie. The browser stores and sends it; frontend JavaScript does not read the cookie.

**Q: How does a component make an API request?**  
A: It calls a feature function or hook, such as `useSession().load`. That function uses the shared `api` Axios instance, stores the response in React state, and the component rerenders.

**Q: Why use a shared Axios instance?**  
A: It keeps base URL, credentials, headers, and common error handling consistent across services.

**Q: What happens when a session expires?**  
A: The backend's auth dependency rejects the request with `401`. The Axios interceptor redirects to the localized sign-in page; the proxy flag prevents a stale cookie from redirecting the user back to a protected page.

**Q: What is the difference between authentication and authorization here?**  
A: The session cookie identifies a user (authentication). Backend checks such as “does this announcement belong to this user?” decide whether that user may perform an action (authorization).

**Q: How do you know a delete succeeded if there is no response body?**  
A: Endpoints such as deleting a post return `204 No Content`. Axios resolves the promise for that success status, and the frontend updates its state or calls a success callback without reading a body.

**Q: Why does avatar upload use `FormData`?**  
A: A file is binary data rather than ordinary JSON. The frontend appends it under the backend's expected multipart field name, `file`.

**Q: What does CORS do?**  
A: It tells the browser which frontend origins are allowed to call the API. For cookie requests, the backend must allow credentials and list explicit origins.

**Q: Is every backend route integrated?**  
A: No. The frontend calls the routes listed in this guide. For example, backend post-detail/update and user-sports routes exist but are not called by the inspected frontend services.

**Q: What is one improvement you would make?**  
A: I would align API error parsing with the backend's nested `{ error: { code, message } }` response and avoid silent catch blocks, so users see clear failures.
