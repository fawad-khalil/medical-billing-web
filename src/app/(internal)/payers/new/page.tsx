'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreatePayer } from '@/hooks/usePayers';
import { EdiPayerIdField } from '@/components/payers/EdiPayerIdField';
import { ClaimTypesCheckboxGroup } from '@/components/payers/ClaimTypesCheckboxGroup';
import { AppealsAddressSection } from '@/components/payers/AppealsAddressSection';
import type { PayerType, ClaimType, CreatePayerInput } from '@/types/payer';

const PAYER_TYPE_OPTIONS: { label: string; value: PayerType }[] = [
  { label: 'Medicare', value: 'MEDICARE' },
  { label: 'Medicaid', value: 'MEDICAID' },
  { label: 'Primary Commercial', value: 'PRIMARY' },
  { label: 'Secondary', value: 'SECONDARY' },
  { label: 'Tertiary', value: 'TERTIARY' },
  { label: "Workers' Comp", value: 'WORKERS_COMP' },
  { label: 'Auto', value: 'AUTO' },
  { label: 'Other', value: 'OTHER' },
];

type FormErrors = Partial<Record<keyof CreatePayerInput | '_form', string>>;

export default function NewPayerPage() {
  const router = useRouter();
  const create = useCreatePayer();

  const [name, setName] = useState('');
  const [payerType, setPayerType] = useState<PayerType>('PRIMARY');
  const [ediPayerId, setEdiPayerId] = useState('');
  const [claimTypes, setClaimTypes] = useState<ClaimType[]>(['PROFESSIONAL']);
  const [timelyFilingDays, setTimelyFilingDays] = useState('');
  const [acceptsElectronic, setAcceptsElectronic] = useState(true);
  const [portalUrl, setPortalUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [appeals, setAppeals] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!name.trim()) e.name = 'Payer name is required.';
    if (!ediPayerId.trim()) e.ediPayerId = 'EDI payer ID is required.';
    else if (!/^[A-Z0-9]{2,10}$/i.test(ediPayerId.trim())) e.ediPayerId = 'Must be 2–10 alphanumeric characters.';
    if (claimTypes.length === 0) e.claimTypes = 'Select at least one claim type.';
    if (timelyFilingDays && (isNaN(Number(timelyFilingDays)) || Number(timelyFilingDays) < 1 || Number(timelyFilingDays) > 730))
      e.timelyFilingDays = 'Must be between 1 and 730 days.';
    if (portalUrl && !/^https?:\/\/.+/.test(portalUrl)) e.portalUrl = 'Enter a valid URL starting with http(s)://.';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});

    try {
      const payload: CreatePayerInput = {
        name: name.trim(),
        payerType,
        ediPayerId: ediPayerId.trim().toUpperCase(),
        claimTypes,
        ...(timelyFilingDays ? { timelyFilingDays: Number(timelyFilingDays) } : {}),
        acceptsElectronic,
        ...(portalUrl ? { portalUrl } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        ...(appeals.appealsAddress ? { appealsAddressLine1: appeals.appealsAddress } : {}),
        ...(appeals.appealsCity ? { appealsCity: appeals.appealsCity } : {}),
        ...(appeals.appealsState ? { appealsState: appeals.appealsState } : {}),
        ...(appeals.appealsZip ? { appealsZip: appeals.appealsZip } : {}),
        ...(appeals.appealsPhone ? { fax: appeals.appealsPhone } : {}),
        ...(appeals.appealsFax ? { fax: appeals.appealsFax } : {}),
      };
      const payer = await create.mutateAsync(payload);
      router.push(`/payers/${payer.id}`);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setErrors({ _form: 'A payer with this EDI ID or name already exists.' });
      } else {
        setErrors({ _form: 'Failed to save. Please try again.' });
      }
    }
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-6">
        <Link href="/payers" className="text-sm text-zinc-500 hover:text-zinc-700">
          ← Payers
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-zinc-900">Add Payer</h1>
      </div>

      <form onSubmit={handleSubmit} noValidate className="max-w-2xl space-y-8">
        {errors._form && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errors._form}
          </div>
        )}

        {/* Section 1 — Identity */}
        <fieldset className="space-y-4">
          <legend className="text-base font-medium text-zinc-900">Payer Identity</legend>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
              Payer Name <span aria-hidden="true">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
              className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-zinc-300 focus:border-blue-500 focus:ring-blue-500'}`}
              placeholder="e.g. Medicare Part B — Novitas"
            />
            {errors.name && <p id="name-error" role="alert" className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="payerType" className="block text-sm font-medium text-zinc-700">
              Payer Type <span aria-hidden="true">*</span>
            </label>
            <select
              id="payerType"
              value={payerType}
              onChange={(e) => setPayerType(e.target.value as PayerType)}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {PAYER_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <EdiPayerIdField value={ediPayerId} onChange={setEdiPayerId} error={errors.ediPayerId} />
        </fieldset>

        {/* Section 2 — Billing Settings */}
        <fieldset className="space-y-4">
          <legend className="text-base font-medium text-zinc-900">Billing Settings</legend>

          <ClaimTypesCheckboxGroup value={claimTypes} onChange={setClaimTypes} error={errors.claimTypes} />

          <div>
            <label htmlFor="timelyFilingDays" className="block text-sm font-medium text-zinc-700">Timely Filing Limit (days)</label>
            <input
              id="timelyFilingDays"
              type="number"
              min={1}
              max={730}
              value={timelyFilingDays}
              onChange={(e) => setTimelyFilingDays(e.target.value)}
              aria-invalid={!!errors.timelyFilingDays}
              aria-describedby={errors.timelyFilingDays ? 'filing-error' : 'filing-hint'}
              className={`mt-1 block w-40 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${errors.timelyFilingDays ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-zinc-300 focus:border-blue-500 focus:ring-blue-500'}`}
              placeholder="e.g. 365"
            />
            <p id="filing-hint" className="mt-1 text-xs text-zinc-500">Days from date of service to submit. Leave blank if unknown.</p>
            {errors.timelyFilingDays && <p id="filing-error" role="alert" className="mt-1 text-xs text-red-600">{errors.timelyFilingDays}</p>}
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={acceptsElectronic}
              onChange={(e) => setAcceptsElectronic(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            Accepts electronic claims (EDI 837)
          </label>
        </fieldset>

        {/* Section 3 — Portal & Notes */}
        <fieldset className="space-y-4">
          <legend className="text-base font-medium text-zinc-900">Portal &amp; Notes</legend>
          <div>
            <label htmlFor="portalUrl" className="block text-sm font-medium text-zinc-700">Payer Portal URL</label>
            <input
              id="portalUrl"
              type="url"
              value={portalUrl}
              onChange={(e) => setPortalUrl(e.target.value)}
              aria-invalid={!!errors.portalUrl}
              aria-describedby={errors.portalUrl ? 'portal-error' : undefined}
              className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${errors.portalUrl ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-zinc-300 focus:border-blue-500 focus:ring-blue-500'}`}
              placeholder="https://provider.payername.com"
            />
            {errors.portalUrl && <p id="portal-error" role="alert" className="mt-1 text-xs text-red-600">{errors.portalUrl}</p>}
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-zinc-700">Notes</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Prior auth requirements, special billing rules, etc."
            />
          </div>
        </fieldset>

        {/* Section 4 — Appeals Address */}
        <AppealsAddressSection
          values={appeals}
          onChange={(field, val) => setAppeals((prev) => ({ ...prev, [field]: val }))}
        />

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {create.isPending ? 'Saving…' : 'Save Payer'}
          </button>
          <Link
            href="/payers"
            className="rounded-md border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
