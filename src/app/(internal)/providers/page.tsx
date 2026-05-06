'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonRow';
import { ProviderSearchBar } from '@/components/providers/ProviderSearchBar';
import { ProviderTypeFilter } from '@/components/providers/ProviderTypeFilter';
import { useProviders, useProviderSearch } from '@/hooks/useProviders';
import type { ProviderType } from '@/types/provider';

type FilterType = ProviderType | 'all';

const LIMIT = 25;

export default function ProvidersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [npiQuery, setNpiQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');

  // Determine active search mode
  const isNpiSearch = npiQuery.length === 10;
  const isNameSearch = !isNpiSearch && searchQuery.trim().length >= 2;
  const isSearching = isNpiSearch || isNameSearch;

  const activeSearchQuery = isNpiSearch ? npiQuery : searchQuery;
  const searchType = typeFilter !== 'all' ? typeFilter : undefined;

  const listQuery = useProviders({
    page,
    limit: LIMIT,
    isActive: true,
    ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
  });

  const searchResults = useProviderSearch(activeSearchQuery, searchType);

  const providers = isSearching
    ? (searchResults.data ?? [])
    : (listQuery.data?.data ?? []);

  const isLoading = isSearching ? searchResults.isLoading : listQuery.isLoading;
  const total = isSearching ? providers.length : (listQuery.data?.total ?? 0);
  const totalPages = Math.ceil(total / LIMIT);

  function handleSearch(query: string) {
    setNpiQuery('');
    setSearchQuery(query);
    setPage(1);
  }

  function handleNpiSearch(npi: string) {
    setSearchQuery('');
    setNpiQuery(npi);
    setPage(1);
  }

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (!/^\d+$/.test(value.trim())) {
      setNpiQuery('');
    }
    setPage(1);
  }, []);

  function clearSearch() {
    setSearchQuery('');
    setNpiQuery('');
    setPage(1);
  }

  function clearTypeFilter() {
    setTypeFilter('all');
    setPage(1);
  }

  const displayQuery = isNpiSearch ? npiQuery : searchQuery;

  return (
    <div className="px-6 py-8">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Providers</h1>
          {!isSearching && listQuery.data && (
            <p className="mt-0.5 text-sm text-zinc-500">
              {listQuery.data.total} provider{listQuery.data.total !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Link
          href="/providers/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          + Add Provider
        </Link>
      </div>

      {/* Search and filter row */}
      <div className="mb-4 space-y-3">
        <ProviderSearchBar
          value={searchQuery || npiQuery}
          onChange={handleSearchChange}
          onSearch={handleSearch}
          onNpiSearch={handleNpiSearch}
          isLoading={isSearching && searchResults.isLoading}
        />
        <ProviderTypeFilter value={typeFilter} onChange={(v) => { setTypeFilter(v); setPage(1); }} />
      </div>

      {/* API error */}
      {listQuery.isError && !isSearching && (
        <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load providers. Please refresh.
        </div>
      )}

      {/* Content */}
      {!isLoading && providers.length === 0 ? (
        <div role="status">
          {isSearching ? (
            <EmptyState
              heading={`No providers match "${displayQuery}"`}
              message="Try a different name or check the NPI. NPI search requires all 10 digits."
              action={{ label: 'Clear search', onClick: clearSearch }}
            />
          ) : typeFilter !== 'all' ? (
            <EmptyState
              heading={`No ${typeFilter === 'individual' ? 'Individual' : 'Organization'} providers`}
              message="No providers of this type have been added yet."
              action={{ label: 'Show all providers', onClick: clearTypeFilter }}
            />
          ) : (
            <EmptyState
              heading="No providers yet"
              message="Add your first provider to start billing. Providers are the physicians and organizations whose services you bill."
              action={{ label: '+ Add Provider', onClick: () => router.push('/providers/new') }}
            />
          )}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500"
                    aria-sort="ascending"
                  >
                    Display Name
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500"
                  >
                    NPI
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500"
                  >
                    Primary Taxonomy
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500"
                  >
                    Status
                  </th>
                  <th scope="col" className="relative px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
                  : providers.map((provider) => (
                      <tr
                        key={provider.id}
                        className="cursor-pointer hover:bg-zinc-50"
                        onClick={() => router.push(`/providers/${provider.id}`)}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                          {provider.displayName}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={provider.providerType} />
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-zinc-700">
                          {provider.npi}
                        </td>
                        <td
                          className="max-w-[120px] truncate px-4 py-3 text-sm text-zinc-500"
                          title={provider.primaryTaxonomyCode}
                        >
                          {provider.primaryTaxonomyCode.slice(0, 12)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={provider.isActive ? 'active' : 'inactive'} />
                        </td>
                        <td
                          className="px-4 py-3 text-right text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            href={`/providers/${provider.id}`}
                            className="font-medium text-blue-600 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                          >
                            View
                          </Link>
                          <span className="mx-2 text-zinc-300" aria-hidden="true">|</span>
                          <Link
                            href={`/providers/${provider.id}/edit`}
                            className="font-medium text-blue-600 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {!isSearching && total > LIMIT && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={LIMIT}
              onPageChange={setPage}
              entityLabel="providers"
            />
          )}
        </>
      )}
    </div>
  );
}
