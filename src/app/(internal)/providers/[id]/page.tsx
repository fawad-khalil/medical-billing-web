'use client';

import { use, useState, useCallback } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { DataField } from '@/components/ui/DataField';
import { useProvider } from '@/hooks/useProviders';

type Tab = 'overview' | 'claims';

export default function ProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: provider, isLoading, isError } = useProvider(id);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [copied, setCopied] = useState(false);

  const handleCopyNpi = useCallback(async () => {
    if (!provider) return;
    try {
      await navigator.clipboard.writeText(provider.npi);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — silently ignore
    }
  }, [provider]);

  function handleTabKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const tabs: Tab[] = ['overview', 'claims'];
    const currentIndex = tabs.indexOf(activeTab);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveTab(tabs[(currentIndex + 1) % tabs.length]);
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveTab(tabs[(currentIndex - 1 + tabs.length) % tabs.length]);
    }
  }

  if (isLoading) {
    return (
      <div className="px-6 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-100 mb-4" />
        <div className="h-4 w-64 animate-pulse rounded bg-zinc-100" />
      </div>
    );
  }

  if (isError || !provider) {
    return (
      <div className="px-6 py-8">
        <p className="text-sm text-red-600">
          Failed to load provider.{' '}
          <Link href="/providers" className="underline">Go back</Link>
        </p>
      </div>
    );
  }

  const address = [
    provider.addressLine1,
    provider.addressLine2,
    provider.city,
    provider.state,
    provider.zip,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="px-6 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-zinc-500">
        <Link href="/providers" className="hover:text-zinc-700">Providers</Link>
        <span aria-hidden="true">/</span>
        <span className="text-zinc-900">{provider.displayName}</span>
      </nav>

      {/* Provider header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-zinc-900">{provider.displayName}</h1>
            <Badge variant={provider.isActive ? 'active' : 'inactive'} />
          </div>

          {/* Sub-header: NPI + copy · type · taxonomy */}
          <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
            <span>NPI:</span>
            <span className="font-mono font-medium text-zinc-700">{provider.npi}</span>

            {/* Copy to clipboard button */}
            <button
              type="button"
              aria-label="Copy NPI to clipboard"
              onClick={handleCopyNpi}
              className="rounded p-0.5 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {copied ? (
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
              )}
            </button>

            {/* Live announcement for copy feedback */}
            <span aria-live="polite" className="sr-only">{copied ? 'Copied' : ''}</span>

            <span aria-hidden="true">·</span>
            <span className="capitalize">{provider.providerType}</span>
            <span aria-hidden="true">·</span>
            <span>{provider.primaryTaxonomyDesc ?? provider.primaryTaxonomyCode}</span>
          </div>
        </div>

        <Link
          href={`/providers/${id}/edit`}
          className="rounded-md border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Edit
        </Link>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Provider sections"
        className="mb-6 flex gap-0 border-b border-zinc-200"
        onKeyDown={handleTabKeyDown}
      >
        {([
          { key: 'overview', label: 'Overview' },
          { key: 'claims', label: 'Claims (0)' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            role="tab"
            id={`tab-${tab.key}`}
            aria-selected={activeTab === tab.key}
            aria-controls={`panel-${tab.key}`}
            tabIndex={activeTab === tab.key ? 0 : -1}
            onClick={() => setActiveTab(tab.key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview panel */}
      {activeTab === 'overview' && (
        <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-lg border border-zinc-200 bg-white p-6">
            <DataField label="Provider Type" value={provider.providerType === 'individual' ? 'Individual (Type 1 NPI)' : 'Organization (Type 2 NPI)'} />
            <DataField label="Display Name" value={provider.displayName} />

            {provider.providerType === 'individual' ? (
              <>
                <DataField label="First Name" value={provider.firstName} />
                <DataField label="Last Name" value={provider.lastName} />
                <DataField label="Credentials" value={provider.credentials} />
              </>
            ) : (
              <DataField label="Organization Name" value={provider.organizationName} fullWidth />
            )}

            <DataField label="NPI">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-sm text-zinc-900">{provider.npi}</span>
                <button
                  type="button"
                  aria-label="Copy NPI to clipboard"
                  onClick={handleCopyNpi}
                  className="rounded p-0.5 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  {copied ? (
                    <svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                    </svg>
                  )}
                </button>
              </div>
            </DataField>

            <DataField label="Primary Taxonomy" value={
              provider.primaryTaxonomyDesc
                ? `${provider.primaryTaxonomyCode} — ${provider.primaryTaxonomyDesc}`
                : provider.primaryTaxonomyCode
            } />

            {provider.secondaryTaxonomyCode && (
              <DataField label="Secondary Taxonomy" value={
                provider.secondaryTaxonomyDesc
                  ? `${provider.secondaryTaxonomyCode} — ${provider.secondaryTaxonomyDesc}`
                  : provider.secondaryTaxonomyCode
              } />
            )}

            {provider.deaNumber && (
              <DataField label="DEA Number" value={provider.deaNumber} />
            )}

            <DataField label="Tax ID Type" value={provider.taxIdType ?? undefined} />
            <DataField label="Tax ID">
              {provider.taxIdType === 'SSN' ? (
                <div>
                  <span className="font-mono text-zinc-500">[PROTECTED]</span>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    SSN stored encrypted — not transmitted to browser.
                  </p>
                </div>
              ) : (
                <span className="text-sm text-zinc-900">{provider.taxId ?? <span className="text-zinc-400">—</span>}</span>
              )}
            </DataField>

            <DataField label="Address" value={address || undefined} fullWidth />
            <DataField label="Phone" value={provider.phone} />
            <DataField label="Fax" value={provider.fax} />
          </dl>
        </div>
      )}

      {/* Claims panel (stub) */}
      {activeTab === 'claims' && (
        <div role="tabpanel" id="panel-claims" aria-labelledby="tab-claims">
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
              <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-zinc-700">
              Claims will appear here once the Claims module is built
            </p>
            <ul className="mt-2 inline-block list-inside list-disc text-left text-sm text-zinc-500">
              <li>Claim ID, date of service, status</li>
              <li>Payer, billed amount, paid amount</li>
              <li>Rendering vs. billing provider role on each claim</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
