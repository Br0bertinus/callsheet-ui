// All shared types used across the application.
// Import from this file instead of re-declaring types locally.

export type Actor = {
  id: number;
  name: string;
  // Partial TMDB path — prepend TMDB_IMAGE_BASE_URL to display the image
  profilePath: string;
};

export type Movie = {
  id: number;
  title: string;
  year: number;
  // Partial TMDB path — prepend TMDB_POSTER_BASE_URL to display the poster
  posterPath?: string;
};

// Response from POST /game
export type NewGameResponse = {
  startActor: Actor;
  targetActor: Actor;
};

// Response from POST /game/validate-step
export type ValidateStepResponse = {
  valid: boolean;
  // All valid shared movies between the two actors (useful when the wrong movie was named)
  connectingMovies: Movie[];
};

// A single link in the chain: actor → movie → next actor
export type ChainStep = {
  actor: Actor;
  movie: Movie;
};

// Full game state passed between hooks and pages
export type GameState = {
  startActor: Actor;
  targetActor: Actor;
  // The actor currently at the end of the chain (where the next step begins)
  currentActor: Actor;
  // Completed steps in the chain so far
  chain: ChainStep[];
  visitedActorIds: number[];
  visitedMovieIds: number[];
};
