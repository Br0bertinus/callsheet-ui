import { TMDB_POSTER_BASE_URL } from '../api/constants';
import type { Movie } from '../types';

type MovieBadgeProps = {
  movie: Movie;
};

function MoviePoster({ movie }: { movie: Movie }) {
  const posterUrl = movie.posterPath
    ? `${TMDB_POSTER_BASE_URL}${movie.posterPath}`
    : null;

  if (posterUrl) {
    return (
      <img
        src={posterUrl}
        alt={`${movie.title} poster`}
        className="h-14 w-9.5 rounded object-cover shrink-0"
      />
    );
  }

  return (
    <div className="h-14 w-9.5 rounded bg-amber-200 flex items-center justify-center shrink-0 text-lg">
      🎬
    </div>
  );
}

export function MovieBadge({ movie }: MovieBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
      <MoviePoster movie={movie} />
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-semibold text-amber-900 leading-tight">{movie.title}</span>
        <span className="text-xs text-amber-500 mt-0.5">{movie.year}</span>
      </div>
    </div>
  );
}
