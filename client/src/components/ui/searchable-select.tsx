import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, ChevronDown, Loader2 } from 'lucide-react';

interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: string[];
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  searchPlaceholder?: string;
  maxHeight?: string;
}

export function SearchableSelect({
  value,
  onValueChange,
  placeholder,
  options,
  label,
  disabled = false,
  loading = false,
  searchPlaceholder = "Search...",
  maxHeight = "200px"
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Memoize filtered options to prevent unnecessary re-computations
  const filteredOptions = useMemo(() => {
    console.log('🔍 SearchableSelect: Filtering options', { searchQuery, optionsCount: options.length });
    if (searchQuery.trim() === '') {
      return options;
    } else {
      const filtered = options.filter(option =>
        option.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log('🔍 SearchableSelect: Filtered options', { searchQuery, filteredCount: filtered.length, filtered });
      return filtered;
    }
  }, [searchQuery, options]);

  // Focus search input when select opens
  useEffect(() => {
    if (isOpen && searchInputRef.current && !loading) {
      // Use a longer timeout to ensure the DOM is ready
      const timeoutId = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 150);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, loading]);

  // Clear search when select closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleSelect = useCallback((selectedValue: string) => {
    console.log('🔍 SearchableSelect: Selected value:', selectedValue);
    onValueChange(selectedValue);
    setIsOpen(false);
    setSearchQuery('');
  }, [onValueChange]);

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    // Keep dropdown open when typing
    if (!isOpen) {
      setIsOpen(true);
    }
  }, [isOpen]);

  const handleSearchInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    } else if (e.key === 'Enter' && filteredOptions.length > 0) {
      // Select first option on Enter
      handleSelect(filteredOptions[0]);
    } else if (e.key === 'ArrowDown' && filteredOptions.length > 0) {
      e.preventDefault();
      // Focus first option
      const firstOption = document.querySelector('[data-option]') as HTMLElement;
      if (firstOption) {
        firstOption.focus();
      }
    }
  }, [filteredOptions, handleSelect]);

  const handleSearchInputFocus = useCallback(() => {
    // Keep dropdown open when search input is focused
    if (!isOpen) {
      setIsOpen(true);
    }
  }, [isOpen]);



  return (
    <div className="relative">
      {label && <Label className="mb-2 block">{label}</Label>}
      
      {/* Custom Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || placeholder}
        </span>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ChevronDown className="h-4 w-4 opacity-50" />
        )}
      </button>

      {/* Custom Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          {/* Search Input */}
          {!loading && (
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onKeyDown={handleSearchInputKeyDown}
                  onFocus={handleSearchInputFocus}
                  className="pl-8 h-8 text-sm"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div 
            className="overflow-y-auto"
            style={{ maxHeight }}
          >
            {loading ? (
              <div className="p-6 text-center text-sm text-gray-500">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  <span>Loading options...</span>
                </div>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                {searchQuery ? 'No results found' : 'No options available'}
              </div>
            ) : (
              <div className="py-1">
                {filteredOptions.map((option, index) => (
                  <button
                    key={option}
                    type="button"
                    data-option={option}
                    onClick={() => handleSelect(option)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(option);
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const nextOption = document.querySelector(`[data-option]:nth-child(${index + 2})`) as HTMLElement;
                        if (nextOption) {
                          nextOption.focus();
                        }
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const prevOption = document.querySelector(`[data-option]:nth-child(${index})`) as HTMLElement;
                        if (prevOption) {
                          prevOption.focus();
                        }
                      }
                    }}
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    tabIndex={0}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 