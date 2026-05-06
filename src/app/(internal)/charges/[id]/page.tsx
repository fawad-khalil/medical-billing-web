'use client';

import { use } from 'react';
import Link from 'next/link';
import { EncounterStatusBar } from '@/components/charges/EncounterStatusBar';
import { SourceBadge } from '@/components/charges/SourceBadge';
import { DataField } from '@/components/ui/DataField';
import { SkeletonRow } from '@/components/ui/SkeletonRow';
import { useEncounter } from '@/hooks/useEncounters';

const LETTERS = 'ABCDEFGHIJKL';

const POS_LABELS: Record<string, string> = {
  '11': 'Office',
  '12': 'Home',
  '21': 'Inpatient Hospital',
  '22': 'Outpatient Hospital',
  '23': 'Emergency Room',
  '24': 'ASC',
  '02': 'Telehealth',
  '10': 'Telehealth Home',
};

function formatDOS(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

function formatFee(fee: string): string {
  const n = parseFloat(fee);
  return isNaN(n)
    ? '—'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function computeLineTotal(fee: string, units: number): string {
  const n = parseFloat(fee);
  if (isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n * units);
}

function computeTotal(lines: Array<{ fee: string; units: number }>): string {
  const sum = lines.reduce((acc, l) => {
    const n = parseFloat(l.fee);
    return acc + (isNaN(n) ? 0 : n * l.units);
  }, 0);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(sum);
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-full animate-pulse rounded-lg bg-zinc-100" />
      <dl className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-lg border border-zinc-200 bg-white p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-20 animate-pulse rounded bg-zinc-100" />
            <div className="mt-1 h-4 w-36 animate-pulse rounded bg-zinc-100" />
          </div>
        ))}
      </dl>
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              {Array.from({ length: 7 }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-3 w-12 animate-pulse rounded bg-zinc-100" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={7} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function EncounterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: encounter, isLoading, isError, refetch } = useEncounter(id);

  if (isLoading) {
    return (
      <div className="px-6 py-8">
        <div className="mb-4 h-5 w-48 animate-pulse rounded bg-zinc-100" />
        <DetailSkeleton />
      </div>
    );
  }

  if (isError || !encounter) {
    return (
      <div className="px-6 py-8">
        <p className="text-sm text-red-600">
          Failed to load encounter.{' '}
          <Link href="/charges" className="underline">
            Go back to Charges
          </Link>
        </p>
      </div>
    );
  }

  const posLabel = POS_LABELS[encounter.placeOfService]
    ? `${encounter.placeOfService} – ${POS_LABELS[encounter.placeOfService]}`
    : encounter.placeOfService;

  return (
    <div className="px-6 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-zinc-500">
        <Link href="/charges" className="hover:text-zinc-700">
          Charges
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-zinc-900">{formatDOS(encounter.dateOfService)}</span>
      </nav>

      {/* Page header */}
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900">
          {formatDOS(encounter.dateOfService)}
        </h1>
        <SourceBadge source={encounter.source} />
      </div>

      {/* Status bar */}
      <div className="mb-6">
        <EncounterStatusBar
          status={encounter.status}
          encounterId={encounter.id}
          hasLines={encounter.chargeLines.length > 0}
          onStatusChange={() => void refetch()}
        />
      </div>

      {/* Encounter header */}
      <section aria-labelledby="section-header" className="mb-6">
        <h2 id="section-header" className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Encounter Details
        </h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-lg border border-zinc-200 bg-white p-6">
          <DataField label="Patient">
            <Link
              href={`/patients/${encounter.patientId}`}
              className="text-blue-600 hover:text-blue-800 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {encounter.patientId}
            </Link>
          </DataField>
          <DataField label="Provider">
            <Link
              href={`/providers/${encounter.providerId}`}
              className="text-blue-600 hover:text-blue-800 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {encounter.providerId}
            </Link>
          </DataField>
          <DataField label="Date of Service" value={formatDOS(encounter.dateOfService)} />
          <DataField label="Place of Service" value={posLabel} />
          <DataField label="Notes" value={encounter.notes ?? undefined} fullWidth />
        </dl>
      </section>

      {/* Diagnosis codes */}
      <section aria-labelledby="section-dx" className="mb-6">
        <h2 id="section-dx" className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Diagnosis Codes
        </h2>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          {encounter.diagnosisCodes.length === 0 ? (
            <p className="text-sm text-zinc-500">No diagnosis codes recorded.</p>
          ) : (
            <ul className="space-y-1.5">
              {encounter.diagnosisCodes.map((code, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-5 text-center text-xs font-semibold text-zinc-500">
                    {LETTERS[i] ?? String(i + 1)}
                  </span>
                  <span className="font-mono text-sm text-zinc-900">{code}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Charge lines */}
      <section aria-labelledby="section-lines">
        <h2 id="section-lines" className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Charge Lines
        </h2>

        {encounter.chargeLines.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center">
            <p className="text-sm font-medium text-zinc-700">No charge lines recorded</p>
            <p className="mt-1 text-sm text-zinc-500">Edit this encounter to add procedure lines.</p>
            {encounter.status !== 'BILLED' && (
              <Link
                href={`/charges/${encounter.id}/edit`}
                className="mt-3 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Edit Encounter
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">CPT</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Mod</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Dx</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">Units</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">Fee</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {encounter.chargeLines.map((line, i) => {
                  const modStr = (line.modifiers ?? []).filter(Boolean).join(', ') || '—';
                  const dxStr = line.diagnosisPointers
                    .map((p) => LETTERS[p - 1] ?? String(p))
                    .join(', ') || '—';
                  return (
                    <tr key={line.id ?? i}>
                      <td className="px-4 py-3 font-mono text-sm text-zinc-900">{line.cptCode}</td>
                      <td className="px-4 py-3 text-sm text-zinc-700">{modStr}</td>
                      <td className="px-4 py-3 text-sm text-zinc-700">{dxStr}</td>
                      <td className="px-4 py-3 text-right text-sm text-zinc-700">{line.units}</td>
                      <td className="px-4 py-3 text-right text-sm text-zinc-700">{formatFee(line.fee)}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-zinc-900">
                        {computeLineTotal(line.fee, line.units)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-200 bg-zinc-50">
                  <td colSpan={5} className="px-4 py-3 text-right text-sm text-zinc-500">
                    Total billed:
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-zinc-900" aria-live="polite">
                    {computeTotal(encounter.chargeLines)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
