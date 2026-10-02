# Realtime protocol

## `conversation.new`

- Direction: server → client
- Payload: `{ "type": "conversation.new", "id": "<conversation_id>", "peer_id": "<other_user_id>", "peer_username": "<other_username>" }`
- Sent to every conversation participant when the first message is stored, immediately before that message's `message.new` frame. The peer fields are personalized for each recipient.
- Creating an empty conversation does not emit this frame. The sender's normal conversation list includes the thread after it has a message.
