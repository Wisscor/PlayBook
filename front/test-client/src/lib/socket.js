// WebSocket lifecycle, kept as a plain object outside React.
//
// Why not inside a component: a React 18 remount (StrictMode, or any fast
// re-render of the provider) would open a second socket and then close the
// first one while it is still CONNECTING, which Chrome reports as
// "WebSocket is closed before the connection is established." That warning is
// noise in the console, and the brief asks for a clean console. Owning the
// socket here, and deferring a close until after onopen, removes it.

import { logFrame, logEvent, pushToast } from './log'
import { describeClose, AUTH_CLOSE_CODES, PING, READY } from './protocol'

const BACKOFF_MS = [1000, 2000, 4000, 8000, 16000, 30000]
const HEARTBEAT_MS = 20000

// Always same-origin, so the socket follows whichever host the page was loaded
// from. That is what makes localhost and 127.0.0.1 two separate sessions.
// vite.config.js proxies /ws to the backend with ws:true.
export function wsUrl() {
  const scheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${scheme}//${window.location.host}/ws`
}

export function createSocket({ onFrame, onState, onAuthFailure }) {
  let ws = null
  let timer = null
  let heartbeatTimer = null
  let attempt = 0
  let stopped = false // a deliberate stop: logout, or leaving /app
  let closeWhenOpen = false // stop() arrived while still CONNECTING

  let state = {
    phase: 'idle', // idle | connecting | open | closed
    ready: false, // true once the server's "ready" frame lands
    code: null,
    reason: null,
    describe: null,
    attempt: 0,
    retryInMs: null,
  }

  function setState(patch) {
    state = { ...state, ...patch }
    onState(state)
  }

  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function clearHeartbeat() {
    if (heartbeatTimer !== null) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  function connect() {
    stopped = false
    closeWhenOpen = false
    clearTimer()
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return

    const url = wsUrl()
    setState({ phase: 'connecting', ready: false, code: null, reason: null, describe: null, retryInMs: null })
    logEvent('ws connecting', { url, attempt })

    ws = new WebSocket(url)

    ws.onopen = () => {
      if (closeWhenOpen) {
        // A stop() was requested before the handshake finished. Close now that
        // closing is legal, and do not report an open state that is about to end.
        closeWhenOpen = false
        ws.close(1000, 'client stop')
        return
      }
      // ws.py calls accept() BEFORE authenticating, so "open" is not proof of a
      // valid session. Authentication is confirmed only by the "ready" frame,
      // or denied by a 4001 close a moment later.
      setState({ phase: 'open', ready: false })
      logEvent('ws open', { note: 'accepted; waiting for the ready frame (auth is not confirmed yet)' })
      heartbeatTimer = setInterval(() => {
        if (!ws || ws.readyState !== WebSocket.OPEN) return
        const frame = { type: PING }
        ws.send(JSON.stringify(frame))
        logFrame('out', frame, { label: 'out heartbeat' })
      }, HEARTBEAT_MS)
    }

    ws.onmessage = (event) => {
      let frame
      try {
        frame = JSON.parse(event.data)
      } catch (cause) {
        logFrame('in', { unparseable: String(event.data), error: String(cause) }, { error: true, label: 'in bad' })
        pushToast({
          title: 'Server sent text that is not JSON',
          detail: 'Logged in the debug drawer verbatim.',
          payload: String(event.data),
        })
        return
      }
      logFrame('in', frame, { label: 'in' })
      if (frame && frame.type === READY) {
        attempt = 0 // only a confirmed, authenticated connection resets backoff
        setState({ ready: true, attempt: 0 })
      }
      onFrame(frame)
    }

    ws.onerror = () => {
      // The browser deliberately withholds detail here to avoid leaking
      // cross-origin information. The close event that follows carries the code.
      logEvent('ws error', {
        note: 'The browser reports no detail for socket errors by design. See the close entry below for the code.',
      })
    }

    ws.onclose = (event) => {
      clearHeartbeat()
      const describe = describeClose(event.code, event.reason)
      logEvent('ws close', {
        code: event.code,
        reason: event.reason || null,
        wasClean: event.wasClean,
        meaning: describe,
      })
      ws = null

      if (stopped) {
        setState({ phase: 'idle', ready: false, code: event.code, reason: event.reason || null, describe, retryInMs: null })
        return
      }

      setState({ phase: 'closed', ready: false, code: event.code, reason: event.reason || null, describe })

      if (AUTH_CLOSE_CODES.has(event.code)) {
        // Reconnecting would fail identically forever. Hand it to the caller,
        // which sends the user to /login.
        pushToast({ title: 'Socket closed by authentication', detail: describe, payload: { code: event.code, reason: event.reason || null } })
        onAuthFailure(event.code, describe)
        return
      }

      pushToast({ title: 'Socket closed unexpectedly', detail: describe, payload: { code: event.code, reason: event.reason || null } })
      scheduleReconnect()
    }
  }

  function scheduleReconnect() {
    const delay = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)]
    attempt += 1
    setState({ attempt, retryInMs: delay })
    logEvent('ws reconnect scheduled', { inMs: delay, attempt })
    clearTimer()
    timer = setTimeout(connect, delay)
  }

  function retryNow() {
    attempt = 0
    clearTimer()
    connect()
  }

  function send(frame) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      logFrame('out', { refused: 'socket is not open', phase: state.phase, frame }, { error: true, label: 'out blocked' })
      pushToast({
        title: 'Not sent — socket is not open',
        detail: `Connection state is "${state.phase}".`,
        payload: frame,
      })
      return false
    }
    ws.send(JSON.stringify(frame))
    logFrame('out', frame, { label: 'out' })
    return true
  }

  // reason is recorded in the drawer so a deliberate close is never mistaken
  // for a dropped connection when reading the log later.
  function stop(reason = 'client stop') {
    stopped = true
    clearTimer()
    setState({ retryInMs: null })
    logEvent('ws stop requested', { reason })
    if (!ws) {
      setState({ phase: 'idle', ready: false })
      return
    }
    if (ws.readyState === WebSocket.CONNECTING) {
      closeWhenOpen = true // see the comment at the top of this file
      return
    }
    if (ws.readyState === WebSocket.OPEN) ws.close(1000, reason)
  }

  return { connect, send, stop, retryNow, getState: () => state }
}
