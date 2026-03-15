# CallSheet UI

A *Six Degrees of Kevin Bacon*-style game where two players connect any two actors by naming a chain of shared movies. Built with React 19, TypeScript, Vite, React Query, and Tailwind CSS v4.

---

## The Game

### How to play

There are two ways to start a game:

- **Daily Challenge** — Every day a new fixed pair of actors is chosen for everyone. The pair is the same for all players on a given calendar day, resets at midnight UTC, and your result is saved so you can share it without spoilers.
- **Random Game** — Pick any two actors yourself and build your own chain.

Once a game starts the rules are the same either way:

1. **Build the chain** — Starting from Actor A, each turn you must name:
   - The **next actor** in the chain
   - The **movie** that connects the current actor to that next actor
2. **Win** — The game is won when you successfully add the target actor to the end of the chain.

### Scoring

There are two ways to compete once you've finished:

- **Fewest steps** — the classic goal. Shortest chain wins.
- **Obscurity Score** — the sum of TMDB popularity scores for every actor and movie *you chose* (the fixed start/end actors are excluded). Lower is better — the more obscure your path through the graph, the lower your score. Compare with friends to see who has the deeper film knowledge.

### Rules

- Every actor and every movie in the chain must be **unique** — you cannot reuse someone already in the chain.
- A step is only valid if the current actor and the next actor **both appeared in the named movie**. The API is the source of truth.
- If a step is rejected but the two actors do share films, the UI will tell you which movies would have been valid.

---

## Running the project

### Prerequisites

- **Node.js** (v22 LTS recommended) — https://nodejs.org
- The **CallSheet back-end** running at `http://localhost:8080`

### Install and start

```bash
npm install
npm run dev
```

The app starts at `http://localhost:5173` by default.

### Other scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server with hot-reload |
| `npm run build` | Type-check with `tsc` then build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint across the whole codebase |

---

## Code architecture

The codebase is organised around a strict separation of concerns. Each layer has a single job:

```
src/
  api/          Data access — all fetch() calls live here, nowhere else
  context/      React context — GameContext provides game state to all routes
  hooks/        Logic — all state, derived values, and side effects
  components/   Reusable UI pieces — receive props, emit callbacks
  pages/        Screens — layout only, wires hooks to components
  types.ts      All shared TypeScript types, imported everywhere
  main.tsx      App entry point, providers, and route definitions
```

### The three-layer rule

> **API → Hook → Page/Component**

- A **page** may call hooks and render components. It contains no logic.
- A **hook** may call API functions and manage state. It contains no JSX.
- An **API function** may call `fetch`. It knows nothing about React.

If you find yourself writing `fetch` inside a component or `useState` inside an API file, that's a signal something is in the wrong layer.

---

## File-by-file guide

### `src/types.ts`

Single source of truth for all TypeScript types. Any time a new shape appears in the API, add it here and import from here everywhere else. Never re-declare a type locally.

Key types:

| Type | Description |
|---|---|
| `Actor` | An actor with `id`, `name`, and `profilePath` |
| `Movie` | A movie with `id`, `title`, and `year` |
| `GameState` | The full client-side game state: chain, current actor, and optional `isDailyChallenge` / `challengeDate` flags |
| `ChainStep` | One link in the chain: an actor and the movie connecting them to the next |
| `NewGameResponse` | Response from `POST /game` and `GET /game/daily` |
| `ValidateStepResponse` | Response from `POST /game/validate-step` |
| `DailyChallengeResult` | The user's completed daily result persisted to localStorage: `date`, `steps`, `score` |

---

### `src/api/`

One file per API resource. No file in this folder imports from React.

| File | Exports |
|---|---|
| `constants.ts` | `API_BASE_URL`, `TMDB_IMAGE_BASE_URL`, `SEARCH_MIN_LENGTH`, `SEARCH_DEBOUNCE_MS`, `getProfileImageUrl()`, `getPosterUrl()` |
| `game.ts` | `startGame()`, `validateStep()`, `getDailyChallenge()` |
| `people.ts` | `searchPeople()` |
| `movies.ts` | `searchMovies()` |

`getDailyChallenge()` calls `GET /api/game/daily` and returns a `NewGameResponse` — the same shape as `startGame()`. No request body is needed; the server derives the pair from the current UTC date.

**Adding a new endpoint:** create or add to the relevant resource file, type the request body and response separately, throw a descriptive `Error` on non-OK responses.

---

### `src/hooks/`

Every hook wraps either a React Query `useQuery` / `useMutation` or manages pure client state with `useState`. Components call hooks; hooks call API functions.

| Hook | Wraps | Purpose |
|---|---|---|
| `useSearch` | `useQuery` | Generic debounced search; skips queries shorter than `SEARCH_MIN_LENGTH`. Used by `useActorSearch` and `useMovieSearch` |
| `useActorSearch` | `useSearch` | Searches actors by query string |
| `useMovieSearch` | `useSearch` | Searches movies by query string |
| `useNewGame` | `useMutation` | Calls `POST /game`; pass `onSuccess` to `submitNewGame()` at the call site |
| `useValidateStep` | `useMutation` | Calls `POST /game/validate-step`; pass `onSuccess` to `submitStep()` at the call site |
| `useGameState` | `useState` | Owns all game state; exposes `initializeGame`, `addStepToChain`, `resetGame`. Accepts an optional `isDailyChallenge` flag |
| `useDailyChallenge` | `useQuery` | Fetches today's actor pair from `GET /api/game/daily` (cached 10 min). Also exports `getTodayResult()` and `saveTodayResult()` for reading/writing the completed result to localStorage |

The `onSuccess` callback is passed to the `.mutate()` call (e.g. `submitNewGame(args, { onSuccess })`) rather than to the hook itself. This is the TanStack Query v5 idiomatic pattern and avoids stale-closure bugs.

---

### `src/components/`

Reusable building blocks. Each one has a single visual responsibility. None of them fetch data or hold game logic — they receive everything via props.

| Component | Props | Purpose |
|---|---|---|
| `ErrorMessage` | `message` | Consistent error display, used everywhere an error needs to be shown |
| `ActorCard` | `actor`, `isHighlighted?` | Actor photo + name tile; shows a silhouette placeholder when `profilePath` is empty |
| `MovieBadge` | `movie` | Pill badge showing movie title and year |
| `SearchInput` | generic `TResult`, query/results/loading props, optional `contextLabel` | Debounced search with two render paths: a standard inline dropdown on pointer/mouse devices and a full-screen portal overlay on touch devices. The `contextLabel` prop (rendered inside the mobile overlay) lets callers show context about what the user is searching for — e.g. the current and target actors while searching for a next actor. |
| `ChainDisplay` | `startActor`, `chain`, `currentActor` | The visual chain trail: Actor → Movie → Actor → Movie → … |

---

### `src/context/`

`GameContext.tsx` wraps `useGameState` in a React context and exposes it to all routes via `GameProvider`. `GameProvider` is used as the layout route in the router, so any page can call `useGameContext()` to read or update game state without prop-drilling.

---

### `src/pages/`

Top-level screens. These are layout components — they read like a description of what is on screen, not a state machine. All logic is delegated to hooks.

| Page | When shown | Key hooks |
|---|---|---|
| `SetupPage` | No game in progress | `useNewGame`, `useActorSearch`, `useGameContext`. Shows a **Daily Challenge** button at the top that routes to `/daily` |
| `DailyChallengePage` | Navigating to `/daily` | `useDailyChallenge`, `useGameContext`. Fetches today's pair, initializes game state with `isDailyChallenge: true`, and immediately redirects to `/game`. If the user has already finished today's challenge, shows an "Already completed" summary screen instead |
| `GamePage` | Game in progress, not yet won | `useValidateStep`, `useActorSearch`, `useMovieSearch`, `useGameContext` |
| `WinPage` | `hasWon === true` | `useGameContext`. When `isDailyChallenge` is set, persists the result to localStorage via `saveTodayResult()`, shows the challenge date, and shares a spoiler-light result (no actor IDs) |

Screen transitions are managed by React Router. `GameProvider` wraps all routes as a layout route in `main.tsx`, holding game state in context. Each page uses `useNavigate()` to move between routes when state changes.

---

### `src/main.tsx`

App entry point. Sets up the `QueryClientProvider` for React Query and defines the React Router route tree:

- `GameProvider` (layout route — holds all game state in context)
  - `/` → `SetupPage`
  - `/daily` → `DailyChallengePage`
  - `/game` → `GamePage`
  - `/win` → `WinPage`

This is the only file that defines routes. Adding a new screen means adding a new `{ path, element }` entry here.

---

## Adding features

### Adding a new API endpoint

1. Add the function to the appropriate file in `src/api/`, or create a new file if it's a different resource.
2. Add any new response/request types to `src/types.ts`.
3. Create a hook in `src/hooks/` that wraps it with `useQuery` or `useMutation`.
4. Call the hook from the relevant page or component.

### Adding a new screen

1. Create the page component in `src/pages/`. Keep it layout-only.
2. Add any needed logic to a new or existing hook in `src/hooks/`.
3. Add a new route entry in `main.tsx`.

### Changing the API base URL

Change `API_BASE_URL` in `src/api/constants.ts`. It is the only place this value exists.

---

## Design decisions worth knowing

**Why is React Router used here despite the app being simple?** The three-screen flow maps naturally to three URLs (`/`, `/game`, `/win`), which means the browser back button works correctly, refreshing mid-game behaves predictably, and challenge links can point to `/` with query params without any manual URL parsing. React Router v7 was already a listed dependency.

**Why is game state in a context instead of prop-drilled?** Now that pages are separate routes (not children of a common `App` component), context is the natural home for shared state. `GameProvider` acts as the layout route and holds `useGameState`, making it accessible to any page via `useGameContext()` without threading props through the router.

**Why does `SearchInput` use a full-screen portal overlay on mobile instead of an inline dropdown?** iOS Safari scrolls the page whenever the document height changes while a keyboard is open. An absolute-positioned dropdown appearing below a focused input changes layout height, which triggers this scroll and causes the page to jump. Rendering the results inside a `position: fixed` portal detaches them from the document layout entirely, so no height change ever occurs. `document.body.style.overflow = 'hidden'` is set while the overlay is open to prevent rubber-band overscroll from revealing the page behind. Desktop (pointer/mouse) devices retain the original inline dropdown because they don't have a software keyboard and don't exhibit this issue. The split is detected via the `(pointer: coarse)` media query rather than viewport width, so tablets also receive the mobile path.

**Why does `SearchInput` use `onMouseDown` instead of `onClick` for results?** The input's `onBlur` fires before a click on a dropdown item, which would close the dropdown before the click registers. `onMouseDown` fires first, so the selection goes through correctly.

**Why are `visitedActorIds` and `visitedMovieIds` not stored in `GameState`?** They are fully derivable from `chain` — `visitedActorIds` is `[...chain.map(s => s.actor.id), currentActor.id]` and `visitedMovieIds` is `chain.map(s => s.movie.id)`. Storing derived data separately means keeping it in sync manually, which creates a class of bugs for no benefit. They are computed on-the-fly in `GamePage` immediately before the duplicate check and API call.

**Why is the daily result stored in localStorage instead of a backend?** The app has no user accounts, so localStorage is the simplest durable store available. The stored value is keyed by date (`callsheet:dailyResult`), which means stale entries from previous days are automatically ignored — no cleanup needed. If the data is cleared, the user just plays again; nothing is lost on the server side.

**Why does `DailyChallengePage` redirect immediately to `/game` instead of having its own play UI?** The daily challenge is just a regular game with a pre-set pair — sharing a separate gameplay implementation would create a divergence that's hard to maintain. Redirecting to `/game` after setting game state means daily users and random users get exactly the same in-game experience for free.
