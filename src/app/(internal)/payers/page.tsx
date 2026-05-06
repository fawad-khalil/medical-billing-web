'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePayers, useDeactivatePayer } from '@/hooks/usePayers';
import { Badge } from '@/components/ui/Badge';
import { PayerTypeFilter } from '@/components/payers/PayerTypeFilter';
import { PayerSearchBar } from '@/components/payers/PayerSearchBar';
import { payerTypeToBadgeVariant, formatClaimTypes, payerTypeLabel } from '@/lib/payerUtils';
import type { PayerType, PayerListItem } from '@/types/payer';

export default function PayersPage() {
  const [search, setSearch] = useState('');
  const [ediSearch, setEdiSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<PayerType[] | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [page, setPage] = useState(1);

  const searchParam = ediSearch || search;
  const isEdiSearch = !!ediSearch;

  const { data, isLoading, isError } = usePayers({
    page,
    limit: 25,
    isActive: showInactive ? undefined : true,
    payerType: typeFilter ?? undefined,
    ...(isEdiSearch ? { ediPayerId: searchParam } : { q: searchParam || undefined }),
  });

  const deactivate = useDeactivatePayer();

  async function handleDeactivate(id: string, name: string) {
    if (!confirm(`Deactivate ${name}? It will be hidden from future claims.`)) return;
    await deactivate.mutateAsync({ id });
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Payers</h1>
        <Link
          href="/payers/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Add Payer
        </Link>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:max-w-xs">
          <PayerSearchBar
            value={search}
            onChange={(v) => { setSearch(v); setEdiSearch(''); setPage(1); }}
            onSearch={(q) => { setSearch(q); setPage(1); }}
            onEdiSearch={(edi) => { setEdiSearch(edi); setSearch(''); setPage(1); }}
          />
        </div>
        <PayerTypeFilter
          value={typeFilter}
          onChange={(v) => { setTypeFilter(v); setPage(1); }}
        />
        <label className="ml-auto flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => { setShowInactive(e.target.checked); setPage(1); }}
            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
          Show inactive
        </label>
      </div>

      {isLoading && (
        <p className="py-12 text-center text-sm text-zinc-500" aria-live="polite">Loading payers…</p>
      )}
      {isError && (
        <p className="py-12 text-center text-sm text-red-600" role="alert">Failed to load payers. Please try again.</p>
      )}

      {data && (
        <>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-zinc-500">Payer</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-zinc-500">EDI ID</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-zinc-500">Type</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-zinc-500">Claims</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-zinc-500">Filing Limit</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-zinc-500">Status</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium text-zinc-500">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data.data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                      No payers found.
                    </td>
                  </tr>
                )}
                {data.data.map((payer: PayerListItem) => (
                  <tr key={payer.id} className={`hover:bg-zinc-50 ${!payer.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      <Link href={`/payers/${payer.id}`} className="hover:underline">
                        {payer.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-600">{payer.ediPayerId}</td>
                    <td className="px-4 py-3">
                      <Badge variant={payerTypeToBadgeVariant(payer.payerType)}>
                        {payerTypeLabel(payer.payerType)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{formatClaimTypes(payer.claimTypes)}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {payer.timelyFilingDays ? `${payer.timelyFilingDays} days` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {payer.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <Link
                          href={`/payers/${payer.id}/edit`}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </Link>
                        {payer.isActive && (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(payer.id, payer.name)}
                            className="text-zinc-500 hover:text-red-600"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.total > 25 && (
            <div className="mt-4 flex items-center justify-between text-sm text-zinc-600">
              <span>
                {(page - 1) * 25 + 1}–{Math.min(page * 25, data.total)} of {data.total}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * 25 >= data.total}
                  className="rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
