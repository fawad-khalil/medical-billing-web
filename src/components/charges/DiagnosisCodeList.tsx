'use client';

import { useRef } from 'react';

const MAX_CODES = 12;
const LETTERS = 'ABCDEFGHIJKL';

const ICD10_RE = /^[A-Z]\d{2,3}(\.\d{1,4})?$/i;

interface DiagnosisCodeListProps {
  codes: string[];
  onChange: (codes: string[]) => void;
  aiExtracted?: Set<number>; // indices of AI-highlighted inputs
  onFieldEdited?: (index: number) => void;
}

export function DiagnosisCodeList({
  codes,
  onChange,
  aiExtracted,
  onFieldEdited,
}: DiagnosisCodeListProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, value: string) {
    const upper = value.toUpperCase();
    const next = [...codes];
    next[index] = upper;
    onChange(next);
    onFieldEdited?.(index);
  }

  function handleAdd() {
    if (codes.length >= MAX_CODES) return;
    const next = [...codes, ''];
    onChange(next);
    // Focus the new input after render
    setTimeout(() => {
      inputRefs.current[next.length - 1]?.focus();
    }, 0);
  }

  function handleRemove(index: number) {
    if (codes.length <= 1) return;
    const next = codes.filter((_, i) => i !== index);
    onChange(next);
    // Focus previous input or the add button area
    setTimeout(() => {
      const target = inputRefs.current[Math.max(0, index - 1)];
      target?.focus();
    }, 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <fieldset>
      <legend className="sr-only">ICD-10 Diagnosis Codes</legend>
      <div className="space-y-2">
        {codes.map((code, index) => {
          const letter = LETTERS[index] ?? String(index + 1);
          const isAi = aiExtracted?.has(index) ?? false;
          const isInvalid = code.length > 0 && !ICD10_RE.test(code);

          return (
            <div key={index} className="flex items-center gap-2">
              <span
                className="w-5 shrink-0 text-center text-xs font-semibold text-zinc-500"
                aria-hidden="true"
              >
                {letter}
              </span>
              <input
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                value={code}
                maxLength={8}
                placeholder="ICD-10"
                aria-label={`Diagnosis code ${letter}`}
                aria-invalid={isInvalid}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`block w-32 rounded-md border px-3 py-1.5 text-sm font-mono uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  isInvalid
                    ? 'border-red-500 bg-red-50 text-red-900'
                    : isAi
                    ? 'border-amber-300 bg-amber-50 text-zinc-900'
                    : 'border-zinc-300 bg-white text-zinc-900'
                }`}
              />
              {isInvalid && (
                <span className="text-xs text-red-600" role="alert">
                  Must be a valid ICD-10-CM code (e.g. J06.9)
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={codes.length <= 1}
                aria-label={`Remove diagnosis code ${letter}`}
                className="rounded p-1 text-zinc-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {codes.length < MAX_CODES ? (
        <button
          type="button"
          onClick={handleAdd}
          className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          + Add diagnosis code
        </button>
      ) : (
        <p className="mt-3 text-sm text-zinc-400">Maximum 12 diagnosis codes</p>
      )}
    </fieldset>
  );
}
