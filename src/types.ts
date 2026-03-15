// All shared types used across the application.
// Import from this file instead of re-declaring types locally.

export type Actor = {
  id: number;
  name: string;
  // Partial TMDB path — prepend TMDB_IMAGE_BASE_URL to display the image
  profilePath: string;
  // TMDB popularity score — higher means more popular, lower means rarer
  popularity: number;
};

export type Movie = {
  id: number;
  title: string;
  year: number;
  // Partial TMDB path — prepend TMDB_POSTER_BASE_URL to display the poster
  posterPath?: string;
  // TMDB popularity score — higher means more popular, lower means rarer
  popularity: number;
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
  // visitedActorIds and visitedMovieIds are intentionally omitted — derive them
  // from chain when needed: actors = [...chain.map(s => s.actor.id), currentActor.id]
  //                          movies = chain.map(s => s.movie.id)
  // Set to true when this game was started from the daily challenge
  isDailyChallenge?: boolean;
  // ISO date string (YYYY-MM-DD) identifying which day's challenge this is
  challengeDate?: string;
};

// Stored in localStorage after the user completes a daily challenge.
// Used to show the "already played today" screen on subsequent visits.
export type DailyChallengeResult = {
  // ISO date string matching the challenge that was completed (YYYY-MM-DD)
  date: string;
  steps: number;
  score: number;
  // Full chain preserved so it can be displayed on the already-played screen.
  startActor: Actor;
  targetActor: Actor;
  chain: ChainStep[];
};
