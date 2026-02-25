import { useQuery } from '@tanstack/react-query';
import { searchPeople } from '../api/people';
import { SEARCH_MIN_LENGTH } from '../api/constants';

// Fetches a list of actors matching the search query.
// The query is only fired when the input is long enough to be meaningful.
export function useActorSearch(query: string) {
  const isQueryLongEnough = query.length >= SEARCH_MIN_LENGTH;

  const {
    data: actorResults,
    isLoading: isLoadingActorSearch,
    error: actorSearchError,
  } = useQuery({
    queryKey: ['actorSearch', query],
    queryFn: () => searchPeople(query),
    enabled: isQueryLongEnough,
    staleTime: 30_000,
  });

  return {
    actorResults: actorResults ?? [],
    isLoadingActorSearch,
    actorSearchError,
  };
}
