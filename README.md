# Calendar Countdown

A live countdown to your next Google Calendar event.

- **React Router v8, framework mode, SPA** (`ssr: false`) — one static `index.html` hydrates every route
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **Google Calendar API v3** read-only, called straight from the browser with a
  Google Identity Services access token — no backend, no client secret

## Setup

### 1. Create an OAuth client

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and pick or create a project.
2. **APIs & Services → Library →** enable **Google Calendar API**.
3. **APIs & Services → OAuth consent screen →** configure it (External is fine),
   add the scope `.../auth/calendar.readonly`, and add your Google account under
   **Test users** while the app is in testing.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID →
   Web application**. Under **Authorized JavaScript origins** add:
   - `http://localhost:5173`
   - your production origin, if you deploy it

   No redirect URI is needed — the token model uses a popup, not a redirect.

### 2. Configure the app

```sh
cp .env.example .env
# then paste your client ID into VITE_GOOGLE_CLIENT_ID
```

### 3. Run it

```sh
npm install
npm run dev      # http://localhost:5173
```

Click **Connect Google Calendar**, approve the read-only scope, and the
countdown starts ticking.

### Try it without credentials

Append `?demo` to any route (`http://localhost:5173/?demo`) to load sample
events and see the whole UI without an OAuth client.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Static SPA build into `build/client` |
| `npm run start` | Preview the production build locally |
| `npm run typecheck` | Route typegen + `tsc` |

## Deploying

`npm run build` emits a plain static site in `build/client`. Host it anywhere
(Netlify, Vercel, Cloudflare Pages, S3, nginx) with a **SPA fallback rewriting
all paths to `/index.html`**. Then add that origin to the OAuth client's
authorized JavaScript origins.

## How it works

```
app/
  root.tsx                  document shell + <CalendarProvider>
  layout.tsx                nav chrome, sync / disconnect controls
  routes.ts                 route config (index + /events under the layout)
  routes/countdown.tsx      the big ticking clock for the next event
  routes/events.tsx         upcoming events grouped by day
  lib/google-auth.ts        GIS script loading, token request, token storage
  lib/calendar.ts           Calendar API v3 fetching + normalisation
  lib/calendar-store.tsx    React context: token → events, refresh, useNow()
  lib/time.ts               countdown maths and Intl formatting
  components/               countdown clock, event card, connect panel, states
```

- Events are pulled from **every calendar the user has selected**, expanded
  through `singleEvents=true` (so recurring instances count), merged and sorted.
- The countdown targets the first event that has not **ended** yet: before it
  starts it counts down to `start`, once it is running it counts down to `end`.
- Events refresh every 5 minutes while the tab is visible, plus on demand
  via **Sync**.

## Notes on the token

The access token lives in `sessionStorage` and expires after ~1 hour; the
implicit flow issues no refresh token, so reconnecting is a click. **Disconnect**
revokes the token with Google and clears local state. Nothing is sent anywhere
except `googleapis.com`.
