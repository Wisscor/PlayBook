import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useRealtime } from '../hooks/useRealtime'
import Chats from '../components/Chats'
import Thread from '../components/Thread'
import Notifications from '../components/Notifications'
import DebugDrawer from '../components/DebugDrawer'
import ConnectionBadge from '../components/ConnectionBadge'

export default function AppPage() {
  const { user, logout } = useAuth()
  const {
    activeConvId,
    conversations,
    conversationsLoading: loading,
    reloadConversations: reload,
    notificationsUnread,
    loadNotifications,
  } = useRealtime()

  const [createdConversation, setCreatedConversation] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showDrawer, setShowDrawer] = useState(true)

  const active = conversations.find((c) => c.id === activeConvId)
    || (createdConversation?.id === activeConvId ? createdConversation : null)

  function toggleBell() {
    const opening = !showNotifications
    setShowNotifications(opening)
    if (opening) loadNotifications().catch(() => {})
  }

  return (
    <div className="shell">
      <div className="topbar">
        <strong>{user ? user.username : '—'}</strong>
        <span className="who">{user ? user.id : ''}</span>
        <ConnectionBadge />
        <span className="spacer" />
        <button onClick={toggleBell}>
          bell {notificationsUnread ? <span className="badge">{notificationsUnread}</span> : null}
        </button>
        <button onClick={() => setShowDrawer((v) => !v)}>{showDrawer ? 'hide debug' : 'show debug'}</button>
        <button className="danger" onClick={logout}>
          log out
        </button>
      </div>

      <div className="panels">
        <Chats
          conversations={conversations}
          loading={loading}
          reload={reload}
          onCreated={setCreatedConversation}
          onOpened={() => setShowNotifications(false)}
        />
        <Thread conversation={active} />
        {showNotifications ? <Notifications /> : null}
      </div>

      {showDrawer ? <DebugDrawer /> : null}
    </div>
  )
}
