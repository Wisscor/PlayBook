# How the Frontend Connects to the Backend

This document explains, step by step, how the PlayBook frontend communicates
with the FastAPI backend using **Axios** and **TypeScript**.

The goal is to understand the flow, not just copy code.

## 1. The two applications

PlayBook has two separate applications:

- **Frontend:** Next.js, React, TypeScript, and Tailwind CSS.
- **Backend:** FastAPI, Python, SQLAlchemy, and PostgreSQL.

The frontend displays pages and collects user input. The backend validates the
input, talks to the database, and returns a response.

In the Docker Compose setup, the browser communicates with the API through
Caddy over HTTPS. Caddy forwards requests to the API over the private Docker
network.

For example:

```text
Frontend  -- POST /auth/login -->  Backend
Frontend  <-- user data ---------  Backend
```

The frontend does not directly access PostgreSQL. It always goes through a
backend endpoint.

## 2. What is an API endpoint?

An API endpoint is a backend URL that performs one operation.

Examples from this project:

| Action | HTTP method | Endpoint |
| --- | --- | --- |
| Create an account | POST | `/auth/signup` |
| Log in | POST | `/auth/login` |
| Log out | POST | `/auth/logout` |
| Get the current user | GET | `/auth/me` |
| Get my profile | GET | `/users/me` |
| Update my profile | PATCH | `/users/me` |
| List sports | GET | `/sports` |
| Create a match | POST | `/match-announcements` |
| Update a match | PATCH | `/match-announcements/{id}` |
| Delete a match | DELETE | `/match-announcements/{id}` |
| Create a post | POST | `/posts` |
| Delete a post | DELETE | `/posts/{id}` |

The HTTP method tells the backend what kind of operation is requested:

- `GET`: read data.
- `POST`: create data or perform an action.
- `PATCH`: update part of existing data.
- `DELETE`: remove data.

## 3. The central Axios client

The shared Axios client is in:

```text
src/services/api.ts
```

Its important code is:

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:8443",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
```

### `baseURL`

`baseURL` is the common beginning of backend URLs.

If the frontend calls:

```ts
api.get("/sports");
```

Axios sends the request to:

```text
https://localhost:8443/sports
```

In production, `NEXT_PUBLIC_API_URL` should contain the HTTPS backend URL. In the local Docker
setup, this is `https://localhost:8443`.

### `withCredentials: true`

This is essential for PlayBook authentication.

The backend uses a session cookie called `session_id`. After a successful
login, the backend sends this cookie to the browser. Axios must send that
cookie with future requests.

```ts
withCredentials: true
```

Without this option:

1. Login may appear to work.
2. The browser may have the cookie.
3. Future requests such as `/sports` or `/users/me` do not include the cookie.
4. The backend returns `401 Not authenticated`.

The cookie is `HttpOnly`, so frontend JavaScript cannot read it directly. This
is good for security. The browser stores it and sends it automatically.

## 4. Services keep API code simple

Instead of writing Axios requests inside every component, related requests are
grouped into service files.

For authentication, the service is:

```text
src/services/auth.ts
```

Example:

```ts
export const signIn = async (data: SignInData) => {
  const response = await api.post<User>("/auth/login", data);
  return response.data;
};
```

This function does three things:

1. Receives login data.
2. Sends it to `/auth/login`.
3. Returns the response body as a `User`.

The component does not need to know Axios details:

```ts
await signIn({
  username_or_email: infos.username_or_email,
  password: infos.password,
});
```

There is also a sports service:

```text
src/services/sports.ts
```

```ts
export const getSports = async () => {
  const response = await api.get<Sport[]>("/sports");
  return response.data;
};
```

This means the match form can simply call:

```ts
const sports = await getSports();
```

## 5. TypeScript describes the data

TypeScript interfaces describe the shape of data expected from the backend.

They are stored in:

```text
src/types/user.ts
src/types/api.ts
```

Example:

```ts
export interface Sport {
  id: string;
  name: string;
  max_players: number;
}
```

This tells TypeScript that every sport should have:

- an `id` string,
- a `name` string,
- a `max_players` number.

When the Axios request uses a generic type:

```ts
api.get<Sport[]>("/sports");
```

TypeScript understands that `response.data` should be an array of `Sport`.
That gives editor autocomplete and catches many mistakes before running the
application.

Another example:

```ts
export interface MatchAnnouncement {
  id: string;
  title: string;
  sport: Sport;
  remaining_player_slots: number;
  match_status: "upcoming" | "live" | "canceled" | "finished";
  start_time: string;
  end_time: string;
  created_at: string;
}
```

The `match_status` type is a union. It means only these four values are valid.

## 6. The general React request flow

Most API-connected components follow this pattern:

```ts
const [items, setItems] = useState<Item[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState("");

const loadItems = async () => {
  try {
    const response = await api.get<Item[]>("/some-endpoint");
    setItems(response.data);
  } catch (requestError) {
    console.error("Unable to load items:", requestError);
    setError("Unable to load items");
  } finally {
    setIsLoading(false);
  }
};
```

The pieces have different jobs:

- `items`: data shown in the UI.
- `isLoading`: tells the UI to show a loading message.
- `error`: tells the UI to show a useful error.
- `try`: runs the request.
- `response.data`: contains the backend response body.
- `catch`: handles failed requests.
- `finally`: runs whether the request succeeds or fails.

For data needed when a component opens, the request is started from
`useEffect`.

## 7. Sign up flow

The sign-up component is:

```text
src/app/[locale]/(public)/auth/components/signUp.tsx
```

The user fills in:

- first name,
- last name,
- username,
- email,
- password,
- password confirmation.

Before sending the request, the frontend checks that the two passwords match.
Then it transforms the frontend field names into the backend field names:

```ts
await signUp({
  firstname: infos.firstName,
  lastname: infos.lastName,
  username: infos.username,
  email: infos.email,
  password: infos.password,
});
```

The backend receives:

```json
{
  "firstname": "Jane",
  "lastname": "Player",
  "username": "jane",
  "email": "jane@example.com",
  "password": "password123"
}
```

The backend hashes the password before saving it. The frontend must never hash
or store the password itself.

After successful registration, the frontend sends the user to the sign-in
page. Registration and login are separate operations in this backend.

## 8. Sign in flow

The sign-in component is:

```text
src/app/[locale]/(public)/auth/components/signIn.tsx
```

The frontend sends:

```ts
await signIn({
  username_or_email: infos.username_or_email,
  password: infos.password,
});
```

The backend:

1. Finds the user by username or email.
2. Verifies the password.
3. Creates a session database row.
4. Sends the `session_id` cookie.
5. Returns the user data.

The frontend then navigates to the home page:

```ts
goHome();
```

The frontend does not manually create the session cookie. The backend creates
it, and the browser stores it.

## 9. Protected requests and authentication

After login, requests such as this include the session automatically:

```ts
api.get("/sports");
```

The browser sends:

```text
Cookie: session_id=...
```

The backend reads that cookie and identifies the current user.

If the cookie is missing, invalid, or expired, the backend usually returns:

```text
401 Unauthorized
```

The frontend middleware also checks whether a `session_id` cookie exists before
allowing access to private routes such as profile, history, and home.

The middleware is only a navigation guard. The backend remains the real
authority. A user can never be considered authenticated only because the
frontend allowed navigation.

## 10. Logout flow

The logout helper is in `src/services/auth.ts`:

```ts
export const signOut = async () => {
  await api.post("/auth/logout");
};
```

The private layout calls it when the user clicks the logout button:

```ts
await signOut();
goSignIn();
```

The backend deletes the session from the database and clears the cookie. The
frontend then redirects the user to sign-in.

## 11. Profile flow

The profile page loads the current user:

```ts
const response = await api.get<User>("/users/me");
setUser(response.data);
```

The edit profile page sends changed fields with:

```ts
await api.patch<User>("/users/me", updatedInfos);
```

The backend updates only the fields included in the request.

A useful rule is:

- Use `GET` to load the profile.
- Use `PATCH` to update the profile.
- Update React state with the returned backend response.

Do not use a fake browser cookie as the source of truth for profile data. The
database response from `/users/me` is the source of truth.

## 12. Sports flow

Sports are needed before creating a match.

The match modal calls:

```ts
const sports = await getSports();
```

The backend returns data like:

```json
[
  {
    "id": "sport-uuid",
    "name": "Football",
    "max_players": 11
  }
]
```

The user sees the sport name, but the frontend stores the sport ID:

```tsx
<option value={sport.id}>{sport.name}</option>
```

This is important. The match endpoint expects:

```json
{
  "sport_id": "sport-uuid"
}
```

It does not expect `"sport_id": "Football"`.

The frontend also uses `max_players` to prevent a user from entering more
players than the selected sport allows.

## 13. Match creation flow

The match form collects:

- title,
- selected sport ID,
- remaining player slots,
- start time,
- end time.

The backend expects:

```json
{
  "title": "Football on Saturday",
  "sport_id": "uuid-of-football",
  "remaining_player_slots": 5,
  "start_time": "2026-10-20T10:00:00.000Z",
  "end_time": "2026-10-20T12:00:00.000Z"
}
```

The browser's `datetime-local` input does not include a timezone. The frontend
converts it into an ISO timestamp:

```ts
new Date(form.start_time).toISOString()
```

Then it sends:

```ts
await api.post("/match-announcements", payload);
```

The backend validates:

- the title is not empty,
- the sport exists,
- at least one player slot is requested,
- the end time is after the start time.

## 14. Match editing and deleting

For editing, the frontend keeps the match ID and sends only the changed match
data:

```ts
await api.patch(`/match-announcements/${form.id}`, payload);
```

For deleting:

```ts
await api.delete(`/match-announcements/${id}`);
```

The backend checks that the current user owns the match before allowing an
update or deletion.

After a successful request, the frontend updates its local React state so the
screen changes immediately without a full page refresh.

## 15. Post creation flow

The post modal sends:

```ts
await api.post("/posts", {
  caption: postText.trim(),
});
```

The backend creates the post for the current session user.

The post history first loads the current user:

```ts
const profile = await api.get<{ id: string }>("/users/me");
```

Then it requests posts belonging to that user:

```ts
await api.get("/posts", {
  params: {
    user_id: profile.data.id,
  },
});
```

Axios turns `params` into a query string:

```text
/posts?user_id=user-uuid
```

## 16. Axios errors

An Axios request can fail because of several different reasons:

### `400 Bad Request`

The request format or values are invalid.

### `401 Unauthorized`

The user is not authenticated or the session cookie is missing or expired.

### `403 Forbidden`

The user is authenticated but does not have permission. For example, a user
trying to edit somebody else's match.

### `404 Not Found`

The requested user, sport, post, or match does not exist.

### `409 Conflict`

The request conflicts with existing data. For example, a duplicate username.

### `422 Unprocessable Entity`

The JSON shape is understood, but validation failed. For example, the match
end time is before the start time.

### `500 Internal Server Error`

This usually means a backend or database problem. The frontend cannot solve
this by changing the error message. Check the API container logs and database
schema.

A useful temporary debugging pattern is:

```ts
catch (error) {
  if (axios.isAxiosError(error)) {
    console.error("Status:", error.response?.status);
    console.error("Backend detail:", error.response?.data);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

Do not show sensitive information such as cookies or passwords in the browser
console or in a support message.

## 17. CORS and credentials

Because the frontend and backend run on different ports during development,
the backend must allow the frontend origin.

Typical development addresses are:

```text
Frontend: https://localhost
Backend:  https://localhost:8443
```

The backend must allow:

- the frontend origin,
- credentials,
- the required HTTP methods,
- the required headers.

The frontend also needs:

```ts
withCredentials: true
```

Both sides are required for cookie-based authentication.

## 18. Why the database schema matters

The API code, TypeScript types, and database schema must agree.

For example, the current sport response requires:

```text
id
name
max_players
```

If the database does not have `max_players`, the backend query can fail with a
database error even though the frontend request is correct.

The same happened with match announcements when the database used old column
names such as `owner_id` and `type`, while the current backend expected
`organizer_id`, `title`, and `match_status`.

When an authenticated endpoint returns HTTP 500:

1. Check the browser Network tab.
2. Check the response status and response body.
3. Check backend container logs.
4. Compare the SQL/database schema with the current SQLAlchemy model.
5. Check migrations or schema setup.

## 19. A simple mental model

For every feature, think about these five steps:

```text
1. User action
   The user clicks a button or submits a form.

2. React state
   The component reads the form values.

3. Service/API request
   Axios sends the values to a backend endpoint.

4. Backend/database
   FastAPI validates the request and saves or reads data.

5. React update
   The frontend displays the response or an error.
```

For example, creating a match:

```text
Click "Create Match"
        |
        v
Read title, sport_id, slots, start_time, end_time
        |
        v
POST /match-announcements with Axios
        |
        v
FastAPI validates and saves the match
        |
        v
Return the created match
        |
        v
Add the match to React state and display it
```

## 20. Recommended habits for future features

When connecting a new frontend feature to the backend:

1. Read the backend route and schema first.
2. Write a TypeScript interface for the response.
3. Create a small service function for the request.
4. Use `withCredentials` for protected endpoints.
5. Validate simple user mistakes in the component.
6. Still let the backend validate everything.
7. Handle loading, success, and error states.
8. Update React state using the backend response.
9. Test unauthenticated and authenticated behavior.
10. Check backend logs when the response is `500`.

The most important distinction is:

- **Frontend validation** improves user experience.
- **Backend validation** provides security and correctness.

The frontend can be changed or bypassed, so the backend must always validate
permissions, IDs, dates, and ownership.
