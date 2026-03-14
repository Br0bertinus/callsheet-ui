import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useGameContext } from '../context/GameContext';
import { useActorSearch } from '../hooks/useActorSearch';
import { useNewGame } from '../hooks/useNewGame';
import { startGame } from '../api/game';
import { SearchInput } from '../components/SearchInput';
import { ActorCard } from '../components/ActorCard';
import { ErrorMessage } from '../components/ErrorMessage';
import { TmdbLogo } from '../components/TmdbLogo';
import { getProfileImageUrl } from '../api/constants';
import type { Actor } from '../types';

export function SetupPage() {
  const { initializeGame } = useGameContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle challenge link: if URL contains actor IDs, skip setup and jump into the game.
  const autoStartAttempted = useRef(false);
  const [isAutoStarting, setIsAutoStarting] = useState(false);
  const [autoStartError, setAutoStartError] = useState<string | null>(null);

  useEffect(() => {
    if (autoStartAttempted.current) return;
    autoStartAttempted.current = true;

    const startActorId = Number(searchParams.get('startActorId'));
    const targetActorId = Number(searchParams.get('targetActorId'));
    if (!startActorId || !targetActorId) return;

    setIsAutoStarting(true);
    startGame({ startActorId, targetActorId })
      .then((data) => {
        initializeGame(data.startActor, data.targetActor);
        navigate('/game');
      })
      .catch(() => {
        setAutoStartError('Could not load the shared game. Please set up a new one.');
        setIsAutoStarting(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [startActor, setStartActor] = useState<Actor | null>(null);
  const [targetActor, setTargetActor] = useState<Actor | null>(null);

  const [startActorQuery, setStartActorQuery] = useState('');
  const [targetActorQuery, setTargetActorQuery] = useState('');

  const [infoOpen, setInfoOpen] = useState(false);

  const { actorResults: startActorResults, isLoadingActorSearch: isLoadingStartSearch, actorSearchError: startSearchError } =
    useActorSearch(startActorQuery);

  const { actorResults: targetActorResults, isLoadingActorSearch: isLoadingTargetSearch, actorSearchError: targetSearchError } =
    useActorSearch(targetActorQuery);

  const { submitNewGame, isStartingGame, newGameError } = useNewGame();

  const handleStartActorQueryChange = useCallback((query: string) => {
    setStartActorQuery(query);
  }, []);

  const handleTargetActorQueryChange = useCallback((query: string) => {
    setTargetActorQuery(query);
  }, []);

  function handleStartGameClick() {
    if (startActor && targetActor) {
      submitNewGame(
        { startActorId: startActor.id, targetActorId: targetActor.id },
        {
          onSuccess: (data) => {
            initializeGame(data.startActor, data.targetActor);
            navigate('/game');
          },
        },
      );
    }
  }

  const bothActorsSelected = startActor !== null && targetActor !== null;

  if (isAutoStarting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-500 text-lg animate-pulse">Loading your challenge…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-4 sm:p-8 flex flex-col gap-8">
        <SetupHeader onInfoClick={() => setInfoOpen(true)} />
        {infoOpen && <InfoModal onClose={() => setInfoOpen(false)} />}

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

        {autoStartError && <ErrorMessage message={autoStartError} />}
        {newGameError && (
          <ErrorMessage message={newGameError.message} />
        )}

        <button
          type="button"
          onClick={handleStartGameClick}
          disabled={!bothActorsSelected || isStartingGame}
          className="w-full py-3 px-6 rounded-lg bg-indigo-600 text-white font-semibold text-lg hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isStartingGame ? 'Starting…' : 'Start Game'}
        </button>
      </div>
    </div>
  );
}

function SetupHeader({ onInfoClick }: { onInfoClick: () => void }) {
  return (
    <div className="text-center relative">
      <h1 className="text-3xl font-bold text-gray-900">CallSheet</h1>
      <p className="mt-2 text-gray-500">
        Connect two actors through a chain of shared movies.
      </p>
      <button
        type="button"
        onClick={onInfoClick}
        aria-label="How to play"
        className="absolute top-0 right-0 p-2 -mr-2 -mt-2 text-gray-400 hover:text-indigo-500 active:text-indigo-600 transition-colors text-xl leading-none"
      >
        &#9432;
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// How to play modal
// ---------------------------------------------------------------------------

const HOW_TO_PLAY_GOAL =
  'Connect the Start Actor to the Target Actor through a chain of shared movies. Try to finish in as few steps as possible \u2014 or find the most obscure path you can.';

const HOW_TO_PLAY_STEPS = [
  { icon: '\uD83C\uDFAD', text: 'Choose a Start Actor and a Target Actor.' },
  { icon: '\uD83D\uDD17', text: 'Each step: pick a movie your current actor appeared in, and a co-star from that movie. That co-star becomes your next link in the chain.' },
  { icon: '\uD83C\uDFAF', text: 'Keep linking until your chain reaches the Target Actor.' },
  { icon: '\uD83D\uDEAB', text: 'No actor or movie can appear in your chain more than once.' },
  { icon: '\uD83D\uDCAA', text: 'Finish in as few steps as you can \u2014 then challenge a friend to beat your score!' },
  { icon: '\uD83D\uDC8E', text: 'Every finished chain also gets an Obscurity Score \u2014 the sum of TMDB popularity for each actor and movie you chose. Lower is better: the more obscure your path, the more bragging rights you earn.' },
];

function InfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          &times;
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900">How to Play</h2>

        {/* Goal */}
        <p className="text-gray-600 text-sm leading-relaxed">{HOW_TO_PLAY_GOAL}</p>

        {/* Steps */}
        <ol className="flex flex-col gap-3">
          {HOW_TO_PLAY_STEPS.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-xl mt-0.5" aria-hidden="true">{step.icon}</span>
              <span className="text-gray-700 text-sm leading-relaxed">{step.text}</span>
            </li>
          ))}
        </ol>

        {/* TMDB attribution */}
        <div className="border-t border-gray-100 pt-4 flex flex-col items-center gap-2">
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-80 hover:opacity-100 transition-opacity"
            aria-label="The Movie Database"
          >
            <TmdbLogo />
          </a>
          <p className="text-xs text-gray-400 text-center">
            Actor and film data provided by{' '}
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600"
            >
              The Movie Database
            </a>
            . This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>
      </div>
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
  function handleActorSelect(actor: Actor) {
    onActorSelect(actor);
  }

  function handleClear() {
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
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 active:text-gray-800"
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
        />
      )}

      {searchError && <ErrorMessage message={searchError.message} />}
    </div>
  );
}

function ActorSearchResult({ actor }: { actor: Actor }) {
  const imageUrl = getProfileImageUrl(actor.profilePath);

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
