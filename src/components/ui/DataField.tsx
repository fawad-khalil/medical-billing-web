import type { ReactNode } from 'react';

interface DataFieldProps {
  label: string;
  value?: string | null;
  children?: ReactNode;
  /** Span across both grid columns */
  fullWidth?: boolean;
}

/**
 * A `<dt>`/`<dd>` pair for use inside a `<dl>` data grid.
 * Extracted from patients/[id]/page.tsx for reuse across detail pages.
 */
export function DataField({ label, value, children, fullWidth = false }: DataFieldProps) {
  return (
    <div className={fullWidth ? 'col-span-2' : undefined}>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-zinc-900">
        {children ?? (value ? value : <span className="text-zinc-400">—</span>)}
      </dd>
    </div>
  );
}
