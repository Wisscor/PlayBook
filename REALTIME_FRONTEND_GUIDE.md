# Realtime integration guide (frontend)

**Audience:** the `playbook-web` (Next.js) team.
**Backend:** the `realtime` module of `Wisscor/PlayBook`, branch `Core-Dev`, commit `f97996f` — *"fix(auth): invalidate all realtime sessions on logout"* (2026-10-16).

Everything in this document was read out of that commit, not from the older `docs/` diagrams. Where the two disagree, this document is the one that matches the running code. Two places where the old material is wrong are called out in [§12](#12-known-backend-limitations-and-what-to-do).

The module gives you two things:

| Layer | Transport | Used for |
| --- | --- | --- |
| REST | `fetch`/axios under `/realtime/*` | conversations list, message history, notifications list, marking notifications read |
| WebSocket | one socket per tab at `/ws` | live messages, presence, live notifications, read receipts, sending messages |

There are **no REST endpoints for sending a message**. Sending is WebSocket-only. That is the single most important fact in this document.

---

## 1. What the backend actually guarantees

Read this section before writing any code. The guarantees are weaker than they look.

**1. One socket per tab. No shared socket, no server-side fan-out trick.** The registry is an in-process dict keyed by user id, and the API runs **one uvicorn worker** (the `CMD` in `back/Dockerfile.api` has no `--workers`). If that ever changes to multiple workers, presence and delivery break. Assume one process.

**2. The sender receives its own message back.** `message.new` is broadcast to *all* participants, including the sender's other tabs. So your own message arrives twice: once as your optimistic bubble, once as the server echo. See [§8](#8-state-rules).

**3. `message.send` has no client-generated id and no acknowledgement.** There is no `message.ack` frame. The only confirmation that a send succeeded is the `message.new` echo coming back. Match the echo to your optimistic bubble using `conversation_id` + the trimmed body, FIFO per conversation.

**4. Delivery of queued messages is at-least-once.** A message is queued in `pending_messages` only for participants who had **zero** open sockets at send time, and is flushed on their next connect. If the connection drops mid-flush, rows stay undelivered and are sent again next time. **Always dedupe by message id.**

**5. The message history is not pushed over the socket on connect.** Only *undelivered* messages are flushed. A brand new tab gets zero history; you must call `GET /realtime/conversations/{id}/messages`.

**6. Contacts are frozen at connect time.** The presence broadcast list is computed once, when the socket opens, from the conversations that already exist. A conversation created *after* you connected gets no presence updates for either side until one of you reconnects.

**7. Presence is per-user and stateful.** `online: true` is emitted only for the user's **first** socket; `online: false` only when their **last** socket closes. Treat it as idempotent state, never as a counter.

**8. A failing handler is silent.** If a database error happens while handling `message.send`, the exception is logged server-side and the client receives **nothing** — no `error` frame, no close. The socket stays open. You must time out optimistic bubbles yourself.

**9. Live notifications do not update the unread counter.** A `notification` frame is *not* followed by `notification.count`. Increment client-side.

---

## 2. Environment checklist

Do these five things first; four of the five are the usual source of "it works for me" bugs on this project.

1. **Backend reachable at `http://localhost:8000`.** `back/docker-compose.yaml` runs Postgres + the API on 8000. There is no nginx and no reverse proxy, so the WebSocket is served on the same port: `ws://localhost:8000/ws`.

2. **Use `localhost`, never `127.0.0.1`, for both the page and the API.** The session cookie is set with the default `Domain` (host-only) and `SameSite=Lax`. `localhost` and `127.0.0.1` are different sites for cookie purposes, so a page served from one and an API on the other will look logged-out. Keep both on `localhost`.

3. **`NEXT_PUBLIC_API_URL` must be set.** `playbook-web` currently has **no `.env` file committed** and `src/services/api.ts` reads `process.env.NEXT_PUBLIC_API_URL` directly — if it is unset, axios `baseURL` becomes `undefined` and every REST call goes to the Next.js dev server instead of the API. Add:

   ```bash
   # front/playbook-web/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Port 4000 is not in `cors_origins`.** `back/app/core/config.py` allows `localhost:3000`, `127.0.0.1:3000`, `localhost:5173`, `127.0.0.1:5173`. The production `Dockerfile` of the front app exposes **4000**, which is *not* allowed. In local dev (`next dev` on 3000) you are fine. If you ever build the front container and run it on 4000, either add the origin to the backend list or serve it on 3000.

5. **CORS with credentials is already configured** (`allow_credentials=True`, explicit origins). Keep `withCredentials: true` on your axios instance — as `src/services/api.ts` already does — or the cookie will not be sent.

**Cookies and the WebSocket.** The browser sends cookies on the WS handshake automatically, and they are the only authentication. The socket URL carries no token, so never put one in the query string. Note that Starlette does **not** apply the CORS middleware or an Origin check to the WebSocket route — an important backend gap, listed in [§12](#12-known-backend-limitations-and-what-to-do). SameSite=Lax is what protects you today: it stops a cross-site page from opening an authenticated socket.

---

## 3. Connection lifecycle

```
tab opens
   │
   ├─ new WebSocket("ws://localhost:8000/ws")     ← cookies ride along automatically
   │
   │   ┌── server: accept(), then authenticate from the cookie
   │   │
   │   ├── auth FAILS → close(4001)  ← you DO get onopen first, then onclose 4001
   │   │
   │   └── auth OK → register(), then, in this exact order on the wire:
   │           1. ready                  { user_id, username }
   │           2. message.new  × N       (queued messages, oldest first)
   │           3. notification × N       (undelivered notifications, oldest first)
   │           4. notification.count     { unread_count }
   │           5. presence.snapshot      { online: [user_id, ...] }
   │       then, if this was the user's FIRST socket:
   │           6. every contact receives  presence { user_id, online: true }
   │
   ├─ steady state: you ping every 20s → server answers pong
   │                you message.send / read as needed
   │
   └─ close (see the close-code table in §6)
        ├─ 4001 → do NOT reconnect, send the user to sign-in
        ├─ 4002 → you were flooding; wait ≥10s, then reconnect
        ├─ 4003 → session ended by a logout; check GET /auth/me to decide
        └─ 4004 → you stopped pinging; reconnect and fix the heartbeat
```

Two consequences worth internalising:

- **`onopen` does not mean "connected".** Auth happens *after* `accept()`, so the browser fires `onopen` and then immediately `onclose` with 4001. Treat the socket as usable only after the `ready` frame, and never send anything before it.
- **Frames 2–5 arrive back to back, before you have sent anything.** Your message store, notification store and presence store must all be ready to fill from frames that arrive within milliseconds of connecting.

### Heartbeat

The server closes idle connections with **4004**.

- Server side: a watchdog task runs every **15s** and closes if `last_seen` is older than **45s**.
- `last_seen` is refreshed by *any* inbound frame, not just `ping`. Sending a message counts.
- Because of the 15s poll granularity, the actual close lands somewhere between **45s and 60s** of silence.
- **Client rule: send `{"type":"ping"}` every 20 seconds.** That keeps you well inside the window with margin for a stalled timer or a backgrounded tab.
- Also treat a missing `pong` as a dead socket: if you ping and see no `pong` within ~15s, close and reconnect yourself rather than waiting for 4004.

---

## 4. Frame reference

All ids are UUID strings. All timestamps are ISO 8601 strings with an offset (`created_at.isoformat()`), so `new Date(value)` parses them correctly.

### 4.1 Client → server

Only three frame types are accepted. Anything else gets an `error` frame.

**`message.send`**

```json
{ "type": "message.send", "conversation_id": "<uuid>", "body": "hello" }
```

The body is stripped of surrounding whitespace **before** validation, then must be **1–2000 characters**. `"   "` therefore fails with `invalid_frame`. Sending is capped at 10 per 10s per connection — see §7.

**`read`**

```json
{ "type": "read", "conversation_id": "<uuid>", "message_id": "<uuid>" }
```

Marks the conversation read **up to** `message_id`. The cursor only ever moves forward: if `message_id` is not newer than the current cursor, the server sends **nothing at all** — no ack, no error. See §8.5.

**`ping`**

```json
{ "type": "ping" }
```

Server replies `pong`. Any frame resets the idle timer, so a busy connection can skip pings.

### 4.2 Server → client

**`ready`** — first frame on every connection. Refetch REST state on every one of these.

```json
{ "type": "ready", "user_id": "<uuid>", "username": "string" }
```

**`message.new`** — a new message, or a message replayed from the queue. Sent to **every** participant, sender included.

```json
{ "type": "message.new", "id": "<uuid>", "conversation_id": "<uuid>",
  "sender_id": "<uuid>", "body": "string", "created_at": "2026-10-16T12:00:00+00:00" }
```

**`conversation.new`** — sent to *both* participants when a conversation receives its **first ever** message (the conversation row is created earlier by REST). Can be delivered twice in a race; dedupe by `id`.

```json
{ "type": "conversation.new", "id": "<uuid>",
  "peer_id": "<uuid>", "peer_username": "string" }
```

> Note the key is **`id`**, not `conversation_id` — the one place where the payload shape differs from the REST list. Convert it at the edge of your store.

**`presence`** — a contact went online/offline. Only sent for contacts known at *your* connect time.

```json
{ "type": "presence", "user_id": "<uuid>", "online": true }
```

**`presence.snapshot`** — once per connection, right after `notification.count`.

```json
{ "type": "presence.snapshot", "online": ["<uuid>", "<uuid>"] }
```

Only *contacts* who are online appear. Anyone not in the array is offline (or not a contact). Because it arrives after `ready`, initialise everyone to offline and let this frame promote them.

**`notification`** — a live notification, or one replayed from the queue.

```json
{ "type": "notification", "id": "<uuid>", "event_type": "like",
  "actor_id": "<uuid>", "actor_username": "string",
  "target_id": "<uuid>|null", "target_type": "post|match_announcement|null",
  "read_at": null|"2026-...", "created_at": "2026-..." }
```

**Not** followed by an updated count. Increment locally (see §8.6).

**`notification.count`**

```json
{ "type": "notification.count", "unread_count": 3 }
```

Sent exactly once per connection, after the notification backlog.

**`read`** — your peer read up to a message. Sent to the *other* participants only; the reader's own other tabs do **not** get it.

```json
{ "type": "read", "user_id": "<reader uuid>",
  "conversation_id": "<uuid>", "message_id": "<uuid>" }
```

**`error`** — a recoverable problem. Does **not** close the socket.

```json
{ "type": "error", "reason": "invalid_frame" }
```

**`pong`**

```json
{ "type": "pong" }
```

### 4.3 Error reasons

| `reason` | Meaning | What to do |
| --- | --- | --- |
| `invalid_json` | The frame was not valid JSON. | Bug on your side — log it. |
| `unknown_type` | Missing `type`, or a type the server does not handle. Also sent for a non-object frame (e.g. a JSON array). | Bug on your side — log it. |
| `invalid_frame` | Pydantic rejected the payload. Covers an unknown `conversation_id` format, an empty or >2000-char body, a missing field. | Check the payload; for `message.send` the usual cause is an all-whitespace body. |
| `conversation_not_found` | The sender is not a participant, or the `message_id` is not in that conversation. | Refresh the conversation list; the conversation may have been deleted or the id is stale. |
| `rate_limited` | More than 10 `message.send` in 10s. **The message was not saved.** | Back off; show the message as failed. Five of these inside 60s close the socket with 4002. |
| *(no frame)* | A handler crashed server-side (DB error). Logged on the server only. | Your send-timeout logic must cover this case. |

### 4.4 TypeScript frame types

Drop this in `src/types/realtime.ts`. The discriminated union gives you exhaustive `switch` checking on `type`.

```ts
export type Uuid = string;
export type IsoDate = string;

export type MessageFrame = {
  type: "message.new";
  id: Uuid;
  conversation_id: Uuid;
  sender_id: Uuid;
  body: string;
  created_at: IsoDate;
};

export type ConversationFrame = {
  type: "conversation.new";
  id: Uuid;
  peer_id: Uuid;
  peer_username: string;
};

export type PresenceFrame = {
  type: "presence";
  user_id: Uuid;
  online: boolean;
};

export type PresenceSnapshotFrame = {
  type: "presence.snapshot";
  online: Uuid[];
};

export type NotificationEventType =
  | "follow"
  | "like"
  | "comment"
  | "reply"
  | "play_request"
  | "play_request_accepted"
  | "play_request_declined";

export type NotificationFrame = {
  type: "notification";
  id: Uuid;
  event_type: string;
  actor_id: Uuid;
  actor_username: string;
  target_id: Uuid | null;
  target_type: "post" | "match_announcement" | null;
  read_at: IsoDate | null;
  created_at: IsoDate;
};

export type ReadyFrame = { type: "ready"; user_id: Uuid; username: string };
export type NotificationCountFrame = { type: "notification.count"; unread_count: number };
export type ReadReceiptFrame = {
  type: "read";
  user_id: Uuid;
  conversation_id: Uuid;
  message_id: Uuid;
};
export type ErrorFrame = { type: "error"; reason: string };
export type PongFrame = { type: "pong" };

export type ServerFrame =
  | ReadyFrame
  | MessageFrame
  | ConversationFrame
  | PresenceFrame
  | PresenceSnapshotFrame
  | NotificationFrame
  | NotificationCountFrame
  | ReadReceiptFrame
  | ErrorFrame
  | PongFrame;

export type ClientFrame =
  | { type: "message.send"; conversation_id: Uuid; body: string }
  | { type: "read"; conversation_id: Uuid; message_id: Uuid }
  | { type: "ping" };
```

---

## 5. REST reference

Base URL: `NEXT_PUBLIC_API_URL`. All of these require the `session_id` cookie (`get_curr_user`), and all failures are `401` when the cookie is missing, invalid or expired. Send `withCredentials: true`.

Prefix `router = APIRouter(prefix="/realtime")` — note that the WebSocket is **not** under this prefix; it is `/ws`.

### `POST /realtime/conversations`

```json
{ "peer_id": "<uuid>" }
```

Response `200`: `{ "id": "<uuid>", "peer_id": "<uuid>" }`.

| Status | When |
| --- | --- |
| `422` | `peer_id` is yourself. |
| `404` | No such user. |
| `403` | No conversation exists yet **and** the two users do not follow each other mutually. |

The flow is: look for an existing direct conversation first — if one exists it is returned **even if you no longer follow each other**. Mutual follow is only a gate on *creating* a new one.

The conversation is created empty. It will **not** appear in `GET /realtime/conversations` until the first message is sent, because that list only returns conversations that have at least one message. Keep the returned `id` in local state and render the chat view from it anyway, or the user will click "Message" and see nothing happen.

`GET /users/{id}` returns `is_following` for **you → them** only. There is no "follows you back" field, so you cannot pre-check mutual follow: call this endpoint and handle `403`.

### `GET /realtime/conversations`

```json
[ { "id": "<uuid>", "peer_id": "<uuid>", "peer_username": "string", "unread_count": 2 } ]
```

The list only includes conversations with ≥1 message, ordered by **conversation creation time descending**. There is no last-message preview and no last-message timestamp, so the ordering will drift away from "most recent activity" — sort client-side by your newest known message if you show a chat list, and label the rows from your own message cache.

`unread_count` here counts **all** messages newer than your read cursor, **including your own**. It is a backend bug, documented in §12; if you display it, subtract your own or recompute locally from message `sender_id`.

### `GET /realtime/conversations/{conversation_id}/messages`

Query: `before` (a message id, optional), `limit` (1–100, default 50).

```json
{
  "items": [
    { "id": "<uuid>", "conversation_id": "<uuid>", "sender_id": "<uuid>",
      "body": "string", "created_at": "2026-10-16T12:00:00+00:00" }
  ],
  "next_cursor": "<uuid>|null"
}
```

Items are **newest first**. `next_cursor` is the id of the *oldest* item in the page, and is `null` when the page was not full (i.e. you have reached the beginning). Paginate by passing `next_cursor` back as `before`; stop when it is `null`.

| Status | When |
| --- | --- |
| `404` | You are not a participant ("conversation not found"). |
| `404` | `before` is not a message in this conversation ("unknown cursor"). |

To render a thread: request the newest page, then reverse it for display.

### `GET /realtime/notifications`

Query: `unread_only` (bool, default `false`), `limit` (1–100, default 30).

```json
{ "items": [ /* same shape as the notification frame, minus "type" */ ], "unread_count": 3 }
```

Newest first. `unread_count` is the true total unread (this one is correct, unlike the conversation list).

### `POST /realtime/notifications/read`

```json
{ "notification_ids": ["<uuid>", "..."] }
```

1–50 ids. The server only touches notifications that belong to you and are currently unread. Response: `{ "unread_count": 3 }` — the authoritative new count, so always take the number from the response.

### `GET /realtime/notifications/count`

```json
{ "unread_count": 3 }
```

Cheap poll/refresh target. Useful on window focus.

### Endpoints used by the auth flow

`POST /auth/login` `{ username_or_email, password }` → user object, sets the cookie. `POST /auth/logout` → deletes the session **and closes all your sockets with 4003**. `GET /auth/me` → the user, or 401. See §9.

---

## 6. Close codes and the reconnect policy

| Code | Meaning | Reconnect? | Action |
| --- | --- | --- | --- |
| `4001` | Auth failed: no cookie, malformed UUID, unknown session, expired session, or user row missing. | **No.** | Stop the client and send the user to `/${locale}/auth?mode=signin`. Retrying just burns reconnects — the cookie is not going to appear by itself. |
| `4002` | Rate limiting: 5 `rate_limited` errors within 60s. | Yes, after a delay. | Wait **≥10s** before reconnecting — the strike window is 60s per connection, and a fresh connection resets it, so a fast reconnect only re-arms the trap if you keep flooding. Fix the flood first. |
| `4003` | Session ended by a logout. | **Ask first.** | Call `GET /auth/me`: `401` → go to sign-in; `200` → your session is still valid (someone logged out on another device) and you may reconnect. See §9. |
| `4004` | Idle timeout — you stopped pinging. | Yes. | Reconnect with backoff and make sure the 20s heartbeat is actually running. A backgrounded tab throttles timers; that is the usual cause. |
| `1000` | Normal closure, requested by us. | No. | Intentional (logout, unmount, app shutdown). |
| `1001` | Going away (tab closed, navigation). | No. | — |
| `1006` | Abnormal — network drop, laptop sleep, server restart. | Yes. | The common case. Reconnect with backoff. A `1006` also happens if the server process restarts because the registry is in memory. |
| `1011` | Server-side error. | Yes. | Reconnect with backoff; if it repeats immediately, stop and surface an error. |

**Recommended backoff:** start at 1s, double each attempt, cap at 30s, and add ±20% jitter so that all the tabs of a restarted server do not reconnect in lockstep. Reset the counter after a connection has stayed up for ~30s (not merely after `onopen`, which succeeds even when auth is about to fail).

**If the browser goes offline,** do not burn attempts: listen for `online`/`offline` and pause the loop while offline, then reconnect immediately on `online`. Also reconnect on `visibilitychange` → visible if the socket is not open, since background tabs get throttled.

---

## 7. Limits

| Limit | Value | Scope | Behaviour on breach |
| --- | --- | --- | --- |
| `message.send` | 10 per 10s | per **connection** | 11th and later get `error: rate_limited` and are **dropped, not saved**. 5 such errors within 60s → close `4002`. |
| Socket idle | ~45–60s | per connection | Watchdog closes with `4004`. Keep pinging every 20s. |
| `body` length | 1–2000 chars after trimming | per message | `invalid_frame`, message not saved. |
| `limit` query params | messages 1–100, notifications 1–100 | per request | FastAPI `422`. |
| `notification_ids` | 1–50 per call | per request | FastAPI `422`. |

Two things to note about the rate limit. Every attempt counts, **including the rejected ones** — a burst of 11 puts you at 11 hits, and continuing to hammer gets you closed with 4002. And the windows belong to the connection, so a reconnect resets them (which is exactly why shortening the backoff after 4002 makes things worse, not better).

`read` is **not** throttled in any way. It is also not idempotent on the wire — every `read` you send for a newer message generates a frame to your peer. Debounce it (300–500ms) rather than sending one per scroll event.

**Client-side body validation.** Validate before sending so the user gets instant feedback instead of a silent failure:

```ts
const MAX_BODY_LENGTH = 2000;

export function normalizeBody(raw: string): string {
  return raw.replace(/\s+/g, " ").trim(); // server strips, so match it before measuring
}

export function validateBody(raw: string): string | null {
  const body = normalizeBody(raw);
  if (body.length === 0) return "message is empty";
  if (body.length > MAX_BODY_LENGTH) {
    return `message is too long (${body.length}/${MAX_BODY_LENGTH})`;
  }
  return null;
}
```

`String.prototype.length` counts UTF-16 code units and Python's `len()` counts code points, so for emoji and other astral characters JS reports a slightly **larger** number. That errs on the safe side: anything JS accepts, Python accepts.

---

## 8. State rules

These are the rules that keep a chat UI correct against this backend. Most of them exist because of a specific weakness listed in §12.

### 8.1 Refetch on every `ready`

A new socket gets no history. On **every** `ready` frame — including reconnects — re-fetch the conversation list, the currently open thread (newest page), and `GET /realtime/notifications/count`. Do not try to merge state across a reconnect; discard and refetch. The socket is the delta channel, REST is the truth.

### 8.2 Dedupe every message by `id`

Store messages in a `Map<id, Message>`, never an array with `push`. Queued messages are at-least-once, a replayed flush can repeat a message you already received live, and a reconnect refetch will return messages you already have. `Map` makes all three harmless.

Merge rule per message: keep the server's copy, ignore the incoming one if the id is already present.

### 8.3 Sort by `created_at`, then `id`

Queued messages can arrive **after** live ones (the flush of the backlog and the live broadcast race). Never sort by arrival order. `created_at` is second-or-finer resolution, so break ties on `id` to get a stable order:

```ts
import type { MessageFrame } from "@/types/realtime";

export function sortMessages(a: MessageFrame, b: MessageFrame): number {
  if (a.created_at !== b.created_at) return a.created_at < b.created_at ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}
```

### 8.4 Optimistic sends

There is no message id until the echo arrives. Model the pending bubble separately:

```ts
type PendingBubble = {
  localId: string;          // crypto.randomUUID()
  conversationId: Uuid;
  body: string;             // already normalized
  createdAt: string;        // local ISO, for immediate display only
  status: "sending" | "failed";
};
```

On echo (`message.new` with `sender_id === me`): find the **first** pending bubble in that conversation whose `body` matches the echo's body (FIFO — this is why you normalize whitespace on both sides), remove it, insert the real message. If no pending bubble matches, just insert the message: it is one of *your other tabs'* messages, which also reach you.

Start a ~10s timer per bubble. On expiry mark it `failed` with a retry action, and on retry re-send with the same `localId` so the matching still works. **This timer is mandatory**, because a server-side handler crash produces no `error` frame and no close — the message would otherwise sit in "sending" forever.

A `rate_limited` error arrives with **no identifier**, so you cannot tell which send it rejected. Treat it as "the most recent still-pending send failed" and mark that bubble failed.

### 8.5 Read receipts

Send `read` with the id of the **newest message currently visible** in the open conversation when: the thread is open, the tab is visible (`document.visibilityState === "visible"`), there are unread messages, and the user is near the bottom. Debounce 300–500ms.

- The server only accepts a **forward** move of the cursor. If your `message_id` is not newer than the current cursor, nothing happens — no receipt, no error. That is normal, not a bug; do not retry.
- The receipt goes to your peer, not to your own other tabs. If you want the read state consistent across your own tabs, keep it in local state per tab.
- There is **no REST endpoint for the peer's read cursor**, so "seen" indicators can only be driven by the live `read` frame. On a fresh page load you cannot know what your peer has read — show no seen state until a `read` frame arrives. Do not fabricate it.

To pick the newest visible message id you need the id, which the DOM element must carry: give every bubble `data-message-id={id}` and read the last one in view, or just use the newest message in the thread if you auto-scroll.

### 8.6 Unread counts

Three different sources, and they disagree by design:

1. `GET /realtime/conversations` → `unread_count` **includes your own messages** (bug, §12). For a chat badge, recompute locally: your messages count only if `sender_id !== me`.
2. `notification.count` → correct, but only sent once per connection.
3. A live `notification` frame → the server does **not** send a follow-up count. Increment your local count by 1 when you accept a notification frame that is unread.

When the user opens the notifications panel, mark the visible ones read via `POST /realtime/notifications/read` and **take the count from the response** — the server's number supersedes your local increment.

### 8.7 Presence

- Default everyone to offline. `presence.snapshot` arrives after `ready`, so treat "not in the snapshot" as offline.
- `presence` and `presence.snapshot` are **state**, not events. Set the flag; do not count up and down. A user with two tabs closing one keeps `online: true` because only the last socket triggers `online: false`; and a logout with two tabs can broadcast `online: false` twice (idempotent, so harmless).
- Presence only covers **contacts**: users you already share a conversation with at your connect time. A brand new conversation shows no presence dot until someone reconnects. Do not show a "typing"-style spinner for it or anything that implies live status you do not have.
- Presence has no REST equivalent, so on a fresh page load nobody is online until the snapshot arrives. That is why defaulting to offline matters — otherwise the UI flickers.

### 8.8 Conversations

- Keep a `Map<id, Conversation>` keyed by `id` (`conversation.new` uses `id` too — map it straight in).
- `conversation.new` can arrive twice for the same conversation. Idempotent insert.
- The conversation list from REST only contains conversations with ≥1 message. A conversation you just created via `POST /realtime/conversations` is **not** in it until the first message is sent. Hold it in local state so the empty thread can render.

---

## 9. Notifications: event types and UI mapping

The backend emits seven event types, all through the same `notification` frame and the same REST list. `target_type` is always `"post"` or `"match_announcement"` or `null`; `target_id` is the thing to link to.

| `event_type` | Triggered by | Recipient | `target_id` / `target_type` | Route to open |
| --- | --- | --- | --- | --- |
| `follow` | `POST /users/{id}/follow` | the followed user | `null` / `null` | the actor's profile |
| `like` | `POST /posts/{id}/like` | the post author | post id / `post` | `/[locale]/posts/{target_id}` |
| `comment` | `POST /posts/{id}/comments` | the post author | post id / `post` | `/[locale]/posts/{target_id}` |
| `reply` | same endpoint, when the comment replies to a comment | the **parent comment's** author | post id / `post` | `/[locale]/posts/{target_id}` |
| `play_request` | a play request against a match announcement | the announcement owner | announcement id / `match_announcement` | `/[locale]/matches/{target_id}` |
| `play_request_accepted` | owner accepts the request | the requester | announcement id / `match_announcement` | `/[locale]/matches/{target_id}` |
| `play_request_declined` | owner declines the request | the requester | announcement id / `match_announcement` | `/[locale]/matches/{target_id}` |

Three details that bite:

- For a `reply`, `target_id` is the **post** id, not the comment id. You cannot deep-link to the comment; open the post.
- `follow` has no target at all. Link to the actor.
- The routes above (`/posts/{id}`, `/matches/{id}`, another user's profile) **do not exist yet** in `lib/constants.ts` — `ROUTES` currently has only HOME, SIGNIN, SIGNUP, POSTS (`/history?type=posts`), MATCHES (`/history?type=matches`) and PROFILE. Add the routes or fall back to the section page until they exist, otherwise the notification list will look broken.

Notification rows should be labelled with i18n keys — add to every message file, including `ar.json`:

```ts
// src/lib/notifications.ts
import type { NotificationFrame } from "@/types/realtime";

export function notificationKey(n: {
  event_type: string;
  target_type: string | null;
}): string {
  switch (n.event_type) {
    case "follow": return "notification-follow";
    case "like": return "notification-like";
    case "comment": return "notification-comment";
    case "reply": return "notification-reply";
    case "play_request": return "notification-play-request";
    case "play_request_accepted": return "notification-play-request-accepted";
    case "play_request_declined": return "notification-play-request-declined";
    default: return "notification-generic";
  }
}
```

Then, with `next-intl`, render `t(key, { actor: n.actor_username })`. Define a `notification-generic` fallback so an unknown type (a future backend addition) degrades to something readable instead of a raw key in the UI.

**Notifications are emitted as FastAPI background tasks**, after the response is sent. So after a `follow`/`like`/`comment`, do not wait for the socket to confirm anything — optimistic UI on the REST response, and let the notification arrive when it arrives.

**Two more behaviours to design around:** duplicate unread notifications are suppressed (same actor + type + target, while still unread), so liking → unliking → liking again produces **one** notification, and the target of a notification could already be deleted by the time you click it — handle `404` on the linked route. Self-actions never notify, so you never see your own likes.

---

## 10. Logout

`POST /auth/logout` deletes the session, then calls `registry.close_user(user_id)`, which closes **every socket that user has open — on every device and every tab — with code 4003 and reason `"session ended"`**. This is the important part: logging out on your phone will close the socket on your laptop, whose session is still perfectly valid.

So the frontend flow is:

```ts
async function signOut(client: RealtimeClient, router: Router) {
  client.closeIntentionally();          // suppresses reconnect while we tear down
  try {
    await api.post("/auth/logout");
  } catch {
    // 401 here just means the session was already gone; keep going.
  }
  router.replace("/auth?mode=signin");
}
```

Order matters: close the socket **first** (deliberately, suppressing the reconnect loop) so the 4003 does not race your redirect, then call the API, then navigate. `playbook-web` has no logout UI on the integration branch yet, so this is new code — put it where the burger menu items live.

**Handling a 4003 you did not cause** (another device logged out, or the session expired):

```ts
if (code === 4003) {
  const { status } = await api.get("/auth/me", { validateStatus: () => true });
  if (status === 200) client.reconnectNow();       // still valid → resume
  else router.replace("/auth?mode=signin");        // truly gone → sign in again
}
```

Because the browser clears or expires the cookie independently, `GET /auth/me` is the only reliable way to tell "someone else logged out" from "your session is gone". Always ask it.

Note that `4001` is a different, simpler case — the cookie was missing or invalid at connect time, so there is no point checking `/auth/me`; go straight to sign-in.

---

## 11. Two flows worth spelling out

### 11.1 Starting a conversation ("Message" button)

```
click "Message" on a profile
  └─ POST /realtime/conversations { peer_id }
       ├─ 200 → { id, peer_id }
       │        keep { id, peer_id, peer_username } in local state
       │        open the thread on conversation id — it is empty and
       │        NOT in GET /realtime/conversations yet (no messages)
       │        render the composer; on first send the conversation
       │        appears in the server list and both sides get conversation.new
       ├─ 403 → show "you need to follow each other to start a chat"
       ├─ 404 → "user not found" (stale profile page)
       └─ 422 → you passed your own id (bug)
```

Do not route to a chat page that looks up its conversation only from `GET /realtime/conversations`; a fresh empty conversation is invisible to that endpoint and the page would 404 you back. Pass the new id through local state or a store.

### 11.2 Opening a thread

```
open conversation C
  ├─ GET /realtime/conversations/C/messages?limit=50      → newest 50, reverse for display
  ├─ store into Map by id, sort by (created_at, id)
  ├─ when visible and there are unread messages:
  │     send { type: "read", conversation_id: C, message_id: <newest visible id> }
  │     (debounce ~400ms; dedupe so you do not resend the same id)
  ├─ scroll up → GET ...?before=<oldest known id>&limit=50, merge, repeat while next_cursor != null
  └─ every reconnection's `ready` → refetch the newest page and merge
```

There is a deliberate gap in the read-cursor flow: the *other* participant's read state arrives only as live `read` frames. On a fresh load, show nothing. A "seen" marker that appears from nowhere on reload would be a lie.

---

## 12. Known backend limitations and what to do

These are real behaviours of commit `f97996f`. The frontend workarounds are listed so you are not blocked; the backend fixes are for whoever owns the `realtime` module.

| # | Limitation | Frontend workaround | Backend fix |
| --- | --- | --- | --- |
| 1 | **Logout closes all of a user's sockets** (4003), including other devices with valid sessions. | On 4003 call `GET /auth/me`; `200` → reconnect, `401` → sign-in. | Track the session id per socket and only close the sockets of the logged-out session. |
| 2 | **Conversation-list `unread_count` counts your own messages.** | Recompute locally excluding `sender_id === me`, or hide the badge until fixed. | Add `Message.sender_id != me` to the subquery in `services/conversations.py`. |
| 3 | **A live `notification` frame does not update the count.** | Increment locally; resync with `GET /realtime/notifications/count` on panel open/focus. | Send a `notification.count` after each live notification. |
| 4 | **A handler crash is silent** (no `error`, no close, socket stays open). | Optimistic bubbles with a ~10s timeout and a retry action. | Catch and reply `{"type":"error","reason":"internal_error"}`. Patch available — see the note at the end. |
| 5 | **A binary WS frame crashes the connection** (`receive_json` only catches `ValueError`). | Only ever send text frames — the default for `WebSocket.send()`. Never use `send(blob)`/`ArrayBuffer`. | Catch `KeyError`/`TypeError` too. |
| 6 | **`read` is unthrottled.** | Debounce. | Reuse the sliding window. |
| 7 | **Contacts are frozen at connect time** → no presence for a brand-new conversation. | Default offline; do not imply live status you do not have. | Recompute contacts on conversation creation, or announce presence dynamically. |
| 8 | **No REST endpoint for the peer's read cursor or presence.** | Live frames only; show nothing until they arrive. | Add a `read_at`/`last_read_message_id` field to the conversation payload. |
| 9 | **Conversation list has no last message** and is ordered by creation time. | Sort and label from your own message cache. | Return last message + timestamp, order by it. |
| 10 | **Port 4000 is missing from `cors_origins`.** | Dev on 3000, or serve the built app on a listed port. | Add the origin. |
| 11 | **No Origin check on the WebSocket.** Auth is cookie-only; SameSite=Lax is the current defence. | Never pass tokens in the socket URL. | Validate the `Origin` header on handshake. |

**Correcting the older docs.** `docs/realtime-flow.html` and `docs/diagrams/*.mmd` (untracked, in the repo root) have three stale points: the frame-router diagram shows validation bypassing the rate-limit check and shows `RL_CHECK <=10` looping back to start, which is not what `receive_loop`/`handle_message_send` do; and the HTML says 4003 is "not sent", which stopped being true at `f97996f`. `front/test-client/src/lib/protocol.js` is also stale — it says `ping` is unhandled and that `pong`, 4002 and 4004 are never emitted; all four are wrong now. `back/app/realtime/README.md` only documents `conversation.new` and presence, and should be replaced by this guide.

---

## 13. Reference implementation

Two files. They are written to drop into `playbook-web` on `origin/integration` as-is, using the existing `@/` path alias and the existing axios instance.

Everything below has been checked mechanically: the frames module and `RealtimeClient` compile under TypeScript strict mode (`tsc --strict`, no errors), and `RealtimeClient` was behaviour-tested against a mock `WebSocket` (a send issued before `ready` is queued and flushed on `ready`; `onopen` alone does not mark the socket ready; close `4001` stops instead of reconnecting; an intentional close does not reconnect). The two `.tsx` files are syntax-checked only — there is no React type package available in this sandbox, so they are not type-checked against React itself.

### `src/services/realtime.ts`

```ts
import type { ClientFrame, ServerFrame } from "@/types/realtime";

export type ConnectionState =
  | "idle"
  | "connecting"
  | "ready"
  | "reconnecting"
  | "failed";

type FrameHandler = (frame: ServerFrame) => void;

const HEARTBEAT_MS = 20_000;
const PONG_TIMEOUT_MS = 15_000;
const BASE_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;
const STABLE_AFTER_MS = 30_000;
const SEND_TIMEOUT_MS = 10_000;

export function websocketUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL ?? "";
  if (configured) {
    return configured.replace(/^http/, "ws").replace(/\/+$/, "") + "/ws";
  }
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws`;
}

export class RealtimeClient {
  private socket: WebSocket | null = null;
  private listeners = new Set<FrameHandler>();
  private stateListeners = new Set<(s: ConnectionState) => void>();
  private outbox: ClientFrame[] = [];
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private pongDeadline: ReturnType<typeof setTimeout> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private attempt = 0;
  private openedAt = 0;
  private intentional = false;

  state: ConnectionState = "idle";

  onFrame(handler: FrameHandler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  onState(handler: (s: ConnectionState) => void): () => void {
    this.stateListeners.add(handler);
    return () => this.stateListeners.delete(handler);
  }

  private setState(state: ConnectionState) {
    if (this.state === state) return;
    this.state = state;
    this.stateListeners.forEach((h) => h(state));
  }

  connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)) return;
    this.intentional = false;
    this.setState(this.attempt === 0 ? "connecting" : "reconnecting");

    const socket = new WebSocket(websocketUrl());   // cookies ride along automatically
    this.socket = socket;

    socket.onopen = () => {
      this.openedAt = Date.now();
      // Do NOT treat this as connected: auth happens on the server after accept()
      // and may close us with 4001. Wait for the `ready` frame.
    };

    socket.onmessage = (event: MessageEvent<string>) => {
      let frame: ServerFrame;
      try {
        frame = JSON.parse(event.data) as ServerFrame;
      } catch {
        return;
      }
      if (frame.type === "ready") {
        this.attempt = 0;
        this.setState("ready");
        this.flushOutbox();
        this.startHeartbeat();
      }
      if (frame.type === "pong") this.clearPongDeadline();
      this.listeners.forEach((h) => h(frame));
    };

    socket.onerror = () => { /* close follows; handled there */ };

    socket.onclose = (event: CloseEvent) => {
      this.stopHeartbeat();
      this.socket = null;
      const uptime = Date.now() - this.openedAt;
      if (this.intentional) { this.setState("idle"); return; }
      if (uptime > STABLE_AFTER_MS) this.attempt = 0;

      switch (event.code) {
        case 4001: // auth failed - retrying cannot help
          this.setState("failed");
          this.listeners.forEach((h) =>
            h({ type: "error", reason: "auth_failed" } as ServerFrame));
          return;
        case 4003: // session ended elsewhere - the app decides via GET /auth/me
          this.setState("failed");
          this.listeners.forEach((h) =>
            h({ type: "error", reason: "session_ended" } as ServerFrame));
          return;
        case 4002: // rate limited
          this.scheduleReconnect(Math.max(10_000, this.backoff()));
          return;
        case 1000:
        case 1001:
          this.setState("idle");
          return;
        default:   // 4004, 1006, 1011 and anything unknown
          this.scheduleReconnect(this.backoff());
      }
    };
  }

  private backoff(): number {
    const base = Math.min(BASE_BACKOFF_MS * 2 ** this.attempt, MAX_BACKOFF_MS);
    this.attempt += 1;
    const jitter = base * 0.2 * (Math.random() * 2 - 1);  // +/-20%
    return Math.round(base + jitter);
  }

  private scheduleReconnect(delayMs: number) {
    this.setState("reconnecting");
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => this.connect(), delayMs);
  }

  reconnectNow(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.attempt = 0;
    this.connect();
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeat = setInterval(() => {
      if (this.state !== "ready") return;
      this.send({ type: "ping" });
      this.armPongDeadline();
    }, HEARTBEAT_MS);
  }

  private armPongDeadline() {
    this.clearPongDeadline();
    this.pongDeadline = setTimeout(() => {
      // No pong: the socket is a zombie. Reconnect rather than wait for 4004.
      this.intentional = false;
      try { this.socket?.close(); } catch { /* already dead */ }
    }, PONG_TIMEOUT_MS);
  }

  private clearPongDeadline() {
    if (this.pongDeadline) { clearTimeout(this.pongDeadline); this.pongDeadline = null; }
  }

  private stopHeartbeat() {
    if (this.heartbeat) { clearInterval(this.heartbeat); this.heartbeat = null; }
    this.clearPongDeadline();
  }

  /** Queues the frame until `ready`; drops it if auth failed permanently. */
  send(frame: ClientFrame): void {
    if (this.state === "ready" && this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(frame));
      return;
    }
    if (this.state === "failed") return;
    this.outbox.push(frame);
  }

  private flushOutbox() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    const pending = this.outbox;
    this.outbox = [];
    for (const frame of pending) this.socket.send(JSON.stringify(frame));
  }

  closeIntentionally(): void {
    this.intentional = true;
    if (this.retryTimer) { clearTimeout(this.retryTimer); this.retryTimer = null; }
    this.stopHeartbeat();
    try { this.socket?.close(1000); } catch { /* already closed */ }
    this.socket = null;
    this.setState("idle");
  }

  /** Call on unmount; the app-level singleton stays alive across route changes. */
  dispose(): void {
    this.listeners.clear();
    this.stateListeners.clear();
    this.closeIntentionally();
  }
}

export const SEND_TIMEOUT = SEND_TIMEOUT_MS;
```

Two notes on that class. It deliberately treats `onopen` as *not* connected, because auth runs after `accept()` and a `4001` close arrives right after a successful open. And it keeps an outbox: any `send` before `ready` is queued rather than dropped, so a user who hits Enter while the socket is still handshaking does not lose the message.

### `src/hooks/contexts/realtimeContext.tsx`

```tsx
"use client";

import React from "react";
import { RealtimeClient, type ConnectionState } from "@/services/realtime";
import type { ServerFrame } from "@/types/realtime";

type RealtimeContextValue = {
  client: RealtimeClient;
  state: ConnectionState;
};

const RealtimeContext = React.createContext<RealtimeContextValue | null>(null);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Lazy initialiser: the socket object survives React StrictMode's double effect,
  // and the client is only constructed in the browser.
  const [client] = React.useState(() => new RealtimeClient());
  const [state, setState] = React.useState<ConnectionState>(client.state);

  React.useEffect(() => {
    const off = client.onState(setState);
    client.connect();

    const onVisible = () => {
      if (document.visibilityState === "visible" && client.state !== "ready") {
        client.connect();
      }
    };
    const onOnline = () => client.connect();

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    return () => {
      off();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [client]);

  const value = React.useMemo(() => ({ client, state }), [client, state]);
  return (
    <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
  );
};

export function useRealtime(): RealtimeContextValue {
  const ctx = React.useContext(RealtimeContext);
  if (!ctx) throw new Error("useRealtime must be used inside RealtimeProvider");
  return ctx;
}

/** Subscribe to a subset of server frames. */
export function useRealtimeFrame<T extends ServerFrame["type"]>(
  type: T,
  handler: (frame: Extract<ServerFrame, { type: T }>) => void,
): void {
  const { client } = useRealtime();
  const ref = React.useRef(handler);
  ref.current = handler;

  React.useEffect(() => {
    return client.onFrame((frame) => {
      if (frame.type === type) {
        ref.current(frame as Extract<ServerFrame, { type: T }>);
      }
    });
  }, [client, type]);
}
```

### Wiring it in

Wrap the private layout, which is already a client component — this is the natural mount point, since it covers every authenticated route:

```tsx
// src/app/[locale]/(private)/layout.tsx
"use client";

import { RealtimeProvider } from "@/hooks/contexts/realtimeContext";

export const PrivateLayout = ({ children }: { children: React.ReactNode }) => {
  // ...existing header/menu state...
  return (
    <RealtimeProvider>
      <div className="flex flex-col min-h-screen">
        {/* existing header, main, footer */}
      </div>
    </RealtimeProvider>
  );
};
```

Do **not** mount it in the root layout: the socket would open on the public auth pages too, where there is no session, and every one of those would burn a 4001.

**One socket per tab, not one per app.** There is no cross-tab sharing (`BroadcastChannel`, shared worker) and you do not need any: the server delivers to every socket the user has, so a second tab gets its own copy of everything. That is also why you must dedupe by id — the same message reaches each tab independently.

---

## 14. Files to add or touch

| File | Action | Why |
| --- | --- | --- |
| `front/playbook-web/.env.local` | **add** | `NEXT_PUBLIC_API_URL=http://localhost:8000`. Not committed today — REST calls silently hit the Next dev server without it. |
| `src/types/realtime.ts` | **add** | Frame union from §4.4, plus REST row types. |
| `src/services/realtime.ts` | **add** | `RealtimeClient` from §13. |
| `src/hooks/contexts/realtimeContext.tsx` | **add** | Provider + `useRealtime` + `useRealtimeFrame`. |
| `src/hooks/contexts/contextsProviders.tsx` | edit | Currently only wraps `ResizeProvider`. If you prefer one provider file, add `RealtimeProvider` here — but it will then also wrap public routes. Wrapping `(private)/layout.tsx` is the better fit. |
| `src/app/[locale]/(private)/layout.tsx` | edit | Mount `RealtimeProvider` (already `"use client"`). |
| `src/lib/constants.ts` | edit | Add routes for a single post, a single match, and another user's profile — notification links need them. |
| `messages/en.json`, `fr.json`, `ar.json` | edit | `notification-follow`, `notification-like`, `notification-comment`, `notification-reply`, `notification-play-request`, `notification-play-request-accepted`, `notification-play-request-declined` (and a `notification-generic` fallback), plus the new error strings. All three locales, or the Arabic UI shows raw keys. |
| `src/app/[locale]/(private)/chat/*` | **add** | Conversation list + thread + composer, built on §8. |

Everything is prefixed `NEXT_PUBLIC_API_URL`-relative, so no CORS work is needed for the REST side beyond keeping `withCredentials: true`.

---

## 15. Testing checklist

Backend up (`docker compose up` in `back/`, or uvicorn on 8000), front on `next dev` at `localhost:3000`.

**Two users requires two isolated cookie jars.** A normal second tab shares cookies and you will be talking to yourself, which makes every test pass for the wrong reason. Use a private/incognito window, a second browser profile, or two different browsers. Do not use `localhost` and `127.0.0.1` as your two "users" — the session cookie is host-only, so that trick fails on the auth side.

| # | Test | Expected |
| --- | --- | --- |
| 1 | Log in as A, open the app. | Socket connects, `ready` arrives, conversations + counts load. No `4001`. |
| 2 | Open DevTools → Network → WS. | Exactly one socket per tab, URL `ws://localhost:8000/ws`, no token in the URL. |
| 3 | Wait 60s idle without backgrounding the tab. | Still open. If it closes with 4004, the heartbeat is not running. |
| 4 | A sends a message; B has the tab open. | B sees it live. A sees its own echo. A's bubble flips from pending to sent. |
| 5 | A sends a message while B is **logged out**. Then B logs in. | B receives the message right after `ready` (queue flush), plus `notification.count`. |
| 6 | A hard-refreshes mid-conversation. | History reloads via REST; no duplicates after the reconnect. |
| 7 | Paste 2500 characters into the composer. | Blocked client-side with a clear message; nothing sent. Pasting 2000 works. |
| 8 | Send 12 messages fast in one chat. | The 11th shows as failed (rate limited); 5 more and the socket closes with 4002, then reconnects after ≥10s. |
| 9 | Log in as A in **two tabs**, then log out from tab 1. | Both of A's tabs close with 4003. Tab 2 redirects to sign-in (its session was killed too — see §12 #1). |
| 10 | Log in as A on two tabs, then log out from a *different* device/browser session of A. | Both tabs close with 4003 and then **reconnect** (their own session is still valid via `/auth/me`). |
| 11 | Delete the `session_id` cookie manually, then reload. | Redirected to sign-in by middleware, no reconnect loop. |
| 12 | B closes its tab; A watches the contact list. | B flips to offline once. Reopening flips it back. |
| 13 | B opens two tabs, then closes one. | A still shows B online (last socket). |
| 14 | A follows B while B is online with the notifications panel closed. | The badge increments by exactly 1 (no `notification.count` frame follows — §12 #3). |
| 15 | Like → unlike → like the same post while unread. | One notification, not three. |
| 16 | Open a conversation, scroll to the bottom. | A `read` frame goes out to the peer once (debounced), not once per scroll event. |
| 17 | Kill the backend (`docker compose stop api`) while a tab is open. | Close 1006; the client retries with growing backoff; restarting the API reconnects it. |
| 18 | Restart the backend. | Presence works again for existing conversations; no stale "online" ghosts. |
| 19 | Two tabs for A, messaging B from tab 1. | Tab 2 shows the message too (its own socket received it). No duplicate rendering. |
| 20 | Start a conversation with someone you do not mutually follow. | `403`, and the UI says so in the user's language rather than failing silently. |
| 21 | Start a conversation with someone you do follow mutually, before sending a message. | The thread opens empty; it is absent from `GET /realtime/conversations`; after the first send both sides get `conversation.new`. |
| 22 | Click a notification for a post that has since been deleted. | A clean 404 state, not a crash. |
| 23 | Switch locale to `ar` with notifications present. | Notification text renders translated and mirrored, no raw i18n keys. |

For a quick manual probe of the protocol there is a scratch client in the repo at `front/test-client/` — but its `src/lib/protocol.js` is stale (it claims `ping` is unhandled and that `pong`/`4002`/`4004` are not emitted). Trust this document over that file, or fix the file.

---

## 16. Quick reference

```
WS              ws://localhost:8000/ws
REST base       http://localhost:8000
Auth            cookie session_id, httpOnly, SameSite=Lax, 7 days
Send            {"type":"message.send","conversation_id":u,"body":s}   (1..2000, trimmed)
Read            {"type":"read","conversation_id":u,"message_id":u}
Ping            every 20s
Idle close      4004 at ~45-60s
Rate limit      10 sends / 10s per connection, then 4002 at 5 strikes
Close codes     4001 auth   4002 flood   4003 logout   4004 idle
Connect order   ready, message.new*, notification*, notification.count, presence.snapshot
Connected when  you receive `ready`, NOT when onopen fires
On every ready  refetch conversations + open thread + notification count
Dedupe          every message by id; sort by (created_at, id)
Presence        idempotent state, default offline, contacts only
Unread          increment on live notification; list count includes your own (bug)
```

---

*Written against `Wisscor/PlayBook` `Core-Dev` @ `f97996f`. If the `realtime` module changes, §4.3, §6 and §12 are the sections most likely to go stale.*
