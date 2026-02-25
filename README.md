# CallSheet UI

A *Six Degrees of Kevin Bacon*-style game where two players connect any two actors by naming a chain of shared movies. Built with React 19, TypeScript, Vite, React Query, and Tailwind CSS v4.

---

## The Game

### How to play

1. **Setup** — Search for two actors (one per player). Once both are selected, click **Start Game** to begin.
2. **Build the chain** — Starting from Actor A, each turn you must name:
   - The **next actor** in the chain
   - The **movie** that connects the current actor to that next actor
3. **Win** — The game is won when you successfully add the target actor to the end of the chain.

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
  hooks/        Logic — all state, derived values, and side effects
  components/   Reusable UI pieces — receive props, emit callbacks
  pages/        Screens — layout only, wires hooks to components
  types.ts      All shared TypeScript types, imported everywhere
  main.tsx      App entry point, providers
  App.tsx       Top-level screen router
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
| `GameState` | The full client-side game state: chain, current actor, visited IDs |
| `ChainStep` | One link in the chain: an actor and the movie connecting them to the next |
| `NewGameResponse` | Response from `POST /game` |
| `ValidateStepResponse` | Response from `POST /game/validate-step` |

---

### `src/api/`

One file per API resource. No file in this folder imports from React.

| File | Exports |
|---|---|
| `constants.ts` | `API_BASE_URL`, `TMDB_IMAGE_BASE_URL`, `SEARCH_MIN_LENGTH`, `SEARCH_DEBOUNCE_MS` |
| `game.ts` | `startGame()`, `validateStep()` |
| `people.ts` | `searchPeople()` |
| `movies.ts` | `searchMovies()` |

**Adding a new endpoint:** create or add to the relevant resource file, type the request body and response separately, throw a descriptive `Error` on non-OK responses.

---

### `src/hooks/`

Every hook wraps either a React Query `useQuery` / `useMutation` or manages pure client state with `useState`. Components call hooks; hooks call API functions.

| Hook | Wraps | Purpose |
|---|---|---|
| `useActorSearch` | `useQuery` | Searches actors by query string; skips queries shorter than `SEARCH_MIN_LENGTH` |
| `useMovieSearch` | `useQuery` | Searches movies by query string; same short-query guard |
| `useNewGame` | `useMutation` | Calls `POST /game`; accepts an `onSuccess` callback |
| `useValidateStep` | `useMutation` | Calls `POST /game/validate-step`; accepts an `onSuccess` callback |
| `useGameState` | `useState` | Owns all game state; exposes `initializeGame`, `addStepToChain`, `resetGame` |

The `onSuccess` callback pattern is intentional: the hook owns the API call, the caller owns what to do with the result. This keeps the hooks reusable if they are ever needed in a different context.

---

### `src/components/`

Reusable building blocks. Each one has a single visual responsibility. None of them fetch data or hold game logic — they receive everything via props.

| Component | Props | Purpose |
|---|---|---|
| `ErrorMessage` | `message` | Consistent error display, used everywhere an error needs to be shown |
| `ActorCard` | `actor`, `isHighlighted?` | Actor photo + name tile; shows a silhouette placeholder when `profilePath` is empty |
| `MovieBadge` | `movie` | Pill badge showing movie title and year |
| `SearchInput` | generic `TResult`, query/results/loading props | Debounced text input with a dropdown results list; data-agnostic |
| `ChainDisplay` | `startActor`, `chain`, `currentActor` | The visual chain trail: Actor → Movie → Actor → Movie → … |

`SearchInput` is deliberately generic (`TResult extends { id: number }`). The caller provides `renderResult` to control how each row looks. This is what allows the same component to power both actor search and movie search without duplication.

---

### `src/pages/`

Top-level screens. These are layout components — they read like a description of what is on screen, not a state machine. All logic is delegated to hooks.

| Page | When shown | Key hook |
|---|---|---|
| `SetupPage` | No game in progress (`gameState === null`) | `useNewGame`, `useActorSearch` |
| `GamePage` | Game in progress, not yet won | `useValidateStep`, `useActorSearch`, `useMovieSearch`, `useGameState` |
| `WinPage` | `hasWon === true` | — (display only) |

Screen transitions are managed in `App.tsx` by inspecting `gameState` and `hasWon` from `useGameState`.

---

### `src/App.tsx`

Reads from `useGameState` and renders one of the three pages. It is the only place that decides which screen is active. If the routing ever becomes more complex (e.g. adding a URL-based router), this is the only file that needs to change.

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
3. Add the screen transition condition in `App.tsx`.

### Changing the API base URL

Change `API_BASE_URL` in `src/api/constants.ts`. It is the only place this value exists.

---

## Design decisions worth knowing

**Why no React Router?** The current three-screen flow is a simple state machine (`null` → game → won), so React Router would add indirection without benefit. If the app grows to need shareable URLs or a back-button history, React Router v7 is already listed as a dependency and can be introduced in `App.tsx` cleanly.

**Why is game state client-side only?** The back-end API is stateless by design — it validates individual steps but doesn't store sessions. The chain, visited actors, and visited movies all live in `useGameState`. This also means there is nothing to sync or invalidate with React Query.

**Why does `SearchInput` use `onMouseDown` instead of `onClick` for results?** The input's `onBlur` fires before a click on a dropdown item, which would close the dropdown before the click registers. `onMouseDown` fires first, so the selection goes through correctly.

**Why are `visitedActorIds` and `visitedMovieIds` checked client-side before the API call?** To give instant feedback without a network round-trip. The API enforces the same rules server-side as a safety net — the client check is for UX, not security.
