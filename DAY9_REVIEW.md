# Day 9 review — checked against the code that is actually on `Realtime-Dev`

Reviewed: Oct 2, 2026. Source: your uploaded `REALTIME_PLAN(1).md` (2,266 lines), Day 9 at lines 1491–1886.
Repo checked at commit `ddcbdb3 Add realtime message broadcast`, branch `Realtime-Dev`, **1 commit ahead of origin — push it.**

Everything below was read out of your files, not assumed. Line numbers in `plan:NNNN` form refer to the uploaded plan; line numbers in `file.py:NN` form refer to your repo.

---

## First, the part that is good

You edited this section yourself, so it is worth naming what you got right, because several of these are choices people get wrong and then have to unpick later.

`mark_delivered(db, [n.id for n in pending])` at `plan:1770` passes the explicit list of ids instead of running a blanket `UPDATE ... WHERE delivered_at IS NULL`. That is the difference between a correct flush and one that silently swallows a notification which arrived *during* the flush. It is not an obvious distinction and you made it the right way.

Send-then-mark ordering, stated in the prose and again in the mistakes field. `read_at` as a nullable timestamp rather than a boolean, with the reason written down. The self-notify guard in exactly one function, with a comment saying why it is not also in `create_notification`. `Field(min_length=1, max_length=50)` on a `list[UUID]` — that is the correct Pydantic v2 spelling; `min_items` would have been the v1 spelling and would have failed. `mark_read`'s `WHERE read_at IS NULL` so a second read does not overwrite the first timestamp. Messages kept out of the notification table, repeated four times so the frontend cannot misread it.

And the "Open decisions" block at the end is the most useful thing in the section. Writing down what has not been decided, instead of pretending it has been, is exactly what keeps a plan honest. Four of those five decisions I can now answer from the code — see the last section.

One piece of good news from outside Day 9: `back/requirements.txt` now says `fastapi[standard]`, which pulls in `uvicorn[standard]`, which pulls in `websockets`. The old defect where `websockets` was missing from requirements is **closed**, and `python-jose` and `passlib` are gone too.

---

## Blockers — decide these before you write any Day 9 code

### B1. Developer C has already claimed notifications, with a different design

`back/app/models/notification.py` exists. It has no class in it yet, only his design note:

```python
# Polymorphic Associations :
# 1. notification_events : what happened
# 2. notification_actors :who initiated the event
# 3. notification_recipients : who is the target of the event
```

That is a three-table polymorphic design. Day 9 Part B builds a **single flat `notifications` table** in `back/app/realtime/models.py`.

**What breaks.** Two things, one of them fatal. If he later fills that file in with `__tablename__ = "notifications"` while your model also declares it, `Base.metadata` raises `InvalidRequestError: Table 'notifications' is already defined for this MetaData instance` and the app refuses to start — for both of you, because you share one `Base`. And even with no crash, two competing notification designs in one codebase is the kind of thing that gets taken apart at defense.

**Fix.** This goes into the message you send him at Step 4, and it goes *first*, before Step 1 is written. You are not asking permission to write code; you are asking who owns the `notifications` table. Either he deletes his note and yours is the design, or his design wins and Part B becomes "call his function", or you namespace yours (`__tablename__ = "realtime_notifications"`) and accept two systems. The first option is the only one that earns the point cleanly (see B4).

### B2. The `messages` table name is already claimed twice, today

- `back/app/realtime/models.py:30` → `__tablename__ = "messages"` (your `conversation_id` + `body` design)
- `back/app/models/message.py:18` → `__tablename__ = "messages"` (his `private_chat_id` + `message` design, with `models/private_chat.py`, `schemas/message.py` and `schemas/private_chat.py` beside it)

**Why it has not exploded yet.** `back/app/models/__init__.py` line 8 reads `# from .message import Message` — commented out. His class is never imported, so `Base.metadata` never learns about it. The moment anyone uncomments that line, or any file does `import app.models.message`, `create_all` raises the same `InvalidRequestError` as above.

**What Day 9 adds on top.** Part A's `PendingMessage` declares `ForeignKey("messages.id")` — a foreign key pointing at a table name that two models claim. If the wrong one ever wins, your queue points at his private-chat table.

**Fix.** Same conversation as B1: ask him to delete `models/message.py` and `models/private_chat.py` (plus their two schema files) as superseded by `realtime/models.py`, or to rename his to `private_messages`. His own `models/__init__.py` already has them commented out, which suggests he has abandoned them — so he may well agree straight away. Get that agreement before you add the foreign key.

### B3. Part B asks him for one line in three handlers. Two of the three handlers do not exist

Checked every router file:

| Endpoint Part B needs | Reality |
|---|---|
| like | `back/app/routers/like.py` is **0 bytes**. Not in `main.py`. |
| comment | `back/app/routers/comments.py` is **0 bytes**. Not in `main.py`. |
| follow | **Exists** — `POST /users/{user_id}/follow` at `routers/followers.py:20`, plus `DELETE /users/{user_id}/unfollow` at line 71. Included in `main.py`. |

The `Like` and `Comment` *models* exist (`models/like.py`, `models/comment.py`) and `Post.likes` / `Post.comments` relationships are wired. It is only the HTTP endpoints that are missing.

So the Step 4 message as written — "add one `await` call at the end of your like, comment, and follow handlers" — asks him for something impossible in two cases out of three. This inverts your Open Decision #1: you were worried follow might not exist. Follow is the one that is ready.

**Fix.** Rewrite Step 4 as two requests with different sizes. For follow: "add these two lines at the end of `follow_user`, after your `await db.commit()`." For like and comment: "when you build those endpoints, add the same two lines" — and ask him **when** they are landing, because that date decides B4.

Also correct the snippet itself. His handler takes `user_id: uuid.UUID` as the path parameter and names the current user `curr_user`, not `current_user`. There is no `followed_user` variable. The real line for his follow handler is:

```python
await emit_notification(event_type="follow", actor_id=curr_user.id, target_user_id=user_id)
```

And he already rejects self-follow with a 400 at `routers/followers.py:34`, so your self-notify guard is belt-and-braces there — which is fine, keep it, it has to work for like and comment too.

### B4. The subject pays for this, and pays zero for a partial version

From the v19.1 subject: **"A complete notification system…" is a Minor, 1 point, under Web.** And Chapter IV: an incomplete or non-functional module scores **0, not partial**.

So Part B is not polish. It is a point — and that point matters, because the monolith decision already forfeited the microservices Major, which is why Days 14–15 and 16–17 exist at all. But a notification system that only ever fires on follows is not "complete", and claiming it would be claiming a 0.

**Fix.** Write this into Day 9 as a scope gate rather than leaving it implicit: *Part B ships only if like and comment endpoints exist by Oct 6. If they do, it goes in the README point calculation as the Web "complete notification system" Minor. If they do not, Part B is cut and the point is not claimed.* That sentence is also your defense answer if an evaluator asks why notifications cover three event types and not more.

---

## Code-level defects in the Day 9 snippets

### C1. `delivered_at` loses its time zone — in both models

`plan:1517` and `plan:1582`:

```python
delivered_at: Mapped[datetime | None] = mapped_column(default=None)
```

`Mapped[datetime]` with no explicit column type makes SQLAlchemy emit `TIMESTAMP WITHOUT TIME ZONE`. Then `mark_delivered` at `plan:1630` writes `datetime.now(timezone.utc)`, which is timezone-aware. asyncpg's `timestamp` encoder subtracts a naive epoch from whatever you give it, so it raises a naive-versus-aware `TypeError` on the insert — the same error family Day 2 already warns you about at `plan:868`.

Note that `read_at` and `created_at` in the very same model both carry `DateTime(timezone=True)`. Only `delivered_at` was missed, and it was missed twice.

**Fix**, both places:

```python
delivered_at: Mapped[datetime | None] = mapped_column(
    DateTime(timezone=True), default=None
)
```

### C2. `registry.send_to_user` crashes instead of returning `0` — and returning `0` is Part A's entire trigger

This is the most important code finding, because Part A is built directly on top of it. Your `back/app/realtime/registry.py`:

```python
def connections_for(user_id: UUID) -> set[WebSocket]:
    return _connections.get(user_id, set())      # the live set, not a copy

async def send_to_user(user_id: UUID, payload: dict) -> int:
    reached = 0
    for ws in connections_for(user_id):          # iterating the live set
        try:
            await ws.send_json(payload)
            reached += 1
        except Exception:
            unregister(user_id, ws)              # mutates the set being iterated
    return reached
```

`unregister` does `_connections[user_id].discard(ws)` on the set the `for` loop is walking. I ran the exact shape of this:

```
RuntimeError: Set changed size during iteration
```

with one socket in the set, and again with three. So the one case Part A exists to handle — a recipient whose socket is dead — raises inside the fan-out instead of returning `0`, the `message.send` handler's `except` clauses do not catch `RuntimeError`, and `create_pending_message` is never reached. Part A would look broken and the cause would be two files away.

An earlier draft of your plan had this right: `set(_connections.get(user_id, ()))  # a copy: safe to iterate while sockets come and go`. The copy got lost somewhere between the draft and `registry.py`.

**Fix, and do it before Day 9 as a Day 6 repair:**

```python
def connections_for(user_id: UUID) -> set[WebSocket]:
    return set(_connections.get(user_id, ()))   # a copy: safe to iterate while sockets come and go
```

Then the second half: `ws.py:65` currently throws the return value away.

```python
for pid in participant_ids:
    await registry.send_to_user(pid, payload)   # return value ignored
```

That line is where Part A hooks in. Also worth knowing: `connections_for` is correctly written with `.get()` rather than `_connections[user_id]` — on a `defaultdict`, the bracket form would invent an empty entry and that user would show up in `online_user_ids()` as a phantom online user. You dodged that one.

### C3. `emit_notification` commits inside Developer C's transaction

`plan:1692` takes `db: AsyncSession` from the caller, and `create_notification` at `plan:1612` calls `await db.commit()` on it.

**What breaks.** That `db` is his request-scoped session. Your commit commits everything he has pending in it, not only your row. If he calls your function before his own commit and his handler then raises, the row he expected to roll back is already in Postgres. You would be changing the behaviour of his endpoint from inside a function he was told was one safe line — and his instruction to you was to not touch his logic.

**Fix — option (a), the one that matches the plan's own rule.** Drop the `db` parameter entirely and open your own short session inside:

```python
async def emit_notification(
    event_type: str,
    actor_id: uuid.UUID,
    target_user_id: uuid.UUID,
    target_id: uuid.UUID | None = None,
):
    if actor_id == target_user_id:
        return
    async with session_maker() as db:
        notif = await service.create_notification(
            db, target_user_id, actor_id, event_type, target_id
        )
        actor = await db.get(User, actor_id)
        payload = service.notification_payload(
            notif, actor.username if actor else "unknown"
        )
        reached = await registry.send_to_user(target_user_id, payload)
        if reached > 0:
            await service.mark_delivered(db, [notif.id])
```

Then tell him to call it **after** his `await db.commit()`. His follow handler already commits at `routers/followers.py:66` and returns two lines later, so it slots in with no reordering. The bonus: his call site no longer needs a `db` argument at all, so it really is one line.

Option (b) would be to keep his session and replace `commit()` with `flush()`, letting his commit finalize both rows atomically. Fewer round-trips and the notification cannot outlive a rolled-back like — but `mark_delivered` then cannot commit either, and you have pushed a frame over a socket for a row that is not durable yet. Option (a) is consistent with the "short session blocks, never a shared one" rule you set on Day 2 at `plan:763`, so take (a) unless you want to defend the trade-off.

### C4. Missing imports in four files

The plan mentions only `String` for `models.py` (`plan:1593`). Here is what is actually missing, checked against your current imports:

- **`service.py`** imports `select` only (`service.py:3`), and imports no `datetime` at all. Part B needs `update` and `func` added to the sqlalchemy import, `from datetime import datetime, timezone`, `Notification` added to the `.models` import, and `from . import frames` for `notification_payload`.
- **`rest.py`** needs `Query` added to the fastapi import, `from sqlalchemy import select`, `Notification` from `.models`, and `NotificationReadRequest` added to the `.schemas` import.
- **`ws.py`** needs `from sqlalchemy import select` and `from ..models.user import User` for the Step 5 flush block.
- **`models.py`** needs `String` — correctly noted in the plan already.

Each of these is a `NameError` or `ImportError` the moment you run it, so it is worth writing them into the steps rather than discovering them one at a time.

### C5. Every REST snippet uses dependency names this repo does not have

Step 6 uses `Depends(get_async_session)` and `Depends(get_current_user)`. The real names here are:

| Plan says | Repo has | Where |
|---|---|---|
| `get_async_session` | `get_db` | `app/database/database.py:34` |
| `get_current_user` | `get_curr_user` | `app/core/deps.py:19` |
| `app/db/database.py` | `app/database/database.py` | — |

Your own `rest.py:4,6` already imports the correct two, so you know this — but pasting Step 6 as written gives you an `ImportError`. And this is not a Day 9 problem only: `get_db` and `get_curr_user` appear **zero times** in the whole 2,266-line plan, while `get_async_session` and `get_current_user` appear throughout. Worth one find-and-replace pass over the entire file while you are in there.

### C6. `frames.NOTIFICATION_COUNT` is in the plan but not in your `frames.py`

`plan:593` lists `NOTIFICATION_COUNT = "notification.count"`. Your real `back/app/realtime/frames.py` stops at `NOTIFICATION` on line 11. Step 5 at `plan:1776` references `frames.NOTIFICATION_COUNT`, so as it stands you get `AttributeError: module 'app.realtime.frames' has no attribute 'NOTIFICATION_COUNT'`. One line to add, in the server→client block next to `NOTIFICATION`.

### C7. `list_notifications` hands FastAPI raw SQLAlchemy objects

`plan:1807`:

```python
return {"items": rows, "unread_count": ...}
```

with no `response_model`. FastAPI runs `jsonable_encoder` over those ORM instances, which walks `__dict__`, finds `_sa_instance_state`, and you get either a serialization error or internals leaking into your JSON. Nothing else in this repo does that: `service.list_conversations` returns plain dicts, and his endpoints return Pydantic models with `from_attributes=True` (`UserResponse`, `FollowToggleResponse`).

**Fix.** Add to `schemas.py` and set it as the `response_model`:

```python
class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    event_type: str
    actor_id: UUID
    target_id: UUID | None
    read_at: datetime | None
    created_at: datetime
```

That is also the right place to decide what the frontend is allowed to see — note it does not expose `delivered_at`, which is your bookkeeping, not theirs.

### C8. Smaller things, your call

`create_notification` calls `await db.refresh(notif)` (`plan:1613`). With `expire_on_commit=False` in your `session_maker` and Python-side defaults for both `id` and `created_at`, that is a database round-trip for values already sitting in memory. Harmless, but unnecessary — and the same pattern is already in `service.create_message`, so if you drop it, drop it in both or neither.

`Notification` carries three separate single-column indexes (`user_id`, `read_at`, `created_at`). Your two real queries are "this user's unread" and "this user's newest first". One composite index on `(user_id, created_at)` serves both. (For reference: `models/session.py` imports `Index` on line 3 but never uses it — there is no `__table_args__` in that file, so there is no composite-index precedent in the repo yet. Yours would be the first.)

`plan:1862` has `curl ... http://localhost:8000/realtime/notifications?unread_only=true` unquoted. `?` is a shell glob character; quote the URL so it cannot bite you.

---

## Format check against your own eight-field rule

**Passes.** All eight fields present and in the right order, in both Part A and Part B. 16 code fences, even. No day-ahead reading invited. Paths given explicitly.

**One banned word.** `plan:1493`: "the same idea the original plan had, **just** named clearly." Replace with "renamed for clarity." Two more are borderline and I would leave them: `plan:1523` "a user whose only socket **just** died" is temporal, not minimizing, and `plan:1882` "uses **simple** `limit`" describes an API shape rather than telling you something is easy.

**"What do I need to learn first? Nothing new." is wrong for Part B.** Checked against the rest of the plan: this section is the first place that uses `sqlalchemy.update()`, `func.count()` (first occurrence in the whole file is `plan:1652`, inside Part B), `String(32)`, and `Query(...)`. By your own rule each needs a gloss and a search string. Suggested wording:

> An `update()` statement (changing rows in the database without loading them into Python first) — search "sqlalchemy 2.0 orm update statement". And `func.count()` (asking Postgres to count rows and send back one number, instead of fetching every row and calling `len()`) — search "sqlalchemy func.count select".

**Part B is too big to be half of one day.** It runs ~345 lines across six numbered sub-steps, where every other day in the plan is a single block. Two new tables, a new module, three REST endpoints, and a dependency on another developer's unwritten endpoints is not one day's work for you right now. Splitting it into Day 9 (Part A, all yours, no dependencies) and Day 9b (Part B) has a second benefit: it makes Part B a clean unit you can cut without touching Part A, which is exactly what B4 may force.

---

## Your five open decisions, answered from the code

**1. Does a follow endpoint exist?** Yes — `POST /users/{user_id}/follow`, `routers/followers.py:20`, and it is wired into `main.py`. The question was pointed at the wrong endpoint: **like and comment are the missing ones**, both 0-byte files. See B3.

**2. Cascade rules on source deletion.** Decide it as follows, and the reason is the subject, not taste. `target_id` with no foreign key leaves orphan rows pointing at deleted posts; clicking one in the bell gives the frontend a 404 and a console error — and zero browser-console errors is a *rejection-level* mandatory item in Chapter III. So either add `ForeignKey("posts.id", ondelete="CASCADE")` and let Postgres clean up, or have the frontend render "this post was deleted". The foreign key is one line and removes a whole class of problem; the cost is that `target_id` can then only ever hold a post id, which is true for all three of your event types anyway (`follow` stores `None`). Take the foreign key. On unlike, leave the notification — Instagram does, and deleting it means a user who saw the bell has it vanish under them.

**3. Live badge count while connected.** Pick (b), the frontend increments on each `notification` frame. Every frame already carries everything needed, it costs no extra traffic, and a second `NOTIFICATION_COUNT` from `emit_notification` means two concurrent sends on one socket from a request handler. Write the rule into the Day 18 protocol README so the frontend developer is not guessing.

**4. Pagination style for `GET /notifications`.** Keep the simple `limit` and write the trade-off down. You are reusing nothing from Day 7 by making them match, the bell is not an infinite scroll, and the inconsistency costs you one sentence in the README instead of an afternoon.

**5. Aggregation.** Agreed, out of scope, and your defense sentence is already well written. Leave it exactly as it is.

---

## Where Day 9 actually sits on the calendar

Day 9's heading says Sep 27. Today is **Oct 2**.

Your latest commit is `ddcbdb3 Add realtime message broadcast` — that is Day 6's fan-out. Days 7 and 8 are not written: `ws.py` has no history endpoint, `rest.py` has only the two conversation endpoints, and there is no presence announce or `presence.snapshot` anywhere. The whole calendar from Day 7 onward is about five days optimistic, and Oct 10 has not moved.

Suggested order from here, with Day 9 Part B last on purpose:

1. **`registry.py` copy fix (C2)** — one line, and Part A cannot work without it.
2. Day 7 — history. Day 8 — presence. These two carry the "see their online status" bullet of the User Management Major, which spans you and Developer C, so they are not optional.
3. **Day 9 Part A** — entirely yours, no waiting on anyone.
4. Day 12 (`docker compose up`) and Day 13 (logout kills live sockets). Single-command containerized launch is rejection-level mandatory; Day 13 is your best answer to "why sessions instead of JWT".
5. Day 19 — the clean-database rehearsal. Do not let this one get squeezed.
6. **Day 9 Part B** — only if like and comment endpoints exist by Oct 6, per B4.

And send Developer C the B1/B2/B3 message today, before you write any of it. Those three answers decide how much of Day 9 there even is, and none of them are yours alone to settle.
