// Every endpoint this client knows about, with the backend file and line it was
// read from. If a call is not in this file, the client does not make it.

import { api } from './client'

export const authApi = {
  // routers/auth.py:31 — UserCreate; returns UserResponse. Sets NO cookie.
  signup: (body) => api.post('/auth/signup', body),

  // routers/auth.py:61 — {username_or_email, password}; sets the session cookie.
  login: (body) => api.post('/auth/login', body),

  // routers/auth.py:108 — deletes the session row and clears the cookie.
  logout: () => api.post('/auth/logout'),

  // routers/auth.py:147 — the session probe. 401 here just means "not logged in".
  me: (opts) => api.get('/auth/me', opts),
}

export const usersApi = {
  // routers/users.py:117 — GET /users?search=&limit=&offset=
  // `search` has min_length=1, so an empty string would be a 422. Callers must
  // not call this with a blank query; Chats.jsx guards it.
  // Note this route has no get_curr_user dependency, so it answers while logged out.
  search: (query, limit = 20) =>
    api.get(`/users?search=${encodeURIComponent(query)}&limit=${limit}`),

  following: (userId, limit = 100) =>
    api.get(`/users/${encodeURIComponent(userId)}/following?limit=${limit}`),
  follow: (userId) => api.post(`/users/${encodeURIComponent(userId)}/follow`),
  unfollow: (userId) => api.del(`/users/${encodeURIComponent(userId)}/follow`),
}

export const realtimeApi = {
  // realtime/rest.py — [{id, peer_id, peer_username, unread_count}, ...]
  listConversations: () => api.get('/realtime/conversations'),

  // realtime/rest.py:13 — {peer_id} -> {id, peer_id}
  // Declares no status_code, so success is 200, not 201.
  // 422 = peer_id is your own id; 404 = no such user; 401 = no session.
  createConversation: (peerId) => api.post('/realtime/conversations', { peer_id: peerId }),

  // Returns the newest page first; `before` is the previous page's next_cursor.
  listMessages: (conversationId, { limit = 50, before } = {}) => {
    const params = new URLSearchParams({ limit: String(limit) })
    if (before) params.set('before', before)
    return api.get(
      `/realtime/conversations/${encodeURIComponent(conversationId)}/messages?${params}`,
    )
  },

  listNotifications: ({ unreadOnly = false, limit = 100 } = {}) =>
    api.get(`/realtime/notifications?unread_only=${unreadOnly}&limit=${limit}`),
  markNotificationsRead: (notificationIds) =>
    api.post('/realtime/notifications/read', { notification_ids: notificationIds }),
}

// ---------------------------------------------------------------------------
// Protocol reminders: read receipts use WebSocket frames; conversation unread
// counts come from REST; notification counts are separate.
// ---------------------------------------------------------------------------
export const PROTOCOL_NOTES = {
  notificationsList: 'Notification list is available at GET /realtime/notifications.',
  unreadCounts: 'Conversation unread counts come from GET /realtime/conversations.',
  presence: 'Presence is delivered over the WebSocket.',
}
