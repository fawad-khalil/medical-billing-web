'use client';

import { use } from 'react';
import Link from 'next/link';
import { ClaimStatusBadge } from '@/components/claims/ClaimStatusBadge';
import { ClaimActionBar } from '@/components/claims/ClaimActionBar';
import { ClaimLinesTable } from '@/components/claims/ClaimLinesTable';
import { ClaimHistoryTimeline } from '@/components/claims/ClaimHistoryTimeline';
import { DataField } from '@/components/ui/DataField';
import { SkeletonRow } from '@/components/ui/SkeletonRow';
import { useClaim, useClaimHistory } from '@/hooks/useClaims';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
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

function formatCurrency(value: string): string {
  const n = parseFloat(value);
  return isNaN(n)
    ? '—'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Action bar skeleton */}
      <div className="h-12 w-full animate-pulse rounded-lg bg-zinc-100" />
      {/* Details skeleton */}
      <dl className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-lg border border-zinc-200 bg-white p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-20 animate-pulse rounded bg-zinc-100" />
            <div className="mt-1 h-4 w-36 animate-pulse rounded bg-zinc-100" />
          </div>
        ))}
      </dl>
      {/* Lines table skeleton */}
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              {Array.from({ length: 9 }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-3 w-12 animate-pulse rounded bg-zinc-100" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonRow key={i} cols={9} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: claim, isLoading, isError } = useClaim(id);
  const { data: history = [], isLoading: historyLoading } = useClaimHistory(id);

  if (isLoading) {
    return (
      <div className="px-6 py-8 bg-zinc-50 min-h-full">
        <div className="mb-4 h-5 w-48 animate-pulse rounded bg-zinc-100" />
        <div className="mb-4 h-8 w-72 animate-pulse rounded bg-zinc-100" />
        <DetailSkeleton />
      </div>
    );
  }

  if (isError || !claim) {
    return (
      <div className="px-6 py-8 bg-zinc-50 min-h-full">
        <p className="text-sm text-red-600">
          Failed to load claim.{' '}
          <Link href="/claims" className="underline">
            Go back to Claims
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 bg-zinc-50 min-h-full">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-zinc-500">
        <Link href="/claims" className="hover:text-zinc-700">
          Claims
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-zinc-900">{claim.claimNumber}</span>
      </nav>

      {/* Page header */}
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900 font-mono">{claim.claimNumber}</h1>
        <ClaimStatusBadge status={claim.status} />
      </div>

      {/* Action bar */}
      <div className="mb-6">
        <ClaimActionBar claimId={claim.id} status={claim.status} />
      </div>

      {/* Claim details */}
      <section aria-labelledby="section-details" className="mb-6">
        <h2
          id="section-details"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500"
        >
          Claim Details
        </h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-lg border border-zinc-200 bg-white p-6">
          <DataField label="Patient">
            <Link
              href={`/patients/${claim.patientId}`}
              className="text-blue-600 underline hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {claim.patientName}
            </Link>
          </DataField>
          <DataField label="Payer" value={claim.payerName} />
          <DataField label="Provider">
            <Link
              href={`/providers/${claim.providerId}`}
              className="text-blue-600 underline hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {claim.providerName}
            </Link>
          </DataField>
          <DataField label="Date of Service" value={formatDate(claim.dateOfService)} />
          <DataField
            label="Submitted"
            value={formatDateTime(claim.submittedAt)}
          />
          <DataField
            label="Billed"
            value={formatCurrency(claim.billedAmount)}
          />
          {claim.notes && (
            <DataField label="Notes" value={claim.notes} fullWidth />
          )}
        </dl>
      </section>

      {/* Claim lines */}
      <section aria-labelledby="section-lines" className="mb-6">
        <h2
          id="section-lines"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500"
        >
          Claim Lines
        </h2>
        <ClaimLinesTable lines={claim.claimLines} />
      </section>

      {/* Status history timeline */}
      <section aria-labelledby="section-history">
        <h2
          id="section-history"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500"
        >
          Status History
        </h2>
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          {historyLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-4 w-4 animate-pulse rounded-full bg-zinc-100" />
                  <div className="h-4 w-48 animate-pulse rounded bg-zinc-100" />
                </div>
              ))}
            </div>
          ) : (
            <ClaimHistoryTimeline history={history} />
          )}
        </div>
      </section>
    </div>
  );
}
