import type { TransmissionStatus } from '@/types/clearinghouse';

const styles: Record<TransmissionStatus, string> = {
  PENDING:  'bg-amber-100 text-amber-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  ERROR:    'bg-zinc-100 text-zinc-600',
};

const labels: Record<TransmissionStatus, string> = {
  PENDING:  'Pending ACK',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  ERROR:    'Error',
};

export function TransmissionStatusBadge({ status }: { status: TransmissionStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
