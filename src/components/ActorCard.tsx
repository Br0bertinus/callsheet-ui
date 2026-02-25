import { TMDB_IMAGE_BASE_URL } from '../api/constants';
import type { Actor } from '../types';

type ActorCardProps = {
  actor: Actor;
  isHighlighted?: boolean;
};

function ActorPhoto({ actor }: { actor: Actor }) {
  const imageUrl = actor.profilePath
    ? `${TMDB_IMAGE_BASE_URL}${actor.profilePath}`
    : null;

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={actor.name}
        className="w-16 h-16 rounded-full object-cover"
      />
    );
  }

  // Placeholder silhouette when no profile photo is available
  return (
    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
      <svg
        className="w-10 h-10 text-gray-400"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    </div>
  );
}

export function ActorCard({ actor, isHighlighted = false }: ActorCardProps) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        isHighlighted
          ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-300'
          : 'border-gray-200 bg-white'
      }`}
    >
      <ActorPhoto actor={actor} />
      <span className="font-medium text-gray-900">{actor.name}</span>
    </div>
  );
}
