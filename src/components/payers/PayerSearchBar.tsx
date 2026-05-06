'use client';

import { useRef, useState } from 'react';

interface PayerSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (q: string) => void;
  onEdiSearch: (ediPayerId: string) => void;
}

export function PayerSearchBar({ value, onChange, onSearch, onEdiSearch }: PayerSearchBarProps) {
  const [isEdiMode, setIsEdiMode] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const announcerRef = useRef<HTMLSpanElement | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    onChange(v);

    const trimmed = v.trim();
    const isDigitOnly = /^\d+$/.test(trimmed);

    if (isDigitOnly && trimmed.length >= 1) {
      if (!isEdiMode) {
        setIsEdiMode(true);
      }
      if (trimmed.length >= 2) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        onEdiSearch(trimmed);
      }
    } else {
      if (isEdiMode) setIsEdiMode(false);
      if (trimmed.length >= 2) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => onSearch(trimmed), 300);
      } else if (trimmed.length === 0) {
        onSearch('');
      }
    }
  }

  function handleClear() {
    onChange('');
    onSearch('');
    setIsEdiMode(false);
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        aria-label="Search payers by name or EDI payer ID"
        placeholder="Search by name or EDI payer ID"
        className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-3 pr-20 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {isEdiMode && (
        <span className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 text-xs font-medium text-blue-600">
          EDI ID
        </span>
      )}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600"
        >
          ×
        </button>
      )}
      <span
        ref={announcerRef}
        aria-live="polite"
        className="sr-only"
      >
        {isEdiMode ? 'Searching by EDI payer ID' : ''}
      </span>
    </div>
  );
}
