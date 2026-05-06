'use client';

import { useTransmissions } from '@/hooks/useClearinghouse';
import { TransmissionStatusBadge } from './TransmissionStatusBadge';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function TransmissionHistoryPanel({ claimId }: { claimId: string }) {
  const { data: transmissions = [], isLoading } = useTransmissions(claimId);

  return (
    <details className="group rounded-lg border border-zinc-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
        <span>Transmission History ({transmissions.length} attempt{transmissions.length !== 1 ? 's' : ''})</span>
        <svg
          className="h-4 w-4 text-zinc-400 transition-transform group-open:rotate-180"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </summary>

      <div className="border-t border-zinc-200 px-5 py-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-zinc-100" />
            ))}
          </div>
        ) : transmissions.length === 0 ? (
          <p className="text-sm text-zinc-500">No transmissions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Submitted</th>
                  <th className="pb-2 pr-4">Clearinghouse</th>
                  <th className="pb-2 pr-4">Method</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">ACK Code</th>
                  <th className="pb-2">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {transmissions.map((tx) => (
                  <tr key={tx.id} className="text-zinc-700">
                    <td className="py-2 pr-4 font-mono text-zinc-500">{tx.attemptNumber}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{formatDateTime(tx.submittedAt)}</td>
                    <td className="py-2 pr-4">{tx.clearinghouse}</td>
                    <td className="py-2 pr-4">{tx.submissionMethod}</td>
                    <td className="py-2 pr-4">
                      <TransmissionStatusBadge status={tx.status} />
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">{tx.ackCode ?? '—'}</td>
                    <td className="py-2 max-w-xs truncate text-xs text-red-600">
                      {tx.errorMessage ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </details>
  );
}
