import { useEffect, useMemo, useRef, useState } from 'react'
import { realtimeApi } from '../api/endpoints'
import { BODY_MAX, useRealtime } from '../hooks/useRealtime'

export default function Thread({ conversation }) {
  const { messagesByConv, readReceiptsByConv, sendMessage, sendRead, conn, selfFromSocket } = useRealtime()
  const [body, setBody] = useState('')
  const [historyByConv, setHistoryByConv] = useState({})
  const [nextCursorByConv, setNextCursorByConv] = useState({})
  const [historyLoading, setHistoryLoading] = useState(false)
  const [olderLoading, setOlderLoading] = useState(false)
  const bottom = useRef(null)
  const sentReadRef = useRef(new Set())

  const convId = conversation ? conversation.id : null
  const messages = useMemo(() => {
    if (!convId) return []
    const combined = new Map()
    for (const message of [...(historyByConv[convId] || []), ...(messagesByConv[convId] || [])]) {
      combined.set(message.id, message)
    }
    return [...combined.values()].sort((a, b) =>
      Date.parse(a.created_at) - Date.parse(b.created_at) || a.id.localeCompare(b.id),
    )
  }, [convId, historyByConv, messagesByConv])

  useEffect(() => {
    if (!convId || !conn.ready || !messages.length) return
    const latest = messages[messages.length - 1]
    const key = `${conn.attempt}:${convId}:${latest.id}`
    if (sentReadRef.current.has(key)) return
    if (sendRead(convId, latest.id)) sentReadRef.current.add(key)
  }, [conn.ready, convId, messages, sendRead])

  useEffect(() => {
    if (!convId || !conn.ready) {
      setHistoryLoading(false)
      return
    }

    let cancelled = false
    setHistoryLoading(true)
    realtimeApi.listMessages(convId)
      .then(({ items, next_cursor: nextCursor }) => {
        if (cancelled) return
        setHistoryByConv((prev) => ({ ...prev, [convId]: [...items].reverse() }))
        setNextCursorByConv((prev) => ({ ...prev, [convId]: nextCursor }))
      })
      .catch(() => {}) // The API client already reports request failures.
      .finally(() => {
        if (!cancelled) setHistoryLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [convId, conn.ready])

  async function loadOlder() {
    const cursor = nextCursorByConv[convId]
    if (!cursor || olderLoading) return
    setOlderLoading(true)
    try {
      const { items, next_cursor: nextCursor } = await realtimeApi.listMessages(convId, {
        before: cursor,
      })
      const olderMessages = [...items].reverse()
      setHistoryByConv((prev) => {
        const existing = prev[convId] || []
        const knownIds = new Set(existing.map((message) => message.id))
        return {
          ...prev,
          [convId]: [...olderMessages.filter((message) => !knownIds.has(message.id)), ...existing],
        }
      })
      setNextCursorByConv((prev) => ({ ...prev, [convId]: nextCursor }))
    } catch {
      // The API client already reports request failures.
    } finally {
      setOlderLoading(false)
    }
  }

  useEffect(() => {
    if (bottom.current) bottom.current.scrollIntoView({ block: 'end' })
  }, [messages.length, convId])

  function submit(e) {
    e.preventDefault()
    const text = body.trim()
    if (!text || !convId) return
    // Nothing is appended locally: ws.py:64 fans the message back to every
    // participant including the sender, so the echo is the confirmation that it
    // reached Postgres. Appending here too would show it twice.
    if (sendMessage(convId, text)) setBody('')
  }

  if (!conversation) {
    return (
      <section className="panel thread">
        <h2>Thread</h2>
        <div className="body">
          <div className="empty">Pick a conversation on the left.</div>
        </div>
      </section>
    )
  }

  const selfId = selfFromSocket ? selfFromSocket.user_id : null
  const tooLong = body.trim().length > BODY_MAX
  const canSend = conn.ready && body.trim().length > 0 && !tooLong

  return (
    <section className="panel thread">
      <h2>
        {conversation.peer_username} · conv {String(conversation.id).slice(0, 8)}
      </h2>
      <div className="body">
        {nextCursorByConv[convId] ? (
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <button onClick={loadOlder} disabled={olderLoading}>
              {olderLoading ? 'Loading…' : 'Load older messages'}
            </button>
          </div>
        ) : null}
        {messages.length === 0 ? (
          <div className="empty">{historyLoading ? 'Loading messages…' : 'No messages yet.'}</div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`msg ${m.sender_id === selfId ? 'mine' : ''}`}>
              <div>{m.body}</div>
              <div className="meta">
                {m.sender_id === selfId ? 'me' : `sender ${String(m.sender_id).slice(0, 8)}`} ·{' '}
                {m.created_at} · id {String(m.id).slice(0, 8)}
                {m.sender_id === selfId && readReceiptsByConv[convId]?.[m.id]?.length
                  ? ` · seen by ${readReceiptsByConv[convId][m.id].map((id) => String(id).slice(0, 8)).join(', ')}`
                  : ''}
              </div>
            </div>
          ))
        )}
        <div ref={bottom} />
      </div>
      <div className="foot">
        <form className="composer" onSubmit={submit}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) submit(e)
            }}
            className={tooLong ? 'invalid' : ''}
            placeholder={conn.ready ? 'message… (Enter sends, Shift+Enter newline)' : 'socket is not ready'}
            aria-label="message body"
          />
          <button className="primary" type="submit" disabled={!canSend}>
            send
          </button>
        </form>
        <div className="meta" style={{ fontSize: 11, color: tooLong ? '#a00' : '#777' }}>
          {body.trim().length}/{BODY_MAX} — MessageSend rejects an empty body or more than {BODY_MAX}{' '}
          characters (realtime/schemas.py:8), which comes back as reason "invalid_frame".
        </div>
      </div>
    </section>
  )
}
