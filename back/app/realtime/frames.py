# ── client → server ───────────────────────────────────────────
MESSAGE_SEND = "message.send"
READ = "read"
PING = "ping"                # client → server every 20s; the server answers PONG

# ── server → client ───────────────────────────────────────────
READY = "ready"
MESSAGE_NEW = "message.new"
CONVERSATION_NEW = "conversation.new"  # sent with the first message in the conversation
PRESENCE = "presence"
PRESENCE_SNAPSHOT = "presence.snapshot"  # which contacts are online, on connect
NOTIFICATION = "notification"
NOTIFICATION_COUNT = "notification.count"  # unread badge count update
ERROR = "error"              # {"type": "error", "reason": "..."}; the socket stays open
PONG = "pong"                # server → client, only ever a reply to PING

# ── close codes (4000-4999 is the application-defined range) ──
CLOSE_AUTH_FAILED = 4001     # no cookie, unknown session, or expired
CLOSE_RATE_LIMIT = 4002      # repeated rate_limited violations (not a dead heartbeat)
CLOSE_SESSION_ENDED = 4003   # you logged out while connected, or the session expired
CLOSE_IDLE_TIMEOUT = 4004    # no frame from the client for 45s