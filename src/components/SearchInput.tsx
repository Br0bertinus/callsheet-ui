import { useState, useEffect, useRef } from 'react';
import { SEARCH_DEBOUNCE_MS } from '../api/constants';

type SearchInputProps<TResult> = {
  placeholder: string;
  onDebouncedQueryChange: (query: string) => void;
  results: TResult[];
  isLoading: boolean;
  renderResult: (result: TResult) => React.ReactNode;
  onResultSelect: (result: TResult) => void;
  // Used to reset the input when a selection is cleared externally
  resetKey?: number;
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
  resetKey,
}: SearchInputProps<TResult>) {
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset the input whenever the parent signals a fresh start
  useEffect(() => {
    setInputValue('');
    setIsDropdownOpen(false);
  }, [resetKey]);

  // Debounce: wait for the user to stop typing before firing the query
  useEffect(() => {
    const timer = setTimeout(() => {
      onDebouncedQueryChange(inputValue);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [inputValue, onDebouncedQueryChange]);

  // Close dropdown when clicking outside the component
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
      />

      {shouldShowDropdown && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
