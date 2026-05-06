import type { ProviderType } from '@/types/provider';

type FilterValue = ProviderType | 'all';

interface ProviderTypeFilterProps {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
}

const OPTIONS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'individual', label: 'Individual' },
  { value: 'organization', label: 'Organization' },
];

export function ProviderTypeFilter({ value, onChange }: ProviderTypeFilterProps) {
  return (
    <fieldset>
      <legend className="sr-only">Filter by provider type</legend>
      <div role="radiogroup" className="flex gap-2">
        {OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                selected
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
