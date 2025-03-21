import React, { useEffect, useCallback, forwardRef } from 'react';
import { Search, X } from 'lucide-react'; // v0.284.0
import { cn } from '../../lib/utils/color';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useSearch } from '../../hooks/use-search';

export interface SearchBarProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  /** Initial value for the search input */
  initialValue?: string;
  /** Callback function when search term changes */
  onSearch: (searchTerm: string) => void;
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Additional CSS class names */
  className?: string;
  /** Whether to show a search button */
  showButton?: boolean;
  /** Text to display on the search button */
  buttonText?: string;
  /** Delay in milliseconds for debouncing search input */
  debounceDelay?: number;
  /** Callback function when search is cleared */
  onClear?: () => void;
}

/**
 * A reusable search bar component that provides a standardized interface for searching data.
 * Features include debounced search, optional search button, and clear functionality.
 */
export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(({
  initialValue = '',
  onSearch,
  placeholder = 'Search...',
  className,
  showButton = false,
  buttonText = 'Search',
  debounceDelay = 300,
  onClear,
  ...props
}, ref) => {
  // Use the useSearch hook to manage search state with debouncing
  const { searchTerm, debouncedSearchTerm, setSearchTerm, resetSearchTerm } = useSearch(
    initialValue,
    debounceDelay
  );

  // Handle search input changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, [setSearchTerm]);

  // Handle search submission (for immediate search without waiting for debounce)
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    onSearch(searchTerm);
  }, [onSearch, searchTerm]);

  // Handle clearing the search input
  const handleClear = useCallback(() => {
    resetSearchTerm();
    if (onClear) {
      onClear();
    }
    onSearch('');
  }, [resetSearchTerm, onClear, onSearch]);

  // Handle key press events (e.g., Enter key)
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // Call onSearch when the debounced search term changes
  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  return (
    <form
      className={cn("flex items-center w-full", className)}
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      role="search"
    >
      <div className="relative flex-1">
        <Input
          ref={ref}
          type="search"
          value={searchTerm}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(searchTerm ? "pr-8" : "")}
          icon={<Search size={18} aria-hidden="true" />}
          aria-label={placeholder}
          {...props}
        />
        {searchTerm && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500 hover:text-gray-700"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      {showButton && (
        <Button
          type="submit"
          className="ml-2"
        >
          {buttonText}
        </Button>
      )}
    </form>
  );
});

SearchBar.displayName = 'SearchBar';