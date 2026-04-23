import { ClaimStatusBadge } from './ClaimStatusBadge';
import type { ClaimStatusHistory } from '@/types/claim';

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

interface ClaimHistoryTimelineProps {
  history: ClaimStatusHistory[];
}

export function ClaimHistoryTimeline({ history }: ClaimHistoryTimelineProps) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No status history recorded yet.</p>
    );
  }

  // Reverse-chronological
  const sorted = [...history].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <ol aria-label="Claim status history" className="relative border-l border-zinc-200 pl-6 space-y-6">
      {sorted.map((entry) => (
        <li key={entry.id} className="relative">
          {/* Dot on the timeline */}
          <span
            aria-hidden="true"
            className="absolute -left-[1.625rem] mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-zinc-300 ring-2 ring-zinc-100"
          />

          <div className="flex flex-wrap items-center gap-2">
            {entry.fromStatus && (
              <>
                <ClaimStatusBadge status={entry.fromStatus} />
                <span className="text-xs text-zinc-400" aria-hidden="true">&rarr;</span>
              </>
            )}
            <ClaimStatusBadge status={entry.toStatus} />
            <time
              dateTime={entry.createdAt}
              className="ml-auto text-xs text-zinc-400"
            >
              {formatDateTime(entry.createdAt)}
            </time>
          </div>

          {entry.notes && (
            <p className="mt-1 text-sm text-zinc-600">{entry.notes}</p>
          )}

          {entry.createdBy && (
            <p className="mt-0.5 text-xs text-zinc-400">by {entry.createdBy}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
