# SolveNet Frontend

React + Vite + Tailwind frontend for the SolveNet B2B AI matchmaking platform.

## Dev server

```bash
npm run dev      # starts on http://localhost:5173
npm run build    # production build → dist/
npm run preview  # preview production build
```

Backend must be running on port 5001 (Vite proxies `/api` and `/socket.io` to it).

## Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 18 | UI |
| React Router v6 | 6 | Client-side routing |
| Tailwind CSS | 3 | Styling |
| Vite | 5 | Bundler / dev server |
| React Three Fiber + Drei | 8/9 | 3D network graph |
| Three.js | 0.165 | 3D engine |
| Socket.io-client | 4 | Real-time match/message events |
| Axios | 1 | HTTP client |
| Lucide React | 0.390 | Icons |

## Project structure

```
src/
├── api/
│   └── businessApi.js      # Axios instance + all API calls (authApi, businessApi, matchApi, messageApi, graphApi)
├── assets/
│   ├── logo.png             # Full wordmark (used in navbars, footer)
│   └── full_logo.png        # Icon-only logo (used in dark rail)
├── components/
│   ├── Layout.jsx           # Sidebar + TopBar wrapper for authenticated routes
│   ├── Sidebar.jsx          # Two-panel nav: dark icon rail (56px) + white panel (208px)
│   ├── TopBar.jsx           # Top bar shown inside Layout
│   ├── MatchCard.jsx        # Renders a single match with correct perspective logic
│   ├── TagBadge.jsx         # CategoryBadge + TagBadge pill components
│   ├── StatCard.jsx         # Small metric card
│   ├── Toast.jsx            # Toast notification system (ToastProvider + useToast)
│   └── graph/
│       └── BusinessGraph3D.jsx  # React Three Fiber 3D network visualization
├── context/
│   └── BusinessContext.jsx  # Auth + business session state (current, token, signIn, clearBusiness)
├── hooks/
│   └── useSocket.js         # Singleton Socket.io connection hook
├── pages/
│   ├── LandingPage.jsx      # Public landing page with 3D hero
│   ├── LoginPage.jsx        # Email + password login → /my-dashboard
│   ├── RegisterBusiness.jsx # 4-step registration form (Basic Info + password, Services, Challenges, Review)
│   ├── MyDashboard.jsx      # Per-business private dashboard (matches, connection map)
│   ├── Dashboard.jsx        # General/public dashboard
│   ├── BusinessList.jsx     # Browse all businesses
│   ├── BusinessDetail.jsx   # Single business profile
│   ├── MatchList.jsx        # All matches list with filters
│   ├── Messages.jsx         # Real-time messaging between matched businesses
│   ├── ExploreGraph.jsx     # 3D network graph page
│   └── SelectBusiness.jsx   # Redirects to /login (kept for backwards compat)
├── App.jsx                  # Route definitions
├── index.css                # Tailwind base + component classes
└── main.jsx                 # Entry point
```

## Routing

| Path | Component | Auth required |
|------|-----------|---------------|
| `/` | LandingPage | No |
| `/login` | LoginPage | No |
| `/register` | RegisterBusiness | No |
| `/select` | → redirects to `/login` | — |
| `/my-dashboard` | MyDashboard | Yes (needs `current` in context) |
| `/businesses` | BusinessList | No |
| `/businesses/:id` | BusinessDetail | No |
| `/matches` | MatchList | No |
| `/network` | ExploreGraph | No |
| `/messages` | Messages | Yes |
| `/messages/:matchId` | Messages | Yes |

Routes under `<Layout />` render with Sidebar + TopBar.

## Auth flow

1. **Register** → `POST /api/auth/register` → returns `{ token, business }` → `signIn(token, business)`
2. **Login** → `POST /api/auth/login` → returns `{ token, business }` → `signIn(token, business)`
3. Token stored in `localStorage` key `solvenet_token`, business in `solvenet_current_business`
4. Axios interceptor (in `businessApi.js`) attaches `Authorization: Bearer <token>` to every request
5. **Logout** → `clearBusiness()` removes both keys

`useBusiness()` exposes: `current`, `token`, `signIn`, `selectBusiness`, `clearBusiness`, `refreshCurrent`

## Design system (Tailwind)

Colors defined in `tailwind.config.js`:

| Token | Value | Usage |
|-------|-------|-------|
| `bg` | `#F5F4F1` | Page background |
| `surface` | `#FFFFFF` | Cards, panels |
| `rail` | `#1A2E1A` | Dark green sidebar rail |
| `accent` | `#F97316` | Primary orange (buttons, highlights) |
| `accent-hover` | `#EA580C` | Hover state for accent |
| `accent-light` | `#FFF7ED` | Light orange tint (badges, backgrounds) |
| `accent-green` | `#166534` | Secondary dark green |
| `card-dark` | `#0F1F0F` | Dark green card (CTA sections) |
| `border` | `#E8E7E4` | Dividers, input borders |
| `text-primary` | `#0F0F0F` | Main text |
| `text-secondary` | `#6B7280` | Secondary text |
| `text-muted` | `#9CA3AF` | Placeholder / helper text |

Reusable component classes in `index.css`:

```css
.card          /* white rounded card with border + shadow */
.card-dark     /* dark green card */
.btn-primary   /* orange filled button */
.btn-ghost     /* transparent hover button */
.input         /* standard text input */
.nav-item      /* sidebar nav item */
.no-scrollbar  /* hide scrollbar utility */
```

Animation utilities added to Tailwind config:
- `animate-marquee` — infinite horizontal scroll (used in landing page industry ticker)
- `animate-fade-up` — fade-in-up entrance

## API layer (`src/api/businessApi.js`)

All calls go through a single Axios instance with base URL `/api` (proxied to backend).

```js
authApi.login({ email, password })
authApi.register({ name, owner_email, password, address, services, challenges })

businessApi.list(params)
businessApi.get(id)
businessApi.getMatches(id)
businessApi.rematch(id)

matchApi.list(params)
matchApi.get(id)
matchApi.accept(id)
matchApi.reject(id)

messageApi.send({ match_id, sender, content })
messageApi.thread(matchId)

graphApi.get()
```

## Real-time (Socket.io)

Use the `useSocket` hook to subscribe to events:

```js
const socket = useSocket()
useEffect(() => {
  socket.on('new_match', handler)
  socket.on('match_accepted', handler)
  socket.on('new_message', handler)
  return () => { socket.off('new_match', handler) }
}, [])
```

Join a match room before listening for messages:
```js
socket.emit('join_match', matchId)
```

## ID comparison gotcha

MongoDB ObjectIds returned from the API are strings in JSON. Always compare with `.toString()`:

```js
// WRONG
match.business_a === current._id

// RIGHT
match.business_a?._id?.toString() === current._id?.toString()
```

`MatchCard` and `Messages` use a `sameId(field)` helper for this.

## Common commands

```bash
# Install deps
npm install

# Add a package
npm install <package>

# Type-check (no TS, but Vite will surface JSX errors on build)
npm run build
```
