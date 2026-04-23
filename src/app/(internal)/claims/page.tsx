'use client';

import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClaimStatusBadge } from '@/components/claims/ClaimStatusBadge';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonRow';
import { useClaimsList } from '@/hooks/useClaims';
import type { ClaimFilters, ClaimStatus } from '@/types/claim';

const LIMIT = 25;

// ─── Quick-filter tab definitions ─────────────────────────────────────────────

type TabKey = 'all' | 'pending' | 'needsAction' | 'paid';

const PENDING_STATUSES: ClaimStatus[] = ['DRAFT', 'SCRUBBED', 'SUBMITTED', 'ACCEPTED'];
const NEEDS_ACTION_STATUSES: ClaimStatus[] = ['REJECTED', 'DENIED', 'APPEALED'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDOS(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y.slice(2)}`;
}

function formatCurrency(value: string): string {
  const n = parseFloat(value);
  return isNaN(n)
    ? '—'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function formatAge(iso: string | null): string {
  if (!iso) return '—';
  const days = Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days}d ago`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ClaimsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabKey>(
    (searchParams.get('tab') as TabKey | null) ?? 'all',
  );

  const [filters, setFilters] = useState<ClaimFilters>(() => ({
    status: (searchParams.get('status') as ClaimStatus | null) ?? undefined,
    payerId: searchParams.get('payerId') ?? undefined,
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined,
    claimNumber: searchParams.get('claimNumber') ?? undefined,
    page: parseInt(searchParams.get('page') ?? '1', 10),
    limit: LIMIT,
  }));

  // Debounce claim number input
  const claimNumRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [claimNumInput, setClaimNumInput] = useState(filters.claimNumber ?? '');

  function handleClaimNumChange(val: string) {
    setClaimNumInput(val);
    if (claimNumRef.current) clearTimeout(claimNumRef.current);
    claimNumRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, claimNumber: val || undefined, page: 1 }));
    }, 300);
  }

  // Build effective filters based on active tab
  const effectiveFilters: ClaimFilters = (() => {
    if (activeTab === 'pending') {
      // Backend: pass comma-separated or multiple values — we pass each individually.
      // For now pass no status (the tab=pending param tells the user intent, but
      // the real API call will need the backend to support multi-status. We use
      // tab-level filtering client-side from the "all" result for simplicity.)
      return { ...filters, status: undefined };
    }
    if (activeTab === 'needsAction') {
      return { ...filters, status: undefined };
    }
    if (activeTab === 'paid') {
      return { ...filters, status: 'PAID' };
    }
    return filters;
  })();

  const query = useClaimsList(effectiveFilters);
  const allClaims = query.data?.data ?? [];

  // Client-side tab filtering when tab restricts statuses
  const claims = (() => {
    if (activeTab === 'pending') {
      return allClaims.filter((c) => (PENDING_STATUSES as string[]).includes(c.status));
    }
    if (activeTab === 'needsAction') {
      return allClaims.filter((c) => (NEEDS_ACTION_STATUSES as string[]).includes(c.status));
    }
    return allClaims;
  })();

  const rawTotal = query.data?.total ?? 0;
  const total = activeTab === 'all' || activeTab === 'paid' ? rawTotal : claims.length;
  const totalPages = activeTab === 'all' || activeTab === 'paid'
    ? Math.ceil(rawTotal / LIMIT)
    : 1;
  const page = filters.page ?? 1;

  // Count needs-action claims for the red dot badge.
  // We query with a large limit to get all needs-action claims.
  // In a real backend this would be a dedicated count endpoint.
  const needsActionQuery = useClaimsList({ limit: 200 });
  const needsActionCount = (needsActionQuery.data?.data ?? []).filter(
    (c) => (NEEDS_ACTION_STATUSES as string[]).includes(c.status),
  ).length;

  // Sync URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== 'all') params.set('tab', activeTab);
    if (filters.status && activeTab === 'all') params.set('status', filters.status);
    if (filters.payerId) params.set('payerId', filters.payerId);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.claimNumber) params.set('claimNumber', filters.claimNumber);
    if (filters.page && filters.page > 1) params.set('page', String(filters.page));
    const qs = params.toString();
    router.replace(qs ? `/claims?${qs}` : '/claims', { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filters]);

  const setFilter = useCallback(
    <K extends keyof ClaimFilters>(key: K, value: ClaimFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    },
    [],
  );

  function clearFilters() {
    setFilters({ limit: LIMIT, page: 1 });
    setClaimNumInput('');
  }

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    setFilters({ limit: LIMIT, page: 1 });
    setClaimNumInput('');
  }

  const hasActiveFilters = !!(
    filters.status ||
    filters.payerId ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.claimNumber
  );

  // ─── Tab strip ─────────────────────────────────────────────────────────────

  const tabs: Array<{ key: TabKey; label: string; showDot?: boolean }> = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'needsAction', label: 'Needs Action', showDot: needsActionCount > 0 },
    { key: 'paid', label: 'Paid' },
  ];

  // ─── Empty state per tab ───────────────────────────────────────────────────

  function renderEmpty() {
    if (hasActiveFilters) {
      return (
        <EmptyState
          heading="No claims match these filters"
          message="Try a wider date range or clear the filters."
          action={{ label: 'Clear filters', onClick: clearFilters }}
        />
      );
    }
    if (activeTab === 'needsAction') {
      return (
        <EmptyState
          heading="No claims need action"
          message="All claims are either pending, paid, or voided."
        />
      );
    }
    if (activeTab === 'paid') {
      return (
        <EmptyState
          heading="No paid claims"
          message="Paid claims will appear here once payment is posted."
        />
      );
    }
    return (
      <EmptyState
        heading="No claims yet"
        message="Generate a claim from a ready encounter to get started."
        action={{ label: '+ New Claim', onClick: () => router.push('/claims/new') }}
      />
    );
  }

  return (
    <div className="px-6 py-8 bg-zinc-50 min-h-full">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Claims</h1>
          {query.data && (
            <p className="mt-0.5 text-sm text-zinc-500">
              {rawTotal} claim{rawTotal !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Link
          href="/claims/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          + New Claim
        </Link>
      </div>

      {/* Quick filter tabs */}
      <div
        role="tablist"
        aria-label="Filter claims by status group"
        className="mb-4 flex gap-0 border-b border-zinc-200"
      >
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
                aria-label={`${needsActionCount} claim${needsActionCount !== 1 ? 's' : ''} need action`}
                className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
              >
                {needsActionCount > 9 ? '9+' : needsActionCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Advanced filter bar */}
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
        {activeTab === 'all' && (
          <div>
            <label htmlFor="filter-status" className="block text-xs font-medium text-zinc-600 mb-1">
              Status
            </label>
            <select
              id="filter-status"
              value={filters.status ?? ''}
              onChange={(e) => setFilter('status', (e.target.value as ClaimStatus) || undefined)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SCRUBBED">Scrubbed</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="PAID">Paid</option>
              <option value="DENIED">Denied</option>
              <option value="APPEALED">Appealed</option>
              <option value="VOIDED">Voided</option>
            </select>
          </div>
        )}
        <div>
          <label htmlFor="filter-claim-number" className="block text-xs font-medium text-zinc-600 mb-1">
            Claim #
          </label>
          <input
            id="filter-claim-number"
            type="text"
            value={claimNumInput}
            placeholder="CLM-2026-..."
            onChange={(e) => handleClaimNumChange(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          />
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
          Failed to load claims. Refresh to try again.
        </div>
      )}

      {/* Content */}
      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {!query.isLoading && claims.length === 0 ? (
          renderEmpty()
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Claim #
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Patient
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Payer
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Date of Service
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Billed
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Submitted
                    </th>
                    <th scope="col" className="relative px-4 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {query.isLoading
                    ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
                    : claims.map((claim) => (
                        <tr
                          key={claim.id}
                          className="cursor-pointer hover:bg-zinc-50"
                          onClick={() => router.push(`/claims/${claim.id}`)}
                        >
                          <td className="px-4 py-3 font-mono text-sm text-blue-600">
                            <Link
                              href={`/claims/${claim.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            >
                              {claim.claimNumber}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-700">
                            <Link
                              href={`/patients/${claim.patientId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-600 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            >
                              {claim.patientName}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-700">{claim.payerName}</td>
                          <td className="px-4 py-3 text-sm text-zinc-700">
                            {formatDOS(claim.dateOfService)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-zinc-900">
                            {formatCurrency(claim.billedAmount)}
                          </td>
                          <td className="px-4 py-3">
                            <ClaimStatusBadge status={claim.status} />
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-500">
                            {formatAge(claim.submittedAt)}
                          </td>
                          <td
                            className="px-4 py-3 text-right text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/claims/${claim.id}`}
                                className="font-medium text-blue-600 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                              >
                                View
                              </Link>
                              {(claim.status === 'DRAFT' || claim.status === 'SCRUBBED') && (
                                <>
                                  <span className="text-zinc-300" aria-hidden="true">|</span>
                                  <Link
                                    href={`/claims/${claim.id}`}
                                    className="font-medium text-blue-600 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                                  >
                                    Submit
                                  </Link>
                                </>
                              )}
                              {claim.status === 'DENIED' && (
                                <>
                                  <span className="text-zinc-300" aria-hidden="true">|</span>
                                  <Link
                                    href={`/denials?claimId=${claim.id}`}
                                    className="font-medium text-red-600 hover:text-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                                  >
                                    Appeal
                                  </Link>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            {(activeTab === 'all' || activeTab === 'paid') && rawTotal > LIMIT && (
              <Pagination
                page={page}
                totalPages={totalPages}
                total={rawTotal}
                limit={LIMIT}
                onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
                entityLabel="claims"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ClaimsPage() {
  return (
    <Suspense>
      <ClaimsContent />
    </Suspense>
  );
}
