import { TransmissionStatusBadge } from './TransmissionStatusBadge';
import type { TransmissionResponse } from '@/types/clearinghouse';

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
}

export function SubmissionResultPanel({
  transmission,
}: {
  transmission: TransmissionResponse;
}) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">
        Clearinghouse Submission
      </h2>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <div>
          <dt className="text-xs font-medium text-zinc-500">Clearinghouse</dt>
          <dd className="mt-0.5 font-medium text-zinc-900">{transmission.clearinghouse}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-zinc-500">Control Number</dt>
          <dd className="mt-0.5 font-mono text-zinc-900">
            {transmission.clearinghouseControlNumber ?? transmission.isaControlNumber}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-zinc-500">Method</dt>
          <dd className="mt-0.5 text-zinc-900">{transmission.submissionMethod}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-zinc-500">Submitted</dt>
          <dd className="mt-0.5 text-zinc-900">{formatDateTime(transmission.submittedAt)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-zinc-500">Status</dt>
          <dd className="mt-0.5">
            <TransmissionStatusBadge status={transmission.status} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-zinc-500">ACK Received</dt>
          <dd className="mt-0.5 text-zinc-900">
            {transmission.ackReceivedAt
              ? formatDateTime(transmission.ackReceivedAt)
              : 'Awaiting acknowledgment...'}
          </dd>
        </div>
        {transmission.ackCode && (
          <div>
            <dt className="text-xs font-medium text-zinc-500">ACK Code</dt>
            <dd className="mt-0.5 font-mono text-zinc-900">{transmission.ackCode}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
