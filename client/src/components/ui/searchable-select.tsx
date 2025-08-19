import { useState, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, ChevronDown } from 'lucide-react';

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
  const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search query
  useEffect(() => {
    console.log('🔍 SearchableSelect: Filtering options', { searchQuery, optionsCount: options.length });
    if (searchQuery.trim() === '') {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option =>
        option.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log('🔍 SearchableSelect: Filtered options', { searchQuery, filteredCount: filtered.length, filtered });
      setFilteredOptions(filtered);
    }
  }, [searchQuery, options]);

  // Focus search input when select opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Clear search when select closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div>
      {label && <Label className="mb-2 block">{label}</Label>}
      <Select 
        value={value} 
        onValueChange={handleSelect}
        disabled={disabled}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
          <ChevronDown className="h-4 w-4 opacity-50" />
        </SelectTrigger>
        <SelectContent 
          className="w-full min-w-[200px]"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Search Input */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsOpen(false);
                  }
                }}
              />
            </div>
          </div>

          {/* Options List */}
          <div 
            className="overflow-y-auto"
            style={{ maxHeight }}
          >
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Loading...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                {searchQuery ? 'No results found' : 'No options available'}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <SelectItem 
                  key={option} 
                  value={option}
                  className="cursor-pointer"
                >
                  {option}
                </SelectItem>
              ))
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
} 