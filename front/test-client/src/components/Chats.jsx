import { useEffect, useState } from 'react'
import { realtimeApi, usersApi } from '../api/endpoints'
import { useRealtime } from '../hooks/useRealtime'
import { useAuth } from '../hooks/useAuth'

export default function Chats({ conversations, loading, reload, onOpened, onCreated }) {
  const { activeConvId, openConversation, unreadByConv, onlineUserIds } = useRealtime()
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [creating, setCreating] = useState(null)
  const [followingIds, setFollowingIds] = useState(() => new Set())
  const [followBusy, setFollowBusy] = useState(null)

  useEffect(() => {
    if (!user?.id) return undefined
    let cancelled = false
    usersApi.following(user.id)
      .then((following) => {
        if (!cancelled) setFollowingIds(new Set(following.map((person) => person.id)))
      })
      .catch(() => {}) // The API client already reports request failures.
    return () => {
      cancelled = true
    }
  }, [user?.id])

  async function onSearch(e) {
    e.preventDefault()
    const q = query.trim()
    // GET /users declares search with min_length=1, so a blank query is a 422.
    if (!q) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      setResults(await usersApi.search(q))
    } catch {
      setResults([]) // already reported by the api client
    } finally {
      setSearching(false)
    }
  }

  async function onCreate(peer) {
    setCreating(peer.id)
    try {
      const conv = await realtimeApi.createConversation(peer.id)
      onCreated({ id: conv.id, peer_id: peer.id, peer_username: peer.username })
      openConversation(conv.id)
      onOpened()
      setResults(null)
      setQuery('')
    } catch {
      // 422 own id, 404 unknown user, 401 no session — all surfaced already.
    } finally {
      setCreating(null)
    }
  }

  async function onToggleFollow(peer) {
    const alreadyFollowing = followingIds.has(peer.id)
    setFollowBusy(peer.id)
    try {
      if (alreadyFollowing) await usersApi.unfollow(peer.id)
      else await usersApi.follow(peer.id)
      setFollowingIds((prev) => {
        const next = new Set(prev)
        if (alreadyFollowing) next.delete(peer.id)
        else next.add(peer.id)
        return next
      })
    } catch {
      // The API client reports errors; keep the displayed state unchanged.
    } finally {
      setFollowBusy(null)
    }
  }

  return (
    <section className="panel chats">
      <h2>Chats</h2>
      <div className="body">
        <form onSubmit={onSearch} style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="find a user…"
            aria-label="find a user"
          />
          <button type="submit" disabled={searching}>
            {searching ? '…' : 'find'}
          </button>
        </form>

        {results !== null ? (
          <div style={{ marginBottom: 10 }}>
            <div className="note">Follow each other before starting a conversation.</div>
            {results.length === 0 ? (
              <div className="empty">No users matched.</div>
            ) : (
              results.map((u) => (
                <div key={u.id} className="rowitem userresult">
                  <div>
                    <strong>{u.username}</strong>
                    <div className="meta">{u.id.slice(0, 8)}</div>
                  </div>
                  <div className="userresult-actions">
                    <button
                      onClick={() => onToggleFollow(u)}
                      disabled={followBusy === u.id}
                      aria-pressed={followingIds.has(u.id)}
                    >
                      {followBusy === u.id ? '…' : followingIds.has(u.id) ? 'Following' : 'Follow'}
                    </button>
                    <button
                      className="primary"
                      onClick={() => onCreate(u)}
                      disabled={creating === u.id}
                    >
                      {creating === u.id ? 'opening…' : 'Message'}
                    </button>
                  </div>
                </div>
              ))
            )}
            <button onClick={() => setResults(null)}>hide results</button>
          </div>
        ) : null}

        {loading && !conversations.length ? <div className="empty">Loading…</div> : null}
        {!loading && !conversations.length ? (
          <div className="empty">No conversations yet. Find a user above.</div>
        ) : null}

        {conversations.map((c) => {
          const unread = unreadByConv[c.id] ?? c.unread_count ?? 0
          return (
            <button
              key={c.id}
              className={`rowitem ${c.id === activeConvId ? 'active' : ''}`}
              onClick={() => {
                openConversation(c.id)
                onOpened()
              }}
            >
              <div>
                {c.peer_username}{' '}
                {onlineUserIds.has(c.peer_id) ? <span className="online">online</span> : null}{' '}
                {unread ? <span className="dot">● {unread}</span> : null}
              </div>
              <div className="meta">conv {String(c.id).slice(0, 8)} · peer {String(c.peer_id).slice(0, 8)}</div>
            </button>
          )
        })}
      </div>
      <div className="foot">
        <button onClick={reload} disabled={loading}>
          {loading ? 'refreshing…' : 'refresh list'}
        </button>
      </div>
    </section>
  )
}
