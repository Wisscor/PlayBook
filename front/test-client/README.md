# Realtime test client

A developer tool for exercising the real-time part of the FastAPI backend in
`back/`. It has two pages behind auth (`/signup`, `/login`) and one working page
(`/app`) with a chats panel, a notifications bell, and a debug drawer that shows
every WebSocket frame in both directions as raw JSON.

It is deliberately plain. The point is to see what the backend actually does,
including what it does wrong, so error reporting gets more attention here than
layout does.

**It does not touch the backend.** No file under `back/` was created, edited, or
is expected to change for this client to run. Everything the backend does not
provide is worked around on this side and listed under *Backend blockers* at the
bottom of this file.

## Install

Node 18 or newer. From the repository root:

```sh
cd front/test-client
npm install
```

## Configure the backend URL

One place, read by `vite.config.js` at startup:

```sh
cp .env.example .env
```

`.env` holds a single line:

```
BACKEND_URL=http://127.0.0.1:8000
```

Port 8000 is what `back/docker-compose.yaml` publishes for the `api` service. If
you run uvicorn directly on another port, change it here. The value is read by
the Vite dev server in Node, never by the browser, so it is not baked into the
bundle. Restart `npm run dev` after editing it.

Everything the browser requests is relative (`/auth/login`, `/realtime/...`,
`/ws`). The dev server proxies those to `BACKEND_URL`. That is what makes the
page and the API same-origin, which matters for two reasons explained under
*Backend blockers*: the backend installs no CORS middleware, and the session
cookie has to be treated as first-party to be stored at all.

## Run

Start the backend first:

```sh
cd back && docker compose up
```

Confirm it answers, then start the client:

```sh
cd front/test-client && npm run dev
```

Open http://localhost:5173. Sign up, which logs you in immediately
(`/auth/signup` does not set a cookie, so the client posts `/auth/login` right
after a successful signup), or log in if you already have an account.

## Testing two users at the same time

You need two sessions in one browser. The session is an **HttpOnly** cookie, so
no amount of JavaScript in a tab can read it, store a copy per tab, or send a
different one. Per-tab token storage is not possible with this auth mechanism.
Two separate cookie jars are the way, and you can get them without touching the
backend and without incognito.

The cookie is set in `routers/auth.py:61` with no `Domain` attribute, which makes
it **host-only**: the browser stores it for exactly the hostname that was in the
address bar and sends it back only for that hostname. `localhost` and
`127.0.0.1` resolve to the same machine but are two different hostnames, so they
get two independent jars. `vite.config.js` sets `host: true`, so the dev server
answers on both.

Open user A at **http://localhost:5173** and user B at **http://127.0.0.1:5173**,
in ordinary tabs of the same browser window. Log in as a different account in
each. Both sockets stay open, and a message sent in one appears live in the
other.

Two details make this work rather than half-work. The WebSocket URL is built from
`window.location.host` in `src/lib/socket.js`, so the tab on `127.0.0.1` opens
`ws://127.0.0.1:5173/ws` and its cookie travels with it. And the proxy runs with
`changeOrigin: false`, so the hostname you typed is the hostname the backend sees
and sets the cookie for.

A third session, if you ever want one, can come from any other name that points
at the same machine, for example `http://[::1]:5173`, or a name you add to
`/etc/hosts`.

To exercise chat you need a conversation. In the chats panel, search for the
other user by username and click the result row. `POST /realtime/conversations`
returns the conversation to the caller only, so the other tab picks it up with
*refresh list*.

## What to look at while testing

The debug drawer at the bottom is the real instrument. Every frame sent and
received is appended with a timestamp and a direction, newest first, with its
raw JSON, and `clear` empties it. HTTP requests and connection events are logged
in the same stream and can be filtered with the three checkboxes.

The drawer also sends hand-written frames. This is how you confirm protocol
behaviour rather than assume it:

- Opening a thread loads its message history and automatically sends a `read`
  frame for the newest displayed message. The reader's WebSocket log shows the
  outgoing frame; the sender's log shows the receipt. The sender's message is
  labeled `seen by <user-id>` in the thread.
- The `read latest live` shortcut fills a valid frame from the newest live
  message in the active conversation. To test another message, edit the raw JSON
  with its `conversation_id` and `message_id` from the thread or drawer.
- *ping* is declared in `realtime/frames.py` but is not yet handled, so it
  returns `{"type":"error","reason":"unknown_type"}`.
- *bad json* makes the server answer `invalid_json`.
- A `message.send` with an empty body, or one longer than 2000 characters, fails
  `MessageSend` validation and returns `invalid_frame`.
- A `message.send` naming a conversation you are not part of returns
  `conversation_not_found`, which is `service.py:52` raising `PermissionError`.

The badge in the top bar shows the connection phase. It distinguishes **open**
from **ready** on purpose: `ws.py` calls `websocket.accept()` before it
authenticates, so an open socket is not evidence of a valid session. The `ready`
frame is the evidence, and a close with code 4001 is the refusal. When the
socket closes unexpectedly the client reconnects with backoff
(1s, 2s, 4s, 8s, 16s, 30s, then 30s), and the badge names the wait before the
next attempt. After a close
with 4001 or 4003 it does not retry, because retrying with a cookie the server
already rejected would loop; it reports the session as lost and sends you to
`/login`. Logging out stops the socket deliberately and does not reconnect
either.

Errors surface in two places, always. A toast appears with a readable message,
and the drawer keeps the raw payload so you can see what the server really sent.
Status codes are handled apart from one another: 401 ends the session and
redirects, 403 is reported as a permission refusal, 422 is split into per-field
messages shown under the inputs (both FastAPI shapes are parsed, the plain
`{"detail": "..."}` string and the `{"detail": [{"loc": [...], "msg": ...}]}`
list), 500 is reported as a server fault with the body attached, and a failed
`fetch` is reported as a network or backend-down error rather than being
swallowed.

## Layout

```
src/
  lib/protocol.js   every frame type, error reason and close code, copied from frames.py
  lib/errors.js     ApiError, 422 parsing, status-to-message mapping
  lib/log.js        the debug store (plain subscribe/getSnapshot, read with useSyncExternalStore)
  lib/socket.js     one socket, backoff, close-code handling, logging
  api/client.js     fetch wrapper; every failure becomes an ApiError and a toast
  api/endpoints.js  the only endpoints this client knows, each with its backend file:line
  hooks/useAuth     session probe, login, signup, logout, session-lost
  hooks/useRealtime conversations, messages, notifications, frame dispatch
  components/       Chats, Thread, Notifications, DebugDrawer, ConnectionBadge, Toasts, FieldErrors
  pages/            Login, Signup, AppPage
```

`src/main.jsx` renders without `StrictMode`. That is not carelessness. StrictMode
double-invokes effects in development, which opens a second WebSocket and closes
it mid-handshake, and Chrome logs *"WebSocket is closed before the connection is
established"* for it. The brief asks for no console noise in normal use, and a
test client that cries wolf about its own transport is worse than useless. The
socket manager also defers a close until `onopen` when one is requested while
still connecting, so the warning cannot appear from ordinary navigation either.

## Assumptions

These are the places where the backend did not settle a question, so a choice was
made here and written down rather than guessed silently.

Success for `POST /realtime/conversations` is treated as **200**, because
`rest.py:13` declares no `status_code` and FastAPI's default is 200. Its response
is read as `{"id", "peer_id"}` only. It omits `peer_username`, which the list
route includes, so after creating a conversation the client re-fetches
`GET /realtime/conversations` rather than assembling a row from the search result
— one shape of conversation row in the UI, always the server's.

The thread loads message history from `GET /realtime/conversations/{id}/messages`
and merges it with live WebSocket frames. Opening a thread marks its newest
displayed message as read.

No local echo is appended when you send. `ws.py:64` fans the stored message out
to every participant **including the sender**, so the message appearing is proof
it reached Postgres. Appending locally as well would show it twice and would also
hide a failure to persist.

Conversation unread counts come from `GET /realtime/conversations`; notification
unread counts are separate. The cursor advances monotonically by message
creation time, so replaying an older read frame does not roll it backward.

`GET /users` is used for finding people to chat with. It has no `get_curr_user`
dependency, so it answers while logged out; the client still only calls it from
the authenticated page. `search` has `min_length=1`, so a blank query would be a
422 and the client refuses to send one.

Optional signup fields (`phone`, `bio`) are omitted from the request body when
left blank rather than sent as `""`, because their schema sets `min_length=3` and
an empty string is a validation error while an absent key is allowed.

Close codes 4002, 4003 and 4004 are mapped to readable text even though nothing
in the current backend emits them; only 4001 is reachable today. They are in
`frames.py`, so the day something starts sending them the client already explains
them instead of showing a bare number.

A trailing-slash difference is avoided deliberately: the users route is declared
`path=""` with prefix `/users`, so the client requests `/users` and not `/users/`,
which would be a 307 redirect.

## Backend blockers

Three things in the backend get in the frontend's way. None of them was fixed by
editing the backend.

**No CORS middleware.** `back/app/main.py` installs none, so a browser page on
`:5173` calling `:8000` directly would fail the preflight, and a cross-origin
cookie would need `SameSite=None; Secure` while `core/config.py` sets
`samesite="lax"` and `secure=False`. Worked around completely by the Vite dev
proxy: the page and the API share an origin, so there is no preflight and the
cookie is first-party. This is a dev-server-only arrangement. A deployed frontend
on a different origin would need either CORS middleware with
`allow_credentials=True` and an explicit origin, or a reverse proxy putting both
behind one hostname. Worth raising with whoever owns `main.py` before deployment,
not before testing.

**Notifications may be empty.** The notifications API exists, but only stored
notifications will appear; chat read receipts and message unread counts are
separate from notification counts. Presence is delivered over the WebSocket.

One smaller thing, not a blocker: `ws.py` accepts the socket before
authenticating, so clients cannot treat "open" as "authenticated". This client
handles it by waiting for `ready`. Any other client will need the same care.
