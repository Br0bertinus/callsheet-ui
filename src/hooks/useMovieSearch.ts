import { useQuery } from '@tanstack/react-query';
import { searchMovies } from '../api/movies';
import { SEARCH_MIN_LENGTH } from '../api/constants';

// Fetches a list of movies matching the search query.
// The query is only fired when the input is long enough to be meaningful.
export function useMovieSearch(query: string) {
  const isQueryLongEnough = query.length >= SEARCH_MIN_LENGTH;

  const {
    data: movieResults,
    isLoading: isLoadingMovieSearch,
    error: movieSearchError,
  } = useQuery({
    queryKey: ['movieSearch', query],
    queryFn: () => searchMovies(query),
    enabled: isQueryLongEnough,
    staleTime: 30_000,
  });

  return {
    movieResults: movieResults ?? [],
    isLoadingMovieSearch,
    movieSearchError,
  };
}
