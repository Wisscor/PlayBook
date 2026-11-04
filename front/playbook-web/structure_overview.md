# Frontend structure overview

The frontend lives in `front/playbook-web` and uses Next.js App Router, React, TypeScript, Tailwind CSS, and `next-intl`.

## Main directory tree

```text
front/playbook-web/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Redirects / to /en
│   │   └── [locale]/
│   │       ├── layout.tsx           # Locale, translations, and app providers
│   │       ├── page.tsx             # Public landing page
│   │       ├── (private)/           # Pages that require a session cookie
│   │       │   ├── layout.tsx       # Shared authenticated navigation/layout
│   │       │   ├── home/
│   │       │   ├── profile/
│   │       │   ├── edit-profile/
│   │       │   ├── community/
│   │       │   ├── history/
│   │       │   ├── messages/
│   │       │   ├── followers/
│   │       │   ├── play-requests/
│   │       │   ├── search/
│   │       │   └── user-profile/
│   │       └── (public)/            # Public auth and legal pages
│   │           ├── auth/
│   │           ├── privacy/
│   │           └── terms/
│   ├── components/
│   │   ├── shared/                  # Header, language switcher, legal links
│   │   └── ui/                      # Reusable buttons, inputs, modals, text
│   ├── hooks/
│   │   ├── contexts/                # Auth, chat, resize, and provider setup
│   │   ├── useNavigation.ts
│   │   └── useDismiss.ts
│   ├── services/                    # Axios API actions and feature controllers
│   ├── types/                       # Shared TypeScript data types
│   ├── lib/                          # Routes, helpers, and page titles
│   └── proxy.ts                      # Cookie-based route checks
├── i18n/                             # Locale-aware navigation and request setup
├── messages/                         # English, French, and Arabic translations
├── public/                           # Global CSS, fonts, and static images/icons
├── next.config.ts                    # Next.js and next-intl plugin setup
├── package.json                      # Dependencies and commands
├── tsconfig.json                     # TypeScript settings and path aliases
└── postcss.config.mjs                # Tailwind/PostCSS setup
```

## Routing

- `src/app` is the **App Router**. A `page.tsx` file defines a page; a `layout.tsx` wraps its child routes.
- `[locale]` is a dynamic route segment. The site supports `/en/...`, `/fr/...`, and `/ar/...`.
- `(private)` and `(public)` are route groups. Their names organize layouts but do not appear in URLs. For example, `src/app/[locale]/(private)/home/page.tsx` serves `/en/home`.
- The private pages share `(private)/layout.tsx`; public pages use their own layouts.
- Query parameters are used for page modes and filters, such as `/en/auth?mode=signin` and history page filters. There are no other dynamic folder segments such as `[userId]` in the current route tree.
- `src/proxy.ts` checks for the `session_id` cookie before allowing protected paths. The API remains responsible for validating that session.

## How the parts fit together

- **Pages and components:** Route pages compose feature components. Shared UI components in `src/components/ui` provide consistent controls and styling.
- **Contexts:** The locale layout wraps pages in `AuthProvider`, `ChatProvider`, and `ResizeProvider`. Components access shared state through hooks such as `useAuth` and `useChat`.
- **Hooks and services:** Feature hooks/controllers in `src/services` call the backend and update UI or context state. For example, `useProfileController` handles profile requests and `useSession` loads/revokes sessions.
- **API client:** `src/services/api.ts` creates the shared Axios client. It uses `NEXT_PUBLIC_API_URL` (defaulting to `http://localhost:8000`) and `withCredentials: true` so the browser sends the session cookie.
- **Authentication:** Login at `/auth/login` sets the HttpOnly session cookie. `AuthProvider` fetches `/users/me` to load the user. The proxy checks whether the cookie exists; backend API endpoints verify whether it is valid. On API `401` responses, the Axios interceptor sends the browser to sign-in.
- **Live chat:** `ChatProvider` uses the Axios client for chat data and opens a WebSocket for live messages and connection events.
- **Styling and translations:** `public/globals.css` imports Tailwind and defines the app theme. Components use Tailwind utility classes. `messages/en.json`, `messages/fr.json`, and `messages/ar.json` provide translated text; the locale layout loads the matching file.

## Typical data flow

1. A page renders a feature component, such as the profile page and its sessions modal.
2. The component calls a feature hook/controller in `src/services`.
3. The service sends an Axios request through `src/services/api.ts`; the browser includes the session cookie.
4. The backend checks the cookie and returns JSON (or an error such as `401`).
5. The service updates React state or a context, and the component renders the result or an error/loading state.

For example, `sessionModal.tsx` calls `useSession` in `src/services/session.ts`, which requests `GET /auth/sessions` and `DELETE /auth/sessions/{session_id}`.
