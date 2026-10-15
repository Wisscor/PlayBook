# Realtime protocol

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
