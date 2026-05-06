'use client';

import type { ClaimType } from '@/types/payer';

interface ClaimTypesCheckboxGroupProps {
  value: ClaimType[];
  onChange: (value: ClaimType[]) => void;
  error?: string;
}

const OPTIONS: { label: string; value: ClaimType }[] = [
  { label: 'Professional (837P)', value: 'PROFESSIONAL' },
  { label: 'Institutional (837I)', value: 'INSTITUTIONAL' },
];

export function ClaimTypesCheckboxGroup({ value, onChange, error }: ClaimTypesCheckboxGroupProps) {
  function toggle(ct: ClaimType) {
    if (value.includes(ct)) {
      onChange(value.filter((v) => v !== ct));
    } else {
      onChange([...value, ct]);
    }
  }

  return (
    <fieldset aria-required="true" aria-describedby={error ? 'claimTypes-error' : undefined}>
      <legend className="block text-sm font-medium text-zinc-700">
        Claim Types <span aria-hidden="true">*</span>
      </legend>
      <div className="mt-2 flex gap-6">
        {OPTIONS.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={value.includes(opt.value)}
              onChange={() => toggle(opt.value)}
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            {opt.label}
          </label>
        ))}
      </div>
      {error && (
        <p id="claimTypes-error" role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}
