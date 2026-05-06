'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePayer, useDeactivatePayer } from '@/hooks/usePayers';
import { Badge } from '@/components/ui/Badge';
import { payerTypeToBadgeVariant, formatClaimTypes, payerTypeLabel } from '@/lib/payerUtils';
import { useRouter } from 'next/navigation';

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-zinc-100 last:border-0">
      <dt className="text-sm font-medium text-zinc-500">{label}</dt>
      <dd className="col-span-2 text-sm text-zinc-900">{children}</dd>
    </div>
  );
}

export default function PayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: payer, isLoading, isError } = usePayer(id);
  const deactivate = useDeactivatePayer();

  async function handleDeactivate() {
    if (!payer) return;
    if (!confirm(`Deactivate ${payer.name}? It will be hidden from future claims.`)) return;
    await deactivate.mutateAsync({ id });
    router.push('/payers');
  }

  if (isLoading) return <div className="px-6 py-8 text-sm text-zinc-500">Loading…</div>;
  if (isError || !payer) return <div className="px-6 py-8 text-sm text-red-600" role="alert">Payer not found.</div>;

  const hasAppealsAddress = payer.appealsAddressLine1 || payer.appealsCity;

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link href="/payers" className="text-sm text-zinc-500 hover:text-zinc-700">
            ← Payers
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-xl font-semibold text-zinc-900">{payer.name}</h1>
            <Badge variant={payerTypeToBadgeVariant(payer.payerType)}>
              {payerTypeLabel(payer.payerType)}
            </Badge>
            {!payer.isActive && (
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
                Inactive
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/payers/${id}/edit`}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Edit
          </Link>
          {payer.isActive && (
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={deactivate.isPending}
              className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Deactivate
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Identity */}
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">Identity</h2>
          <dl className="rounded-lg border border-zinc-200 bg-white px-4">
            <DetailRow label="EDI Payer ID">
              <span className="font-mono">{payer.ediPayerId}</span>
            </DetailRow>
            <DetailRow label="Payer Type">{payerTypeLabel(payer.payerType)}</DetailRow>
            <DetailRow label="Claim Types">{formatClaimTypes(payer.claimTypes)}</DetailRow>
          </dl>
        </section>

        {/* Billing Settings */}
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">Billing Settings</h2>
          <dl className="rounded-lg border border-zinc-200 bg-white px-4">
            <DetailRow label="Timely Filing">
              {payer.timelyFilingDays ? `${payer.timelyFilingDays} days` : '—'}
            </DetailRow>
            <DetailRow label="Electronic Claims">
              {payer.acceptsElectronic ? 'Yes — accepts EDI 837' : 'No — paper claims only'}
            </DetailRow>
            {!payer.acceptsElectronic && (
              <DetailRow label="">
                <span role="status" className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                  Paper claims required — allow extra processing time
                </span>
              </DetailRow>
            )}
          </dl>
        </section>

        {/* Contact */}
        {(payer.phone || payer.fax || payer.portalUrl) && (
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">Contact</h2>
            <dl className="rounded-lg border border-zinc-200 bg-white px-4">
              {payer.phone && <DetailRow label="Phone">{payer.phone}</DetailRow>}
              {payer.fax && <DetailRow label="Fax">{payer.fax}</DetailRow>}
              {payer.portalUrl && (
                <DetailRow label="Portal">
                  <a href={payer.portalUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {payer.portalUrl}
                  </a>
                </DetailRow>
              )}
            </dl>
          </section>
        )}

        {/* Appeals Address */}
        {hasAppealsAddress && (
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">Appeals Address</h2>
            <dl className="rounded-lg border border-zinc-200 bg-white px-4">
              {payer.appealsAddressLine1 && <DetailRow label="Street">{payer.appealsAddressLine1}</DetailRow>}
              {payer.appealsAddressLine2 && <DetailRow label="">{payer.appealsAddressLine2}</DetailRow>}
              {(payer.appealsCity || payer.appealsState || payer.appealsZip) && (
                <DetailRow label="City / State / ZIP">
                  {[payer.appealsCity, payer.appealsState, payer.appealsZip].filter(Boolean).join(', ')}
                </DetailRow>
              )}
            </dl>
          </section>
        )}

        {/* Notes */}
        {payer.notes && (
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">Notes</h2>
            <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 whitespace-pre-wrap">
              {payer.notes}
            </div>
          </section>
        )}

        <p className="text-xs text-zinc-400">
          Added {new Date(payer.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
          {payer.updatedAt !== payer.createdAt && (
            <> · Updated {new Date(payer.updatedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}</>
          )}
        </p>
      </div>
    </div>
  );
}
