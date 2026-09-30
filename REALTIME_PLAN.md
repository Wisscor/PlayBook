# Realtime Plan — Developer R

*Monolith. Sep 17 → Oct 10, 2026. Rewritten against Developer C's commit `05b9b7c` (cookie sessions, argon2).*

---

> ## Status check — Sep 20, 2026 (today)
>
> Verified directly against the working tree and `origin/Core-Dev`, not assumed:
>
> - **Oct 10 is a fixed calendar date, not "14 days from whenever we start."** From today that is 20 calendar days / 14 working days if you subtract two weekends — that is almost certainly where the "14 days" figure people are repeating came from. Anchor every estimate to **Oct 10**, and pull from the three built-in slack days (Sep 25, Sep 30, Oct 9) when something runs long — do not silently push the end date.
> - Per the table below, today is **Day 3**. The actual repo is not there yet: the merge started against `origin/Core-Dev` is still open (12 files under conflict — real list in Task 0.1 below), and `app/realtime/frames.py`, `ws_auth.py`, `registry.py`, `service.py`, `schemas.py`, `models.py`, `rest.py` are all still empty stub files (`ws.py` still just echoes). That's Day 0/Day 1 progress, not Day 3 — call it roughly two working days behind. Nothing here is unrecoverable, but it means the first slack day (Sep 25) is likely already spoken for.
> - The JWT → session rewrite in Days 0–2 below (handshake auth, user identification, dependencies, tests) has been cross-checked line-by-line against the real `origin/Core-Dev` code (`config.py`, `security.py`, `core/deps.py`, `models/session.py`, `routers/auth.py`) and matches. Nothing in Days 3–21 (now written out, same 8-heading format) references JWT or the old token flow — there was nothing auth-related left to port there.
> - This pass also: corrected Task 0.1's root-cause for the merge conflicts (it previously blamed a rewritten history that never happened — see the correction there), added an Origin-check task (2.4) the plan never covered, fixed the pre-accept-close-returns-HTTP-403-not-a-close-code detail and the `Origin: None` non-browser-client bug in that same task, moved `allowed_origins` out of Core-Dev's `config.py` into `app/realtime/`, and corrected the frontend dev origin to `localhost:3000` (Next.js default — `front/` has no `package.json` yet, confirmed via `origin/Home`'s `package.json`/Dockerfile, so treat the port as inferred, not observed running). See the changelog for the full list.
> - **Cut order if the ~2-day slip isn't recovered:** Day 14–15 (search) first, Day 16–17 (GDPR) second — both marked bonus already, see the note at the very end of this file. Don't cut Day 19 (rehearsal) to save either.

---

## START HERE — two things are broken before any of this matters

### 1. Your merge is stuck — here is what is actually happening

Right now your clone has **12 conflicted files** sitting in an unfinished merge (`git merge origin/Core-Dev` was started and never finished): `main.py`, `user.py`, `auth.py`, `requirements.txt`, `README.md`, `database.py`, `config.py`, `security.py`, `comment.py`, `like.py`, `post.py` all contain `<<<<<<<` markers, plus `routers/user.py` which he deleted outright.

**Correction to an earlier draft of this section:** it claimed Developer C rewrote his branch history and that `f712917` became `7c5b1e9` under a new hash. That is not what the commit graph shows, and if you're reading an older printout that says otherwise, don't act on it. `git log --oneline` on both branches confirms: they share a real common ancestor at `d76ee01`, and `f712917` (17 files, by `zouazrou`, "wip: save progress to continue on another machine") is a normal commit that only ever existed on `Realtime-Dev` — it was never on Core-Dev under any hash. `7c5b1e9` is a *different*, older commit ("...'get_current_user'") that both branches already share below `d76ee01`. Nothing was rewritten. This is just two branches that diverged normally and both touched the same files — which is what merge conflicts are supposed to look like.

**That changes the fix.** Because there's no duplicated/superseded history to skip over, do **not** run `git rebase --onto origin/Core-Dev f712917 Realtime-Dev` if you see that command anywhere — `--onto` replays only the commits *after* `f712917`, which silently drops `f712917` itself (17 files, 153 lines) from the result with no warning and no conflict to catch it. Some of that content is superseded by Core-Dev's later commits, but not verified to be all of it.

**Do this instead:** resolve the open merge in place. It's the same 12 files either way, but resolving the live merge keeps `f712917` in the history and doesn't require a force-push to a shared branch. Your own two commits (`2a2e0eb` the empty scaffold, `c5b7bc4` the echo socket) aren't touched by any of this — they sit on top of the merge either way.

**Verified conflict list** (`git status`, checked today):

| File | What's actually conflicting |
|---|---|
| `back/app/main.py` | Import line (`FastAPI` vs `FastAPI, Header, Response`) and a stray `@app.get("/")` root route on your side vs his `/header/{name}/{value}` debug route |
| `back/app/core/config.py` | Both added (`AA`) — his side adds the `Literal` import and six `session_*` settings; JWT settings (`algorithm`, `secret_key`, `access_token_expire_minutes`) stay on both sides since `config.py` still declares them even though they're unused now |
| `back/app/core/security.py` | Both added (`AA`) — full JWT (`jose`, `passlib`, `create_access_token`/`create_refresh_token`/`decode_token`, plus the `colorama` debug prints) vs full argon2 (`hash_password`/`verify_password` only, 15 lines) |
| `back/app/routers/auth.py` | The whole file: `/auth/register` (form data, `TokenPair`) vs `/auth/signup` (JSON, `UserResponse`) and JSON `/auth/login` with `username_or_email`; his side adds `/auth/logout` and rewires `/auth/me`'s import path |
| `back/app/requirements.txt` | `bcrypt<4.1.0` vs `argon2-cffi` |
| `back/app/db/database.py` | Cosmetic only — `async_sessionmaker(engine, ...)` vs `async_sessionmaker(bind=engine, class_=AsyncSession, ...)`, same behavior |
| `back/app/models/user.py`, `comment.py`, `like.py`, `post.py` | Not auth-related — old `Column(...)` declarative style vs SQLAlchemy 2.0 `Mapped[...]` typed style. `user.py` additionally gains the `sessions` relationship on his side |
| `back/app/routers/user.py` | Deleted on his side (`UD`) — decide whether to keep or drop |
| `back/README.md` | Docs only — still shows `POST /auth/register`, needs the signup/login/logout endpoints documented either way |

Already resolved cleanly, no action needed: `back/app/core/deps.py` (new file, only ever existed on his side — this is the WebSocket auth's dependency, see Task 2.1), `back/app/models/session.py` (new), `back/app/schemas/user.py` and `schemas/__init__.py` (already merged to `UserSigup`/`UserLogin` with `username_or_email`), `back/.gitignore` (new). **`app/realtime/` has zero conflicts** — Core-Dev never touched it, so whatever you build there merges in clean regardless of how the rest of this merge gets resolved.

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

## Task 0.1 — Resolve the open merge with Core-Dev

**What am I doing?**
Finishing the `git merge origin/Core-Dev` that's already sitting open in your tree: resolving the 12 conflicted files, keeping his session-auth code over your old JWT code wherever the two disagree, and closing it with a normal commit.

**Why am I doing this?**
The conflicts exist because `Realtime-Dev` and `Core-Dev` diverged normally from a shared commit (`d76ee01`) and both branches independently edited the same files (`main.py`, `config.py`, `security.py`, `auth.py`, the model files, `requirements.txt`). That's it — no rewritten history, nothing exotic. Your own two commits (`2a2e0eb` the scaffold, `c5b7bc4` the echo socket) touch `app/realtime/` and three lines of `main.py`, which is why they carry no conflicts of their own; the 12 conflicts all belong to files you don't own the content of, so the resolution rule is simple: take his side on anything auth-related, keep whatever of yours doesn't overlap.

**What do I need to learn first?**
Nothing new — this is an ordinary merge conflict. If you haven't resolved one by hand before, search `git resolve merge conflict markers`: for each file, edit out the `<<<<<<<`/`=======`/`>>>>>>>` lines, keep the code you want, `git add` the file, then `git commit` once every file is resolved (a merge conflict is closed with a plain commit, not `--continue`).

**Steps in detail**

Resolve the 12 files listed above in the merge that's already open — no abort, no rebase, no force-push. File by file:

1. `back/app/core/security.py`, `back/app/routers/auth.py` — this feature is moving to sessions, so take **his** (`origin/Core-Dev`) side of both files wholesale and delete the JWT side (the `jose`/`create_access_token`/`decode_token` code and the `/auth/register` + form-based `/auth/login`).

2. `back/app/core/config.py` — keep both halves: his `Literal` import and the six `session_*` settings, plus the existing `database_url`/`algorithm`/`secret_key` fields (still required even though JWT no longer reads them — `Settings()` fails to construct without them since they have no default).

3. `back/app/requirements.txt` — take `argon2-cffi`; drop the `bcrypt<4.1.0` pin. `passlib` is now unused by either side — flag it to Developer C rather than deleting it unilaterally, since dropping a dependency someone else's branch might still reference is his call.

4. `back/app/db/database.py`, `back/app/models/user.py`, `comment.py`, `like.py`, `post.py` — take his `Mapped[...]`-typed side. This isn't optional for `user.py`: it's the one that adds the `sessions` relationship, and `models/session.py` (already merged in cleanly) points back at it.

5. `back/app/routers/user.py` — he deleted it (`UD`). Confirm with him before deciding whether to keep it or accept the deletion; don't silently resurrect or drop a file you don't own.

6. `back/README.md` — not code, resolve to whatever's accurate (it still documents `/auth/register`, which no longer exists either way).

7. `back/app/main.py` — the one file you both actually edited. It will look like this:

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

8. Stage every resolved file and close the merge with a plain commit (not `rebase --continue` — there is no rebase here):

   ```bash
   git add back/app/main.py back/app/core/config.py back/app/core/security.py \
           back/app/db/database.py back/app/models/user.py back/app/models/comment.py \
           back/app/models/like.py back/app/models/post.py back/app/requirements.txt \
           back/README.md back/app/routers/auth.py back/app/routers/user.py
   git commit
   ```

   (`git add` on a path git has marked "deleted by them" accepts the deletion; if you're keeping `routers/user.py` instead, restore it before adding.)

9. Verify. His session files should be present alongside your realtime folder, and your two commits (plus this merge commit) sit on top:

   ```bash
   ls back/app/core/deps.py back/app/models/session.py back/app/realtime/ws.py
   git log --oneline -6
   grep -rn '<<<<<<<' back/app/ || echo "no conflict markers left"
   ```

10. Push normally — history wasn't rewritten, so no force is needed:

    ```bash
    git push
    ```

**Where do I put the files?**
No new files. This resolves the 12 files already listed above.

**How do I know I'm done?**
`git status` reports a clean tree on `Realtime-Dev`, no `<<<<<<<` markers remain anywhere under `back/app/`, and `back/app/models/session.py` exists.

**How do I test?**

```bash
git status
git log --oneline -6
ls back/app/models/session.py back/app/core/deps.py
grep -rn '<<<<<<<' back/app/ || echo "no conflict markers left"
```

**Common beginner mistakes**
Trying `git rebase --continue` on a plain merge — it errors because there's no rebase in progress; the merge closes with `git commit`. Force-pushing when nothing required it, which risks a teammate's meanwhile-pushed work for no reason. Resolving `auth.py`/`security.py` by keeping bits of both sides instead of taking Core-Dev's session version wholesale — a half-JWT-half-session `auth.py` won't import (`jose` may not even be installed) and will look like a mystery failure on Day 1. And committing with conflict markers still in a file because a resolved-looking merge tool left one behind — always run the `grep` in step 9 before trusting a green `git status`.

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

2. Add the second part. **Not** the history-rewrite claim from an earlier draft of this plan — that turned out to be wrong (see the correction in Task 0.1) and nothing here needs it. What's real: `back/.env` is tracked with a live `SECRET_KEY` in it, `back/.gitignore` doesn't exclude `.env` even after today's cleanup, and `git log --all -- back/.env` shows it first entered history on *your* branch, in your commit `7c5b1e9`, before `Realtime-Dev` and `Core-Dev` even split — it's shared ancestor history, not mine. It's absent from `main`, present on both `Core-Dev` and `Realtime-Dev`. That means one branch purging it alone doesn't fix anything — the other branch still has it and will reintroduce it on the next merge. Suggest:

   > Two things on `.env`: it's tracked with a real `SECRET_KEY` in it — `git log --all -- back/.env` shows it started in your commit `7c5b1e9`, so it's in both our branches' shared history. Rotating the key is the urgent part, today. Purging it from history is a joint job (it has to happen on both branches or the other one just brings it back) — can you add `.env` to `.gitignore` now so it stops recurring, and we pick a time to run `git filter-repo` together?

3. If any history *does* get rewritten later — by either of you — say so before anyone else pulls. A force-push onto a branch someone else has checked out is what actually causes stuck merges; that's worth avoiding regardless of whose branch it is.

4. Ask the ownership question for Day 12 now, because the answer takes days to arrive:

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

## Task 2.4 — Check the Origin header on the handshake

**What am I doing?**
Rejecting a WebSocket handshake whose `Origin` header isn't your own frontend, before `authenticate_socket` even runs.

**Why am I doing this?**
This is a gap in the session design, not something carried over from the JWT plan — JWT never needed it because a JWT had to be attached deliberately by JavaScript on your own page. A cookie doesn't work that way: it's attached by the browser to *any* request to your origin, including a `new WebSocket("ws://your-api/ws")` opened by a page on a completely different site. Checked today: nothing in `back/app/main.py` or anywhere else registers `CORSMiddleware`, and nothing reads the `Origin` header on the socket route.

One correction from the previous draft: modern browsers (Chrome/Firefox/Safari, current versions) do **not** attach `SameSite=Lax` cookies to a cross-site WebSocket handshake — a WS upgrade request is treated as a subresource fetch, not top-level navigation, so `Lax` already blocks it in practice. That weakens but doesn't remove the reason for this task: `Lax` is a browser behavior you're trusting, not something your server enforces, it doesn't protect non-browser or misconfigured clients, and `session_cookie_same_site` is a setting Core-Dev owns and could change (e.g. to `"none"` for a cross-subdomain frontend) without realtime/ noticing. The Origin check makes the guarantee explicit and server-side instead of implicit and browser-side — defense in depth, not a fix for a hole that's otherwise open today.

**What do I need to learn first?**
Search: `websocket.headers.get("origin")`. `WebSocket` exposes headers the same way `Request` does. Also: closing a `WebSocket` *before* `accept()` doesn't deliver a close code to the client at all — see the note in step 2.

**Steps in detail**

1. Add the allowed origin(s) inside `app/realtime/`, not `app/core/config.py` — that file is Core-Dev's, and this setting has no HTTP-side use yet (there's no `CORSMiddleware` to share it with). Put it in `app/realtime/frames.py` or a new `app/realtime/ws_config.py`, whichever you'd rather grow later:

   ```python
   # app/realtime/ws_config.py
   ALLOWED_ORIGINS = {
       "http://localhost:3000",   # Next.js `next dev` default (frontend has no package.json yet — confirm once it exists)
       "http://localhost:4000",   # front/playbook-web's Dockerfile sets PORT=4000 for `next start` in prod
       None,                      # same-origin / non-browser clients send no Origin header at all
   }
   ```

   If Core-Dev later adds `CORSMiddleware` for the HTTP side, ask him to import this set rather than you importing a setting of his — keeps the dependency pointing one direction.

2. Check it first thing inside `websocket_endpoint`, before `accept()` — and note what "before `accept()`" actually does: `WebSocket.close()` called pre-accept doesn't send a WebSocket close frame (the connection was never upgraded to a WebSocket), it makes uvicorn respond to the handshake with a plain **HTTP 403**. The `code=` argument is accepted but never reaches the client. Real WS close codes like `4001` only exist for closes that happen *after* `accept()` — which is exactly what `authenticate_socket` does on Day 2, so nothing there changes.

   ```python
   from .ws_config import ALLOWED_ORIGINS

   @router.websocket("/ws")
   async def websocket_endpoint(websocket: WebSocket):
       if websocket.headers.get("origin") not in ALLOWED_ORIGINS:
           await websocket.close()   # → HTTP 403 to the handshake, not a WS close code
           return

       await websocket.accept()
       ...
   ```

   `None` is in the set explicitly, from step 1 — don't write `if origin and origin not in ALLOWED_ORIGINS`, which silently *skips* the check for every non-browser client (`tools/ws_client.py`, your own test scripts, `curl`) since none of them send an `Origin` header. Listing `None` makes that a deliberate allow, not an accidental one.

**Where do I put the files?**
New `app/realtime/ws_config.py`; edit inside `app/realtime/ws.py`. Nothing in `app/core/`.

**How do I know I'm done?**
A handshake with a matching `Origin`, or none at all (`tools/ws_client.py`), still connects and gets a `ready` frame. A handshake claiming `Origin: http://evil.example` gets an HTTP 403 at the handshake — never a WebSocket connection, never a `4001` close frame.

**How do I test?**

```bash
# no Origin header (this is how tools/ws_client.py connects) — must still work
python3 tools/ws_client.py $ALICE

# forge a bad Origin with curl's raw handshake — expect HTTP/1.1 403, not a 101 Switching Protocols
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Origin: http://evil.example" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  -b alice.cookies http://localhost:8000/ws
```

**Common beginner mistakes**
Writing `if origin and origin not in ALLOWED_ORIGINS` instead of putting `None` in the set — that exempts every non-browser client from the check entirely, defeating the point. Expecting `4001` on the curl test and being confused when you see `403` instead — that's correct, pre-accept closes are always HTTP-level. Checking `Origin` after `accept()`, which spends a full round trip talking to a client you're about to reject. And trusting `Origin` as a substitute for `authenticate_socket`'s cookie/session checks — it isn't; it's a browser-enforced header, meaningless to `curl`/`websockets`-library clients, so the real auth check in Task 2.3 stays mandatory regardless.

---

## Known dependencies and open risks (session-auth side effects, not covered elsewhere)

**Session store is Core-Dev's code, not yours, and everything here depends on it staying shaped this way.** `ws_auth.py` (Task 2.3) imports `Session` from `..models.session` and reads `Session.id`, `Session.user_id`, `Session.expires_at` directly — there's no abstraction between your socket auth and his ORM model. If he changes the `sessions` schema, renames the cookie setting, or moves session validation logic, `app/realtime/` breaks silently at runtime, not at merge time, since `app/realtime/` never conflicts with his branch (see the conflict table in Task 0.1). Worth an explicit ask in the Task 0.3 message: ping you before changing anything under `models/session.py`, `core/deps.py`, or the `session_*` settings.

The store itself is **Postgres, not Redis** — confirmed in `models/session.py` (a plain SQLAlchemy model, `sessions` table) and in Task 0.4's reasoning (single process, in-memory connection registry, no Redis anywhere in `requirements.txt`). That means every socket auth check in `ws_auth.py` is a real DB round-trip through the same connection pool HTTP requests use — fine at the class's scale, but it's why Task 2.3 step 4 is emphatic about short-lived `async with session_maker()` blocks rather than one session per socket lifetime.

**Logout does not close open sockets yet — this is real today, not just a Day 13 future feature.** Confirmed in Task 2.3 step 5 of this file: revocation blocks a *new* connection attempt (the session row is gone, so `authenticate_socket` fails), but a socket that was already open when the user logged out keeps receiving and sending on the old, now-revoked session until Day 13's disconnect-on-logout is built. Between today and Day 13, anyone reviewing the app mid-build should expect that gap rather than read it as a bug.

---

## Day 3 — Sep 20 (today) — Many sockets per user, tracked correctly

**What am I doing?**
Building `registry.py`: an in-memory map from `user_id` to the *set* of that user's live `WebSocket` connections, plus register/unregister hooks around the Day 2 connection lifecycle.

**Why am I doing this?**
One user can have two tabs or a phone and a laptop open at once. Day 6 (fan-out) and Day 8 (presence) both need "every socket for user X," not "the socket for user X" — a plain `dict[UUID, WebSocket]` breaks the moment someone opens a second tab. This dict lives in process memory, which is the concrete thing Task 0.4's "single process" rule protects.

**What do I need to learn first?**
Nothing new — a dict of sets.

**Steps in detail**

1. `app/realtime/registry.py`:

   ```python
   from collections import defaultdict
   from uuid import UUID
   from fastapi import WebSocket

   _connections: dict[UUID, set[WebSocket]] = defaultdict(set)

   def register(user_id: UUID, ws: WebSocket) -> None:
       _connections[user_id].add(ws)

   def unregister(user_id: UUID, ws: WebSocket) -> None:
       _connections[user_id].discard(ws)
       if not _connections[user_id]:
           del _connections[user_id]

   def connections_for(user_id: UUID) -> set[WebSocket]:
       return _connections.get(user_id, set())

   def online_user_ids() -> set[UUID]:
       return set(_connections.keys())
   ```

2. Wire into `ws.py`: `register(user.id, websocket)` right after auth succeeds, before sending `ready`. Wrap the receive loop in `try/finally` and put `unregister(user.id, websocket)` in the `finally` — not just in the `except WebSocketDisconnect` branch, or an unhandled exception leaks the entry forever.

**Where do I put the files?**
`app/realtime/registry.py` (fills the stub); edits in `ws.py`.

**How do I know I'm done?**
Two `tools/ws_client.py` connections as the same user both register; `connections_for(alice.id)` has length 2; closing one drops it to 1, not 0.

**How do I test?**
Temporarily log `len(connections_for(user.id))` right after `register()`; open two terminals as Alice, confirm 1 then 2; close one, confirm it drops back to 1.

**Common beginner mistakes**
Cleaning up only in `except WebSocketDisconnect` — leaks on any other exception. Using `dict[UUID, WebSocket]` instead of a set — breaks on the second tab. Skipping the `del` on empty — `online_user_ids()` (Day 8) would then report a user online after their last tab closed.

---

## Day 4 — Sep 21 — Your three tables exist

**What am I doing?**
Filling in `models.py`: `Conversation`, `ConversationParticipant`, `Message`. Three tables — a fourth (`Notification`) comes on Day 9, once there's something to notify about. Don't build it early.

**Why am I doing this?**
Every task from Day 5 on persists through these.

**What do I need to learn first?**
Nothing beyond what `models/session.py` already showed — same `Mapped[...]` style, same `Base`.

**Steps in detail**

```python
# app/realtime/models.py
import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from ..db.database import Base


class Conversation(Base):
    __tablename__ = "conversations"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class ConversationParticipant(Base):
    __tablename__ = "conversation_participants"
    __table_args__ = (UniqueConstraint("conversation_id", "user_id"),)
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    last_read_message_id: Mapped[uuid.UUID | None] = mapped_column(default=None)  # Day 10


class Message(Base):
    __tablename__ = "messages"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"), index=True
    )
    sender_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
```

**Where do I put the files?**
`app/realtime/models.py` (fills the stub).

**How do I know I'm done?**
The existing `lifespan` hook in `main.py` (Core-Dev's `create_all`, untouched) picks these up on next startup — `\dt` lists `conversations`, `conversation_participants`, `messages`.

**How do I test?**
```bash
docker compose -f back/docker-compose.yaml down -v && docker compose -f back/docker-compose.yaml up -d
uvicorn app.main:app --reload &
docker exec -it CONTAINER_NAME psql -U ziko -d mydb -c "\dt"
```

**Common beginner mistakes**
Defining the models but never importing `models.py` anywhere — `create_all` only sees classes whose module has actually been imported at least once; importing it from `ws.py` or `realtime/__init__.py` is enough, but something has to. Adding a `relationship("User", ...)` back on `user.py` — you don't own that file; query by `user_id` instead of reaching for a bidirectional relationship you'd have to ask Core-Dev to add his side of.

---

## Day 5 — Sep 22 — A message over the socket lands in Postgres

**What am I doing?**
`service.create_message()`, and dispatch in `ws.py` for the `frames.MESSAGE_SEND` frame Day 2 already named but never handled.

**Why am I doing this?**
First real use of the message-type constants from Task 2.2.

**What do I need to learn first?**
Nothing new.

**Steps in detail**

```python
# service.py
async def create_message(db, sender_id, conversation_id, body: str) -> Message:
    is_participant = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == sender_id,
        )
    )
    if is_participant.scalar_one_or_none() is None:
        raise PermissionError("not a participant")
    message = Message(conversation_id=conversation_id, sender_id=sender_id, body=body)
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message
```

```python
# ws.py, inside the receive loop
frame = await websocket.receive_json()
match frame.get("type"):
    case frames.MESSAGE_SEND:
        async with session_maker() as db:
            message = await service.create_message(
                db, user.id, UUID(frame["conversation_id"]), frame["body"]
            )
    case _:
        await websocket.send_json({"type": frames.ERROR, "detail": "unknown type"})
```

**Where do I put the files?**
Edits in `service.py`, `ws.py`.

**How do I know I'm done?**
A `message.send` frame from `ws_client.py` produces a row in `messages`.

**How do I test?**
Send the frame; `psql -c "SELECT * FROM messages;"`.

**Common beginner mistakes**
Skipping the participant check — without it, any authenticated user can post into any conversation by guessing a UUID; this is the same authz gap the `get_current_user`-style checks exist to prevent elsewhere, just on your own table this time. Opening one `db` session for the whole connection instead of a fresh `async with session_maker()` per frame — the rule from Task 2.3 step 4 applies to every DB touch inside `ws.py`, not just the auth check.

---

## Day 6 — Sep 23 — Two browsers, two users, instant delivery

**What am I doing?**
After `create_message()` commits, look up the conversation's other participants and push a `message.new` frame to every one of their live sockets via `registry.connections_for()`.

**Why am I doing this?**
Persistence without delivery isn't chat.

**What do I need to learn first?**
Nothing new.

**Steps in detail**

```python
# service.py
async def get_participant_ids(db, conversation_id) -> list[uuid.UUID]:
    rows = await db.execute(
        select(ConversationParticipant.user_id).where(
            ConversationParticipant.conversation_id == conversation_id
        )
    )
    return [r for (r,) in rows.all()]
```

```python
# ws.py, after create_message() in the Day 5 handler
participant_ids = await service.get_participant_ids(db, message.conversation_id)
payload = {
    "type": frames.MESSAGE_NEW,
    "id": str(message.id),
    "conversation_id": str(message.conversation_id),
    "sender_id": str(message.sender_id),
    "body": message.body,
    "created_at": message.created_at.isoformat(),
}
for pid in participant_ids:
    for ws in list(registry.connections_for(pid)):
        await ws.send_json(payload)
```

Send to every participant including the sender — that's *why* Day 3 tracks a set of sockets per user, so the sender's other tabs get it too, not just the recipient.

**Where do I put the files?**
Edits in `service.py`, `ws.py`.

**How do I know I'm done?**
Alice and Bob each run `ws_client.py` in a shared conversation; a message Alice sends appears on Bob's terminal instantly, no reload or poll.

**How do I test?**
Two terminals.

**Common beginner mistakes**
Iterating `registry.connections_for(pid)` directly instead of `list(...)` first — another coroutine can register/unregister mid-loop (this function `await`s inside the loop), and mutating a set while iterating it raises `RuntimeError`. Deciding ad hoc whether the sender receives their own broadcast instead of deciding it once and documenting it (Day 18) — the frontend needs to know which one you chose.

---

## Day 7 — Sep 24 — Reload the page, history is still there

**What am I doing?**
`rest.py`: `GET /realtime/conversations/{id}/messages`, cursor-paginated, plain HTTP using Core-Dev's `get_current_user` — this one *is* a normal `Depends(get_async_session)` endpoint, unlike anything in `ws.py`, because an HTTP request completes in milliseconds; Task 2.3 step 4's warning is about long-lived sockets, not this.

**Why am I doing this?**
A page reload is an HTTP request, not a still-open socket.

**What do I need to learn first?**
Search: `keyset pagination sql`. Not `OFFSET` — offset pagination skips or duplicates rows when new messages keep arriving between page fetches, which they will, constantly, in a chat app.

**Steps in detail**

```python
# rest.py
router = APIRouter(prefix="/realtime", tags=["realtime"])

@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: UUID,
    before: UUID | None = None,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    participant_ids = await service.get_participant_ids(db, conversation_id)
    if current_user.id not in participant_ids:
        raise HTTPException(status_code=403)
    query = select(Message).where(Message.conversation_id == conversation_id)
    if before is not None:
        anchor = await db.get(Message, before)
        query = query.where(Message.created_at < anchor.created_at)
    query = query.order_by(Message.created_at.desc()).limit(50)
    rows = (await db.execute(query)).scalars().all()
    return {"items": rows, "next_cursor": rows[-1].id if len(rows) == 50 else None}
```

Export this router (and `ws.py`'s) from `app/realtime/__init__.py` as one object, so the single agreed line in `main.py` (`app.include_router(realtime_ws.router)`) covers both without a second edit to his file.

**Where do I put the files?**
`app/realtime/rest.py` (fills the stub).

**How do I know I'm done?**
After closing `ws_client.py`, the GET endpoint returns the messages Days 5–6 persisted.

**How do I test?**
```bash
curl -b alice.cookies "http://localhost:8000/realtime/conversations/$CONV_ID/messages"
```

**Common beginner mistakes**
`OFFSET`-based paging — breaks under concurrent inserts. Forgetting the participant check — same hole as Day 5, new endpoint. Bundling a second `app.include_router()` call into `main.py` instead of merging the routers first — that would be a second edit to a file you agreed to touch in exactly three lines.

---

## Day 8 — Sep 26 — You can see who is online

**What am I doing?**
Presence, derived entirely from `registry.online_user_ids()` — no new table, no background job.

**Why am I doing this?**
Day 3 already tracks exactly the state presence needs.

**What do I need to learn first?**
Nothing new.

**Steps in detail**

In `ws.py`, right after `register()`: if this is the user's *first* connection (i.e., `connections_for(user.id)` had zero entries a moment ago), fetch their conversation partners (reuse `get_participant_ids` across all their conversations, or a dedicated query) and send each currently-connected one a `{"type": "presence", "user_id": ..., "online": true}`. Mirror the same check on `unregister()` — announce `online: false` only when the set becomes empty, not on every tab close.

**Where do I put the files?**
Edits in `ws.py`.

**How do I know I'm done?**
Alice connects; Bob, sharing a conversation with her, gets a `presence` frame with `online: true` — without polling or opening a new connection.

**How do I test?**
Two terminals; watch Bob's for the frame when Alice connects, and again when her last tab closes.

**Common beginner mistakes**
Announcing on every connection instead of only the first — spams "online" once per tab. Building "online" and never testing "offline" — the disconnect path is easy to leave broken since it's less visible in a quick manual test.

---

## Day 9 — Sep 27 — Offline users get notifications

**What am I doing?**
The fourth table, `Notification`; when Day 6's fan-out finds a recipient with zero registry connections, persist one instead of silently dropping the delivery attempt; flush undelivered notifications right after `ready` on that user's next connect.

**Why am I doing this?**
Day 6 only reaches sockets that exist *right now*. Without a queue, an offline user has no signal anything happened until they manually open the conversation and hit Day 7's history endpoint.

**What do I need to learn first?**
Nothing new.

**Steps in detail**

```python
# models.py addition
class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    message_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("messages.id"))
    delivered_at: Mapped[datetime | None] = mapped_column(default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
```

In Day 6's fan-out loop: if `registry.connections_for(pid)` is empty, `service.create_notification(db, pid, message.id)` instead of skipping silently. Right after `ready` in `ws.py`: fetch this user's `Notification` rows where `delivered_at is None`, send each as a `{"type": "notification", ...}` frame, then mark `delivered_at` — in the same short DB block, so a crash between send and mark doesn't lose the mark (send-then-commit, not commit-then-send).

**Where do I put the files?**
`models.py` addition, `service.py`, `ws.py`.

**How do I know I'm done?**
Message sent to offline Bob; when Bob connects later, he gets `notification` frames for what he missed, before he does anything else.

**How do I test?**
Send as Alice while Bob's `ws_client.py` isn't running; start it; observe the notification frames arrive right after `ready`.

**Common beginner mistakes**
Marking `delivered_at` before the send instead of after — a send that fails (client disconnects mid-flush) then never retries, and the user loses the notification permanently. Building this before Day 6 exists — there's nothing to notify about yet.

---

## Day 10 — Sep 28 — Unread counts and read receipts

**What am I doing?**
`last_read_message_id` on `ConversationParticipant` (added to the model back on Day 4, unused until now); handling `frames.READ`.

**Why am I doing this?**
No new table — reuses the per-(conversation, user) row Day 4 already created.

**What do I need to learn first?**
Nothing new.

**Steps in detail**

Client sends `{"type": "read", "conversation_id": ..., "message_id": ...}`. In `ws.py`'s dispatch, add a `case frames.READ:` that updates the caller's `ConversationParticipant.last_read_message_id` — only if the incoming message is newer than what's stored, comparing by `created_at` (a client re-sending a stale `read` frame after a reload race must not move the marker backward). Then broadcast `{"type": frames.READ, "user_id": ..., "conversation_id": ..., "message_id": ...}` to the *other* participants so their UI can show "seen." Unread count for a conversation = messages with `created_at` after the participant row's `last_read_message_id`'s timestamp (or all of them, if it's `None`).

**Where do I put the files?**
Edits in `ws.py`, `service.py`.

**How do I know I'm done?**
Bob sends `read`; Alice's client receives the read-receipt broadcast; the participant row updates.

**How do I test?**
Manual frame via `ws_client.py`, confirm via `psql`.

**Common beginner mistakes**
Letting `last_read_message_id` move backward on a stale/out-of-order `read` frame. Computing unread count with a naive `id`-ordering comparison instead of `created_at` — UUIDs (`uuid4`) aren't sortable by creation order the way an autoincrement int would be.

---

## Day 11 — Sep 29 — Dead connections detected; flooding refused

**What am I doing?**
Heartbeat (`frames.PING`/`PONG`, already named on Day 2) with a timeout that prunes unresponsive sockets; per-connection rate limiting that closes with `frames.CLOSE_RATE_LIMIT`.

**Why am I doing this?**
`registry` only removes entries on a *clean* close (Day 3's `finally`). A phone that loses signal or sleeps leaves a stale "connected" entry that Day 6's fan-out will keep trying, and failing, to write to. And nothing today stops a client from calling `message.send` in a tight loop.

**What do I need to learn first?**
Search: `asyncio gather concurrent websocket receive`. A socket can only be read from one coroutine at a time, so the ping-sender and the receive loop have to run as two concurrent tasks on the same connection, not one blocking loop — same shape you'll reuse for Day 13's session watch.

**Steps in detail**

```python
async def _heartbeat(websocket, last_pong: dict):
    while True:
        await asyncio.sleep(20)
        await websocket.send_json({"type": frames.PING})
        if time.monotonic() - last_pong["at"] > 45:
            await websocket.close(code=frames.CLOSE_RATE_LIMIT)  # or a dedicated dead-connection code
            return
```

Track `last_pong["at"] = time.monotonic()` whenever a `frames.PONG` frame arrives in the receive loop's `match`. Run heartbeat and the receive loop together: `await asyncio.wait([asyncio.create_task(receive_loop()), asyncio.create_task(_heartbeat(...))], return_when=asyncio.FIRST_COMPLETED)`, then cancel whichever task is still running.

For rate limiting: a per-connection `deque[float]` of recent `message.send` timestamps; on each one, drop timestamps older than 10s, and if what's left exceeds N, `close(code=frames.CLOSE_RATE_LIMIT)`.

**Where do I put the files?**
Edits in `ws.py`.

**How do I know I'm done?**
`kill -9` on a client process (not Ctrl-C, which still sends a clean close) leaves the registry entry until the heartbeat timeout, then it's pruned. A scripted send-loop trips `4002`.

**How do I test?**
Heartbeat: kill the client process abruptly, poll `registry.connections_for()`'s length until it drops. Rate limit: script rapid `message.send` frames from `ws_client.py`'s stdin, confirm the close code.

**Common beginner mistakes**
Writing heartbeat as a single blocking loop instead of a concurrent task alongside `receive_json()` — the receive loop then never gets a chance to run. Setting the rate-limit window tight enough to trip on normal fast typing.

---

## Day 12 — Oct 1 — `docker compose up` and chat works

**What am I doing?**
`back/Dockerfile`, a root `docker-compose.yml`, `back/.env.example` — the open question from Task 0.3.

**Why am I doing this?**
Checked today: no Dockerfile exists for `back/` anywhere, and no root compose file. `origin/Devops` has a real stack (Prometheus/Grafana, Elasticsearch) but that's observability — a different owner, different concern, not a substitute for this. If nobody's claimed it by now, this is the day to build it.

**What do I need to learn first?**
Nothing new.

**Steps in detail**

1. `back/Dockerfile` — `python:3.13-slim`, copy `requirements.txt`, `pip install`, copy `app/`, `CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`. No `--workers` — Task 0.4 still applies.
2. Root `docker-compose.yml` — `backend` (`build: ./back`) + the `postgres` service already defined in `back/docker-compose.yaml` (fold it in rather than keeping two compose files). Leave a commented `frontend` block with a TODO pointing at `origin/Home`'s `front/playbook-web/Dockerfile` (`PORT=4000`) rather than guessing its shape — it isn't merged into `Core-Dev` or `Realtime-Dev` yet.
3. `back/.env.example` — every key Task 1.1 lists as required (`DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`), placeholder values, so a fresh clone's setup is `cp .env.example .env`.

**Where do I put the files?**
`back/Dockerfile`, `PlayBook/docker-compose.yml`, `back/.env.example` — all new, all outside anything Core-Dev owns.

**How do I know I'm done?**
`docker compose up` from repo root starts everything; Day 1's signup/login smoke test and Day 2's `ws_client.py` check both pass with zero manual steps.

**How do I test?**
```bash
docker compose down -v && docker compose up --build
```
then rerun Task 1.2's curl checks and Task 2.3's `ws_client.py` connection against it.

**Common beginner mistakes**
Adding `--workers` "for performance" — breaks the in-memory registry per Task 0.4, and the failure looks like random missing messages, not a crash. Baking `SECRET_KEY` into the image/compose file instead of reading `.env` — the same mistake already flagged for the tracked `back/.env` in Task 0.3, just in a new place.

---

## Day 13 — Oct 2 — Logout kills live sockets

**What am I doing?**
A periodic session-recheck task per open connection — the same concurrent-task shape as Day 11's heartbeat — that closes with `frames.CLOSE_SESSION_ENDED` (4003) once the session row is gone.

**Why am I doing this?**
Task 2.3 confirmed logout only blocks *new* connections; an already-open socket keeps working on a revoked session until something checks. **You do not edit `routers/auth.py`'s logout endpoint** — it's Core-Dev's file, and the one standing rule in this plan is that `main.py`'s three lines are the only edit into his code. The fix has to be the socket independently watching the one table logout actually changes.

**What do I need to learn first?**
Nothing new beyond Day 11's `asyncio.wait`/`FIRST_COMPLETED` pattern.

**Steps in detail**

```python
async def _watch_session(websocket, session_id):
    while True:
        await asyncio.sleep(30)
        async with session_maker() as db:
            row = await db.execute(select(Session).where(Session.id == session_id))
            if row.scalar_one_or_none() is None:
                await websocket.close(code=frames.CLOSE_SESSION_ENDED)
                return
```

By this point `websocket_endpoint` runs three concurrent tasks per connection — receive loop, Day 11's heartbeat, this session watch — all under one `asyncio.wait(..., return_when=FIRST_COMPLETED)`, with the others cancelled (and `registry.unregister()` still firing) whichever one exits first.

**Where do I put the files?**
Edits in `ws.py`.

**How do I know I'm done?**
Log out Alice in one terminal while her `ws_client.py` runs in another; within ~30s her socket closes with `4003`, unprompted.

**How do I test?**
The Task 2.3 step 5 revocation scenario, extended: after `curl -b alice.cookies -X POST .../auth/logout`, watch the *already-open* `ws_client.py` terminal for the close, not just a new connection attempt.

**Common beginner mistakes**
Editing Core-Dev's logout to broadcast a disconnect event instead — that's the file-ownership rule broken for a feature that doesn't need it. Polling every second "to be safe" — a DB round-trip per open socket per second, for a race that isn't remotely that fast-moving.

---

## Day 14–15 — Oct 3–4 — Advanced search (Minor, +1)

Bonus. **First to cut** if the schedule slips further (see cut order below).

**What am I doing?**
Text search over messages, scoped to conversations the caller participates in.

**Why am I doing this?**
Marked minor/bonus in the original scope — ship the core chat solidly before spending two days here.

**What do I need to learn first?**
Nothing new for the simple version; skip full-text/trigram indexing unless there's slack left for it — it's not what earns the point.

**Steps in detail**
`rest.py` endpoint: `ILIKE '%term%'` over `Message.body`, filtered to `get_participant_ids()` the same way Day 7 is, same cursor pagination.

**Where do I put the files?**
`rest.py` addition.

**How do I know I'm done?**
Results only ever come from conversations the caller is actually in.

**How do I test?**
`curl` the endpoint with a known substring; confirm a conversation the caller isn't in never appears even with a matching term.

**Common beginner mistakes**
Leaking cross-conversation results — same authz check as Day 5/7, easy to forget on a new endpoint written under time pressure.

---

## Day 16–17 — Oct 5–6 — GDPR: export and delete account (Minor, +1)

Bonus. **Second to cut** if still behind after cutting search.

**What am I doing?**
Export a user's messages/conversations as JSON; decide (don't just assume) what happens to their messages on account deletion.

**Why am I doing this?**
Minor/bonus, and what you actually own here is narrow — the `users` row itself is Core-Dev's, and there's no "delete my account" endpoint in his code yet either. A full GDPR delete needs both sides; you can only build the messages/notifications half unilaterally.

**What do I need to learn first?**
Nothing new.

**Steps in detail**
Export: `rest.py` endpoint returning all messages the caller sent plus all conversations they're in. Deletion: no FK cascade from `users` into `messages` exists (Day 4 didn't add one) — decide whether messages survive sender deletion anonymized (`sender_id` nulled or a placeholder) or hard-delete, write `service.on_user_deleted(db, user_id)` implementing that choice, and hand it to Core-Dev to call from whatever his eventual delete-account endpoint turns out to be — wiring that call in is his edit, not yours.

**Where do I put the files?**
`rest.py`; `service.py`.

**How do I know I'm done?**
Export is complete and accurate for a seeded user; the deletion behavior is written down and agreed with Core-Dev, not silently assumed.

**How do I test?**
Manual — export a seeded user, diff against known rows.

**Common beginner mistakes**
Assuming a future `DELETE /users/{id}` will just cascade into your tables — it can't, no FK was designed for it. This needs the explicit conversation in "Open questions for Core-Dev," not code written in isolation.

---

## Day 18 — Oct 7 — Protocol README and frontend handoff

**What am I doing?**
Documenting every frame in `frames.py`, the connect/close semantics (cookie-carried handshake, Origin requirement from Task 2.4, every close code and what triggers it), and updating `back/README.md`'s endpoint list, which still shows the pre-session `/auth/register`.

**Why am I doing this?**
`front/` is currently an empty stub (confirmed while checking Task 2.4's allowed-origin port) — whoever builds it needs this instead of reading `ws.py`.

**What do I need to learn first?**
Nothing new.

**Steps in detail**
Extend the README section already touched during Task 0.1's merge resolution: connection (`new WebSocket("ws://host/ws")`, cookie attaches automatically, no auth frame), every `frames.py` constant with direction and payload shape, every close code (`4001` from `ws_auth.py`'s post-accept checks vs. the HTTP-403-not-4001 behavior of Task 2.4's pre-accept Origin check — don't conflate the two), and the REST endpoints from Days 7/14–17.

**Where do I put the files?**
`back/README.md` edits only.

**How do I know I'm done?**
Someone who's read only the README — not `ws.py` — could write a client that connects, sends a message, and correctly handles a logout-triggered close.

**How do I test?**
Hand it to whoever's building `front/` and see where they get stuck.

**Common beginner mistakes**
Documenting the happy path and skipping close codes — that's exactly what a frontend dev can't infer by guessing.

---

## Day 19 — Oct 8 — Full rehearsal against a clean database

**What am I doing?**
`docker compose down -v && docker compose up --build`, then walking every prior task's "How do I test?" in order, as if grading it.

**Why am I doing this?**
Better to find a broken step here than during the defense.

**What do I need to learn first?**
Nothing new.

**Steps in detail**
Re-run the test commands from Days 1–17 in sequence against the fresh container. Note anything that only worked because of leftover local state from earlier manual testing.

**Where do I put the files?**
No new files.

**How do I know I'm done?**
Everything passes from a genuinely clean container, no manual patching mid-rehearsal.

**How do I test?**
The rehearsal is the test.

**Common beginner mistakes**
Rehearsing against the existing dev database instead of a fresh one — hides exactly the "works on my machine" bugs this day exists to catch.

---

## Day 21 — Oct 10 — Defense prep, final push

**What am I doing?**
Final pass, and rehearsing the defense Q&A.

**Why am I doing this?**
Last day.

**What do I need to learn first?**
Nothing new.

**Steps in detail**
Two answers worth having cold, updated for sessions:
- *"Why no Redis?"* — one process, in-memory registry (Task 0.4); Redis pub/sub would only matter for fanning out across multiple worker processes, which this app deliberately never runs.
- *"How does the WebSocket authenticate?"* — the session cookie attaches automatically on the handshake (Task 2.1), gets validated against the `sessions` table (Task 2.3), and is re-checked periodically so logout closes already-open sockets too (Day 13) — contrast directly with JWT, which this app no longer uses and which couldn't have been revoked mid-connection even when it did.

**Where do I put the files?**
No new files — these are talking points, not documentation.

**How do I know I'm done?**
Both answers come out without looking anything up.

**How do I test?**
Have someone else ask cold.

**Common beginner mistakes**
Reaching for the old JWT-era answer out of habit — it changed when the auth mechanism did.

---

## If the schedule doesn't recover: cut order

We're already ~2 working days behind (see the Sep 20 status check at the top). If a slack day gets absorbed by something core (most likely candidates: Day 5's authz check, Day 11's concurrent-task plumbing, or Day 13 interacting badly with Day 11's task management — all three are the first genuinely fiddly `asyncio` work in the plan), cut in this order, cheapest-to-restore-value first:

1. **Day 14–15, advanced search** — pure bonus, zero downstream dependents. Cut first.
2. **Day 16–17, GDPR export/delete** — also marked minor/bonus, and already blocked on a decision from Core-Dev (see open questions) that may not land in time regardless.
3. Do **not** cut Day 19 (rehearsal) to buy time for 14–17 — a broken clean-container run discovered on Oct 10 costs far more than two bonus points.
