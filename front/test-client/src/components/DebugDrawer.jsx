import { useState } from 'react'
import { clearEntries, useEntries } from '../lib/log'
import { useRealtime } from '../hooks/useRealtime'
import { PING, READ } from '../lib/protocol'

const FILTERS = [
  ['ws', 'frames'],
  ['http', 'http'],
  ['event', 'events'],
]

export default function DebugDrawer() {
  const entries = useEntries()
  const { activeConvId, messagesByConv, sendRaw } = useRealtime()
  const [show, setShow] = useState({ ws: true, http: true, event: true })
  const [raw, setRaw] = useState('{"type":"ping"}')
  const [rawErr, setRawErr] = useState(null)

  const visible = entries.filter((e) => {
    if (e.direction === 'http') return show.http
    if (e.direction === 'event') return show.event
    return show.ws
  })

  const activeMessages = messagesByConv[activeConvId] || []
  const latestMessage = activeMessages[activeMessages.length - 1]

  function sendRawFrame(e) {
    e.preventDefault()
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch (cause) {
      setRawErr(String(cause))
      return
    }
    setRawErr(null)
    sendRaw(parsed)
  }

  return (
    <div className="drawer">
      <div className="head">
        <strong>Debug</strong>
        <span>{visible.length} shown / {entries.length} kept</span>
        {FILTERS.map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={show[key]}
              onChange={(e) => setShow((s) => ({ ...s, [key]: e.target.checked }))}
            />
            {label}
          </label>
        ))}
        <span className="spacer" />
        <button onClick={clearEntries}>clear</button>
      </div>

      <div className="list">
        {visible.length === 0 ? (
          <div className="empty">Nothing logged yet.</div>
        ) : (
          visible.map((e) => (
            <div key={e.id} className={`entry ${e.direction} ${e.error ? 'err' : ''}`}>
              <span className="ts">{e.at}</span>
              <span className="dir">{e.label}</span>
              <pre>{JSON.stringify(e.payload)}</pre>
            </div>
          ))
        )}
      </div>

        {/* Hand-sending frames lets the client exercise protocol validation directly. */}
      <form className="rawsend" onSubmit={sendRawFrame}>
        <input value={raw} onChange={(e) => setRaw(e.target.value)} aria-label="raw frame JSON" />
        <button type="submit">send raw</button>
        <button type="button" onClick={() => setRaw(JSON.stringify({ type: PING }))}>
          ping
        </button>
        <button
          type="button"
          disabled={!activeConvId || !latestMessage}
          title="Select a conversation that has received a live message first"
          onClick={() => setRaw(JSON.stringify({
            type: READ,
            conversation_id: activeConvId,
            message_id: latestMessage.id,
          }))}
        >
          read latest live
        </button>
        <button type="button" onClick={() => setRaw('not json')}>
          bad json
        </button>
        {rawErr ? <span style={{ color: '#a00', fontSize: 11 }}>{rawErr}</span> : null}
      </form>
    </div>
  )
}
