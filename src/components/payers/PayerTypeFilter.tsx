'use client';

import type { PayerType } from '@/types/payer';

type FilterOption = {
  label: string;
  value: PayerType[] | null;
};

const OPTIONS: FilterOption[] = [
  { label: 'All', value: null },
  { label: 'Medicare', value: ['MEDICARE'] },
  { label: 'Medicaid', value: ['MEDICAID'] },
  { label: 'Commercial', value: ['PRIMARY', 'SECONDARY', 'TERTIARY', 'OTHER'] },
  { label: 'Workers Comp', value: ['WORKERS_COMP'] },
  { label: 'Auto', value: ['AUTO'] },
];

interface PayerTypeFilterProps {
  value: PayerType[] | null;
  onChange: (value: PayerType[] | null) => void;
}

export function PayerTypeFilter({ value, onChange }: PayerTypeFilterProps) {
  const selectedLabel =
    OPTIONS.find(
      (o) => JSON.stringify(o.value) === JSON.stringify(value),
    )?.label ?? 'All';

  return (
    <fieldset>
      <legend className="sr-only">Filter by payer type</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup">
        {OPTIONS.map((opt) => {
          const isSelected = JSON.stringify(opt.value) === JSON.stringify(value);
          return (
            <button
              key={opt.label}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(opt.value)}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                isSelected
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <span className="sr-only" aria-live="polite">
        Showing {selectedLabel} payers
      </span>
    </fieldset>
  );
}
