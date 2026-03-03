import { useQuery } from '@tanstack/react-query';
import { SEARCH_MIN_LENGTH } from '../api/constants';

// Generic debounced search hook shared by useActorSearch and useMovieSearch.
// queryKey should uniquely identify the resource type (e.g. 'actorSearch').
// The query is only fired when the input meets the minimum length threshold.
export function useSearch<T>(
  queryKey: string,
  queryFn: (query: string) => Promise<T[]>,
  query: string,
) {
  const enabled = query.length >= SEARCH_MIN_LENGTH;

  const { data, isLoading, error } = useQuery({
    queryKey: [queryKey, query],
    queryFn: () => queryFn(query),
    enabled,
    staleTime: 30_000,
  });

  return {
    results: data ?? [],
    isLoading,
    error,
  };
}
