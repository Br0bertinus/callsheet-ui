import { useState, useCallback } from 'react';
import { useActorSearch } from '../hooks/useActorSearch';
import { useNewGame } from '../hooks/useNewGame';
import { SearchInput } from '../components/SearchInput';
import { ActorCard } from '../components/ActorCard';
import { ErrorMessage } from '../components/ErrorMessage';
import { TMDB_IMAGE_BASE_URL } from '../api/constants';
import type { Actor, NewGameResponse } from '../types';

type SetupPageProps = {
  onGameStarted: (data: NewGameResponse) => void;
};

export function SetupPage({ onGameStarted }: SetupPageProps) {
  const [startActor, setStartActor] = useState<Actor | null>(null);
  const [targetActor, setTargetActor] = useState<Actor | null>(null);

  const [startActorQuery, setStartActorQuery] = useState('');
  const [targetActorQuery, setTargetActorQuery] = useState('');

  const { actorResults: startActorResults, isLoadingActorSearch: isLoadingStartSearch, actorSearchError: startSearchError } =
    useActorSearch(startActorQuery);

  const { actorResults: targetActorResults, isLoadingActorSearch: isLoadingTargetSearch, actorSearchError: targetSearchError } =
    useActorSearch(targetActorQuery);

  const { submitNewGame, isStartingGame, newGameError } = useNewGame(onGameStarted);

  const handleStartActorQueryChange = useCallback((query: string) => {
    setStartActorQuery(query);
  }, []);

  const handleTargetActorQueryChange = useCallback((query: string) => {
    setTargetActorQuery(query);
  }, []);

  function handleStartGameClick() {
    if (startActor && targetActor) {
      submitNewGame({ startActorId: startActor.id, targetActorId: targetActor.id });
    }
  }

  const bothActorsSelected = startActor !== null && targetActor !== null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-8 flex flex-col gap-8">
        <SetupHeader />

        <SetupActorPicker
          label="Start Actor"
          selectedActor={startActor}
          searchResults={startActorResults}
          isLoadingSearch={isLoadingStartSearch}
          searchError={startSearchError}
          onQueryChange={handleStartActorQueryChange}
          onActorSelect={setStartActor}
          onActorClear={() => setStartActor(null)}
        />

        <SetupActorPicker
          label="Target Actor"
          selectedActor={targetActor}
          searchResults={targetActorResults}
          isLoadingSearch={isLoadingTargetSearch}
          searchError={targetSearchError}
          onQueryChange={handleTargetActorQueryChange}
          onActorSelect={setTargetActor}
          onActorClear={() => setTargetActor(null)}
        />

        {newGameError && (
          <ErrorMessage message={newGameError.message} />
        )}

        <button
          type="button"
          onClick={handleStartGameClick}
          disabled={!bothActorsSelected || isStartingGame}
          className="w-full py-3 px-6 rounded-lg bg-indigo-600 text-white font-semibold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isStartingGame ? 'Starting…' : 'Start Game'}
        </button>
      </div>
    </div>
  );
}

function SetupHeader() {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900">CallSheet</h1>
      <p className="mt-2 text-gray-500">
        Connect two actors through a chain of shared movies.
      </p>
    </div>
  );
}

type SetupActorPickerProps = {
  label: string;
  selectedActor: Actor | null;
  searchResults: Actor[];
  isLoadingSearch: boolean;
  searchError: Error | null;
  onQueryChange: (query: string) => void;
  onActorSelect: (actor: Actor) => void;
  onActorClear: () => void;
};

function SetupActorPicker({
  label,
  selectedActor,
  searchResults,
  isLoadingSearch,
  searchError,
  onQueryChange,
  onActorSelect,
  onActorClear,
}: SetupActorPickerProps) {
  // resetKey forces the SearchInput to clear its internal input value
  const [resetKey, setResetKey] = useState(0);

  function handleActorSelect(actor: Actor) {
    onActorSelect(actor);
  }

  function handleClear() {
    setResetKey((k) => k + 1);
    onActorClear();
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-700">{label}</label>

      {selectedActor ? (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <ActorCard actor={selectedActor} />
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-gray-400 hover:text-gray-600"
            aria-label={`Clear ${label}`}
          >
            ✕
          </button>
        </div>
      ) : (
        <SearchInput
          placeholder={`Search for ${label.toLowerCase()}…`}
          onDebouncedQueryChange={onQueryChange}
          results={searchResults}
          isLoading={isLoadingSearch}
          renderResult={(actor) => (
            <ActorSearchResult actor={actor} />
          )}
          onResultSelect={handleActorSelect}
          resetKey={resetKey}
        />
      )}

      {searchError && <ErrorMessage message={searchError.message} />}
    </div>
  );
}

function ActorSearchResult({ actor }: { actor: Actor }) {
  const imageUrl = actor.profilePath
    ? `${TMDB_IMAGE_BASE_URL}${actor.profilePath}`
    : null;

  return (
    <div className="flex items-center gap-3 py-1">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={actor.name}
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-200" />
      )}
      <span className="text-sm text-gray-900">{actor.name}</span>
    </div>
  );
}
