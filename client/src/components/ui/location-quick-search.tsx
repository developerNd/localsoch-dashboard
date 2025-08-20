import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, MapPin } from 'lucide-react';
import { searchLocations } from '@/lib/location-api';

interface LocationQuickSearchProps {
  onLocationSelect: (state: string, city: string, pincode: string) => void;
  placeholder?: string;
  label?: string;
}

interface SearchResult {
  state: string;
  city: string;
  pincode: string;
}

export function LocationQuickSearch({
  onLocationSelect,
  placeholder = "Search by city, state, or pincode...",
  label = "Quick Location Search"
}: LocationQuickSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.length >= 3) {
        console.log('🔍 Quick search triggered for query:', query);
        setIsSearching(true);
        try {
          const searchResults = await searchLocations(query);
          console.log('🔍 Quick search results:', searchResults);
          setResults(searchResults);
          setShowResults(true);
        } catch (error) {
          console.error('❌ Error in quick search:', error);
          setResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        console.log('🔍 Query too short, clearing results');
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    console.log('🔍 Quick search: Selected result:', result);
    onLocationSelect(result.state, result.city, result.pincode);
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      handleSelect(results[0]);
    }
  };

  return (
    <div className="relative">
      {label && <Label className="mb-2 block">{label}</Label>}
      
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            value={query}
            onChange={(e) => {
              console.log('🔍 Quick search: Input changed:', e.target.value);
              setQuery(e.target.value);
            }}
            placeholder={placeholder}
            className="pl-10 pr-20"
            onFocus={() => {
              console.log('🔍 Quick search: Input focused');
              setShowResults(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (results.length > 0) {
                  handleSelect(results[0]);
                }
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 px-2"
            disabled={isSearching || results.length === 0}
            onClick={() => {
              if (results.length > 0) {
                handleSelect(results[0]);
              }
            }}
          >
            {isSearching ? '...' : 'Select'}
          </Button>
        </div>
      </div>

      {/* Search Results */}
      {showResults && (query.length >= 3) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="py-1">
              {results.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(result)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center space-x-2"
                >
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {result.city}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {result.state} - {result.pincode}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No locations found
            </div>
          )}
        </div>
      )}

      {/* Click outside to close results */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
} 