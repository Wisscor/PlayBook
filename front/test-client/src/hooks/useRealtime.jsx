import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createSocket } from '../lib/socket'
import { logEvent, pushToast } from '../lib/log'
import { realtimeApi } from '../api/endpoints'
import { useAuth } from './useAuth'
import {
  CONVERSATION_NEW,
  ERROR,
  MESSAGE_NEW,
  MESSAGE_SEND,
  NOTIFICATION,
  NOTIFICATION_COUNT,
  PONG,
  PRESENCE,
  PRESENCE_SNAPSHOT,
  READ,
  READY,
  describeReason,
} from '../lib/protocol'

const RealtimeContext = createContext(null)

// body is validated server-side by MessageSend (realtime/schemas.py:8):
// min_length=1, max_length=2000 after whitespace stripping.
export const BODY_MAX = 2000

export function RealtimeProvider({ children }) {
  const { registerPreLogout, sessionLost } = useAuth()

  const [conn, setConn] = useState({ phase: 'idle', ready: false, code: null, reason: null, describe: null, attempt: 0, retryInMs: null })
  const [conversations, setConversations] = useState([])
  const [conversationsLoading, setConversationsLoading] = useState(true)
  const [messagesByConv, setMessagesByConv] = useState({})
  const [unreadByConv, setUnreadByConv] = useState({})
  const [readReceiptsByConv, setReadReceiptsByConv] = useState({})
  const [notifications, setNotifications] = useState([])
  const [notificationsUnread, setNotificationsUnread] = useState(0)
  const [onlineUserIds, setOnlineUserIds] = useState(() => new Set())
  const [activeConvId, setActiveConvId] = useState(null)
  const [selfFromSocket, setSelfFromSocket] = useState(null)

  // The frame handler is created once, so it reads the active conversation
  // through a ref rather than closing over a stale value.
  const activeRef = useRef(null)
  useEffect(() => {
    activeRef.current = activeConvId
  }, [activeConvId])

  const socketRef = useRef(null)
  const conversationsRef = useRef([])
  const reloadPromiseRef = useRef(null)
  const unknownConversationRefreshesRef = useRef(new Set())
  const notificationIdsRef = useRef(new Set())
  const selfIdRef = useRef(null)

  useEffect(() => {
    selfIdRef.current = selfFromSocket?.user_id || null
  }, [selfFromSocket])

  const reloadConversations = useCallback(() => {
    if (reloadPromiseRef.current) return reloadPromiseRef.current
    setConversationsLoading(true)
    reloadPromiseRef.current = realtimeApi.listConversations()
      .then((rows) => {
        const fetchedIds = new Set(rows.map((conversation) => conversation.id))
        const liveRows = conversationsRef.current.filter(
          (conversation) => !fetchedIds.has(conversation.id),
        )
        const merged = [...liveRows, ...rows]
        conversationsRef.current = merged
        setConversations(merged)
        setUnreadByConv(Object.fromEntries(
          rows.map((conversation) => [conversation.id, conversation.unread_count || 0]),
        ))
        return merged
      })
      .catch(() => conversationsRef.current)
      .finally(() => {
        reloadPromiseRef.current = null
        setConversationsLoading(false)
      })
    return reloadPromiseRef.current
  }, [])

  useEffect(() => {
    reloadConversations().catch(() => {})
  }, [reloadConversations])

  const handleFrame = useCallback((frame) => {
    const type = frame && typeof frame === 'object' ? frame.type : undefined

    switch (type) {
      case READY:
        setSelfFromSocket({ user_id: frame.user_id, username: frame.username })
        return

      case CONVERSATION_NEW: {
        const exists = conversationsRef.current.some((conversation) => conversation.id === frame.id)
        if (!exists) {
          const next = [
            { id: frame.id, peer_id: frame.peer_id, peer_username: frame.peer_username, unread_count: 0 },
            ...conversationsRef.current,
          ]
          conversationsRef.current = next
          setConversations(next)
        }
        return
      }

      case MESSAGE_NEW: {
        const convId = frame.conversation_id
        if (
          !conversationsRef.current.some((conversation) => conversation.id === convId)
          && !unknownConversationRefreshesRef.current.has(convId)
        ) {
          unknownConversationRefreshesRef.current.add(convId)
          reloadConversations().catch(() => {})
        }
        setMessagesByConv((prev) => {
          const existing = prev[convId] || []
          // ws.py:64 fans out to every participant including the sender, so the
          // sender's own message arrives here too. Nothing is appended
          // optimistically, and ids are checked, so a message cannot double up.
          if (existing.some((m) => m.id === frame.id)) return prev
          return { ...prev, [convId]: [...existing, frame] }
        })
        if (convId !== activeRef.current) {
          if (frame.sender_id !== selfIdRef.current) {
            setUnreadByConv((prev) => ({ ...prev, [convId]: (prev[convId] || 0) + 1 }))
          }
        }
        return
      }

      case READ:
        setReadReceiptsByConv((prev) => {
          const current = prev[frame.conversation_id] || {}
          const readers = new Set(current[frame.message_id] || [])
          readers.add(frame.user_id)
          return {
            ...prev,
            [frame.conversation_id]: {
              ...current,
              [frame.message_id]: [...readers],
            },
          }
        })
        return

      case PRESENCE:
        setOnlineUserIds((prev) => {
          const next = new Set(prev)
          if (frame.online) next.add(frame.user_id)
          else next.delete(frame.user_id)
          return next
        })
        return

      case PRESENCE_SNAPSHOT:
        setOnlineUserIds(new Set(frame.online || []))
        return

      case ERROR: {
        const described = describeReason(frame.reason)
        pushToast({
          title: described.title,
          detail: `${described.hint}  [reason: ${described.reason}]`,
          payload: frame,
        })
        return
      }

      case NOTIFICATION:
        if (frame.id && notificationIdsRef.current.has(frame.id)) return
        if (frame.id) notificationIdsRef.current.add(frame.id)
        setNotifications((prev) => [frame, ...prev])
        setNotificationsUnread((n) => n + 1)
        return

      case NOTIFICATION_COUNT:
        setNotificationsUnread(Number.isInteger(frame.unread_count) ? frame.unread_count : 0)
        return

      case PONG:
        // Declared in frames.py but nothing in the current ws.py emits them.
        // If one ever arrives it is already in the drawer; this makes it loud.
        logEvent('frame type declared but not expected yet', { type, frame })
        pushToast({ title: `Received "${type}"`, detail: 'The backend did not emit this before. See the drawer.', payload: frame, level: 'info' })
        return

      default:
        pushToast({
          title: 'Unrecognised frame',
          detail: type === undefined ? 'The frame has no "type" field.' : `No handler for type "${type}".`,
          payload: frame,
        })
    }
  }, [reloadConversations])

  const handleAuthFailure = useCallback((code, describe) => {
    sessionLost(`socket closed ${code}: ${describe}`)
  }, [sessionLost])

  // One socket for the lifetime of this provider, which is mounted only inside
  // the authenticated area.
  useEffect(() => {
    const socket = createSocket({
      onFrame: handleFrame,
      onState: setConn,
      onAuthFailure: handleAuthFailure,
    })
    socketRef.current = socket
    socket.connect()
    return () => {
      socket.stop('leaving the app view')
      socketRef.current = null
    }
  }, [handleFrame, handleAuthFailure])

  // Closing the socket deliberately before the logout request means the close
  // is never mistaken for a dropped connection, so no reconnect is attempted.
  useEffect(() => {
    return registerPreLogout(() => {
      if (socketRef.current) socketRef.current.stop('logout')
    })
  }, [registerPreLogout])

  const sendMessage = useCallback((conversationId, body) => {
    if (!socketRef.current) return false
    return socketRef.current.send({ type: MESSAGE_SEND, conversation_id: conversationId, body })
  }, [])

  const sendRead = useCallback((conversationId, messageId) => {
    if (!socketRef.current) return false
    return socketRef.current.send({
      type: READ,
      conversation_id: conversationId,
      message_id: messageId,
    })
  }, [])

  const sendRaw = useCallback((frame) => {
    if (!socketRef.current) return false
    return socketRef.current.send(frame)
  }, [])

  const loadNotifications = useCallback(async () => {
    const result = await realtimeApi.listNotifications()
    const items = result.items || []
    for (const notification of items) {
      if (notification.id) notificationIdsRef.current.add(notification.id)
    }
    setNotifications((prev) => {
      const byId = new Map(prev.map((notification) => [notification.id, notification]))
      for (const notification of items) byId.set(notification.id, notification)
      return [...byId.values()].sort(
        (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
      )
    })
    setNotificationsUnread(Number.isInteger(result.unread_count) ? result.unread_count : 0)

    const unreadIds = items
      .filter((notification) => !notification.read_at)
      .map((notification) => notification.id)
      .filter(Boolean)
    if (unreadIds.length) {
      const updated = await realtimeApi.markNotificationsRead(unreadIds)
      const readAt = new Date().toISOString()
      const unreadSet = new Set(unreadIds)
      setNotifications((prev) => prev.map((notification) => (
        unreadSet.has(notification.id) ? { ...notification, read_at: readAt } : notification
      )))
      setNotificationsUnread(
        Number.isInteger(updated.unread_count) ? updated.unread_count : 0,
      )
    }
  }, [])

  const retryNow = useCallback(() => {
    if (socketRef.current) socketRef.current.retryNow()
  }, [])

  const openConversation = useCallback((convId) => {
    setActiveConvId(convId)
    setUnreadByConv((prev) => {
      if (!prev[convId]) return prev
      const next = { ...prev }
      delete next[convId]
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      conn,
      conversations,
      conversationsLoading,
      messagesByConv,
      unreadByConv,
      readReceiptsByConv,
      notifications,
      notificationsUnread,
      loadNotifications,
      onlineUserIds,
      activeConvId,
      selfFromSocket,
      openConversation,
      reloadConversations,
      sendMessage,
      sendRead,
      sendRaw,
      retryNow,
    }),
    [
      conn,
      conversations,
      conversationsLoading,
      messagesByConv,
      unreadByConv,
      readReceiptsByConv,
      notifications,
      notificationsUnread,
      loadNotifications,
      onlineUserIds,
      activeConvId,
      selfFromSocket,
      openConversation,
      reloadConversations,
      sendMessage,
      sendRead,
      sendRaw,
      retryNow,
    ],
  )

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext)
  if (!ctx) throw new Error('useRealtime must be used inside <RealtimeProvider>')
  return ctx
}
