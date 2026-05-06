'use client';

import { useState, useEffect } from 'react';
import { isValidNpi } from '@/lib/npi';

interface NpiFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** When true, the field is read-only with a lock icon and tooltip. Used on edit forms. */
  readOnly?: boolean;
  error?: string;
  onValidationChange?: (valid: boolean | null) => void;
}

/**
 * NPI input with inline Luhn validation.
 * - Pass state: green checkmark + green border
 * - Fail state: red X icon + red border + role="alert" error
 * - readOnly: lock treatment with tooltip explaining immutability
 */
export function NpiField({
  value,
  onChange,
  readOnly = false,
  error,
  onValidationChange,
}: NpiFieldProps) {
  const [validationState, setValidationState] = useState<'valid' | 'invalid' | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  function runValidation(val: string) {
    if (val.length !== 10) {
      setValidationState(null);
      onValidationChange?.(null);
      return;
    }
    const ok = isValidNpi(val);
    setValidationState(ok ? 'valid' : 'invalid');
    onValidationChange?.(ok);
  }

  // Re-validate when value reaches 10 digits
  useEffect(() => {
    if (value.length === 10) runValidation(value);
    // Reset when user clears below 10
    if (value.length < 10) {
      setValidationState(null);
      onValidationChange?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const borderClass = (() => {
    if (readOnly) return 'border-zinc-200';
    if (error || validationState === 'invalid') return 'border-red-500';
    if (validationState === 'valid') return 'border-green-500';
    return 'border-zinc-300';
  })();

  const inputId = 'npi';
  const hintId = 'npi-hint';
  const errorId = 'npi-error';
  const tooltipId = 'npi-lock-tooltip';

  const describedBy = [
    hintId,
    error || validationState === 'invalid' ? errorId : '',
    readOnly ? tooltipId : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (readOnly) {
    return (
      <div>
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-zinc-700">
          NPI <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <div className="relative">
          {/* Lock icon */}
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
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
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>

          <input
            id={inputId}
            type="text"
            value={value}
            readOnly
            aria-required="true"
            aria-describedby={describedBy}
            className="block w-full cursor-not-allowed rounded-md border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-9 text-sm text-zinc-500"
          />

          {/* Why can't I edit tooltip trigger */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            <div className="relative">
              <button
                type="button"
                aria-label="Why can't I edit the NPI?"
                aria-describedby={tooltipId}
                onClick={() => setTooltipVisible((v) => !v)}
                onBlur={() => setTooltipVisible(false)}
                className="rounded p-0.5 text-zinc-400 hover:text-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                  />
                </svg>
              </button>
              {tooltipVisible && (
                <div
                  id={tooltipId}
                  role="tooltip"
                  className="absolute bottom-full right-0 z-10 mb-2 w-72 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 shadow-lg"
                >
                  NPI cannot be changed after a provider is saved. If this NPI is incorrect,
                  deactivate this provider and create a new one.
                </div>
              )}
            </div>
          </div>
        </div>
        <p id={hintId} className="mt-1 text-xs text-zinc-500">
          10 digits. Validated against the Luhn algorithm.
        </p>
        <p id={tooltipId} className="sr-only">
          NPI cannot be changed after a provider is saved. Deactivate and create a new provider if
          the NPI is incorrect.
        </p>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-zinc-700">
        NPI <span className="text-red-500" aria-hidden="true">*</span>
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          maxLength={10}
          placeholder="10-digit NPI"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
          onBlur={() => runValidation(value)}
          aria-required="true"
          aria-invalid={!!(error || validationState === 'invalid')}
          aria-describedby={describedBy}
          aria-label={
            validationState === 'valid'
              ? 'NPI checksum valid'
              : validationState === 'invalid'
                ? 'NPI checksum invalid'
                : undefined
          }
          className={`block w-full rounded-md border py-2 pl-3 pr-9 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${borderClass}`}
        />

        {/* Validation icon */}
        {validationState === 'valid' && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-4 w-4 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        )}
        {validationState === 'invalid' && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-4 w-4 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        )}
      </div>

      <p id={hintId} className="mt-1 text-xs text-zinc-500">
        10 digits. Validated against the Luhn algorithm.
      </p>

      {(error || validationState === 'invalid') && (
        <span id={errorId} role="alert" className="mt-1 block text-xs text-red-600">
          {error ??
            'This NPI does not pass checksum validation. Verify the number on NPPES.'}
        </span>
      )}
    </div>
  );
}
