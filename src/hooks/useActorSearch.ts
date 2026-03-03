import { searchPeople } from '../api/people';
import { useSearch } from './useSearch';

export function useActorSearch(query: string) {
  const { results, isLoading, error } = useSearch('actorSearch', searchPeople, query);
  return {
    actorResults: results,
    isLoadingActorSearch: isLoading,
    actorSearchError: error,
  };
}
