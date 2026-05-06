'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { SkeletonRow } from '@/components/ui/SkeletonRow';
import { BatchActionBar } from '@/components/payment-posting/BatchActionBar';
import { ClaimSearchBar } from '@/components/payment-posting/ClaimSearchBar';
import { LineEntryPanel } from '@/components/payment-posting/LineEntryPanel';
import { PaymentLineRow } from '@/components/payment-posting/PaymentLineRow';
import { usePaymentBatch } from '@/hooks/usePaymentBatches';
import type { PaymentLine } from '@/types/payment-posting';

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y.slice(2)}`;
}

function formatCurrency(v: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(v || '0'));
}

interface SelectedClaim {
  id: string;
  claimNumber: string;
}

export default function BatchDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: batch, isLoading, isError, refetch } = usePaymentBatch(params.id);
  const [selectedClaim, setSelectedClaim] = useState<SelectedClaim | null>(null);
  const [linePaidAmounts, setLinePaidAmounts] = useState<Record<string, string>>({});

  const lines: PaymentLine[] = batch?.lines ?? [];

  const linesPaidSum = useMemo(() => {
    return lines.reduce((sum, line) => {
      const val = parseFloat(linePaidAmounts[line.id] ?? line.paidAmount);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [lines, linePaidAmounts]);

  function handlePaidAmountChange(lineId: string, value: string) {
    setLinePaidAmounts((prev) => ({ ...prev, [lineId]: value }));
  }

  function handleLineAdded() {
    setSelectedClaim(null);
    refetch();
  }

  if (isLoading) {
    return (
      <div className="px-6 py-8 bg-zinc-50 min-h-full">
        <div className="mb-4 h-12 w-full animate-pulse rounded-lg bg-zinc-100" />
        <div className="mb-6 grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="mb-1 h-3 w-20 animate-pulse rounded bg-zinc-100" />
              <div className="h-4 w-36 animate-pulse rounded bg-zinc-100" />
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full">
            <tbody>{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={9} />)}</tbody>
          </table>
        </div>
      </div>
    );
  }

  if (isError || !batch) {
    return (
      <div className="px-6 py-8 bg-zinc-50 min-h-full">
        <p className="text-sm text-red-600">Failed to load batch.</p>
        <Link href="/payments" className="mt-2 text-sm text-blue-600 hover:text-blue-800">
          Go back to Payment Batches
        </Link>
      </div>
    );
  }

  const readOnly = batch.status !== 'OPEN';
  const existingClaimIds = lines.map((l) => l.claimId);

  const lineTotals = {
    paid: lines.reduce((s, l) => s + parseFloat(l.paidAmount), 0),
    adjustment: lines.reduce((s, l) => s + parseFloat(l.adjustmentAmount), 0),
    patientResp: lines.reduce((s, l) => s + parseFloat(l.patientResponsibilityAmount), 0),
  };

  return (
    <div className="bg-zinc-50 min-h-full">
      {/* Sticky action bar */}
      {batch.status !== 'VOIDED' && (
        <BatchActionBar
          batch={batch}
          linesPaidSum={linesPaidSum}
          onPosted={() => refetch()}
          onVoided={() => refetch()}
        />
      )}

      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/payments" className="text-blue-600 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            Payment Batches
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-mono text-zinc-700">{batch.batchNumber}</span>
        </nav>

        {/* Voided banner */}
        {batch.status === 'VOIDED' && (
          <div className="mb-6 rounded-lg border border-zinc-300 bg-zinc-100 px-4 py-3">
            <p className="text-sm font-medium text-zinc-700">This batch has been voided and cannot be reactivated.</p>
            {batch.voidReason && (
              <p className="mt-0.5 text-sm text-zinc-500">Reason: {batch.voidReason}</p>
            )}
          </div>
        )}

        <div className="mb-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900">{batch.batchNumber}</h1>
          <Badge variant={batch.status === 'OPEN' ? 'batchOpen' : batch.status === 'POSTED' ? 'batchPosted' : 'batchVoided'} />
          <Badge variant={batch.paymentType === 'INSURANCE' ? 'paymentInsurance' : batch.paymentType === 'PATIENT' ? 'paymentPatient' : 'paymentAdjustment'} />
        </div>

        {/* Header card */}
        <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-5">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Payment Date</dt>
              <dd className="mt-0.5 text-zinc-900">{formatDate(batch.paymentDate)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Total Amount</dt>
              <dd className="mt-0.5 font-medium text-zinc-900">{formatCurrency(batch.totalAmount)}</dd>
            </div>
            {batch.payerNameSnapshot && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Payer</dt>
                <dd className="mt-0.5 text-zinc-900">{batch.payerNameSnapshot}</dd>
              </div>
            )}
            {batch.checkNumber && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Check / EFT #</dt>
                <dd className="mt-0.5 font-mono text-zinc-900">{batch.checkNumber}</dd>
              </div>
            )}
            {batch.checkDate && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Check Date</dt>
                <dd className="mt-0.5 text-zinc-900">{formatDate(batch.checkDate)}</dd>
              </div>
            )}
            {batch.notes && (
              <div className="col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Notes</dt>
                <dd className="mt-0.5 text-zinc-700">{batch.notes}</dd>
              </div>
            )}
            {batch.postedAt && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Posted At</dt>
                <dd className="mt-0.5 text-zinc-900">{new Date(batch.postedAt).toLocaleString()}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Payment lines section */}
        <section aria-label="Payment lines">
          <div className="mb-3 flex items-center gap-3">
            {!readOnly && (
              <ClaimSearchBar
                existingClaimIds={existingClaimIds}
                onSelect={(claimId, claimNumber) => setSelectedClaim({ id: claimId, claimNumber })}
              />
            )}
            <h2 className={`text-base font-medium text-zinc-900 ${readOnly ? '' : 'sr-only'}`}>
              Payment Lines
            </h2>
          </div>

          {selectedClaim && !readOnly && (
            <LineEntryPanel
              batchId={batch.id}
              claimId={selectedClaim.id}
              claimNumber={selectedClaim.claimNumber}
              onSuccess={handleLineAdded}
              onCancel={() => setSelectedClaim(null)}
            />
          )}

          <div className={`overflow-x-auto rounded-lg border border-zinc-200 bg-white ${batch.status === 'VOIDED' ? 'opacity-75' : ''}`}>
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  {['Claim #', 'Patient', 'DOS', 'Billed', 'Paid', 'Adjustment', 'CARC', 'Pt. Resp.', ...(readOnly ? [] : [''])].map((h, i) => (
                    <th key={i} scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={readOnly ? 8 : 9} className="py-12 text-center">
                      <svg className="mx-auto mb-2 h-8 w-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <p className="text-base font-semibold text-zinc-900">No payment lines added yet</p>
                      <p className="mt-1 text-sm text-zinc-500">Search for a claim above to add the first payment line.</p>
                    </td>
                  </tr>
                ) : (
                  lines.map((line) => (
                    <PaymentLineRow
                      key={line.id}
                      batchId={batch.id}
                      line={line}
                      readOnly={readOnly}
                      onPaidAmountChange={handlePaidAmountChange}
                    />
                  ))
                )}
              </tbody>
              {lines.length > 0 && (
                <tfoot className="bg-zinc-50">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-right text-sm font-medium text-zinc-900">Totals:</td>
                    <td className="px-3 py-2 text-sm font-medium text-zinc-900" aria-label={`Total paid: ${formatCurrency(lineTotals.paid.toFixed(2))}`}>
                      {formatCurrency(lineTotals.paid.toFixed(2))}
                    </td>
                    <td className="px-3 py-2 text-sm font-medium text-zinc-900">{formatCurrency(lineTotals.adjustment.toFixed(2))}</td>
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2 text-sm font-medium text-zinc-900">{formatCurrency(lineTotals.patientResp.toFixed(2))}</td>
                    {!readOnly && <td />}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
