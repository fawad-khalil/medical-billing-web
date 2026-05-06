'use client';

import { useCallback, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonRow';
import { Pagination } from '@/components/ui/Pagination';
import { usePaymentBatches } from '@/hooks/usePaymentBatches';
import type { BatchFilters, BatchStatus, PaymentType } from '@/types/payment-posting';

const LIMIT = 25;

type TabKey = 'all' | 'open' | 'posted' | 'voided';

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y.slice(2)}`;
}

function formatCurrency(v: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(v || '0'));
}

const TAB_STATUS: Record<TabKey, BatchStatus | undefined> = {
  all: undefined,
  open: 'OPEN',
  posted: 'POSTED',
  voided: 'VOIDED',
};

function PaymentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabKey>(
    (searchParams.get('tab') as TabKey | null) ?? 'all',
  );
  const [filters, setFilters] = useState<BatchFilters>({
    page: parseInt(searchParams.get('page') ?? '1', 10),
    limit: LIMIT,
    status: (searchParams.get('status') as BatchStatus | null) ?? undefined,
    paymentType: (searchParams.get('paymentType') as PaymentType | null) ?? undefined,
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined,
    batchNumber: searchParams.get('batchNumber') ?? undefined,
  });

  const batchNumRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [batchNumInput, setBatchNumInput] = useState(filters.batchNumber ?? '');

  function handleBatchNumChange(val: string) {
    setBatchNumInput(val);
    if (batchNumRef.current) clearTimeout(batchNumRef.current);
    batchNumRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, batchNumber: val || undefined, page: 1 }));
    }, 300);
  }

  const effectiveFilters: BatchFilters = {
    ...filters,
    status: activeTab !== 'all' ? TAB_STATUS[activeTab] : filters.status,
  };

  const query = usePaymentBatches(effectiveFilters);
  const batches = query.data?.data ?? [];
  const rawTotal = query.data?.total ?? 0;
  const totalPages = Math.ceil(rawTotal / LIMIT);
  const page = filters.page ?? 1;

  const openCount = usePaymentBatches({ status: 'OPEN', limit: 1 }).data?.total ?? 0;

  const hasActiveFilters = !!(
    filters.paymentType || filters.dateFrom || filters.dateTo || filters.batchNumber ||
    (activeTab === 'all' && filters.status)
  );

  function clearFilters() {
    setFilters({ limit: LIMIT, page: 1 });
    setBatchNumInput('');
  }

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    setFilters({ limit: LIMIT, page: 1 });
    setBatchNumInput('');
  }

  const tabs: Array<{ key: TabKey; label: string; showDot?: boolean }> = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open', showDot: openCount > 0 },
    { key: 'posted', label: 'Posted' },
    { key: 'voided', label: 'Voided' },
  ];

  function renderEmpty() {
    if (hasActiveFilters) {
      return (
        <EmptyState
          heading="No batches match these filters"
          message="Try a wider date range, a different payer, or clear the type filter."
          action={{ label: 'Clear filters', onClick: clearFilters }}
        />
      );
    }
    if (activeTab === 'open') {
      return (
        <EmptyState
          heading="No open batches"
          message="All batches have been posted or voided."
          action={{ label: '+ New Batch', onClick: () => router.push('/payments/new') }}
        />
      );
    }
    if (activeTab === 'posted') {
      return <EmptyState heading="No posted batches" message="Batches move here after posting." />;
    }
    if (activeTab === 'voided') {
      return <EmptyState heading="No voided batches" message="Voided batches will appear here." />;
    }
    return (
      <EmptyState
        heading="No payment batches yet"
        message="Create a batch to start posting payments against claims."
        action={{ label: '+ New Batch', onClick: () => router.push('/payments/new') }}
      />
    );
  }

  return (
    <div className="px-6 py-8 bg-zinc-50 min-h-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Payment Batches</h1>
          {query.data && (
            <p className="mt-0.5 text-sm text-zinc-500">
              {rawTotal} batch{rawTotal !== 1 ? 'es' : ''}
            </p>
          )}
        </div>
        <Link
          href="/payments/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          + New Batch
        </Link>
      </div>

      {/* Quick filter tabs */}
      <div role="tablist" aria-label="Filter batches by status" className="mb-4 flex gap-0 border-b border-zinc-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            id={`tab-${tab.key}`}
            aria-selected={activeTab === tab.key}
            aria-controls={`panel-${tab.key}`}
            onClick={() => handleTabChange(tab.key)}
            className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {tab.label}
            {tab.showDot && (
              <span
                aria-label={`${openCount} open batch${openCount !== 1 ? 'es' : ''}`}
                className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white"
              >
                {openCount > 9 ? '9+' : openCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="filter-date-from" className="block text-xs font-medium text-zinc-600 mb-1">Date From</label>
          <input id="filter-date-from" type="date" value={filters.dateFrom ?? ''}
            onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value || undefined, page: 1 }))}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          />
        </div>
        <div>
          <label htmlFor="filter-date-to" className="block text-xs font-medium text-zinc-600 mb-1">Date To</label>
          <input id="filter-date-to" type="date" value={filters.dateTo ?? ''}
            onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value || undefined, page: 1 }))}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          />
        </div>
        <div>
          <label htmlFor="filter-type" className="block text-xs font-medium text-zinc-600 mb-1">Type</label>
          <select id="filter-type" value={filters.paymentType ?? ''}
            onChange={(e) => setFilters((p) => ({ ...p, paymentType: (e.target.value as PaymentType) || undefined, page: 1 }))}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <option value="">All types</option>
            <option value="INSURANCE">Insurance</option>
            <option value="PATIENT">Patient</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-batch-num" className="block text-xs font-medium text-zinc-600 mb-1">Batch #</label>
          <input id="filter-batch-num" type="text" value={batchNumInput}
            placeholder="PAY-2026-…"
            onChange={(e) => handleBatchNumChange(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          />
        </div>
        {hasActiveFilters && (
          <button type="button" onClick={clearFilters}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Clear filters
          </button>
        )}
      </div>

      {query.isError && (
        <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load batches. Refresh to try again.
        </div>
      )}

      <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {!query.isLoading && batches.length === 0 ? renderEmpty() : (
          <>
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    {['Batch #', 'Date', 'Type', 'Payer', 'Check / EFT #', 'Amount', 'Status'].map((h) => (
                      <th key={h} scope="col" className={`px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 ${h === 'Amount' ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {query.isLoading
                    ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
                    : batches.map((batch) => (
                        <tr key={batch.id} className="cursor-pointer hover:bg-zinc-50"
                          onClick={() => router.push(`/payments/${batch.id}`)}>
                          <td className="px-4 py-3 font-mono text-sm text-blue-600">
                            <Link href={`/payments/${batch.id}`} onClick={(e) => e.stopPropagation()}
                              className="hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                              {batch.batchNumber}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-700">{formatDate(batch.paymentDate)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={batch.paymentType === 'INSURANCE' ? 'paymentInsurance' : batch.paymentType === 'PATIENT' ? 'paymentPatient' : 'paymentAdjustment'} />
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-700">{batch.payerNameSnapshot ?? '—'}</td>
                          <td className="px-4 py-3 font-mono text-sm text-zinc-700">{batch.checkNumber ?? '—'}</td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-zinc-900">{formatCurrency(batch.totalAmount)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={batch.status === 'OPEN' ? 'batchOpen' : batch.status === 'POSTED' ? 'batchPosted' : 'batchVoided'} />
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
            {rawTotal > LIMIT && (
              <Pagination page={page} totalPages={totalPages} total={rawTotal} limit={LIMIT}
                onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
                entityLabel="batches"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense>
      <PaymentsContent />
    </Suspense>
  );
}
