import { API_BASE_URL } from './constants';
import type { Actor } from '../types';

export async function searchPeople(query: string): Promise<Actor[]> {
  const response = await fetch(
    `${API_BASE_URL}/search/people?q=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error(`Actor search failed: ${response.statusText}`);
  }

  return response.json() as Promise<Actor[]>;
}
