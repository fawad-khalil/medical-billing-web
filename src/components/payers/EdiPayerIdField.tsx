'use client';

import { useState, useEffect } from 'react';
import { payersApi } from '@/lib/api';

interface EdiPayerIdFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  initialValue?: string;
  currentPayerId?: string;
}

export function EdiPayerIdField({
  value,
  onChange,
  error,
  initialValue,
  currentPayerId,
}: EdiPayerIdFieldProps) {
  const [dupeName, setDupeName] = useState<string | null>(null);
  const [dupeId, setDupeId] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [showChangeWarning, setShowChangeWarning] = useState(false);

  const hasChanged = initialValue !== undefined && value !== initialValue;

  useEffect(() => {
    if (hasChanged) {
      setShowChangeWarning(true);
    } else {
      setShowChangeWarning(false);
    }
  }, [hasChanged]);

  async function handleBlur() {
    const trimmed = value.trim();
    if (!trimmed) return;

    setChecking(true);
    try {
      const results = await payersApi.search({ ediPayerId: trimmed });
      const conflict = results.find((p) => p.id !== currentPayerId);
      if (conflict) {
        setDupeName(conflict.name);
        setDupeId(conflict.id);
      } else {
        setDupeName(null);
        setDupeId(null);
      }
    } catch {
      // network error — silently skip duplicate check
    } finally {
      setChecking(false);
    }
  }

  const descIds = ['ediPayerId-hint'];
  if (error) descIds.push('ediPayerId-error');
  if (dupeName) descIds.push('ediPayerId-dupe');
  if (showChangeWarning) descIds.push('ediPayerId-change-warning');

  return (
    <div>
      <label htmlFor="ediPayerId" className="block text-sm font-medium text-zinc-700">
        EDI Payer ID <span aria-hidden="true">*</span>
      </label>
      <div className="relative mt-1">
        <input
          id="ediPayerId"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          onBlur={handleBlur}
          maxLength={10}
          aria-required="true"
          aria-invalid={!!error}
          aria-describedby={descIds.join(' ')}
          className={`block w-full rounded-md border px-3 py-2 font-mono text-sm uppercase focus:outline-none focus:ring-1 ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-zinc-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          placeholder="e.g. 00192"
        />
        {checking && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
            checking…
          </span>
        )}
      </div>
      <p id="ediPayerId-hint" className="mt-1 text-xs text-zinc-500">
        The trading partner ID for your clearinghouse (e.g. 00192 for Medicare Part B).
      </p>
      {error && (
        <p id="ediPayerId-error" role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
      {dupeName && (
        <div
          id="ediPayerId-dupe"
          role="alert"
          className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
        >
          EDI payer ID &ldquo;{value}&rdquo; already exists for payer{' '}
          <a href={`/payers/${dupeId}`} className="underline">
            {dupeName}
          </a>
          . If this is the same payer, edit that record instead. You can still save if this is a
          different payer (e.g. same insurer, different product line).
        </div>
      )}
      {showChangeWarning && (
        <div
          id="ediPayerId-change-warning"
          role="alert"
          className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
        >
          Changing the EDI payer ID will affect all future claims for this payer. Claims already
          submitted will not be affected.
        </div>
      )}
    </div>
  );
}
