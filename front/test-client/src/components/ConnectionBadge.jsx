import { useRealtime } from '../hooks/useRealtime'

// connecting / open / closed, with the close code and reason. "open" and
// "ready" are shown apart because ws.py accepts the socket before it
// authenticates, so being open is not yet proof of a valid session.
export default function ConnectionBadge() {
  const { conn, retryNow } = useRealtime()

  let cls = conn.phase
  let text = conn.phase
  if (conn.phase === 'open' && conn.ready) {
    cls = 'ready'
    text = 'open · ready'
  } else if (conn.phase === 'open') {
    text = 'open · awaiting ready'
  } else if (conn.phase === 'connecting') {
    text = conn.attempt > 0 ? `connecting (retry ${conn.attempt})` : 'connecting'
  } else if (conn.phase === 'closed') {
    text = `closed · ${conn.describe || conn.code || 'no code'}`
  }

  return (
    <>
      <span className={`conn ${cls}`} title={conn.describe || ''}>
        {text}
      </span>
      {conn.retryInMs ? (
        <span className="who">retrying in {Math.round(conn.retryInMs / 1000)}s</span>
      ) : null}
      {conn.phase === 'closed' || conn.phase === 'idle' ? (
        <button onClick={retryNow}>reconnect now</button>
      ) : null}
    </>
  )
}
