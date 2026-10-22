# Frontend notification guide

This guide documents how to receive, display, and mark notifications as read in PlayBook. Notification data is available through both the WebSocket and HTTP API.

## Quick rules

- Use `event_type` to decide what happened. Keep the value as a string; render known values to friendly text.
- `match_time` is an ISO-8601 timestamp for match-related notifications and `null` for other notification types.
- `target_id` identifies the related match when present. It is currently not included in notification responses, so use the existing API/data to navigate to match details if needed.
- A WebSocket notification is a live delivery, not an acknowledgement that the user read it. Notifications remain stored until explicitly marked read.
- Fetch notifications over HTTP on app startup/reconnect. WebSocket frames provide live updates while connected.

## Notification payload

The REST endpoint and WebSocket frame share these fields:

```json
{
  "id": "notification-uuid",
  "event_type": "match_cancelled",
  "actor_id": "organizer-uuid",
  "actor_username": "alex",
  "read_at": null,
  "created_at": "2026-10-22T16:05:00+00:00",
  "match_time": "2026-10-23T18:30:00+00:00"
}
```

The WebSocket version adds `"type": "notification"`. `match_time` is `null` for non-match events, such as `follow`.

### Current event types

| `event_type` | Meaning | Recipient |
| --- | --- | --- |
| `follow` | Someone followed the user | Followed user |
| `play_request` | Someone requested to join a match | Match organizer |
| `play_request_accepted` | Organizer accepted the request | Request sender |
| `play_request_rejected` | Organizer declined the request | Request sender |
| `match_updated` | Match details changed | Users with pending or accepted requests |
| `match_cancelled` | Organizer deleted/cancelled the match | Users with pending or accepted requests |

A match event includes the match start timestamp as it existed when the notification was created. Format it in the user's locale/time zone in the UI; don't assume that the API's timestamp is already local time or append a second AM/PM suffix. For example, a localized `18:30` can be rendered as “Match cancelled — today at 6:30 PM.”

## WebSocket: live notifications

Connect to `/ws` using the authenticated `session_id` cookie. Browsers attach eligible cookies automatically; for cross-origin deployments, the cookie's domain, `SameSite`, and `Secure` settings must permit it, and the backend must allow the frontend origin. The WebSocket endpoint does not accept a token in the frame payload.

When connected, listen for JSON frames where `type` is `notification`:

```json
{
  "type": "notification",
  "id": "notification-uuid",
  "event_type": "match_updated",
  "actor_id": "organizer-uuid",
  "actor_username": "alex",
  "read_at": null,
  "created_at": "2026-10-22T16:05:00+00:00",
  "match_time": "2026-10-23T18:30:00+00:00"
}
```

Also handle `type: "notification.count"`, which contains `unread_count`. The server sends this count during connection setup after flushing undelivered notifications. Update the UI using the `notification` frame immediately; optionally refresh the REST list for authoritative state.

## HTTP: initial load and refresh

`GET /realtime/notifications?unread_only=false&limit=30` returns the user's notifications, newest first:

```json
{
  "items": [
    {
      "id": "notification-uuid",
      "event_type": "match_cancelled",
      "actor_id": "organizer-uuid",
      "actor_username": "alex",
      "read_at": null,
      "created_at": "2026-10-22T16:05:00+00:00",
      "match_time": "2026-10-23T18:30:00+00:00"
    }
  ],
  "unread_count": 1
}
```

Use `unread_only=true` to request unread items. The endpoint requires the user's normal authenticated session.

## Marking notifications read

Send the notification UUIDs the user has read to `POST /realtime/notifications/read`:

```json
{
  "notification_ids": ["notification-uuid"]
}
```

The response is:

```json
{"unread_count": 0}
```

Update local `read_at` state after a successful response and use the returned count for the badge. Only notifications belonging to the signed-in user are marked read.

## Offline users, reconnects, and duplicates

- Notifications are written to the database before live delivery is attempted. If a user is offline, they can still load the notification over HTTP, and undelivered notifications are sent over WebSocket when they reconnect.
- `delivered_at` and `read_at` are different: delivery means the server sent the notification; read means the user marked it read.
- The server suppresses an unread duplicate with the same recipient, actor, event type, and target ID. Different matches have different target IDs, so their notifications remain distinct.
- Repeated unread updates for the *same* match and event type can be deduplicated. The client should not assume that every individual edit creates a separate notification.
- An update followed by a cancellation has different event types, so both notifications can appear. The cancellation is the final/current state; the older update item may still be unread.

## Database setup for match time

New databases get the nullable `match_time` column from the SQLAlchemy model. `Base.metadata.create_all()` does not alter existing tables; an existing database must have the column provisioned separately before running this version of the API.

## Suggested UI handling

1. Load the notification list and unread count on startup.
2. Open the authenticated `/ws` connection and append/deduplicate incoming `notification` frames by notification `id`.
3. On `notification.count`, update the unread badge.
4. Render `event_type` using a mapping and format `match_time` with `Intl.DateTimeFormat` (or the framework's locale/date utilities); gracefully handle `null`.
5. When the user opens/dismisses notifications according to product behavior, mark those IDs read through the HTTP endpoint.
6. On reconnect, refetch the REST list so no notification is missed during a disconnected period.
