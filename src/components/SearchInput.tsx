import { useState, useEffect, useRef } from 'react';
import { SEARCH_DEBOUNCE_MS } from '../api/constants';

type SearchInputProps<TResult> = {
  placeholder: string;
  onDebouncedQueryChange: (query: string) => void;
  results: TResult[];
  isLoading: boolean;
  renderResult: (result: TResult) => React.ReactNode;
  onResultSelect: (result: TResult) => void;
};

// A debounced search input with a dropdown results list.
// All data fetching logic lives in the parent — this component only handles
// input state, debouncing, and rendering the dropdown.
export function SearchInput<TResult extends { id: number }>({
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
  const dropdownRef = useRef<HTMLUListElement>(null);

  // Debounce: wait for the user to stop typing before firing the query
  useEffect(() => {
    const timer = setTimeout(() => {
      onDebouncedQueryChange(inputValue);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [inputValue, onDebouncedQueryChange]);

  // Close dropdown when clicking/tapping outside the component
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside as EventListener);
    document.addEventListener('touchstart', handleClickOutside as EventListener);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside as EventListener);
      document.removeEventListener('touchstart', handleClickOutside as EventListener);
    };
  }, []);

  // Scroll the dropdown into view when it first opens so the virtual keyboard doesn't hide it.
  // Intentionally only depends on isDropdownOpen — we don't want to re-scroll every time
  // results load, which would cause the input to bounce up and down mid-search.
  useEffect(() => {
    if (isDropdownOpen && dropdownRef.current) {
      dropdownRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isDropdownOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(event.target.value);
    setIsDropdownOpen(true);
  }

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
        onChange={handleInputChange}
        onFocus={() => setIsDropdownOpen(true)}
        placeholder={placeholder}
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
      />

      {shouldShowDropdown && (
        <ul ref={dropdownRef} className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading && (
            <li className="px-4 py-3 text-sm text-gray-500">Searching…</li>
          )}
          {!isLoading &&
            results.map((result) => (
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
