'use client';

import { useState, useRef, useEffect, useId, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import { useProviderSearch } from '@/hooks/useProviders';
import type { ProviderSummary, ProviderType } from '@/types/provider';

interface ProviderSummarySelectProps {
  value: ProviderSummary | null;
  onChange: (provider: ProviderSummary | null) => void;
  /** Pre-filter the dropdown to a specific type; biller can still search across types */
  defaultType?: ProviderType;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Searchable combobox for selecting a provider in charge entry.
 * Implements ARIA combobox pattern (role="combobox", role="listbox",
 * role="option") with full keyboard navigation.
 */
export function ProviderSummarySelect({
  value,
  onChange,
  defaultType,
  placeholder = 'Search providers…',
  disabled = false,
}: ProviderSummarySelectProps) {
  const id = useId();
  const inputId = `${id}-input`;
  const listboxId = `${id}-listbox`;

  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: results = [], isLoading } = useProviderSearch(inputValue, defaultType);

  const activeId = activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function openDropdown() {
    if (!disabled) {
      setIsOpen(true);
      setActiveIndex(-1);
    }
  }

  function selectOption(provider: ProviderSummary) {
    onChange(provider);
    setInputValue('');
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function clearSelection() {
    onChange(null);
    setInputValue('');
    inputRef.current?.focus();
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
        openDropdown();
        return;
      }
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((i) => Math.max(i - 1, -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (activeIndex >= 0 && results[activeIndex]) {
            selectOption(results[activeIndex]);
          }
          break;
        case 'Tab':
          if (activeIndex >= 0 && results[activeIndex]) {
            selectOption(results[activeIndex]);
          } else {
            setIsOpen(false);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setActiveIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOpen, results, activeIndex],
  );

  // Scroll active option into view
  useEffect(() => {
    if (activeIndex >= 0) {
      const el = document.getElementById(`${id}-option-${activeIndex}`);
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, id]);

  return (
    <div ref={containerRef} className="relative">
      {/* Selected value display or search input */}
      {value && !isOpen ? (
        <div className="flex items-center justify-between rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm">
          <span className="flex items-center gap-2">
            <span className="font-medium text-zinc-900">{value.displayName}</span>
            <span className="font-mono text-xs text-zinc-500">{value.npi}</span>
            <Badge variant={value.providerType} />
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={openDropdown}
              disabled={disabled}
              aria-label="Change provider"
              className="rounded p-0.5 text-zinc-400 hover:text-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
              </svg>
            </button>
            <button
              type="button"
              onClick={clearSelection}
              disabled={disabled}
              aria-label="Clear provider selection"
              className="rounded p-0.5 text-zinc-400 hover:text-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-controls={isOpen ? listboxId : undefined}
            aria-activedescendant={activeId}
            value={inputValue}
            placeholder={placeholder}
            disabled={disabled}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={openDropdown}
            onKeyDown={handleKeyDown}
            className="block w-full rounded-md border border-zinc-300 bg-white py-2 pl-3 pr-8 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            {isLoading ? (
              <svg className="h-4 w-4 animate-spin text-zinc-400" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Dropdown listbox */}
      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Provider options"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg"
        >
          {/* Live count announcement */}
          <li aria-live="polite" className="sr-only">
            {results.length} provider{results.length !== 1 ? 's' : ''} found
          </li>

          {results.length === 0 && !isLoading && (
            <li className="px-3 py-2 text-sm text-zinc-500">
              {inputValue.length >= 2
                ? 'No providers match your search'
                : 'Type to search providers'}
            </li>
          )}

          {results.map((provider, index) => {
            const isActive = index === activeIndex;
            const optionId = `${id}-option-${index}`;
            return (
              <li
                key={provider.id}
                id={optionId}
                role="option"
                aria-selected={value?.id === provider.id}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent input blur before click fires
                  selectOption(provider);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`cursor-pointer px-3 py-2 ${
                  isActive ? 'bg-blue-50' : 'hover:bg-zinc-50'
                }`}
              >
                <p className="text-sm font-medium text-zinc-900">{provider.displayName}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                  <span className="font-mono">{provider.npi}</span>
                  <span aria-hidden="true">·</span>
                  <span>{provider.primaryTaxonomyCode}</span>
                  <Badge variant={provider.providerType} />
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
