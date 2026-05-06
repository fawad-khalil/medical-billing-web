'use client';

import { useId, useRef, useState } from 'react';
import { paymentPostingApi } from '@/lib/paymentPostingApi';
import type { ClaimBalance } from '@/types/payment-posting';

interface ClaimResult {
  id: string;
  claimNumber: string;
  patientName: string;
  dateOfService: string;
  totalCharge: string;
  status: string;
}

interface ClaimSearchBarProps {
  existingClaimIds: string[];
  onSelect: (claimId: string, claimNumber: string) => void;
}

function formatDOS(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y.slice(2)}`;
}

function formatCurrency(v: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(v));
}

export function ClaimSearchBar({ existingClaimIds, onSelect }: ClaimSearchBarProps) {
  const uid = useId();
  const listboxId = `claim-search-listbox-${uid}`;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClaimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const announceRef = useRef<HTMLDivElement>(null);

  function handleChange(val: string) {
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!val.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/claims?search=${encodeURIComponent(val)}&limit=10`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token') ?? ''}` },
        });
        const data = await res.json();
        const items: ClaimResult[] = (data.data ?? data ?? []).map((c: Record<string, unknown>) => ({
          id: c.id,
          claimNumber: c.claimNumber,
          patientName: c.patientName ?? '—',
          dateOfService: c.dateOfService,
          totalCharge: c.billedAmount ?? c.totalCharge ?? '0',
          status: c.status,
        }));
        setResults(items);
        setOpen(true);
        if (announceRef.current) {
          announceRef.current.textContent = items.length
            ? `${items.length} claim${items.length !== 1 ? 's' : ''} found.`
            : 'No claims found.';
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function handleSelect(result: ClaimResult) {
    setQuery('');
    setResults([]);
    setOpen(false);
    onSelect(result.id, result.claimNumber);
  }

  return (
    <div className="relative flex-1">
      <div aria-live="polite" aria-atomic="true" className="sr-only" ref={announceRef} />
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search by claim #, patient name, or DOS…"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-label="Search claims to add payment line"
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      />

      {loading && (
        <div className="absolute right-3 top-2.5">
          <svg className="h-4 w-4 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {open && results.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Claim search results"
          className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-zinc-200 bg-white shadow-lg max-h-64 overflow-y-auto"
        >
          {results.map((r) => {
            const alreadyAdded = existingClaimIds.includes(r.id);
            return (
              <li
                key={r.id}
                role="option"
                aria-selected={false}
                aria-disabled={alreadyAdded}
                onClick={() => !alreadyAdded && handleSelect(r)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm ${
                  alreadyAdded
                    ? 'cursor-not-allowed text-zinc-400'
                    : 'cursor-pointer hover:bg-zinc-50'
                }`}
              >
                <span className="w-32 shrink-0 font-mono text-blue-600">{r.claimNumber}</span>
                <span className="flex-1 text-zinc-700">{r.patientName}</span>
                <span className="w-20 shrink-0 text-zinc-500">{formatDOS(r.dateOfService)}</span>
                <span className="w-20 shrink-0 text-right font-medium text-zinc-900">{formatCurrency(r.totalCharge)}</span>
                {alreadyAdded && (
                  <span className="text-xs text-zinc-400">(already added)</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {open && results.length === 0 && !loading && query.trim() && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-3 shadow-lg text-sm text-zinc-500">
          No claims found matching &ldquo;{query}&rdquo;. Check the claim number or patient name.
        </div>
      )}
    </div>
  );
}
