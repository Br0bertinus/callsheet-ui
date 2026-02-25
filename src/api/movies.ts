import { API_BASE_URL } from './constants';
import type { Movie } from '../types';

export async function searchMovies(query: string): Promise<Movie[]> {
  const response = await fetch(
    `${API_BASE_URL}/search/movies?q=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error(`Movie search failed: ${response.statusText}`);
  }

  return response.json() as Promise<Movie[]>;
}
