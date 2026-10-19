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

1. An HTTP action such as following, liking, commenting, or creating/responding to a play request schedules `notify.emit_notification()` as a background task.
2. It skips self-notifications and an existing matching unread notification, then saves a notification.
3. If the target user has an active WebSocket, it sends a `notification` frame and marks it delivered. Otherwise, it remains undelivered.
4. On the target user's next WebSocket connection, `connection._flush_notifications()` sends undelivered notifications, marks them delivered, and sends a `notification.count` frame with the unread count.
5. The HTTP endpoints `GET /realtime/notifications` and `POST /realtime/notifications/read` load notifications and mark them read. Both return the unread count, so there is no separate count endpoint.

“Delivered” and “read” are different: delivery means the server sent the notification over WebSocket; read means the user marked it read.

Notification objects sent over HTTP or WebSocket contain `id`, `event_type`, `actor_id`, `actor_username`, `read_at`, and `created_at`. `target_id` is stored internally but is not sent to the frontend. Unread duplicates are identified by recipient, actor, event type, and target ID. This combines repeated likes on the same post while still creating a separate notification when the actor likes a different post.

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
