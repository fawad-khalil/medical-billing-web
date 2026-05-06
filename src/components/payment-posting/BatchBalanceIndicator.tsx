'use client';

interface BatchBalanceIndicatorProps {
  batchTotal: number;
  linesPaidSum: number;
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export function BatchBalanceIndicator({ batchTotal, linesPaidSum }: BatchBalanceIndicatorProps) {
  const diffCents = Math.round(batchTotal * 100) - Math.round(linesPaidSum * 100);
  const diff = diffCents / 100;
  const isBalanced = diffCents === 0;
  const isOver = diffCents < 0;

  if (isBalanced) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 transition-colors duration-200 motion-reduce:transition-none"
      >
        <svg className="h-4 w-4 shrink-0 text-green-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
        <div>
          <p className="text-sm font-medium text-green-800">Batch balanced</p>
          <p className="text-sm text-green-700">{fmt(linesPaidSum)} of {fmt(batchTotal)}</p>
        </div>
      </div>
    );
  }

  if (isOver) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 transition-colors duration-200 motion-reduce:transition-none"
      >
        <svg className="h-4 w-4 shrink-0 text-red-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
        </svg>
        <div>
          <p className="text-sm font-medium text-red-800">{fmt(linesPaidSum)} of {fmt(batchTotal)} posted</p>
          <p className="text-sm font-semibold text-red-700">{fmt(Math.abs(diff))} OVER</p>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 transition-colors duration-200 motion-reduce:transition-none"
    >
      <svg className="h-4 w-4 shrink-0 text-amber-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
      <div>
        <p className="text-sm font-medium text-amber-800">{fmt(linesPaidSum)} of {fmt(batchTotal)} posted</p>
        <p className="text-sm text-amber-700">— {fmt(diff)} remaining</p>
      </div>
    </div>
  );
}
