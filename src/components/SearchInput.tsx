import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SEARCH_DEBOUNCE_MS } from '../api/constants';

// True on touch/stylus devices (phones, tablets); false on mouse-driven desktops.
// Uses pointer:coarse rather than a viewport breakpoint so a tablet in landscape
// still gets the mobile overlay.
function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(
    () => window.matchMedia('(pointer: coarse)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isTouch;
}

type SearchInputProps<TResult> = {
  placeholder: string;
  contextLabel?: React.ReactNode;
  onDebouncedQueryChange: (query: string) => void;
  results: TResult[];
  isLoading: boolean;
  renderResult: (result: TResult) => React.ReactNode;
  onResultSelect: (result: TResult) => void;
};

export function SearchInput<TResult extends { id: number }>(props: SearchInputProps<TResult>) {
  const isTouch = useIsTouchDevice();
  return isTouch
    ? <MobileSearchInput {...props} />
    : <DesktopSearchInput {...props} />;
}

// ─── Desktop ─────────────────────────────────────────────────────────────────
// Original behaviour: inline input with an absolute dropdown below it.

function DesktopSearchInput<TResult extends { id: number }>({
  placeholder,
  onDebouncedQueryChange,
  results,
  isLoading,
  renderResult,
  onResultSelect,
}: SearchInputProps<TResult>) {
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      onDebouncedQueryChange(inputValue);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputValue, onDebouncedQueryChange]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleResultSelect(result: TResult) {
    setIsDropdownOpen(false);
    setInputValue('');
    onResultSelect(result);
  }

  const shouldShowDropdown = isDropdownOpen && (isLoading || results.length > 0);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => { setInputValue(e.target.value); setIsDropdownOpen(true); }}
        onFocus={() => setIsDropdownOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
      />
      {shouldShowDropdown && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading && <li className="px-4 py-3 text-sm text-gray-500">Searching…</li>}
          {!isLoading && results.map((result) => (
            <li key={result.id}>
              <button
                type="button"
                onMouseDown={() => handleResultSelect(result)}
                className="w-full text-left px-4 py-2 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none"
              >
                {renderResult(result)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Mobile ──────────────────────────────────────────────────────────────────
// Full-screen portal overlay: results appear outside the page layout so iOS
// Safari never has a reason to scroll the page when results appear.

function MobileSearchInput<TResult extends { id: number }>({
  placeholder,
  contextLabel,
  onDebouncedQueryChange,
  results,
  isLoading,
  renderResult,
  onResultSelect,
}: SearchInputProps<TResult>) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onDebouncedQueryChange(inputValue);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputValue, onDebouncedQueryChange]);

  // Lock body scroll while open so iOS rubber-band overscroll doesn't reveal
  // the page behind the overlay.
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  function handleClose() {
    setIsOpen(false);
    setInputValue('');
    onDebouncedQueryChange('');
  }

  function handleResultSelect(result: TResult) {
    setIsOpen(false);
    setInputValue('');
    onDebouncedQueryChange('');
    onResultSelect(result);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        {placeholder}
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={placeholder}
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-2 text-indigo-600 font-medium active:opacity-70"
            >
              Cancel
            </button>
          </div>

          {contextLabel && (
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 shrink-0">
              {contextLabel}
            </div>
          )}

          {/* overscroll-contain stops rubber-band bounce from revealing the page */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {isLoading && <p className="px-4 py-3 text-sm text-gray-500">Searching…</p>}
            {!isLoading && results.map((result) => (
              <button
                key={result.id}
                type="button"
                onMouseDown={() => handleResultSelect(result)}
                className="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-indigo-50 active:bg-indigo-100 focus:outline-none"
              >
                {renderResult(result)}
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}


