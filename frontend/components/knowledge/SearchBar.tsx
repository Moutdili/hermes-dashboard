'use client';

import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { debounce } from '@/lib/utils';

interface SearchBarProps {
  onSearch: (q: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = 'Rechercher…' }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const debouncedSearch = useCallback(debounce(onSearch, 300), [onSearch]);

  return (
    <div className="flex gap-2">
      <Input
        icon={<Search size={16} />}
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          debouncedSearch(e.target.value);
        }}
        onKeyDown={(e) => e.key === 'Enter' && onSearch(query)}
      />
      {query && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setQuery('');
            onSearch('');
          }}
          aria-label="Effacer"
        >
          <X size={18} />
        </Button>
      )}
    </div>
  );
}