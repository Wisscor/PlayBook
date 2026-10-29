# Chat and WebSocket explained

This document explains how chat works in PlayBook, from the FastAPI backend to
the Next.js frontend.

The chat system has two parts:

1. **HTTP endpoints** load and create persistent data.
2. **WebSockets** deliver live events without refreshing the page.

The backend stores conversations and messages in the database. The frontend
displays that data and keeps a WebSocket connection open while the user is
logged in.

## 1. The complete chat flow

For two users to chat:

1. User A and User B follow each other.
2. One user clicks the message button on the other user's profile.
3. The frontend calls `POST /realtime/conversations`.
4. The backend checks that:
   - the target user exists;
   - the user is not trying to message themselves;
   - both users follow each other.
5. The backend creates a conversation containing the two users.
6. The frontend navigates to `/messages?conversation=<conversation-id>`.
7. The frontend loads existing messages using HTTP.
8. The frontend connects to `ws://localhost:8000/ws`.
9. When a message is sent, the frontend sends a WebSocket frame.
10. The backend saves the message and sends a live WebSocket event to both
    participants.

The UI does not create fake messages anymore. Messages displayed by the chat
page come from the backend.

## 2. Important project files

### Backend

- `back/app/realtime/rest.py`
  - HTTP endpoints for conversations and message history.
- `back/app/realtime/ws.py`
  - WebSocket connection, authentication, receive loop, and reconnection
    cleanup.
- `back/app/realtime/handlers.py`
  - Handles frames received from the frontend.
- `back/app/realtime/frames.py`
  - Names of all WebSocket frame types.
- `back/app/realtime/connection.py`
  - Sends queued messages, presence, and notification events when a user
    connects.
- `back/app/realtime/delivery.py`
  - Delivers saved messages to conversation participants.
- `back/app/realtime/services/conversations.py`
  - Creates, finds, and lists conversations.
- `back/app/realtime/services/messages.py`
  - Saves messages, creates pending messages for offline users, and builds
    message payloads.
- `back/app/realtime/ws_auth.py`
  - Authenticates a WebSocket using the `session_id` cookie.
- `back/app/realtime/models/conversation.py`
  - Database tables for conversations and participants.
- `back/app/realtime/models/message.py`
  - Database tables for messages and offline pending messages.

### Frontend

- `src/hooks/contexts/chatContext.tsx`
  - The central frontend chat state and WebSocket connection.
- `src/app/[locale]/(private)/messages/page.tsx`
  - Converts backend conversations and messages into the existing UI shape.
- `src/app/[locale]/(private)/messages/components/contactsList.tsx`
  - Displays the conversation list.
- `src/app/[locale]/(private)/messages/components/conversation.tsx`
  - Displays the active conversation and message input.
- `src/app/[locale]/(private)/profile/components/mainDetails.tsx`
  - The existing profile message button creates or finds a conversation.
- `src/hooks/contexts/authContext.tsx`
  - Restores the logged-in user after a browser refresh.
- `src/services/api.ts`
  - Shared Axios client for HTTP requests.
- `src/types/api.ts`
  - TypeScript types used by the frontend.

## 3. Authentication

Chat authentication uses the existing HTTP session cookie.

When a user logs in:

```http
POST /auth/login
```

The backend creates a session and sets a cookie named `session_id`.

The frontend Axios client has:

```ts
withCredentials: true
```

That means the browser sends the cookie with API requests.

The browser also sends cookies automatically during a WebSocket connection.
The frontend does not send the session ID manually in a WebSocket message.

The backend reads the cookie in `ws_auth.py`:

```python
raw = websocket.cookies.get(settings.session_cookie_name)
```

The backend then:

1. Converts the cookie value to a UUID.
2. Finds the session in the database.
3. Checks that the session has not expired.
4. Finds the related user.
5. Accepts the user as the authenticated WebSocket user.

If authentication fails, the backend closes the socket with code `4001`.

After a full page refresh, React state is initially empty. The frontend calls:

```http
GET /users/me
```

from `authContext.tsx`. Once the user is restored, `ChatProvider` starts loading
conversations and opens the WebSocket.

## 4. HTTP endpoints

HTTP is used for operations that read or create persistent data. HTTP is not
used for live message delivery.

### Create or find a conversation

```http
POST /realtime/conversations
Content-Type: application/json
```

Request body:

```json
{
  "peer_id": "USER_B_UUID"
}
```

Backend behavior:

- Returns `422` when trying to message yourself.
- Returns `404` when the target user does not exist.
- Returns `403` when the users do not follow each other.
- Finds the existing direct conversation if one already exists.
- Creates a new conversation if one does not exist.

Successful response:

```json
{
  "id": "CONVERSATION_UUID",
  "peer_id": "USER_B_UUID"
}
```

Frontend equivalent:

```ts
const conversationId = await createConversation(user.id);
goMessages(conversationId);
```

This code is used by the message button in
`src/app/[locale]/(private)/profile/components/mainDetails.tsx`.

### List conversations

```http
GET /realtime/conversations
```

Successful response:

```json
[
  {
    "id": "CONVERSATION_UUID",
    "peer_id": "USER_B_UUID",
    "peer_username": "user_b",
    "unread_count": 0,
    "peer_last_read_message_id": null
  }
]
```

The frontend calls this from `ChatProvider` after the authenticated user is
available. The response is stored in the `conversations` state.

`peer_last_read_message_id` is the latest message the other participant has
read. The frontend uses it to show `Seen` on the sender's messages, including
after a page refresh.

The messages page converts each conversation into a `Contact` object for the
existing components.

### Load message history

```http
GET /realtime/conversations/{conversation_id}/messages
```

Optional query parameters:

```text
limit=50
before=MESSAGE_UUID
```

Successful response:

```json
{
  "items": [
    {
      "id": "MESSAGE_UUID",
      "conversation_id": "CONVERSATION_UUID",
      "sender_id": "USER_UUID",
      "body": "Hello",
      "created_at": "2026-10-27T22:00:00+00:00"
    }
  ],
  "next_cursor": null
}
```

The backend returns messages newest first. The frontend reverses the array
before displaying it so the oldest message appears at the top and the newest
message appears at the bottom.

### Read messages

The frontend sends read information through the WebSocket, not through an HTTP
endpoint. See the `read` frame below.

## 5. What is a WebSocket?

An HTTP request normally works like this:

1. Browser sends a request.
2. Backend sends a response.
3. The connection is finished.

A WebSocket keeps a connection open:

1. Browser connects once.
2. Backend keeps the connection open.
3. Either side can send messages at any time.
4. The connection closes when the user leaves, logs out, or the network fails.

The frontend connects to:

```text
ws://localhost:8000/ws
```

In production, HTTPS should use:

```text
wss://your-api-domain.example/ws
```

The WebSocket URL is built from `NEXT_PUBLIC_API_URL`.

## 6. WebSocket connection sequence

### Step 1: the frontend opens the socket

`ChatProvider` creates a browser WebSocket:

```ts
const socket = new WebSocket("ws://localhost:8000/ws");
```

The browser automatically includes the `session_id` cookie.

### Step 2: the backend checks the Origin

The backend only accepts origins listed in its CORS settings. During local
development, the frontend origin should be:

```text
http://localhost:3000
```

### Step 3: the backend accepts and authenticates

The backend sends a `ready` frame:

```json
{
  "type": "ready",
  "user_id": "USER_UUID",
  "username": "user_name"
}
```

### Step 4: the backend sends initial data

After `ready`, the backend can send:

- pending offline messages;
- undelivered notifications;
- the current notification count;
- the online contacts snapshot.

### Step 5: the frontend listens

The `socket.onmessage` callback in `chatContext.tsx` parses every JSON frame
and updates React state according to the frame's `type`.

## 7. WebSocket frames sent by the frontend

Every frame is JSON and has a `type`.

### Send a message: `message.send`

Frontend sends:

```json
{
  "type": "message.send",
  "conversation_id": "CONVERSATION_UUID",
  "body": "Hello!"
}
```

The backend validates:

- the conversation ID is a valid UUID;
- the sender belongs to the conversation;
- the body is between 1 and 500 characters after trimming.

There is no separate success response. The saved message comes back as a
`message.new` event.

Frontend code:

```ts
sendMessage(conversationId, messageInput)
```

### Mark messages as read: `read`

Frontend sends:

```json
{
  "type": "read",
  "conversation_id": "CONVERSATION_UUID",
  "message_id": "MESSAGE_UUID"
}
```

The backend updates the participant's
`last_read_message_id`. It also sends a read event to the other participant.
The frontend stores that event as `peer_last_read_message_id` and links it to
the corresponding sent messages.

Frontend code:

```ts
markRead(conversationId, messageId)
```

### Keep the connection alive: `ping`

The backend supports:

```json
{
  "type": "ping"
}
```

It responds with:

```json
{
  "type": "pong"
}
```

The current frontend does not need to send pings during normal use because the
backend's idle watchdog is the component responsible for closing an inactive
connection. If long periods of inactivity become a problem, a periodic ping
can be added to `ChatProvider`.

## 8. WebSocket frames sent by the backend

### `ready`

```json
{
  "type": "ready",
  "user_id": "USER_UUID",
  "username": "username"
}
```

This confirms that the socket was authenticated.

### `message.new`

```json
{
  "type": "message.new",
  "id": "MESSAGE_UUID",
  "conversation_id": "CONVERSATION_UUID",
  "sender_id": "USER_UUID",
  "body": "Hello!",
  "created_at": "2026-10-27T22:00:00+00:00"
}
```

Frontend behavior:

1. Checks whether the message already exists.
2. Adds it to the correct conversation.
3. The messages page converts it into the existing UI message shape.
4. React re-renders the conversation automatically.

### `conversation.new`

```json
{
  "type": "conversation.new",
  "id": "CONVERSATION_UUID",
  "peer_id": "USER_UUID",
  "peer_username": "username"
}
```

This is sent when the first message creates a new active conversation for the
participants. The frontend adds it to the conversation list if it is not
already there.

### `presence.snapshot`

```json
{
  "type": "presence.snapshot",
  "online": ["USER_UUID_1", "USER_UUID_2"]
}
```

This is sent when the user connects. It contains the IDs of contacts that are
currently online.

### `presence`

When a contact connects:

```json
{
  "type": "presence",
  "user_id": "USER_UUID",
  "online": true
}
```

When a contact disconnects:

```json
{
  "type": "presence",
  "user_id": "USER_UUID",
  "online": false
}
```

The frontend stores online IDs in `onlineUserIds`. The messages page compares a
conversation's `peer_id` with that list:

```ts
online: onlineUserIds.includes(conversation.peer_id)
```

The existing conversation component then displays the green dot and
`active-now` or `offline`.

### `notification`

The backend also sends notification events through the same socket:

```json
{
  "type": "notification",
  "id": "NOTIFICATION_UUID",
  "event_type": "follow",
  "actor_id": "USER_UUID",
  "actor_username": "username",
  "read_at": null,
  "created_at": "2026-10-27T22:00:00+00:00",
  "match_time": null
}
```

The notification system uses the same authenticated WebSocket, but it is
separate from chat state. Chat frames belong in `ChatProvider`; notification
frames should be handled by a notification provider or another dedicated
notification state owner.

### `notification.count`

```json
{
  "type": "notification.count",
  "unread_count": 3
}
```

This tells the frontend how many unread notifications exist.

### `error`

Example:

```json
{
  "type": "error",
  "reason": "conversation_not_found"
}
```

Common reasons:

- `invalid_json`
  - The client sent invalid JSON.
- `unknown_type`
  - The client sent an unsupported frame type.
- `invalid_frame`
  - Required fields are missing or invalid.
- `conversation_not_found`
  - The user is not a participant or the conversation does not exist.
- `frame_too_large`
  - The frame is larger than the backend limit.
- `rate_limited`
  - The client sent too many frames.
- `timed_out`
  - The user was temporarily timed out after repeated rate-limit violations.

## 9. Offline messages

If a participant is not connected when a message is sent:

1. The backend saves the message.
2. The backend creates a `PendingMessage` row for the offline user.
3. When that user connects later, `connection.py` sends the pending message.
4. The pending row is deleted after successful delivery.

This is why the frontend should always load message history through HTTP when a
conversation is opened. WebSocket events are for new live events, not a
replacement for history loading.

## 10. Reconnection

The frontend handles a closed socket in `ChatProvider`:

1. It sets `connected` to `false`.
2. It clears the socket reference.
3. It waits before reconnecting.
4. The delay increases up to ten seconds.
5. It creates a new WebSocket connection.

The delay is called exponential backoff:

```text
1 second
2 seconds
4 seconds
8 seconds
10 seconds maximum
```

When the connection succeeds, the retry counter resets.

## 11. Why state can disappear after refresh

React state lives in browser memory. A full browser refresh destroys that
memory.

For that reason:

- the authenticated user is restored with `GET /users/me`;
- conversations are loaded again with `GET /realtime/conversations`;
- messages are loaded again with
  `GET /realtime/conversations/{conversation_id}/messages`;
- the WebSocket is opened again for live events.

The database is the source of truth. React state is only a temporary display
cache.

## 12. How to test chat

### Preparation

1. Start PostgreSQL and the backend.
2. Start the frontend.
3. Create two user accounts.
4. Log in as User A and User B in separate browser profiles.
5. Make the users follow each other.

### Create a conversation

1. Open User B's profile while logged in as User A.
2. Click the existing chat icon.
3. The frontend calls `POST /realtime/conversations`.
4. The browser navigates to:

```text
/en/messages?conversation=<conversation-id>
```

### Test live messaging

1. Open the same conversation for both users.
2. Open browser DevTools.
3. Go to **Network** and filter by **WS**.
4. Confirm that `ws://localhost:8000/ws` is open.
5. Send a message from User A.
6. Confirm it appears for User A immediately.
7. Confirm it appears for User B without refreshing.

### Test offline delivery

1. Close User B's messages tab.
2. Send a message as User A.
3. Reopen User B's messages page.
4. Confirm the message appears after history/pending-message loading.

### Test presence

1. Keep both users in the same conversation.
2. Close User B's WebSocket page.
3. User A should see User B become offline.
4. Reopen User B's page.
5. User A should see User B become online.

## 13. Common errors

### `401 Not authenticated`

The browser does not have a valid `session_id` cookie.

Check that:

- the user is logged in;
- the frontend uses `withCredentials: true`;
- the backend is running on the expected port;
- the cookie has not expired.

### `403` when creating a conversation

The users do not follow each other in both directions.

Required:

```text
User A follows User B
User B follows User A
```

### WebSocket closes with `4001`

WebSocket authentication failed. Check the `session_id` cookie and login
state.

### WebSocket closes with `1008`

The backend rejected the browser Origin. Use `http://localhost:3000` and make
sure it is included in the backend CORS origins.

### Conversation URL exists but the list is empty

The frontend must load `/realtime/conversations`. Make sure:

- the user has been restored through `/users/me`;
- the browser is authenticated;
- the backend includes empty newly-created conversations;
- the frontend is using the same API URL as the backend.

### Messages appear only after refreshing

Check:

1. The WebSocket is open in DevTools.
2. The frontend sends a `message.send` frame.
3. The backend sends a `message.new` frame.
4. The frame's `conversation_id` matches the active conversation ID.

## 14. Simple mental model

Think of the system like this:

```text
Profile button
    |
    | HTTP POST /realtime/conversations
    v
Conversation exists in database
    |
    | HTTP GET /realtime/conversations
    v
Conversation list appears in React
    |
    | HTTP GET /realtime/conversations/{id}/messages
    v
Old messages appear
    |
    | WebSocket ws://localhost:8000/ws
    v
Live message.new and presence events
    |
    v
React state updates
    |
    v
Existing chat UI re-renders
```

HTTP is the reliable database read/write path. WebSocket is the live event
path. A complete chat implementation needs both.
