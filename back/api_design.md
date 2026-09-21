# REST API Design — ft_trancendence

Base URL: `/api/v1`
All resource IDs are **UUIDv4** strings (path params and body fields), matching `models.py`.

## Conventions

**Auth**
- `Authorization: Bearer <session_id>` (or an HttpOnly cookie holding the session UUID) on every route except `POST /auth/register` and `POST /auth/login`.
- Any field representing "who is doing this" (`user_id`, `sender_id`, `follower_id`, `actor_id`) is **never** taken from the request body — it's derived from the authenticated session. The body only carries fields the client is actually allowed to choose.

**Pagination** (all list endpoints)
- Query params: `?limit=20&cursor=<opaque_string>` (cursor-based, since offset pagination degrades on high-write tables like `messages`/`notifications`).
- Response envelope: `{"items": [...], "next_cursor": "..." | null}`

**Errors**
- Standard shape: `{"error": {"code": "not_found", "message": "..."}}`
- `400` validation (Pydantic), `401` no/invalid session, `403` authenticated but not authorized (not the owner), `404` not found, `409` conflict (duplicate like/follow/chat).

**Status codes for mutations**
- `POST` (create) → `201` + created resource
- `PATCH` (partial update) → `200` + updated resource
- `DELETE` → `204` no body
- Toggle-style actions (`like`, `follow`) → `201`/`204` per create/delete, or `200` if idempotent

---

## Auth

| Method | Path | Body | Returns | Notes |
|---|---|---|---|---|
| POST | `/auth/register` | `UserCreate` | `201 UserRead` | creates `User` |
| POST | `/auth/login` | `{"username\|email": str, "password": str}` | `201 SessionRead` (+ sets cookie) | creates `Session` |
| POST | `/auth/logout` | — | `204` | deletes current `Session` |
| POST | `/auth/refresh` | — | `200 SessionRead` | rotates `expires_at` |

## Users

| Method | Path | Body | Returns | Notes |
|---|---|---|---|---|
| GET | `/users/{user_id}` | — | `200 UserRead` | public profile |
| PATCH | `/users/me` | `UserUpdate` | `200 UserRead` | self only, ownership implicit |
| DELETE | `/users/me` | — | `204` | cascades sessions/posts/etc. |
| GET | `/users?search=` | — | `200 list[UserRead]` | search by username |

## Posts

| Method | Path | Body | Returns | Notes |
|---|---|---|---|---|
| GET | `/posts` | — | `200 list[PostRead]` | feed, paginated |
| POST | `/posts` | `PostCreate` minus `user_id` | `201 PostRead` | `user_id` = session |
| GET | `/posts/{post_id}` | — | `200 PostRead` | |
| PATCH | `/posts/{post_id}` | `PostUpdate` | `200 PostRead` | owner only (403 otherwise) |
| DELETE | `/posts/{post_id}` | — | `204` | owner only; cascades media/comments/likes |
| GET | `/users/{user_id}/posts` | — | `200 list[PostRead]` | one user's posts |

## Post Media

Always nested — a media row can't exist without its post.

| Method | Path | Body | Returns | Notes |
|---|---|---|---|---|
| POST | `/posts/{post_id}/media` | `PostMediaCreate` minus `post_id` | `201 PostMediaRead` | owner only |
| GET | `/posts/{post_id}/media` | — | `200 list[PostMediaRead]` | ordered by `position` |
| DELETE | `/posts/{post_id}/media/{media_id}` | — | `204` | owner only |

## Comments

| Method | Path | Body | Returns | Notes |
|---|---|---|---|---|
| GET | `/posts/{post_id}/comments` | — | `200 list[CommentRead]` | paginated, top-level + replies flagged by `comment_reply_to_id` |
| POST | `/posts/{post_id}/comments` | `CommentCreate` minus `post_id`/`user_id` | `201 CommentRead` | `comment_reply_to_id` optional in body for replies |
| PATCH | `/comments/{comment_id}` | `CommentUpdate` | `200 CommentRead` | author only |
| DELETE | `/comments/{comment_id}` | — | `204` | author or post owner |

## Likes

Junction table — no flat `/likes` collection, no `id`, no `PATCH` (nothing to update on a binary edge).

| Method | Path | Body | Returns | Notes |
|---|---|---|---|---|
| POST | `/posts/{post_id}/like` | — | `201 LikeRead` | `409` if already liked |
| DELETE | `/posts/{post_id}/like` | — | `204` | un-like |
| GET | `/posts/{post_id}/likes` | — | `200 list[UserRead]` | who liked it |
| GET | `/users/{user_id}/likes` | — | `200 list[PostRead]` | posts a user liked |

## Followers

Same edge-toggle pattern as Likes.

| Method | Path | Body | Returns | Notes |
|---|---|---|---|---|
| POST | `/users/{user_id}/follow` | — | `201 FollowerRead` | `follower_id` = session, `following_id` = `{user_id}`; `409` if already following, `400` if following self |
| DELETE | `/users/{user_id}/follow` | — | `204` | unfollow |
| GET | `/users/{user_id}/followers` | — | `200 list[UserRead]` | |
| GET | `/users/{user_id}/following` | — | `200 list[UserRead]` | |

## Private Chats

Creation is find-or-create, not a plain insert — one chat per user pair.

| Method | Path | Body | Returns | Notes |
|---|---|---|---|---|
| GET | `/chats` | — | `200 list[PrivateChatRead]` | current user's chats |
| POST | `/chats` | `{"other_user_id": UUID}` | `201` (or `200` if exists) `PrivateChatRead` | server checks for an existing `(user1,user2)` pair first |
| GET | `/chats/{chat_id}` | — | `200 PrivateChatRead` | `403` if not a participant |

## Messages

Always nested under a chat.

| Method | Path | Body | Returns | Notes |
|---|---|---|---|---|
| GET | `/chats/{chat_id}/messages` | — | `200 list[MessageRead]` | paginated, chronological |
| POST | `/chats/{chat_id}/messages` | `MessageCreate` minus `private_chat_id`/`sender_id` | `201 MessageRead` | `403` if not a participant |
| POST | `/chats/{chat_id}/messages/{message_id}/read` | — | `200 MessageRead` | marks read; recipient only, not sender |

## Notifications

Read-only from the client's perspective — created server-side as a side effect of likes/comments/follows/messages, never via a client `POST`.

| Method | Path | Body | Returns | Notes |
|---|---|---|---|---|
| GET | `/notifications` | — | `200 list[NotificationRead]` | current user's own, newest first |
| POST | `/notifications/{notification_id}/read` | — | `200 NotificationRead` | |
| POST | `/notifications/read-all` | — | `204` | bulk mark read |

---

## Cross-cutting rules recap

1. **Never trust an FK for "who did this" from the request body.** Always derive `user_id`/`sender_id`/`follower_id`/`actor_id` from the session.
2. **Nest routes under the parent** when the child can't sensibly exist standalone (`media`, `comments`, `messages`) — this also removes the need to pass the parent's FK in the body.
3. **An empty or single-field `Update` schema is a signal**, not a coincidence — model those as action endpoints (`/like`, `/follow`, `/read`) instead of a generic `PATCH`.
4. **Ownership/authorization checks live in the route handler**, not the Pydantic schema — the schema only defines shape.
5. **UUIDs in path params** must be validated as valid UUIDs before the DB query runs (FastAPI does this automatically if the path param is typed `uuid.UUID`) — invalid input should 400/422, not 500.
