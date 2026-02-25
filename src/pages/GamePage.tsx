import { useState, useCallback } from 'react';
import { useValidateStep } from '../hooks/useValidateStep';
import { useActorSearch } from '../hooks/useActorSearch';
import { useMovieSearch } from '../hooks/useMovieSearch';
import { ChainDisplay } from '../components/ChainDisplay';
import { ActorCard } from '../components/ActorCard';
import { MovieBadge } from '../components/MovieBadge';
import { SearchInput } from '../components/SearchInput';
import { ErrorMessage } from '../components/ErrorMessage';
import { TMDB_IMAGE_BASE_URL } from '../api/constants';
import type { Actor, Movie, GameState, ValidateStepResponse } from '../types';

type GamePageProps = {
  gameState: GameState;
  onStepAccepted: (nextActor: Actor, connectingMovie: Movie) => void;
};

export function GamePage({ gameState, onStepAccepted }: GamePageProps) {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        <GameHeader
          startActor={gameState.startActor}
          targetActor={gameState.targetActor}
        />

        <ChainDisplay
          startActor={gameState.startActor}
          chain={gameState.chain}
          currentActor={gameState.currentActor}
        />

        <StepBuilder
          gameState={gameState}
          onStepAccepted={onStepAccepted}
        />
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

type GameHeaderProps = {
  startActor: Actor;
  targetActor: Actor;
};

function GameHeader({ startActor, targetActor }: GameHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <ActorCard actor={startActor} />
      <span className="text-2xl text-gray-400">→</span>
      <ActorCard actor={targetActor} />
    </div>
  );
}

type StepBuilderProps = {
  gameState: GameState;
  onStepAccepted: (nextActor: Actor, connectingMovie: Movie) => void;
};

// Handles all the input state and submission logic for a single chain step.
// Extracted here so GamePage itself stays readable as a layout component.
function StepBuilder({ gameState, onStepAccepted }: StepBuilderProps) {
  const [nextActor, setNextActor] = useState<Actor | null>(null);
  const [connectingMovie, setConnectingMovie] = useState<Movie | null>(null);
  const [actorResetKey, setActorResetKey] = useState(0);
  const [movieResetKey, setMovieResetKey] = useState(0);

  const [actorQuery, setActorQuery] = useState('');
  const [movieQuery, setMovieQuery] = useState('');

  // When a step is invalid but actors share movies, we display the valid options
  const [suggestedMovies, setSuggestedMovies] = useState<Movie[]>([]);
  const [invalidStepMessage, setInvalidStepMessage] = useState<string | null>(null);

  const { actorResults, isLoadingActorSearch, actorSearchError } = useActorSearch(actorQuery);
  const { movieResults, isLoadingMovieSearch, movieSearchError } = useMovieSearch(movieQuery);

  function handleValidateStepSuccess(result: ValidateStepResponse) {
    if (result.valid && nextActor && connectingMovie) {
      onStepAccepted(nextActor, connectingMovie);
      // Clear step builder for the next step
      setNextActor(null);
      setConnectingMovie(null);
      setActorResetKey((k) => k + 1);
      setMovieResetKey((k) => k + 1);
      setSuggestedMovies([]);
      setInvalidStepMessage(null);
    } else {
      // Step was rejected — show feedback
      setInvalidStepMessage('That step is not valid.');
      setSuggestedMovies(result.connectingMovies);
    }
  }

  const { submitStep, isValidatingStep, validateStepError, resetValidateStep } =
    useValidateStep(handleValidateStepSuccess);

  const handleActorQueryChange = useCallback((query: string) => {
    setActorQuery(query);
  }, []);

  const handleMovieQueryChange = useCallback((query: string) => {
    setMovieQuery(query);
  }, []);

  function handleActorSelect(actor: Actor) {
    setNextActor(actor);
    setInvalidStepMessage(null);
    setSuggestedMovies([]);
    resetValidateStep();
  }

  function handleMovieSelect(movie: Movie) {
    setConnectingMovie(movie);
    setInvalidStepMessage(null);
    setSuggestedMovies([]);
    resetValidateStep();
  }

  function handleClearActor() {
    setNextActor(null);
    setActorResetKey((k) => k + 1);
  }

  function handleClearMovie() {
    setConnectingMovie(null);
    setMovieResetKey((k) => k + 1);
  }

  function handleSubmitStep() {
    if (!nextActor || !connectingMovie) return;

    // Client-side duplicate check before hitting the API
    if (gameState.visitedActorIds.includes(nextActor.id)) {
      setInvalidStepMessage(`${nextActor.name} has already been used in this chain.`);
      return;
    }
    if (gameState.visitedMovieIds.includes(connectingMovie.id)) {
      setInvalidStepMessage(`${connectingMovie.title} has already been used in this chain.`);
      return;
    }

    submitStep({
      currentActorId: gameState.currentActor.id,
      nextActorId: nextActor.id,
      movieId: connectingMovie.id,
      visitedActorIds: gameState.visitedActorIds,
      visitedMovieIds: gameState.visitedMovieIds,
    });
  }

  const bothSelectionsMade = nextActor !== null && connectingMovie !== null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5">
      <p className="text-sm text-gray-500">
        Current actor:{' '}
        <span className="font-semibold text-gray-800">{gameState.currentActor.name}</span>
      </p>

      <StepActorPicker
        results={actorResults}
        isLoading={isLoadingActorSearch}
        searchError={actorSearchError}
        selectedActor={nextActor}
        resetKey={actorResetKey}
        onQueryChange={handleActorQueryChange}
        onActorSelect={handleActorSelect}
        onActorClear={handleClearActor}
      />

      <StepMoviePicker
        results={movieResults}
        isLoading={isLoadingMovieSearch}
        searchError={movieSearchError}
        selectedMovie={connectingMovie}
        resetKey={movieResetKey}
        onQueryChange={handleMovieQueryChange}
        onMovieSelect={handleMovieSelect}
        onMovieClear={handleClearMovie}
      />

      {invalidStepMessage && (
        <div className="flex flex-col gap-2">
          <ErrorMessage message={invalidStepMessage} />
          {suggestedMovies.length > 0 && (
            <ValidMovieSuggestions movies={suggestedMovies} />
          )}
        </div>
      )}

      {validateStepError && (
        <ErrorMessage message={validateStepError.message} />
      )}

      <button
        type="button"
        onClick={handleSubmitStep}
        disabled={!bothSelectionsMade || isValidatingStep}
        className="w-full py-2 px-4 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isValidatingStep ? 'Checking…' : 'Submit Step'}
      </button>
    </div>
  );
}

type StepActorPickerProps = {
  results: Actor[];
  isLoading: boolean;
  searchError: Error | null;
  selectedActor: Actor | null;
  resetKey: number;
  onQueryChange: (query: string) => void;
  onActorSelect: (actor: Actor) => void;
  onActorClear: () => void;
};

function StepActorPicker({
  results,
  isLoading,
  searchError,
  selectedActor,
  resetKey,
  onQueryChange,
  onActorSelect,
  onActorClear,
}: StepActorPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-700">Next Actor</label>
      {selectedActor ? (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <ActorCard actor={selectedActor} />
          </div>
          <button
            type="button"
            onClick={onActorClear}
            className="text-sm text-gray-400 hover:text-gray-600"
            aria-label="Clear actor"
          >
            ✕
          </button>
        </div>
      ) : (
        <SearchInput
          placeholder="Search for next actor…"
          onDebouncedQueryChange={onQueryChange}
          results={results}
          isLoading={isLoading}
          renderResult={(actor) => <ActorSearchResult actor={actor} />}
          onResultSelect={onActorSelect}
          resetKey={resetKey}
        />
      )}
      {searchError && <ErrorMessage message={searchError.message} />}
    </div>
  );
}

type StepMoviePickerProps = {
  results: Movie[];
  isLoading: boolean;
  searchError: Error | null;
  selectedMovie: Movie | null;
  resetKey: number;
  onQueryChange: (query: string) => void;
  onMovieSelect: (movie: Movie) => void;
  onMovieClear: () => void;
};

function StepMoviePicker({
  results,
  isLoading,
  searchError,
  selectedMovie,
  resetKey,
  onQueryChange,
  onMovieSelect,
  onMovieClear,
}: StepMoviePickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-700">Connecting Movie</label>
      {selectedMovie ? (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <MovieBadge movie={selectedMovie} />
          </div>
          <button
            type="button"
            onClick={onMovieClear}
            className="text-sm text-gray-400 hover:text-gray-600"
            aria-label="Clear movie"
          >
            ✕
          </button>
        </div>
      ) : (
        <SearchInput
          placeholder="Search for connecting movie…"
          onDebouncedQueryChange={onQueryChange}
          results={results}
          isLoading={isLoading}
          renderResult={(movie) => (
            <span className="text-sm text-gray-900">
              {movie.title}{' '}
              <span className="text-gray-400">({movie.year})</span>
            </span>
          )}
          onResultSelect={onMovieSelect}
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

function ValidMovieSuggestions({ movies }: { movies: Movie[] }) {
  return (
    <div className="rounded-md bg-yellow-50 border border-yellow-200 px-4 py-3">
      <p className="text-sm font-semibold text-yellow-800 mb-2">
        These movies would have been valid:
      </p>
      <div className="flex flex-wrap gap-2">
        {movies.map((movie) => (
          <MovieBadge key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}
