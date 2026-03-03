import { searchMovies } from '../api/movies';
import { useSearch } from './useSearch';

export function useMovieSearch(query: string) {
  const { results, isLoading, error } = useSearch('movieSearch', searchMovies, query);
  return {
    movieResults: results,
    isLoadingMovieSearch: isLoading,
    movieSearchError: error,
  };
}
