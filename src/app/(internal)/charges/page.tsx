'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { EncounterStatusBadge } from '@/components/charges/EncounterStatusBadge';
import { SourceBadge } from '@/components/charges/SourceBadge';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonRow';
import { useEncounters } from '@/hooks/useEncounters';
import type { EncounterFilters, EncounterSource, EncounterStatus } from '@/types/encounter';

const LIMIT = 25;

function formatDOS(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y.slice(2)}`;
}

function formatFee(fee: string): string {
  const n = parseFloat(fee);
  return isNaN(n)
    ? '—'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function ChargesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Derive filter state from URL params
  const [filters, setFilters] = useState<EncounterFilters>(() => ({
    status: (searchParams.get('status') as EncounterStatus | null) ?? undefined,
    source: (searchParams.get('source') as EncounterSource | null) ?? undefined,
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined,
    page: parseInt(searchParams.get('page') ?? '1', 10),
    limit: LIMIT,
  }));

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.source) params.set('source', filters.source);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.page && filters.page > 1) params.set('page', String(filters.page));
    const qs = params.toString();
    router.replace(qs ? `/charges?${qs}` : '/charges', { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const query = useEncounters(filters);
  const encounters = query.data?.data ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);
  const page = filters.page ?? 1;

  const setFilter = useCallback(
    <K extends keyof EncounterFilters>(key: K, value: EncounterFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    },
    [],
  );

  function clearFilters() {
    setFilters({ limit: LIMIT, page: 1 });
  }

  const hasActiveFilters = !!(filters.status || filters.source || filters.dateFrom || filters.dateTo);

  return (
    <div className="px-6 py-8">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Charges</h1>
          {query.data && (
            <p className="mt-0.5 text-sm text-zinc-500">
              {total} encounter{total !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Link
          href="/charges/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          + New Encounter
        </Link>
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="filter-date-from" className="block text-xs font-medium text-zinc-600 mb-1">
            Date From
          </label>
          <input
            id="filter-date-from"
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={(e) => setFilter('dateFrom', e.target.value || undefined)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          />
        </div>
        <div>
          <label htmlFor="filter-date-to" className="block text-xs font-medium text-zinc-600 mb-1">
            Date To
          </label>
          <input
            id="filter-date-to"
            type="date"
            value={filters.dateTo ?? ''}
            onChange={(e) => setFilter('dateTo', e.target.value || undefined)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          />
        </div>
        <div>
          <label htmlFor="filter-status" className="block text-xs font-medium text-zinc-600 mb-1">
            Status
          </label>
          <select
            id="filter-status"
            value={filters.status ?? ''}
            onChange={(e) => setFilter('status', (e.target.value as EncounterStatus) || undefined)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="READY">Ready</option>
            <option value="BILLED">Billed</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-source" className="block text-xs font-medium text-zinc-600 mb-1">
            Source
          </label>
          <select
            id="filter-source"
            value={filters.source ?? ''}
            onChange={(e) => setFilter('source', (e.target.value as EncounterSource) || undefined)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <option value="">All sources</option>
            <option value="PARSED">AI Parsed</option>
            <option value="MANUAL">Manual</option>
          </select>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Error */}
      {query.isError && (
        <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load encounters. Refresh to try again.
        </div>
      )}

      {/* Content */}
      {!query.isLoading && encounters.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            heading="No encounters match these filters"
            message="Try a wider date range or clear the status filter."
            action={{ label: 'Clear filters', onClick: clearFilters }}
          />
        ) : (
          <EmptyState
            heading="No encounters yet"
            message="Create your first encounter to start capturing charges."
            action={{ label: '+ New Encounter', onClick: () => router.push('/charges/new') }}
          />
        )
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Date of Service</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Patient</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Provider</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">Lines</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">Total Fee</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Status</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Source</th>
                  <th scope="col" className="relative px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {query.isLoading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
                  : encounters.map((enc) => (
                      <tr
                        key={enc.id}
                        className={`cursor-pointer hover:bg-zinc-50 ${enc.status === 'BILLED' ? 'opacity-80' : ''}`}
                        onClick={() => router.push(`/charges/${enc.id}`)}
                      >
                        <td className="px-4 py-3 text-sm text-zinc-900">
                          {formatDOS(enc.dateOfService)}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-700">
                          {enc.patientId}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-700">
                          {enc.providerId}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-zinc-700">
                          {enc.lineCount}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-zinc-900">
                          {formatFee(enc.totalFee)}
                        </td>
                        <td className="px-4 py-3">
                          <EncounterStatusBadge status={enc.status} />
                        </td>
                        <td className="px-4 py-3">
                          <SourceBadge source={enc.source} />
                        </td>
                        <td
                          className="px-4 py-3 text-right text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            href={`/charges/${enc.id}`}
                            className="font-medium text-blue-600 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                          >
                            View
                          </Link>
                          {enc.status !== 'BILLED' && (
                            <>
                              <span className="mx-2 text-zinc-300" aria-hidden="true">|</span>
                              <Link
                                href={`/charges/${enc.id}/edit`}
                                className="font-medium text-blue-600 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                              >
                                Edit
                              </Link>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {total > LIMIT && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={LIMIT}
              onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
              entityLabel="encounters"
            />
          )}
        </>
      )}
    </div>
  );
}

export default function ChargesPage() {
  return (
    <Suspense>
      <ChargesContent />
    </Suspense>
  );
}
