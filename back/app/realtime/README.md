# Realtime protocol

## Start here: how the pieces fit together

The realtime feature has two interfaces:

- **WebSocket** (`/ws`) for live messages, read receipts, presence, and live notifications.
- **HTTP API** (`/realtime/...`) for creating/listing conversations, loading message history, and listing/reading notifications.

The WebSocket entry point is `ws.py`. It authenticates and registers the connection, then routes incoming frames to `handlers.py`. Database work is delegated to `services/`; `delivery.py`, `connection.py`, `notify.py`, and `registry.py` handle sending and connection state.

### File map

| File | Responsibility |
| --- | --- |
| `ws.py` | WebSocket authentication, `ready` frame, receive loop, idle timeout, cleanup |
| `handlers.py` | Handles client frames: `message.send`, `read`, and `ping` |
| `connection.py` | On connect: flush queued messages/notifications and send presence snapshot; on disconnect: broadcast offline status |
| `registry.py` | In-memory map of user IDs to their active WebSocket connections; sends frames to all of a user's sockets |
| `delivery.py` | Sends a saved message to conversation participants and announces a newly created conversation |
| `notify.py` | Creates/deduplicates notifications, sends live notifications, and marks successful delivery |
| `rest.py` | HTTP endpoints for conversations, message history, and notifications |
| `services/conversations.py` | Conversation lookup/creation, lists, participants, and contact IDs |
| `services/messages.py` | Message storage, pending delivery, read marker updates, and message payloads |
| `services/notifications.py` | Notification storage, queries, read/delivered timestamps, and payloads |
| `schemas.py`, `frames.py` | Validate incoming WebSocket data and define protocol frame names |
| `models/` | Database tables for conversations, participants, messages, pending messages, and notifications |

### Message flow

1. Client sends `message.send` with `conversation_id` and `body`.
2. `handlers.handle_message_send()` rate-limits and validates it, then calls `services.messages.send_message()`.
3. The service checks that the sender belongs to the conversation, saves the message, and returns its participants.
4. `delivery.deliver_message()` sends `message.new` to every participant. If this is the conversation's first message, it sends each participant a personalized `conversation.new` first.
5. If a participant has no active socket, their user ID is returned as unreached; the handler stores a `PendingMessage` for them.
6. When that user connects later, `connection._flush_pending_messages()` sends queued messages and deletes each queue row after its WebSocket send succeeds.

Message history is separate from live delivery: the frontend loads it through `GET /realtime/conversations/{conversation_id}/messages` and can paginate with the `before` cursor.

### Read receipt flow

1. Client sends a `read` frame with `conversation_id` and `message_id`.
2. `handlers.handle_read()` calls `services.messages.mark_conversation_read()`.
3. The service verifies the user is a participant and the message belongs to that conversation, advances the user's read marker, and returns the other participant IDs.
4. The handler sends each peer a `read` frame containing the reader's `user_id`, `conversation_id`, and `message_id`.

`read` therefore travels in both directions: client → server means “I read through this message”; server → peer means “this user read through this message.”

### Notification flow

1. An HTTP action such as following or creating/responding to a play request schedules `notify.emit_notification()` for one user, or `notify.emit_notifications()` for a list of users, as a background task.
2. It skips self-notifications and an existing matching unread notification, then saves a notification.
3. If the target user has an active WebSocket, it sends a `notification` frame and marks it delivered. Otherwise, it remains undelivered.
4. On the target user's next WebSocket connection, `connection._flush_notifications()` sends undelivered notifications, marks them delivered, and sends a `notification.count` frame with the unread count.
5. The HTTP endpoints `GET /realtime/notifications` and `POST /realtime/notifications/read` load notifications and mark them read. Both return the unread count, so there is no separate count endpoint.

“Delivered” and “read” are different: delivery means the server sent the notification over WebSocket; read means the user marked it read.

Notification objects sent over HTTP or WebSocket contain `id`, `event_type`, `actor_id`, `actor_username`, `read_at`, `created_at`, and nullable `match_time`. The frontend can format a match time such as `18:30` and pair it with `event_type` values like `match_cancelled`, `match_updated`, `play_request_accepted`, or `play_request_rejected`. Other notification types have `match_time: null`. Match notifications are sent to all pending or accepted requesters through one reusable bulk background task. `Base.metadata.create_all()` adds this column on a new database; it does not alter an existing `notifications` table, so provision the column separately for existing databases.

### Connection and presence flow

1. `ws.websocket_endpoint()` accepts the socket and authenticates the session cookie. Invalid sessions are closed.
2. It registers the socket, sends `ready`, then calls `connection.on_connect()`.
3. `on_connect()` flushes pending messages and notifications, sends the user's online contact IDs in `presence.snapshot`, and (for the user's first active socket) broadcasts that user as online.
4. When a socket closes, `on_disconnect()` unregisters it. Only when the user has no remaining sockets does it broadcast that user as offline.

Presence contacts are users who share a conversation with this user. `presence.snapshot` contains IDs only; the frontend uses those IDs to mark entries in its existing contact/conversation data as online.

### A few important distinctions

- `PendingMessage` rows exist only while a message is waiting to be delivered; the row is deleted after its WebSocket send succeeds. `Notification.delivered_at` tracks notification delivery separately. The WebSocket registry itself is only in memory.
- A user can have multiple sockets. `registry.send_to_user()` sends to all of them, while online/offline broadcasts happen only on the first connect and last disconnect.
- `ConversationParticipant.last_read_message_id` is the per-user read marker; it is not a separate read-receipt table.
- The registry is process-local. With multiple server worker processes, online presence and live delivery are not shared between workers unless a shared pub/sub mechanism is added.

## Frontend event and response contract

This section is the client-facing reference for frames sent to and received from `/ws`. All WebSocket application frames are JSON objects with a `type` field. UUIDs and timestamps are serialized as strings. The authenticated session cookie is used to connect; do not send credentials in a WebSocket frame.

### Connection sequence

After the server accepts the socket and authenticates the session, it sends:

```json
{"type":"ready","user_id":"<current-user-uuid>","username":"<current-username>"}
```

Then the server may send queued `message.new` frames and undelivered `notification` frames, followed by `notification.count` and `presence.snapshot`. If this is the user's first active socket, contacts may also receive a `presence` frame announcing the user online. Ordering of frames sent to other users is independent of this connection sequence.

### Client-to-server frames

| `type` | Required fields | Result |
| --- | --- | --- |
| `ping` | None | Responds on this socket with `{"type":"pong"}`. |
| `message.send` | `conversation_id` UUID, `body` string (1–500 characters after trimming) | Persists the message and delivers `message.new` to connected conversation participants. There is no separate acknowledgement frame; use the resulting `message.new`. Offline participants receive the queued message on reconnect. For a first message, connected participants also get `conversation.new`. |
| `read` | `conversation_id` UUID, `message_id` UUID | Updates the sender's read marker and sends a `read` receipt to the other participant(s), if the marker advanced. There is no separate acknowledgement to the sender. |

Examples:

```json
{"type":"message.send","conversation_id":"<conversation-uuid>","body":"Are you free to play?"}
```

```json
{"type":"read","conversation_id":"<conversation-uuid>","message_id":"<message-uuid>"}
```

### Server-to-client event frames

| `type` | Payload fields | When to handle it |
| --- | --- | --- |
| `ready` | `user_id`, `username` | Authentication succeeded; initialize the socket session. |
| `pong` | None | Reply to the client's `ping`. |
| `message.new` | `id`, `conversation_id`, `sender_id`, `body`, `created_at` | Append/deduplicate a message by `id`; may arrive for live or queued delivery. |
| `conversation.new` | `id` (conversation ID), `peer_id`, `peer_username` | Add a conversation created by its first message. Sent before that first `message.new` to each connected participant, with peer fields personalized for the recipient. Offline participants can discover it through `GET /realtime/conversations`. |
| `read` | `user_id`, `conversation_id`, `message_id` | Update the read receipt for the peer identified by `user_id`. |
| `presence.snapshot` | `online`: array of contact UUIDs | Replace the current online-contact set on connection. |
| `presence` | `user_id`, `online` boolean | Add/remove that contact from the online set. It is sent on a user's first connect and last disconnect. |
| `notification` | `id`, `event_type`, `actor_id`, `actor_username`, `read_at`, `created_at`, `match_time` | Add or update a notification, deduplicating by notification `id`. `match_time` can be `null`. |
| `notification.count` | `unread_count` integer | Replace the unread badge count. Sent during connection setup after notification delivery is attempted. |
| `error` | `reason`; `retry_after` for `timed_out` | Display or handle a protocol error as described below. |

Message example:

```json
{"type":"message.new","id":"<message-uuid>","conversation_id":"<conversation-uuid>","sender_id":"<user-uuid>","body":"Are you free to play?","created_at":"2026-10-24T12:30:00+00:00"}
```

Read-receipt example:

```json
{"type":"read","user_id":"<reader-uuid>","conversation_id":"<conversation-uuid>","message_id":"<message-uuid>"}
```

Notification event types currently emitted are `follow`, `post_created`, `play_request`, `play_request_accepted`, `play_request_rejected`, `match_updated`, and `match_cancelled`. Treat `event_type` as an extensible string so new event types can be handled gracefully.

### Error frames and close codes

| Error `reason` | Meaning / client action |
| --- | --- |
| `invalid_json` | Frame text was not valid JSON. |
| `frame_too_large` | Frame exceeded the configured 2,048-byte application limit. |
| `unknown_type` | `type` is missing, invalid, or unsupported. |
| `invalid_frame` | A supported event had missing or invalid fields. |
| `conversation_not_found` | The user is not authorized for the conversation or the referenced message is not in it. |
| `rate_limited` | Message-send rate limit exceeded; slow down. Repeated strikes can close and temporarily time out all the user's sockets. |
| `timed_out` | This user is temporarily blocked from reconnecting; `retry_after` gives remaining seconds (rounded to one decimal place). |

The server also closes sockets with these codes:

| Code | Meaning |
| --- | --- |
| `1008` | Origin is not allowed. |
| `4001` | Session cookie is missing, invalid, expired, or its user no longer exists. |
| `4002` | Rate limit timeout; all of the user's active sockets are closed. |
| `4003` | Session ended; the user's active sockets are closed. |
| `4004` | No inbound frame for 60 seconds (idle timeout). |
| `4005` | Reconnect attempted before the temporary timeout expired; an `error` frame is sent first. |

Inbound frames (including malformed or oversized frames) are limited to 60 per 10 seconds per socket; exceeding this closes the user's active sockets with code `4002` and starts the 30-second timeout without first sending an error frame. Message sends are separately limited to 10 per 10-second window; five rate-limit strikes within 60 seconds trigger the same timeout. The application frame limit is 2,048 UTF-8 bytes. The Docker Uvicorn command has a 4,096-byte transport maximum; messages above that can be rejected by the WebSocket server before the application can send an `error` frame. The idle watchdog checks every 15 seconds after the 60-second idle threshold, so actual closure can be delayed by up to one check interval.

### Realtime HTTP responses

These authenticated endpoints provide initial state and recovery after reconnect:

| Request | Response shape |
| --- | --- |
| `POST /realtime/conversations` with `{"peer_id":"<user-uuid>"}` | `{"id":"<conversation-uuid>","peer_id":"<user-uuid>"}` |
| `GET /realtime/conversations` | Array of `{ "id", "peer_id", "peer_username", "unread_count" }`; conversations without messages are omitted. |
| `GET /realtime/conversations/{conversation_id}/messages?limit=50&before=<message-uuid>` | `{ "items": [message, ...], "next_cursor": "<message-uuid>" | null }`. Messages are newest first; pass `next_cursor` as `before` for the next page. |
| `GET /realtime/notifications?unread_only=false&limit=30` | `{ "items": [notification, ...], "unread_count": 0 }`. |
| `POST /realtime/notifications/read` with `{"notification_ids":["<notification-uuid>"]}` | `{ "unread_count": 0 }`. |

Message objects contain `id`, `conversation_id`, `sender_id`, `body`, and `created_at`. Notification item fields are listed in the notification section above. REST errors use the standard HTTP status and `{"detail":"..."}` response; session authentication is required.

## `conversation.new`

- Direction: server → client
- Payload: `{ "type": "conversation.new", "id": "<conversation_id>", "peer_id": "<other_user_id>", "peer_username": "<other_username>" }`
- Sent to every conversation participant when the first message is stored, immediately before that message's `message.new` frame. The peer fields are personalized for each recipient.
- Creating an empty conversation does not emit this frame. The sender's normal conversation list includes the thread after it has a message.


## `presence` and `presence.snapshot`

- Direction: server → client
- `presence` payload: `{ "type": "presence", "user_id": "<contact_id>", "online": true }`; `online` is `false` when the contact's last socket disconnects.
- `presence.snapshot` payload: `{ "type": "presence.snapshot", "online": ["<contact_id>", ...] }`; sent after `ready` when a socket connects.
- Presence is scoped to contacts: users who share a conversation with the connected user. Only the user's first active socket broadcasts `online: true`; `online: false` is broadcast when the last socket is gone.
