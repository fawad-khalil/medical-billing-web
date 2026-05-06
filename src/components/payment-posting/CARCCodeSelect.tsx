'use client';

import { useRef, useState, useId, useEffect } from 'react';

interface CARCEntry {
  code: string;
  description: string;
}

const CARC_CODES: CARCEntry[] = [
  { code: 'CO-4',   description: 'Service inconsistent with modifier' },
  { code: 'CO-11',  description: 'Diagnosis inconsistent with procedure' },
  { code: 'CO-15',  description: 'Payment adjusted — authorization missing' },
  { code: 'CO-16',  description: 'Claim / service lacks information for adjudication' },
  { code: 'CO-18',  description: 'Exact duplicate claim' },
  { code: 'CO-22',  description: 'Care may be covered by another payer' },
  { code: 'CO-24',  description: 'Charges covered under capitation' },
  { code: 'CO-29',  description: 'Claim past timely filing limit' },
  { code: 'CO-45',  description: 'Charges exceed fee schedule / max allowable' },
  { code: 'CO-50',  description: 'Non-covered service' },
  { code: 'CO-51',  description: 'Procedure inconsistent with place of service' },
  { code: 'CO-96',  description: 'Non-covered charge(s)' },
  { code: 'CO-97',  description: 'Service included in payment for another service' },
  { code: 'CO-109', description: 'Claim not covered by this payer' },
  { code: 'CO-119', description: 'Benefit maximum for period reached' },
  { code: 'CO-167', description: 'Service not covered by this payer' },
  { code: 'CO-197', description: 'Precertification / authorization absent' },
  { code: 'CO-204', description: 'Service not covered by payer' },
  { code: 'CO-236', description: 'Not in network / primary care' },
  { code: 'OA-23',  description: 'Payment adjusted — coordination of benefits' },
  { code: 'PR-1',   description: 'Deductible amount' },
  { code: 'PR-2',   description: 'Coinsurance amount' },
  { code: 'PR-3',   description: 'Co-payment amount' },
  { code: 'PR-26',  description: 'Expenses prior to coverage' },
  { code: 'PR-27',  description: 'Expenses after coverage terminated' },
  { code: 'PR-96',  description: 'Non-covered — patient responsibility' },
  { code: 'PI-97',  description: 'Included in payment for another service' },
  { code: 'PI-184', description: 'Not separately reimbursable' },
  { code: 'OA-4',   description: 'Service inconsistent with modifier' },
  { code: 'OA-18',  description: 'Duplicate' },
];

interface CARCCodeSelectProps {
  value: string | null;
  onChange: (code: string | null) => void;
  disabled?: boolean;
  id?: string;
}

export function CARCCodeSelect({ value, onChange, disabled = false, id: externalId }: CARCCodeSelectProps) {
  const uid = useId();
  const triggerId = externalId ?? `carc-trigger-${uid}`;
  const listboxId = `carc-listbox-${uid}`;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = CARC_CODES.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()),
  );

  function openDropdown() {
    setSearch('');
    setOpen(true);
    setActiveIndex(-1);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function closeDropdown() {
    setOpen(false);
    setSearch('');
  }

  function select(code: string | null) {
    onChange(code);
    closeDropdown();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && filtered[activeIndex]) {
        select(filtered[activeIndex].code);
      } else if (search.trim()) {
        select(search.trim().toUpperCase());
      }
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  }

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  return (
    <div className="relative">
      <button
        type="button"
        id={triggerId}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        disabled={disabled}
        onClick={openDropdown}
        className="flex w-full items-center justify-between rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={`font-mono ${value ? 'text-zinc-900' : 'text-zinc-400'}`}>
          {value ?? '—'}
        </span>
        <svg className="h-3.5 w-3.5 text-zinc-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-80 rounded-md border border-zinc-200 bg-white shadow-lg">
          <div className="border-b border-zinc-100 p-2">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setActiveIndex(-1); }}
              onKeyDown={handleKeyDown}
              placeholder="Search code or description..."
              className="w-full rounded border border-zinc-200 px-2.5 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              aria-label="Search CARC codes"
            />
          </div>
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label="CARC codes"
            className="max-h-56 overflow-y-auto py-1"
          >
            <li
              role="option"
              aria-selected={value === null}
              onClick={() => select(null)}
              className={`flex cursor-pointer items-center px-3 py-2 text-sm ${activeIndex === -1 && !search ? 'bg-blue-50' : 'hover:bg-zinc-50'}`}
            >
              <span className="font-mono font-medium text-zinc-400 w-16">—</span>
              <span className="text-zinc-400">None</span>
            </li>
            {filtered.map((entry, i) => (
              <li
                key={entry.code}
                role="option"
                aria-selected={value === entry.code}
                onClick={() => select(entry.code)}
                className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-sm ${
                  i === activeIndex ? 'bg-blue-50' : value === entry.code ? 'bg-zinc-50' : 'hover:bg-zinc-50'
                }`}
              >
                <span className="w-16 shrink-0 font-mono font-medium text-zinc-900">{entry.code}</span>
                <span className="truncate text-zinc-500">{entry.description}</span>
              </li>
            ))}
            {filtered.length === 0 && search && (
              <li
                role="option"
                aria-selected={false}
                onClick={() => select(search.trim().toUpperCase())}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-zinc-50"
              >
                <span className="font-mono font-medium text-zinc-900">{search.trim().toUpperCase()}</span>
                <span className="text-zinc-400">Use this code</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
