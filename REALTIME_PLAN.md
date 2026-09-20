# Realtime Plan — Developer R

*Monolith. Sep 17 → Oct 10, 2026. Rewritten against Developer C's commit `05b9b7c` (cookie sessions, argon2).*

---

## START HERE — two things are broken before any of this matters

### 1. Your merge is stuck, and it is not your fault

Right now your clone has **12 conflicted files** sitting in an unfinished merge. `main.py`, `user.py`, `auth.py`, `requirements.txt` and eight others all contain `<<<<<<<` markers.

Here is why, because the reason changes the fix. On Day 1 you merged Developer C's branch when its newest commit was `f712917`. He has since **rewritten his branch history** — that same work now has the hash `7c5b1e9`, plus four new commits on top. Git cannot tell that `f712917` and `7c5b1e9` are the same work by the same person, so it sees two independent versions of every file he touched and asks you to reconcile all of them.

**Do not resolve these by hand.** You would be hand-merging his old code against his new code, in his files, which is exactly the work you agreed not to do. There is a two-command fix.

Your own work is two commits (`2a2e0eb` the empty scaffold, `c5b7bc4` the echo socket) and both are safe. The plan below rebuilds your branch cleanly on top of his current code and replays those two commits.

### 2. Your plan file was deleted

`REALTIME_PLAN.md` is gone from the folder, and so is the old `services/` skeleton. Both were untracked files, so a `git clean -fd` — or an editor's "discard untracked changes" — removed them together. Nothing tracked was lost.

This file is the rewrite. **Task 0.1 commits it to your branch**, so git protects it from now on.

---

## What changed in Developer C's code, and what it means for you

He did not only swap the auth mechanism. Five things moved.

**JWT is gone; cookie sessions replace it.** There is a real `sessions` table with `id`, `user_id`, `expires_at`, `created_at`. Login inserts a row and sets a `session_id` cookie. Logout deletes the row. `decode_token`, `create_access_token`, and python-jose are all gone from the codebase.

**`app/routers/deps.py` became `app/core/deps.py`.** The Day 3 import path in the old plan now points at a file that does not exist.

**passlib/bcrypt became argon2.** `core/security.py` is now nine lines: `hash_password` and `verify_password`, both wrapping `argon2.PasswordHasher`.

**Two defects fixed themselves.** The `print()` calls that leaked plaintext passwords are gone. And he added `back/.gitignore`. Those were two of the four items on your "ask him to fix" list — cross them off.

**The registration endpoint is `POST /auth/signup`, not `/auth/register`**, and login takes JSON with a `username_or_email` field, not OAuth2 form data.

### Why this is good news for you

Sessions are less work than JWT was, in three specific ways.

**The handshake carries the cookie automatically.** The entire reason Day 3 was the hardest day in the old plan was that browsers refuse to set an `Authorization` header on a WebSocket, forcing a token-as-first-frame protocol with a timeout. A cookie has no such problem — the browser attaches it to the WebSocket handshake by itself, because a handshake is an ordinary HTTP request. You read `websocket.cookies` and you are done. The `auth` frame, the 10-second deadline, and close code `4000` all disappear.

**Revocation now works.** A JWT stays valid until it expires; there is no way to kill one. A session is a database row, so logout deletes it and the next check fails. This is what makes Day 13's forced-disconnect-on-logout possible, and it is a genuinely better answer at evaluation.

**Nothing expires mid-session.** Access tokens lasted 15 minutes, which meant your long-lived sockets would outlive their own credential. Sessions last 7 days.

One thing gets harder, and it is worth knowing now: a cookie is sent by the browser automatically on *any* request to your origin, including ones triggered by another site. That is what CSRF is. It does not affect your WebSocket work today, but it belongs on the team's list before the project is defended.

---

## The shape of the job

You are building **one folder**: `back/app/realtime/`. Ten files. You edit **three lines** in one file Developer C owns.

| Day | Date | What you finish |
|---|---|---|
| 0 | Sep 17 | Merge unstuck, plan committed, chat claimed |
| 1 | Sep 18 | His new code running; signup/login/cookie in hand |
| 2 | Sep 19 | Socket knows *which user* is connected |
| 3 | Sep 20 | Many sockets per user, tracked correctly |
| 4 | Sep 21 | Your three tables exist |
| 5 | Sep 22 | A message over the socket lands in Postgres |
| 6 | Sep 23 | Two browsers, two users, instant delivery |
| 7 | Sep 24 | Reload the page, history is still there |
| — | Sep 25 | **Slack** |
| 8 | Sep 26 | You can see who is online |
| 9 | Sep 27 | Offline users get notifications |
| 10 | Sep 28 | Unread counts and read receipts |
| 11 | Sep 29 | Dead connections detected; flooding refused |
| — | Sep 30 | **Slack** |
| 12 | Oct 1 | `docker compose up` and chat works |
| 13 | Oct 2 | Logout kills live sockets |
| 14–15 | Oct 3–4 | Advanced search (Minor, +1) |
| 16–17 | Oct 5–6 | GDPR: export and delete account (Minor, +1) |
| 18 | Oct 7 | Protocol README and frontend handoff |
| 19 | Oct 8 | Full rehearsal against a clean database |
| 20 | Oct 9 | **Slack** |
| 21 | Oct 10 | Defense prep, final push |

Three slack days are deliberate. Something will run long; when it does, the plan does not move, the slack absorbs it.

**Every task below has the same eight headings.** When you are lost, read only *What am I doing?* and *Steps in detail*.

---

# DAY 0 — Sep 17 — Unstick, protect, claim

## Task 0.1 — Rebuild your branch on his new history

**What am I doing?**
Throwing away the broken merge, then replaying your two commits on top of Developer C's current code.

**Why am I doing this?**
The conflicts exist only because git is comparing his old commits against his new ones. If you start from his new code and replay only your own two commits, there is nothing of his to reconcile — your commits touch nine files that did not exist before and three lines of `main.py`. The conflict count goes from 12 to at most 1.

A *rebase* replays your commits one at a time onto a new starting point. That is exactly what you want here: keep mine, take his wholesale.

**What do I need to learn first?**
Search: `git rebase onto explained`. You need only the idea — "move my commits to sit on top of a different base." Also `git merge --abort`, which undoes an in-progress merge and leaves no trace.

**Steps in detail**

1. Abandon the broken merge:

   ```bash
   cd /home/fangu/Desktop/transcendenc/PlayBook
   git merge --abort
   ```

   If that reports there is nothing to abort, run `git reset --merge` instead.

2. Confirm you are back to a clean state, with your two commits present:

   ```bash
   git status
   git log --oneline -3
   ```

   You should see `c5b7bc4 realtime: echo websocket endpoint` at the top and no conflicted files.

3. Make a safety branch before doing anything irreversible. It costs nothing and it means no sequence of mistakes can lose your work:

   ```bash
   git branch backup-before-rebase
   ```

4. Fetch his rewritten history:

   ```bash
   git fetch origin
   ```

5. Replay your two commits onto his current code. `--onto` says: take my commits that came after the old base, and put them on the new base instead.

   ```bash
   git rebase --onto origin/Core-Dev f712917 Realtime-Dev
   ```

6. You will likely hit **one** conflict, in `back/app/main.py`, because both of you edited it. It will look like this:

   ```
   <<<<<<< HEAD
   from fastapi import FastAPI, Header, Response
   =======
   from fastapi import FastAPI
   >>>>>>> realtime: echo websocket endpoint
   ```

   Resolve by keeping **his** line and adding **your** import. Open the file, delete the three marker lines, and make the top of the file read:

   ```python
   from contextlib import asynccontextmanager
   from fastapi import FastAPI, Header, Response
   from .db.database import engine, Base
   from .core.config import settings
   from .routers import auth
   from .realtime import ws as realtime_ws
   ```

   And further down, keep his `header` endpoint and your `include_router`:

   ```python
   app.include_router(
       auth.router,
   )
   app.include_router(realtime_ws.router)


   @app.get("/header/{name}/{value}")
   def header(name: str, value: str, response: Response):
       response.headers[name] = value
       return "normal body"
   ```

   If you see a `@app.get("/")` root endpoint in the conflict, that was yours and he does not have it — drop it. It is not in the plan and not worth a conflict.

7. Tell git the conflict is resolved and continue:

   ```bash
   git add back/app/main.py
   git rebase --continue
   ```

8. Verify. His session files should now be present alongside your realtime folder:

   ```bash
   ls back/app/core/deps.py back/app/models/session.py back/app/realtime/ws.py
   git log --oneline -6
   ```

9. Your branch history has been rewritten, so a normal push is refused. Use the safe force, which refuses if someone else pushed to your branch in the meantime:

   ```bash
   git push --force-with-lease
   ```

10. Once the app runs (end of Day 1), delete the safety branch:

    ```bash
    git branch -D backup-before-rebase
    ```

**Where do I put the files?**
No new files. This rearranges history.

**How do I know I'm done?**
`git status` reports a clean tree on `Realtime-Dev`, `git log --oneline -6` shows your two commits sitting on top of his four new ones, and `back/app/models/session.py` exists.

**How do I test?**

```bash
git status
git log --oneline -6
ls back/app/models/session.py back/app/core/deps.py
grep -rn '<<<<<<<' back/app/ || echo "no conflict markers left"
```

**Common beginner mistakes**
Resolving all 12 conflicts by hand instead of aborting — hours of work, and the result is his old code mixed into his new code. Skipping the backup branch. Using `git push --force` instead of `--force-with-lease`, which overwrites a teammate's push if they touched your branch. And running the rebase with uncommitted changes in the tree, which git refuses — commit or stash first.

---

## Task 0.2 — Commit this plan so it cannot vanish again

**What am I doing?**
Adding `REALTIME_PLAN.md` to git.

**Why am I doing this?**
It was deleted once already, by a command that removes untracked files. Git only protects what it tracks. This takes ten seconds and removes the whole category of problem.

**What do I need to learn first?**
Nothing.

**Steps in detail**

1. From the repository root:

   ```bash
   cd /home/fangu/Desktop/transcendenc/PlayBook
   git add REALTIME_PLAN.md
   git commit -m "docs: realtime plan for session-based auth"
   git push
   ```

2. If you would rather it not appear in the shared repository, add it to `.gitignore` instead and keep a copy outside the project folder. Tracked or moved out — either is fine. Untracked and inside the folder is the one state that loses it.

**Where do I put the files?**

```
PlayBook/
└── REALTIME_PLAN.md     ← now tracked
```

**How do I know I'm done?**
`git status` no longer lists it under untracked files.

**How do I test?**

```bash
git status --short
git log --oneline -1
```

**Common beginner mistakes**
Assuming a file is safe because you can see it. `git clean -fd` deletes every untracked file in the tree with no confirmation and no recovery.

---

## Task 0.3 — Claim chat, in writing

**What am I doing?**
Sending one message that establishes conversations, messages, notifications and presence as yours.

**Why am I doing this?**
His README still lists a `models/message.py` and a `realtime/` folder in its recommended structure. He has not built either — his models are user, post, comment, like, session. But the intent is written down, and with 23 days you cannot afford to build chat twice. This is the highest-value fifteen minutes in the plan.

**What do I need to learn first?**
Nothing. Look at his README's structure section so you are both discussing the same text.

**Steps in detail**

1. Send this:

   > I'm taking the realtime part: WebSockets, conversations, messages, notifications, presence. It all goes in `app/realtime/` so I won't touch your files. Two asks: (1) drop `models/message.py` and the `realtime/` folder from the README structure so we don't build it twice, and (2) I need one line in `app/main.py` to register my router — that's the only file of yours I'll edit.

2. Add the second part, which is now much shorter than it was:

   > Also — heads up that rewriting Core-Dev's history broke my merge and cost me an afternoon. If you need to rewrite again, message me first and I'll rebase on purpose rather than discovering it. Separately, `back/.env` is still committed with a real SECRET_KEY in it. It needs purging from history and the value rotating, and that's yours to do since it's your branch's history.

3. Ask the ownership question for Day 12 now, because the answer takes days to arrive:

   > There's no Dockerfile anywhere in the repo and no root compose file. The subject needs the whole thing to start with one command. I can write `back/Dockerfile` and a root `docker-compose.yml` around Oct 1 — or if you or the DevOps person would rather own it, tell me now.

**Where do I put the files?**
No files.

**How do I know I'm done?**
He has replied in writing that chat is yours. Something you can scroll back to, not a verbal yes.

**How do I test?**
Not applicable.

**Common beginner mistakes**
Starting to code before this conversation. Also apologising for asking — you are removing work from his plate, not taking something from him.

---

## Task 0.4 — The one constraint that shapes everything

**What am I doing?**
Accepting one rule: **your application runs as a single process.**

**Why am I doing this?**
You will keep the list of connected users in a Python dictionary in memory. That is correct with one process. If the app is ever started with four *workers* (a worker is a separate copy of your program with its own separate memory), user A lands on worker 1, user B on worker 3, and worker 1 has no idea worker 3 exists. Messages vanish with no crash and no log line. That is the hardest class of bug to find, so you avoid creating it.

Redis exists to let separate processes shout to each other. **You do not need Redis, because you have one process.** That is a real decision with a real reason, and it is your answer at evaluation.

**What do I need to learn first?**
Search: `uvicorn workers`. First paragraph only.

**Steps in detail**

1. In development, the command never carries `--workers`:

   ```bash
   uvicorn app.main:app --reload
   ```

2. Write this where you will find it on Oct 10:

   > We run a single process, so the connection registry lives in memory and in-process fan-out is correct. Scaling to multiple workers would split that registry, and delivering across processes would require Redis pub/sub.

3. Check the Dockerfile for `--workers` again on Day 12.

**Where do I put the files?**
No files.

**How do I know I'm done?**
You can say, without reading, why one process means no Redis.

**How do I test?**
Not applicable.

**Common beginner mistakes**
Adding `--workers 4` later because a blog post said it is faster. It is faster, and it breaks chat. Running gunicorn with multiple uvicorn workers is the same mistake in different clothing.

---

# DAY 1 — Sep 18 — Get his new code running

## Task 1.1 — Install and boot

**What am I doing?**
Installing his new dependencies and starting the app against a clean database.

**Why am I doing this?**
He swapped passlib/bcrypt for argon2 and dropped python-jose. Your existing virtual environment has the old set, so the app will fail to import until you reinstall. And his new `sessions` table needs creating, which his startup code does automatically.

**What do I need to learn first?**
Nothing new. If `.venv` does not exist, search `python virtual environment venv` — a private folder of packages for one project.

**Steps in detail**

1. Activate the environment and reinstall:

   ```bash
   cd /home/fangu/Desktop/transcendenc/PlayBook/back
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

   `colorama` is no longer needed — he removed the import that required it.

2. Check your `.env`. His `config.py` still declares `database_url`, `algorithm` and `secret_key` with no defaults, so all three must be present even though the JWT ones are now unused. It also adds session settings, which all have defaults. Your `back/.env` needs at minimum:

   ```
   DATABASE_URL=postgresql+asyncpg://ziko:1234pass@localhost:5000/mydb
   SECRET_KEY=your_generated_value
   ALGORITHM=HS256
   ```

3. Start Postgres:

   ```bash
   docker compose -f docker-compose.yaml up -d
   ```

4. His `User` model changed shape — it now has a `sessions` relationship. If your database has the old `users` table, the new columns will not appear, because `create_all` creates missing tables and never alters existing ones. Start clean:

   ```bash
   docker compose -f docker-compose.yaml down -v
   docker compose -f docker-compose.yaml up -d
   ```

   That deletes all data. On Sep 18 you have no data worth keeping.

5. Run it:

   ```bash
   uvicorn app.main:app --reload
   ```

**Where do I put the files?**

```
back/
├── .env       ← three required keys, never committed
└── .venv/     ← reinstalled today
```

**How do I know I'm done?**
The server logs `Application startup complete`, and `\dt` lists `users`, `sessions`, `posts`, `comments`, `likes`.

**How do I test?**

```bash
docker ps --format '{{.Names}}'
docker exec -it CONTAINER_NAME psql -U ziko -d mydb -c "\dt"
```

**Common beginner mistakes**
Reinstalling without `--force-reinstall` and keeping a stale `passlib` that shadows nothing — harmless, but if imports fail, `pip install --force-reinstall -r requirements.txt` is the fix. Forgetting `source .venv/bin/activate` in a new terminal. Keeping the old database and then getting confusing errors from a `users` table that predates the `sessions` relationship.

---

## Task 1.2 — Get a session cookie in your hand

**What am I doing?**
Registering two users, logging in as one, and capturing the `session_id` cookie value.

**Why am I doing this?**
Every day from here needs an authenticated user. Under JWT you copied a token string; now you copy a cookie value. The mechanics differ enough that doing it once deliberately saves confusion later.

**What do I need to learn first?**
Search: `http cookie set-cookie header`. One idea: the server replies with `Set-Cookie`, and the browser sends it back automatically on every later request to that origin.

**Steps in detail**

1. Open `http://localhost:8000/docs`.

2. Find `POST /auth/signup`. Note the spelling — it is **signup**, not register. Send:

   ```json
   {"username": "alice", "email": "alice@test.com", "password": "alice12345"}
   ```

   Copy the returned `id`. That is Alice's UUID; save it in a scratch file.

3. Repeat for bob / bob@test.com / bob12345. Save his id too.

4. Find `POST /auth/login`. It takes **JSON**, not a form, and the username field is called `username_or_email`:

   ```json
   {"username_or_email": "alice", "password": "alice12345"}
   ```

5. The response body is Alice's user record. The session is in the response *headers*, not the body. In `/docs` you cannot see it, so use curl instead — this is also how you will get cookies for your test client:

   ```bash
   curl -i -X POST http://localhost:8000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username_or_email":"alice","password":"alice12345"}'
   ```

   Look for a line like:

   ```
   set-cookie: session_id=3f2b8c1e-...; HttpOnly; Path=/; SameSite=lax
   ```

   Copy the UUID after `session_id=`. That is Alice's session.

6. Better: have curl save cookies to a file, so you never copy by hand:

   ```bash
   curl -c alice.cookies -X POST http://localhost:8000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username_or_email":"alice","password":"alice12345"}'

   curl -c bob.cookies -X POST http://localhost:8000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username_or_email":"bob","password":"bob12345"}'
   ```

   Then any later request reuses it with `-b alice.cookies`. Add `*.cookies` to your `.gitignore`.

7. Confirm the cookie authenticates you:

   ```bash
   curl -b alice.cookies http://localhost:8000/auth/me
   ```

   Returns Alice's record.

**Where do I put the files?**
`alice.cookies` and `bob.cookies` in `back/`, git-ignored. Keep the two UUIDs in a scratch file outside the repository.

**How do I know I'm done?**
`curl -b alice.cookies http://localhost:8000/auth/me` returns Alice, and a row exists in the `sessions` table.

**How do I test?**

```bash
curl -b alice.cookies http://localhost:8000/auth/me
docker exec -it CONTAINER_NAME psql -U ziko -d mydb \
  -c "SELECT id, user_id, expires_at FROM sessions;"
```

**Common beginner mistakes**
Calling `/auth/register` — it is `/auth/signup`. Sending `username` instead of `username_or_email`. Sending login as form data; it is JSON now. Expecting the session id in the response body — it is only in the `Set-Cookie` header. And the cookie is `HttpOnly`, so `document.cookie` in DevTools will not show it; that is deliberate and it is what stops JavaScript from stealing sessions.

---

# DAY 2 — Sep 19 — Make the socket know who is connected

This is the day sessions pay you back. Under JWT this was the hardest day in the plan. It is now among the easiest.

## Task 2.1 — Understand why this got simpler

**What am I doing?**
Learning how a WebSocket authenticates when the credential is a cookie.

**Why am I doing this?**
A WebSocket connection begins life as an ordinary HTTP GET with an `Upgrade` header. Ordinary HTTP request means **the browser attaches cookies automatically**. So by the time your endpoint runs, the session id is already there in `websocket.cookies`.

Compare that to what JWT forced: the browser's `WebSocket` constructor takes only a URL, with nowhere to put an `Authorization` header, so the token had to arrive as the first frame with a timeout guarding against clients that connect and say nothing. All of that — the `auth` frame, `asyncio.wait_for`, close code `4000` — is now deleted.

You still validate. A cookie proves the browser sent something; it does not prove the session exists or is unexpired.

**What do I need to learn first?**
Open `back/app/core/deps.py` and read `get_current_user` top to bottom. It is the HTTP version of what you are about to write, and it shows you the four checks in order: cookie present, parses as a UUID, session row exists, session not expired. Yours is the WebSocket twin.

Note the path: `app/core/deps.py`. It used to be `app/routers/deps.py`. If an import fails, that is why.

**Steps in detail**
No code in this task. Read `core/deps.py` and `models/session.py`. Both are short.

**Where do I put the files?**
No files.

**How do I know I'm done?**
You can name the four checks `get_current_user` performs, in order.

**How do I test?**
Not applicable.

**Common beginner mistakes**
Importing from `app.routers.deps`, which no longer exists. Assuming a cookie's presence means a valid session — an expired session still sends its cookie.

---

## Task 2.2 — Name your message types

**What am I doing?**
Filling in `frames.py` with every message name that can cross the socket, plus close codes.

**Why am I doing this?**
Once messages flow you will type `"message.new"` in five files. One typo — `"message_new"` — and delivery silently fails. Naming them once means a typo becomes an `AttributeError` that crashes loudly instead of a bug you find on Day 9.

**What do I need to learn first?**
Search: `websocket close codes 4000`. The 4000–4999 range is yours to define.

**Steps in detail**

1. Put this in `app/realtime/frames.py`:

   ```python
   """Every message name that can appear on the socket, in one place."""

   # ── client → server ───────────────────────────────────────────
   MESSAGE_SEND = "message.send"
   READ = "read"
   PING = "ping"

   # ── server → client ───────────────────────────────────────────
   READY = "ready"
   MESSAGE_NEW = "message.new"
   PRESENCE = "presence"
   NOTIFICATION = "notification"
   ERROR = "error"
   PONG = "pong"

   # ── close codes (4000-4999 is the application-defined range) ──
   CLOSE_AUTH_FAILED = 4001     # no cookie, unknown session, or expired
   CLOSE_RATE_LIMIT = 4002      # you sent too much, too fast
   CLOSE_SESSION_ENDED = 4003   # you logged out while connected
   ```

2. There is no `AUTH` frame and no `CLOSE_AUTH_TIMEOUT`. The cookie arrives with the handshake, so there is no waiting period to guard.

3. `READY` replaces the old `auth.ok`. The name is more honest — the server is not confirming an auth frame you sent, it is telling you the socket is usable.

4. `CLOSE_SESSION_ENDED` is used on Day 13. Naming it now costs nothing.

**Where do I put the files?**

```
back/app/realtime/
└── frames.py     ← today
```

**How do I know I'm done?**
This prints `message.new`:

```bash
cd /home/fangu/Desktop/transcendenc/PlayBook/back
python3 -c "from app.realtime import frames; print(frames.MESSAGE_NEW)"
```

**How do I test?**
The command above.

**Common beginner mistakes**
Making these an `Enum` and then needing `.value` at every use. Plain strings cause less friction. Putting them in `schemas.py` and creating a circular import with `service.py`.

---

## Task 2.3 — Authenticate the socket from the cookie

**What am I doing?**
Writing `ws_auth.py`: one function that takes an open socket and returns a `User` or `None`.

**Why am I doing this?**
Everything after today starts with "for the user on this socket". Until a socket has a user, nothing can be stored, delivered, or counted. This function is the gate the whole feature stands behind.

**What do I need to learn first?**
Search: `sqlalchemy 2.0 async select where`. You need `result = await db.execute(select(Model).where(...))` then `.scalar_one_or_none()`.

One subtlety about time. His `Session.expires_at` is `DateTime(timezone=True)`, so comparisons must use a timezone-aware value: `datetime.now(timezone.utc)`, never `datetime.now()`. Comparing aware and naive datetimes raises `TypeError`.

**Steps in detail**

1. Put this in `app/realtime/ws_auth.py`:

   ```python
   from datetime import datetime, timezone
   from typing import Optional
   from uuid import UUID

   from fastapi import WebSocket
   from sqlalchemy import select
   from sqlalchemy.ext.asyncio import AsyncSession

   from ..core.config import settings
   from ..models.session import Session
   from ..models.user import User
   from . import frames


   async def authenticate_socket(
       websocket: WebSocket, db: AsyncSession
   ) -> Optional[User]:
       """Resolve the session cookie on the handshake to a User.

       Returns the User on success. On any failure it closes the socket
       with 4001 and returns None, so the caller checks only for None.

       No auth frame and no timeout: a WebSocket handshake is an
       ordinary HTTP request, so the browser has already attached the
       cookie by the time this runs.
       """
       # 1. The cookie name is configurable, so read it from settings
       #    rather than hardcoding "session_id".
       raw = websocket.cookies.get(settings.session_cookie_name)
       if not raw:
           await websocket.close(code=frames.CLOSE_AUTH_FAILED)
           return None

       # 2. It must parse as a UUID. Anyone can send any cookie value.
       try:
           session_id = UUID(raw)
       except ValueError:
           await websocket.close(code=frames.CLOSE_AUTH_FAILED)
           return None

       # 3. The session row must exist. This is the revocation check --
       #    logout deletes the row, so a logged-out cookie fails here.
       #    A JWT could not do this.
       result = await db.execute(select(Session).where(Session.id == session_id))
       session = result.scalar_one_or_none()
       if session is None:
           await websocket.close(code=frames.CLOSE_AUTH_FAILED)
           return None

       # 4. And it must not have expired. timezone.utc matters: the
       #    column is timezone-aware, and comparing it to a naive
       #    datetime raises TypeError.
       if session.expires_at <= datetime.now(timezone.utc):
           await websocket.close(code=frames.CLOSE_AUTH_FAILED)
           return None

       # 5. A live session does not guarantee a live user.
       result = await db.execute(select(User).where(User.id == session.user_id))
       user = result.scalar_one_or_none()
       if user is None:
           await websocket.close(code=frames.CLOSE_AUTH_FAILED)
           return None

       return user
   ```

2. Note what this does *not* do: it does not delete the expired session row. Developer C's `get_current_user` does delete it. Yours does not, because deleting inside a read path means a write on every socket connection, and his HTTP path will clean it up anyway. Mentioning that you noticed is a good evaluation answer.

3. Now rewrite `app/realtime/ws.py`, replacing the echo:

   ```python
   from fastapi import APIRouter, WebSocket, WebSocketDisconnect

   from ..db.database import session_maker
   from . import frames
   from .ws_auth import authenticate_socket

   router = APIRouter()


   @router.websocket("/ws")
   async def websocket_endpoint(websocket: WebSocket):
       await websocket.accept()

       # A session ONLY for the length of the auth check, then returned
       # to the pool. See the note below for why this is not Depends().
       async with session_maker() as db:
           user = await authenticate_socket(websocket, db)
       if user is None:
           return  # authenticate_socket already closed the socket

       await websocket.send_json(
           {
               "type": frames.READY,
               "user_id": str(user.id),
               "username": user.username,
           }
       )

       try:
           while True:
               frame = await websocket.receive_json()
               await websocket.send_json({"type": "echo", "received": frame})
       except WebSocketDisconnect:
           pass
   ```

4. Read this twice, because it is the difference between chat that works with four users and chat that dies with twenty. Developer C's HTTP endpoints take a session via `Depends(get_async_session)`, which is right for HTTP — the request lasts milliseconds. **A WebSocket lasts hours.** With `Depends` on a socket endpoint, every connected user holds one database connection for their entire session; the pool is small, and at roughly fifteen users everything freezes with no error. So: short `async with session_maker() as db:` blocks around each operation, never a session that outlives a single operation. Same rule every day after this.

**Where do I put the files?**

```
back/app/realtime/
├── frames.py
├── ws_auth.py     ← new today
└── ws.py          ← rewritten today
```

**How do I know I'm done?**
Connecting with a valid cookie returns a `ready` frame with your username. Connecting with no cookie, a garbage cookie, or a logged-out cookie closes with `4001`.

**How do I test?**

1. Build the test client you will use every day from here. Put this in `back/tools/ws_client.py`:

   ```python
   """Manual socket client.

   Usage:  python3 tools/ws_client.py <session_id>

   Type raw JSON lines to send, e.g.
     {"type": "message.send", "conversation_id": "...", "body": "hi"}
   Everything the server sends is printed with a << prefix.
   """
   import asyncio
   import sys

   import websockets

   URL = "ws://localhost:8000/ws"


   async def read_from_server(ws):
       async for raw in ws:
           print("<<", raw, flush=True)


   async def read_from_keyboard(ws):
       loop = asyncio.get_running_loop()
       while True:
           # readline() blocks. Calling it directly in an async function
           # would freeze the event loop including read_from_server.
           # run_in_executor moves it to a thread.
           line = await loop.run_in_executor(None, sys.stdin.readline)
           if not line:
               return
           line = line.strip()
           if line:
               await ws.send(line)


   async def main(session_id):
       # The cookie goes in the handshake headers, exactly as a browser
       # would send it. No auth frame needed.
       async with websockets.connect(
           URL, additional_headers={"Cookie": f"session_id={session_id}"}
       ) as ws:
           await asyncio.gather(read_from_server(ws), read_from_keyboard(ws))


   if __name__ == "__main__":
       asyncio.run(main(sys.argv[1]))
   ```

   If your `websockets` version rejects `additional_headers`, use `extra_headers` instead — the parameter was renamed in version 14.

2. Pull Alice's session id straight out of her cookie jar and connect:

   ```bash
   cd /home/fangu/Desktop/transcendenc/PlayBook/back
   source .venv/bin/activate
   ALICE=$(grep session_id alice.cookies | awk '{print $7}')
   python3 tools/ws_client.py $ALICE
   ```

   You should immediately see `<< {"type": "ready", "user_id": "...", "username": "alice"}`.

3. Failure cases. Garbage cookie:

   ```bash
   python3 tools/ws_client.py not-a-uuid
   ```

   Expect close code `4001`.

4. A well-formed UUID that is not a real session:

   ```bash
   python3 tools/ws_client.py 00000000-0000-4000-8000-000000000000
   ```

   Also `4001`.

5. The revocation test — the one JWT could not pass. With Alice's socket open, log her out in another terminal:

   ```bash
   curl -b alice.cookies -X POST http://localhost:8000/auth/logout
   ```

   Her existing socket stays open for now (Day 13 fixes that), but a **new** connection with the same session id is refused with `4001`. Confirm it, then log her back in to get a fresh cookie.

**Common beginner mistakes**
Calling `receive_json()` before `accept()`. Using `http://` instead of `ws://`. Comparing `expires_at` against a naive `datetime.now()`, which raises `TypeError` — always `datetime.now(timezone.utc)`. Hardcoding `"session_id"` instead of reading `settings.session_cookie_name`. Importing from `app.routers.deps`, which moved. And putting `Depends(get_async_session)` on the socket endpoint — re-read step 4.

---

*Days 3 through 21 continue below.*
