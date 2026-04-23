'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useReadyEncounters, useCreateClaim } from '@/hooks/useClaims';
import { SkeletonRow } from '@/components/ui/SkeletonRow';
import type { ReadyEncounter } from '@/types/claim';

const LETTERS = 'ABCDEFGHIJKL';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: string): string {
  const n = parseFloat(value);
  return isNaN(n)
    ? '—'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

// ─── Preview card ─────────────────────────────────────────────────────────────

interface PreviewCardProps {
  encounter: ReadyEncounter;
}

function PreviewCard({ encounter }: PreviewCardProps) {
  const dxLetters = encounter.diagnosisCodes
    .map((code, i) => `${LETTERS[i] ?? String(i + 1)}: ${code}`)
    .join(', ');

  return (
    <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Claim Preview
      </h2>

      {/* Warning: no active insurance */}
      {!encounter.hasActiveInsurance && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          This patient has no active insurance on file. Add coverage before submitting to a payer.
        </div>
      )}

      {/* Summary grid */}
      <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Patient</dt>
          <dd className="mt-0.5 text-zinc-900">{encounter.patientName}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Payer</dt>
          <dd className="mt-0.5 text-zinc-900">{encounter.payerName ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Provider</dt>
          <dd className="mt-0.5 text-zinc-900">{encounter.providerName}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Date of Service</dt>
          <dd className="mt-0.5 text-zinc-900">
            {(() => {
              const [y, m, d] = encounter.dateOfService.split('-');
              return `${m}/${d}/${y.slice(2)}`;
            })()}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Billed</dt>
          <dd className="mt-0.5 font-medium text-zinc-900">
            {formatCurrency(encounter.billedAmount)}
          </dd>
        </div>
        {dxLetters && (
          <div className="col-span-2 sm:col-span-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Diagnosis Codes</dt>
            <dd className="mt-0.5 text-zinc-700">{dxLetters}</dd>
          </div>
        )}
      </dl>

      {/* Charge lines table */}
      {encounter.chargeLinesPreview.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200">
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
              {encounter.chargeLinesPreview.map((line, idx) => {
                const modStr = (line.modifiers ?? []).filter(Boolean).join(', ') || '—';
                const dxStr =
                  line.diagnosisPointers
                    .map((p) => LETTERS[p - 1] ?? String(p))
                    .join(', ') || '—';
                const fee = parseFloat(line.fee);
                const lineTotal = isNaN(fee)
                  ? '—'
                  : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                      fee * line.units,
                    );
                return (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-mono text-sm text-zinc-900">{line.cptCode}</td>
                    <td className="px-4 py-3 text-sm text-zinc-700">{modStr}</td>
                    <td className="px-4 py-3 text-sm text-zinc-700">{dxStr}</td>
                    <td className="px-4 py-3 text-right text-sm text-zinc-700">{line.units}</td>
                    <td className="px-4 py-3 text-right text-sm text-zinc-700">{formatCurrency(line.fee)}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-zinc-900">{lineTotal}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewClaimPage() {
  const router = useRouter();
  const [selectedEncounter, setSelectedEncounter] = useState<ReadyEncounter | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: encounters = [], isLoading, isError } = useReadyEncounters();
  const createClaim = useCreateClaim();

  async function handleGenerate() {
    if (!selectedEncounter) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const claim = await createClaim.mutateAsync({ encounterId: selectedEncounter.encounterId });
      router.push(`/claims/${claim.id}`);
    } catch {
      setSubmitError('Could not generate claim — check your connection and try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="px-6 py-8 bg-zinc-50 min-h-full">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-zinc-500">
        <Link href="/claims" className="hover:text-zinc-700">
          Claims
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-zinc-900">New Claim</span>
      </nav>

      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">New Claim</h1>

      {/* Step 1 — Select encounter */}
      <section aria-labelledby="step1-heading">
        <h2 id="step1-heading" className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Step 1 — Select an Encounter
        </h2>

        {isError && (
          <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load ready encounters. Refresh to try again.
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {isLoading ? (
            <table className="min-w-full divide-y divide-zinc-200">
              <tbody className="divide-y divide-zinc-100">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonRow key={i} cols={1} />
                ))}
              </tbody>
            </table>
          ) : encounters.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-zinc-700">No ready encounters</p>
              <p className="mt-1 text-sm text-zinc-500">
                Mark an encounter as Ready in the{' '}
                <Link href="/charges" className="text-blue-600 underline hover:text-blue-800">
                  Charges
                </Link>{' '}
                module before generating a claim.
              </p>
            </div>
          ) : (
            <ul role="listbox" aria-label="Ready encounters" className="divide-y divide-zinc-100">
              {encounters.map((enc) => (
                <li
                  key={enc.encounterId}
                  role="option"
                  aria-selected={selectedEncounter?.encounterId === enc.encounterId}
                  onClick={() =>
                    setSelectedEncounter(
                      selectedEncounter?.encounterId === enc.encounterId ? null : enc,
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedEncounter(
                        selectedEncounter?.encounterId === enc.encounterId ? null : enc,
                      );
                    }
                  }}
                  tabIndex={0}
                  className={`flex cursor-pointer items-center gap-3 px-4 py-3 text-sm hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                    selectedEncounter?.encounterId === enc.encounterId
                      ? 'bg-blue-50'
                      : ''
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                      selectedEncounter?.encounterId === enc.encounterId
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-zinc-300 bg-white'
                    }`}
                  >
                    {selectedEncounter?.encounterId === enc.encounterId && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  <span className="font-mono text-zinc-700">{enc.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Step 2 — Preview (appears on selection) */}
      {selectedEncounter && (
        <section aria-labelledby="step2-heading">
          <h2 id="step2-heading" className="mt-8 mb-0 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Step 2 — Review & Generate
          </h2>
          <PreviewCard encounter={selectedEncounter} />
        </section>
      )}

      {/* Submit error */}
      {submitError && (
        <div role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {/* Footer actions */}
      <div className="mt-6 flex items-center gap-3 border-t border-zinc-200 pt-4">
        <Link
          href="/claims"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!selectedEncounter || submitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {submitting ? 'Generating...' : 'Generate Claim'}
        </button>
      </div>
    </div>
  );
}
