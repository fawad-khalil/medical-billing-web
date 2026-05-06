'use client';

interface TaxIdSectionProps {
  taxIdType: 'EIN' | 'SSN' | '';
  taxId: string;
  onTaxIdTypeChange: (value: 'EIN' | 'SSN' | '') => void;
  onTaxIdChange: (value: string) => void;
  /** In edit mode when SSN is stored, the Tax ID field shows [PROTECTED] read-only. */
  readOnly?: boolean;
  errors?: {
    taxIdType?: string;
    taxId?: string;
  };
}

/**
 * Tax ID Type selector + Tax ID input pair.
 * Cross-field: if either field has a value, both are required.
 * SSN warning banner shown when taxIdType === 'SSN'.
 * Edit readOnly mode: shows [PROTECTED] when SSN.
 */
export function TaxIdSection({
  taxIdType,
  taxId,
  onTaxIdTypeChange,
  onTaxIdChange,
  readOnly = false,
  errors = {},
}: TaxIdSectionProps) {
  const isProtected = readOnly && taxIdType === 'SSN';

  return (
    <div className="space-y-3">
      {/* SSN warning banner */}
      {taxIdType === 'SSN' && !readOnly && (
        <div
          role="alert"
          className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          <svg
            className="mt-0.5 h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <div>
            <p className="font-medium">Sensitive: SSN will be stored encrypted.</p>
            <p className="mt-0.5">
              The value you enter will not be displayed after saving. Verify it carefully before you
              save.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Tax ID Type */}
        <div>
          <label htmlFor="taxIdType" className="mb-1 block text-sm font-medium text-zinc-700">
            Tax ID Type
          </label>
          <select
            id="taxIdType"
            value={taxIdType}
            onChange={(e) => onTaxIdTypeChange(e.target.value as 'EIN' | 'SSN' | '')}
            disabled={readOnly}
            aria-invalid={!!errors.taxIdType}
            aria-describedby={errors.taxIdType ? 'taxIdType-error' : undefined}
            className={`block w-full rounded-md border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              readOnly
                ? 'cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-500'
                : errors.taxIdType
                  ? 'border-red-500'
                  : 'border-zinc-300'
            }`}
          >
            <option value="">— Select type —</option>
            <option value="EIN">EIN (Employer Identification Number)</option>
            <option value="SSN">SSN (Social Security Number)</option>
          </select>
          {errors.taxIdType && (
            <span id="taxIdType-error" role="alert" className="mt-1 block text-xs text-red-600">
              {errors.taxIdType}
            </span>
          )}
        </div>

        {/* Tax ID value */}
        <div>
          <label htmlFor="taxId" className="mb-1 block text-sm font-medium text-zinc-700">
            Tax ID
          </label>
          <div className="relative">
            {isProtected && (
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
            )}
            <input
              id="taxId"
              type="text"
              inputMode="numeric"
              maxLength={9}
              placeholder="9 digits, no dashes"
              value={isProtected ? '[PROTECTED]' : taxId}
              onChange={(e) => {
                if (!readOnly) onTaxIdChange(e.target.value.replace(/\D/g, '').slice(0, 9));
              }}
              readOnly={isProtected}
              aria-invalid={!!errors.taxId}
              aria-describedby={errors.taxId ? 'taxId-error' : undefined}
              aria-label={isProtected ? 'Tax ID — protected, not displayed' : undefined}
              className={`block w-full rounded-md border py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                isProtected
                  ? 'cursor-not-allowed border-zinc-200 bg-zinc-50 pl-9 font-mono text-zinc-500'
                  : errors.taxId
                    ? 'border-red-500 pl-3'
                    : 'border-zinc-300 pl-3'
              }`}
            />
          </div>
          {errors.taxId && (
            <span id="taxId-error" role="alert" className="mt-1 block text-xs text-red-600">
              {errors.taxId}
            </span>
          )}
        </div>
      </div>

      {/* SSN protected notice in read mode */}
      {isProtected && (
        <p className="text-xs text-zinc-500">
          SSN stored encrypted — not transmitted to browser. Contact support if you need to update
          it.
        </p>
      )}
    </div>
  );
}
