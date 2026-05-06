'use client';

import { useState, useRef, useEffect, useId } from 'react';
import type { PayerSummary } from '@/types/payer';
import { Badge } from '@/components/ui/Badge';
import { payerTypeToBadgeVariant } from '@/lib/payerUtils';

interface PayerSummarySelectProps {
  payers: PayerSummary[];
  value: string | null;
  onChange: (id: string | null) => void;
  label?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

export function PayerSummarySelect({
  payers,
  value,
  onChange,
  label = 'Payer',
  error,
  required,
  placeholder = 'Search payers…',
}: PayerSummarySelectProps) {
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selected = payers.find((p) => p.id === value) ?? null;

  const filtered = query.trim()
    ? payers.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.ediPayerId.toLowerCase().includes(query.toLowerCase()),
      )
    : payers;

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setOpen(true);
    setActiveIndex(-1);
    if (!e.target.value) onChange(null);
  }

  function handleSelect(payer: PayerSummary) {
    onChange(payer.id);
    setQuery('');
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  }

  function handleClear() {
    onChange(null);
    setQuery('');
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(filtered[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const inputId = `${listboxId}-input`;
  const errorId = `${listboxId}-error`;

  return (
    <div className="relative">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-zinc-700">
          {label} {required && <span aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative mt-1">
        {selected && !open ? (
          <div className="flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2">
            <Badge variant={payerTypeToBadgeVariant(selected.payerType)}>{selected.payerType}</Badge>
            <span className="flex-1 text-sm text-zinc-900">{selected.name}</span>
            <span className="font-mono text-xs text-zinc-400">{selected.ediPayerId}</span>
            <button
              type="button"
              onClick={handleClear}
              aria-label={`Clear selected payer ${selected.name}`}
              className="ml-1 text-zinc-400 hover:text-zinc-600"
            >
              ×
            </button>
          </div>
        ) : (
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-activedescendant={activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            autoComplete="off"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-zinc-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
          />
        )}
        {open && filtered.length > 0 && (
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label="Payer options"
            className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg"
          >
            {filtered.map((payer, i) => (
              <li
                key={payer.id}
                id={`${listboxId}-opt-${i}`}
                role="option"
                aria-selected={payer.id === value}
                onMouseDown={() => handleSelect(payer)}
                className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${
                  i === activeIndex ? 'bg-blue-50' : 'hover:bg-zinc-50'
                } ${!payer.isActive ? 'opacity-50' : ''}`}
              >
                <Badge variant={payerTypeToBadgeVariant(payer.payerType)}>{payer.payerType}</Badge>
                <span className="flex-1 truncate text-zinc-900">{payer.name}</span>
                <span className="font-mono text-xs text-zinc-400">{payer.ediPayerId}</span>
              </li>
            ))}
          </ul>
        )}
        {open && filtered.length === 0 && query.trim() && (
          <div className="absolute z-10 mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-4 text-center text-sm text-zinc-500 shadow-lg">
            No payers match &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
