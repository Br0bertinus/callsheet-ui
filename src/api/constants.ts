// Central location for all API-related constants.
// Never repeat these values inline — always import from here.

// Relative base path — Nginx proxies /api/* to the back-end container.
// Using a relative URL means this works on any domain without reconfiguring.
export const API_BASE_URL = '/api';

// Prepend this to any Actor.profilePath value to get a displayable image URL
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w185';

// Prepend this to any Movie.posterPath value to get a displayable poster URL
export const TMDB_POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w92';

// Minimum characters required before a search query is fired
export const SEARCH_MIN_LENGTH = 2;

// Debounce delay in milliseconds for search inputs
export const SEARCH_DEBOUNCE_MS = 300;

// Helpers to build full image URLs from partial TMDB paths.
// Always use these instead of constructing URLs inline.
export function getProfileImageUrl(profilePath: string | null | undefined): string | null {
  return profilePath ? `${TMDB_IMAGE_BASE_URL}${profilePath}` : null;
}

export function getPosterUrl(posterPath: string | null | undefined): string | null {
  return posterPath ? `${TMDB_POSTER_BASE_URL}${posterPath}` : null;
}
