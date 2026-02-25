import type { Movie } from '../types';

type MovieBadgeProps = {
  movie: Movie;
};

export function MovieBadge({ movie }: MovieBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium border border-amber-200">
      <span>{movie.title}</span>
      <span className="text-amber-500">({movie.year})</span>
    </span>
  );
}
