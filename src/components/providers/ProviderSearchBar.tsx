'use client';

import { useRef } from 'react';

interface ProviderSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  onNpiSearch: (npi: string) => void;
  isLoading?: boolean;
}

/**
 * Dual-mode search input:
 * - Digit-only (1–10 chars): shows "NPI" label inside the field; at exactly 10
 *   digits fires onNpiSearch immediately (no debounce).
 * - Non-numeric 2+ chars: calls onSearch (caller applies 300 ms debounce).
 * aria-live="polite" announces the mode switch to screen readers.
 */
export function ProviderSearchBar({
  value,
  onChange,
  onSearch,
  onNpiSearch,
  isLoading = false,
}: ProviderSearchBarProps) {
  const isNpiMode = /^\d*$/.test(value) && value.length > 0 && value.length <= 10;
  const liveRef = useRef<HTMLSpanElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    onChange(raw);

    const digits = /^\d+$/.test(raw.trim());

    if (digits && raw.trim().length === 10) {
      // Exact NPI — fire immediately
      onNpiSearch(raw.trim());
    } else if (!digits && raw.trim().length >= 2) {
      // Name search — caller debounces
      onSearch(raw.trim());
    }
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        {isLoading ? (
          <svg
            className="h-4 w-4 animate-spin text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        ) : (
          <svg
            className="h-4 w-4 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"
            />
          </svg>
        )}
      </div>

      <input
        type="text"
        inputMode={isNpiMode ? 'numeric' : 'text'}
        value={value}
        onChange={handleChange}
        placeholder="Search by name or NPI"
        aria-label="Search providers by name or NPI"
        className="block w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-16 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      />

      {/* NPI mode indicator — visible when input looks like digits */}
      {isNpiMode && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <span className="text-xs font-medium text-blue-600">NPI</span>
        </div>
      )}

      {/* Screen-reader live region announces mode switches */}
      <span ref={liveRef} aria-live="polite" className="sr-only">
        {isNpiMode ? 'NPI search mode' : value.length >= 2 ? 'Name search mode' : ''}
      </span>
    </div>
  );
}
