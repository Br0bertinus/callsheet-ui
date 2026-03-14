import type { GameState } from './types';

// Sum the TMDB popularity of every intermediate actor and every movie in the
// completed chain.  The seed actors (start/target) are excluded — they are
// fixed by the puzzle, not chosen by the player.
// Lower total = more obscure path.
export function calcObscurityScore(gameState: GameState): number {
  // chain[0].actor === startActor (seed), so skip index 0.
  // targetActor is also a seed — exclude it.
  const actorSum = gameState.chain.slice(1).reduce((sum, s) => sum + s.actor.popularity, 0);
  const movieSum = gameState.chain.reduce((sum, s) => sum + s.movie.popularity, 0);
  return actorSum + movieSum;
}
