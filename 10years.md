# PlayBook's Web Setup, Explained Simply

Imagine PlayBook is a little town:

- The **frontend** is the shop window. It shows you buttons, pages, pictures,
  and forms.
- The **backend** is the helper behind the counter. It checks your requests,
  applies the rules, and gets or saves information.
- **PostgreSQL** is the filing cabinet where the information is kept.
- **Caddy** is the gatekeeper at the front door. It sends visitors to the
  right place and protects their browser connection with HTTPS.
- **Docker containers** are separate little rooms where each part runs.

## What happens when you open PlayBook?

Open **<https://localhost>** in your browser:

1. Your browser talks to **Caddy** on port **443** using HTTPS. HTTPS is the
   protected, scrambled connection.
2. Caddy passes the page request to the **frontend** inside Docker on port
   **3000**.
3. The frontend displays the page in your browser.
4. When the page needs information, it asks the **backend API** at
   **<https://localhost:8443>**.
5. Caddy receives that request on port **8443** and passes it to the backend
   inside Docker on port **8000**.
6. If the backend needs saved information, it talks to **PostgreSQL** inside
   Docker on port **5432**.

Here is the path in one picture:

```text
Your browser
   |
   | HTTPS: https://localhost (port 443)
   v
Caddy — the gatekeeper
   |
   | private Docker connection
   v
Frontend (port 3000) — makes the pages
   |
   | HTTPS: https://localhost:8443 for API requests
   v
Caddy — the gatekeeper again
   |
   | private Docker connection
   v
Backend API (port 8000) — handles the requests
   |
   | private Docker connection
   v
PostgreSQL (port 5432) — keeps the data
```

## What are ports?

A computer can run many programs at once. A **port** is like a numbered door
that helps network traffic find the right program.

The numbers in this setup mean:

| Port | Who uses it? | What it is for |
| --- | --- | --- |
| **80** | Caddy | The unprotected HTTP door. Caddy sends visitors to HTTPS instead. |
| **443** | Caddy | The protected HTTPS door for the website. |
| **8443** | Caddy | A second protected HTTPS door for browser requests to the API. |
| **3000** | Frontend | Where the Next.js website runs inside Docker. |
| **8000** | Backend | Where the FastAPI application runs inside Docker. |
| **5432** | PostgreSQL | Where the database listens inside Docker. |

You may have meant **443** when you wrote “433”: the HTTPS port is **443**.

The browser uses ports **443** and **8443**. The browser does **not** go
straight to ports 3000 or 8000. Those are doors used privately between
containers. Port 5432 is also private; it is not published to your computer.

## Why are 443 and 8443 both HTTPS?

Port **443** is the usual HTTPS door, so you do not have to write it in the
address. That is why the website address is just `https://localhost`.

We use **8443** as another HTTPS door so the browser can send API requests to
Caddy separately from requests for the website. The frontend is configured to
use `https://localhost:8443` for API calls, pictures, and live chat connections.

## Why does Caddy send requests to other ports?

The browser can only see the doors that Docker publishes on your computer.
Caddy can also see the private Docker network, where the other containers live.
So Caddy acts like a receptionist:

- A website request goes to `frontend:3000`.
- An API request goes to `api:8000`.
- The backend uses `postgres:5432` to reach the database.

Names like `frontend`, `api`, and `postgres` are the containers' names on that
private network.

## What does HTTP redirect mean?

Port **80** accepts old-style, unprotected HTTP requests. Caddy does not serve
the app that way; it tells the browser to come back using HTTPS instead. This
is called a **redirect**.

## Why might my browser warn me about the certificate?

This project is running only on your own computer, so Caddy makes a local
certificate instead of asking a public certificate company for one. Your
browser may not know to trust it yet. Follow the local certificate trust
instructions in the main [README](./README.md).

## The short version

```text
Browser --HTTPS--> Caddy --private connection--> Frontend
Browser --HTTPS--> Caddy --private connection--> Backend --private connection--> Database
```

The browser-facing connections use HTTPS. The connections between containers
stay inside Docker's private network.
