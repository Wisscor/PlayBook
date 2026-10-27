import { useRealtime } from '../hooks/useRealtime'

function notificationMessage(notification) {
  const actor = notification.actor_username || 'Someone'

  switch (notification.event_type) {
    case 'like':
      return `${actor} liked your post`
    case 'comment':
      return `${actor} commented on your post`
    case 'follow':
      return `${actor} started following you`
    default:
      return `${actor} sent you a ${notification.event_type || 'new'} notification`
  }
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString()
}

export default function Notifications() {
  const { notifications, notificationsUnread } = useRealtime()

  return (
    <section className="panel notifications">
      <h2>Notifications{notificationsUnread ? ` · ${notificationsUnread} new` : ''}</h2>
      <div className="body">
        {notifications.length === 0 ? (
          <div className="empty">No notifications received yet. New notifications appear here live.</div>
        ) : (
          notifications.map((notification, index) => (
            <div key={notification.id || `${notification.event_type}-${index}`} className="rowitem notification-item">
              <div className="notification-message">{notificationMessage(notification)}</div>
              <div className="meta">
                {formatDate(notification.created_at)}
                {notification.target_id ? ` · post ${notification.target_id.slice(0, 8)}` : ''}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
