// Transcribed from back/app/realtime/frames.py. Nothing here is invented.
//
// The declarations are mirrored from frames.py; some may be reserved for
// later protocol work and are listed separately when not currently emitted.

/* ---------- client -> server ---------- */

// Handled by ws.py.
export const MESSAGE_SEND = 'message.send'

// READ advances the participant cursor and broadcasts a receipt to peers.
// PING is declared but currently unhandled by the backend.
export const READ = 'read'
export const PING = 'ping'

export const UNHANDLED_OUTBOUND = [PING]

/* ---------- server -> client ---------- */

// Emitted by the current ws.py.
export const READY = 'ready' // ws.py:29
export const MESSAGE_NEW = 'message.new' // ws.py:57
export const CONVERSATION_NEW = 'conversation.new' // emitted before the first message.new
export const ERROR = 'error' // ws.py:14, via _reject()

// Emitted by ws.py after connecting and when a contact's online state changes.
export const PRESENCE = 'presence'
export const PRESENCE_SNAPSHOT = 'presence.snapshot'

// Declared in frames.py, but not emitted by the current ws.py.
export const NOTIFICATION = 'notification'
export const NOTIFICATION_COUNT = 'notification.count'
export const PONG = 'pong'

export const NOT_YET_EMITTED = [PONG]

/* ---------- error frame reasons ---------- */

// Error reasons returned by the backend.
export const ERROR_REASONS = {
  invalid_json: {
    title: 'Malformed JSON',
    hint: 'The server could not parse the text as JSON (ws.py:40). The socket stays open.',
  },
  unknown_type: {
    title: 'Unknown frame type',
    hint: 'ws.py has no case for that "type". Supported client frames include "message.send" and "read".',
  },
  invalid_frame: {
    title: 'Frame failed validation',
    hint: 'The frame schema rejected it. Check UUID fields and required message fields.',
  },
  conversation_not_found: {
    title: 'Not a participant in that conversation',
    hint: 'The conversation or message could not be found for your account.',
  },
}

export function describeReason(reason) {
  const known = ERROR_REASONS[reason]
  if (known) return { ...known, known: true, reason }
  return {
    title: 'Unrecognised error reason',
    hint: 'This string is not one of the four in ws.py. The backend has changed since this client was written.',
    known: false,
    reason,
  }
}

/* ---------- close codes ---------- */

// frames.py:16-19 plus the RFC 6455 codes a browser can produce on its own.
export const CLOSE_CODES = {
  1000: { label: 'Normal closure', emitted: true },
  1001: { label: 'Going away (tab closing or navigating)', emitted: true },
  1005: { label: 'No status received', emitted: true },
  1006: {
    label: 'Abnormal closure — connection dropped without a close frame',
    emitted: true,
  },
  1011: { label: 'Server internal error', emitted: true },
  4001: {
    label: 'Auth failed — no cookie, unknown session, or expired',
    emitted: true, // ws_auth.py:20,26,32,36,42
  },
  4002: {
    label: 'Rate limit',
    emitted: false, // declared in frames.py:17, nothing closes with it yet
  },
  4003: {
    label: 'Session ended — logged out or expired while connected',
    emitted: true, // emitted by auth logout when all user sockets are closed
  },
  4004: {
    label: 'Idle timeout',
    emitted: false, // declared in frames.py:19, no idle watchdog exists yet
  },
}

export function describeClose(code, reason) {
  const known = CLOSE_CODES[code]
  const label = known ? known.label : 'Unknown close code'
  const suffix = known && known.emitted === false ? ' (declared in frames.py, not emitted by the current backend)' : ''
  return reason ? `${code} ${label}${suffix} — "${reason}"` : `${code} ${label}${suffix}`
}

// A close with one of these is an authentication verdict, not a transport
// glitch. Retrying it would spin forever, so the client goes to /login instead.
export const AUTH_CLOSE_CODES = new Set([4001, 4003])
