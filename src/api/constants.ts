// Central location for all API-related constants.
// Never repeat these values inline — always import from here.

// Relative base path — Nginx proxies /api/* to the back-end container.
// Using a relative URL means this works on any domain without reconfiguring.
export const API_BASE_URL = '/api';

// Prepend this to any Actor.profilePath value to get a displayable image URL
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w185';

// Minimum characters required before a search query is fired
export const SEARCH_MIN_LENGTH = 2;

// Debounce delay in milliseconds for search inputs
export const SEARCH_DEBOUNCE_MS = 300;
