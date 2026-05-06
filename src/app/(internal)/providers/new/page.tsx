'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { NpiField } from '@/components/providers/NpiField';
import { TaxIdSection } from '@/components/providers/TaxIdSection';
import { useCreateProvider } from '@/hooks/useProviders';
import type { CreateProviderInput, ProviderType } from '@/types/provider';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

const CREDENTIALS = ['MD', 'DO', 'NP', 'PA-C', 'Other'];

interface FormErrors {
  [key: string]: string | undefined;
}

export default function NewProviderPage() {
  const router = useRouter();
  const { mutateAsync: createProvider, isPending } = useCreateProvider();

  // ── Provider type ──────────────────────────────────────────────────────────
  const [providerType, setProviderType] = useState<ProviderType | ''>('');
  const [typeChangeDialog, setTypeChangeDialog] = useState(false);
  const [pendingType, setPendingType] = useState<ProviderType | null>(null);

  // ── Individual identity ────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [credentials, setCredentials] = useState('');
  const [credentialsOther, setCredentialsOther] = useState('');
  const credentialsOtherRef = useRef<HTMLInputElement>(null);

  // ── Organization identity ──────────────────────────────────────────────────
  const [organizationName, setOrganizationName] = useState('');

  // ── NPI ───────────────────────────────────────────────────────────────────
  const [npi, setNpi] = useState('');
  const [npiValid, setNpiValid] = useState<boolean | null>(null);

  // ── Taxonomy ──────────────────────────────────────────────────────────────
  const [primaryTaxonomyCode, setPrimaryTaxonomyCode] = useState('');
  const [primaryTaxonomyDesc, setPrimaryTaxonomyDesc] = useState('');
  const [secondaryTaxonomyCode, setSecondaryTaxonomyCode] = useState('');
  const [secondaryTaxonomyDesc, setSecondaryTaxonomyDesc] = useState('');

  // ── Address ───────────────────────────────────────────────────────────────
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');
  const [fax, setFax] = useState('');

  // ── Billing identifiers ───────────────────────────────────────────────────
  const [deaNumber, setDeaNumber] = useState('');
  const [taxIdType, setTaxIdType] = useState<'EIN' | 'SSN' | ''>('');
  const [taxId, setTaxId] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // ── Type change logic ──────────────────────────────────────────────────────
  function requestTypeChange(newType: ProviderType) {
    if (providerType === newType) return;
    const hasNameData =
      firstName.trim() || lastName.trim() || organizationName.trim();
    if (hasNameData) {
      setPendingType(newType);
      setTypeChangeDialog(true);
    } else {
      applyTypeChange(newType);
    }
  }

  function applyTypeChange(newType: ProviderType) {
    setProviderType(newType);
    setFirstName('');
    setLastName('');
    setCredentials('');
    setCredentialsOther('');
    setOrganizationName('');
    setTypeChangeDialog(false);
    setPendingType(null);
    setErrors((p) => {
      const { firstName: _, lastName: __, organizationName: ___, providerType: ____, ...rest } = p;
      return rest;
    });
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!providerType) e.providerType = 'Select a provider type';

    if (providerType === 'individual') {
      if (!firstName.trim()) e.firstName = 'First name is required';
      if (!lastName.trim()) e.lastName = 'Last name is required';
    }
    if (providerType === 'organization') {
      if (!organizationName.trim()) e.organizationName = 'Organization name is required';
    }

    if (!npi) {
      e.npi = 'NPI is required';
    } else if (npi.length !== 10) {
      e.npi = 'NPI must be exactly 10 digits';
    } else if (npiValid === false) {
      e.npi = 'This NPI does not pass checksum validation. Verify the number on NPPES.';
    }

    if (!primaryTaxonomyCode.trim()) e.primaryTaxonomyCode = 'Primary taxonomy code is required';

    if (deaNumber && !/^[A-Z]{2}\d{7}$/.test(deaNumber)) {
      e.deaNumber = 'DEA number must be 2 letters followed by 7 digits';
    }

    if (taxId && !taxIdType) {
      e.taxIdType = 'Select EIN or SSN to specify the Tax ID type';
    }
    if (taxIdType && !taxId) {
      e.taxId = 'Tax ID is required when a Tax ID type is selected';
    }
    if (taxId && !/^\d{9}$/.test(taxId)) {
      e.taxId = 'Tax ID must be exactly 9 digits with no dashes or spaces';
    }

    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstKey = Object.keys(errs)[0];
      document.getElementById(firstKey)?.focus();
      return;
    }
    setErrors({});

    const resolvedCredentials =
      credentials === 'Other' ? credentialsOther.trim() || undefined : credentials || undefined;

    const data: CreateProviderInput = {
      npi,
      providerType: providerType as ProviderType,
      ...(providerType === 'individual'
        ? {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            credentials: resolvedCredentials,
          }
        : {
            organizationName: organizationName.trim(),
          }),
      primaryTaxonomyCode: primaryTaxonomyCode.trim().toUpperCase(),
      primaryTaxonomyDesc: primaryTaxonomyDesc.trim() || undefined,
      secondaryTaxonomyCode: secondaryTaxonomyCode.trim().toUpperCase() || undefined,
      secondaryTaxonomyDesc: secondaryTaxonomyDesc.trim() || undefined,
      deaNumber: deaNumber.trim() || undefined,
      addressLine1: addressLine1.trim() || undefined,
      addressLine2: addressLine2.trim() || undefined,
      city: city.trim() || undefined,
      state: state || undefined,
      zip: zip.trim() || undefined,
      phone: phone.trim() || undefined,
      fax: fax.trim() || undefined,
      taxId: taxId || undefined,
      taxIdType: (taxIdType as 'EIN' | 'SSN') || undefined,
    };

    try {
      const provider = await createProvider(data);
      router.push(`/providers/${provider.id}?created=1`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setApiError(msg ?? 'Failed to save provider. Please try again.');
    }
  }

  const fieldClass = (name: string) =>
    `block w-full rounded-md border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
      errors[name] ? 'border-red-500' : 'border-zinc-300'
    }`;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-zinc-500">
        <Link href="/providers" className="hover:text-zinc-700">Providers</Link>
        <span aria-hidden="true">/</span>
        <span className="text-zinc-900">New Provider</span>
      </nav>

      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">New Provider</h1>

      {apiError && (
        <div role="alert" className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {apiError}
        </div>
      )}

      {/* Type-change confirmation dialog */}
      {typeChangeDialog && (
        <div
          role="alert"
          className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-4"
        >
          <p className="text-sm font-medium text-amber-800">
            Changing provider type will clear the name fields. Continue?
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => pendingType && applyTypeChange(pendingType)}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              Clear fields and continue
            </button>
            <button
              type="button"
              onClick={() => { setTypeChangeDialog(false); setPendingType(null); }}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Keep current type
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        {/* ── Section 1: Identity ──────────────────────────────────────────── */}
        <div>
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Identity
          </p>

          {/* Provider Type selector */}
          <fieldset className="mb-6">
            <legend className="mb-3 block text-sm font-medium text-zinc-700">
              Provider Type <span className="text-red-500" aria-hidden="true">*</span>
            </legend>
            <div
              role="radiogroup"
              aria-required="true"
              aria-invalid={!!errors.providerType}
              aria-describedby={errors.providerType ? 'providerType-error' : undefined}
              className="grid grid-cols-2 gap-4"
            >
              {([
                {
                  type: 'individual' as ProviderType,
                  title: 'Individual',
                  subtitle: 'Type 1 NPI',
                  hint: '(Rendering Provider)',
                  icon: (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  ),
                },
                {
                  type: 'organization' as ProviderType,
                  title: 'Organization',
                  subtitle: 'Type 2 NPI',
                  hint: '(Billing / Group)',
                  icon: (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                  ),
                },
              ] as const).map(({ type, title, subtitle, hint, icon }) => {
                const selected = providerType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => requestTypeChange(type)}
                    className={`flex flex-col items-start rounded-lg border-2 p-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                      selected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div className={selected ? 'text-blue-600' : 'text-zinc-400'}>{icon}</div>
                    <p className={`mt-2 text-sm font-semibold ${selected ? 'text-blue-700' : 'text-zinc-900'}`}>
                      {title}
                    </p>
                    <p className="text-xs text-zinc-500">{subtitle}</p>
                    <p className="text-xs text-zinc-400">{hint}</p>
                  </button>
                );
              })}
            </div>
            {errors.providerType && (
              <span id="providerType-error" role="alert" className="mt-1 block text-xs text-red-600">
                {errors.providerType}
              </span>
            )}
          </fieldset>

          {/* Conditional identity fields */}
          {providerType === 'individual' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-zinc-700">
                    First Name <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={fieldClass('firstName')}
                    aria-required="true"
                    aria-invalid={!!errors.firstName}
                    aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                  />
                  {errors.firstName && (
                    <span id="firstName-error" role="alert" className="mt-1 block text-xs text-red-600">
                      {errors.firstName}
                    </span>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-zinc-700">
                    Last Name <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={fieldClass('lastName')}
                    aria-required="true"
                    aria-invalid={!!errors.lastName}
                    aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                  />
                  {errors.lastName && (
                    <span id="lastName-error" role="alert" className="mt-1 block text-xs text-red-600">
                      {errors.lastName}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="credentials" className="mb-1 block text-sm font-medium text-zinc-700">
                  Credentials
                </label>
                <select
                  id="credentials"
                  value={credentials}
                  onChange={(e) => {
                    setCredentials(e.target.value);
                    if (e.target.value === 'Other') {
                      setTimeout(() => credentialsOtherRef.current?.focus(), 0);
                    }
                  }}
                  className={fieldClass('credentials')}
                >
                  <option value="">— Select —</option>
                  {CREDENTIALS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              {credentials === 'Other' && (
                <div>
                  <label htmlFor="credentialsOther" className="mb-1 block text-sm font-medium text-zinc-700">
                    Specify credentials
                  </label>
                  <input
                    ref={credentialsOtherRef}
                    id="credentialsOther"
                    type="text"
                    maxLength={50}
                    value={credentialsOther}
                    onChange={(e) => setCredentialsOther(e.target.value)}
                    placeholder="e.g. DPM, PhD, CNM"
                    className={fieldClass('credentialsOther')}
                  />
                </div>
              )}
            </div>
          )}

          {providerType === 'organization' && (
            <div>
              <label htmlFor="organizationName" className="mb-1 block text-sm font-medium text-zinc-700">
                Organization Name <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="organizationName"
                type="text"
                maxLength={200}
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className={fieldClass('organizationName')}
                aria-required="true"
                aria-invalid={!!errors.organizationName}
                aria-describedby={errors.organizationName ? 'organizationName-error' : undefined}
              />
              {errors.organizationName && (
                <span id="organizationName-error" role="alert" className="mt-1 block text-xs text-red-600">
                  {errors.organizationName}
                </span>
              )}
            </div>
          )}

          {/* NPI */}
          {providerType && (
            <div className="mt-4">
              <NpiField
                value={npi}
                onChange={setNpi}
                error={errors.npi}
                onValidationChange={setNpiValid}
              />
            </div>
          )}
        </div>

        {/* ── Section: Taxonomy ──────────────────────────────────────────── */}
        {providerType && (
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Taxonomy
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="primaryTaxonomyCode" className="mb-1 block text-sm font-medium text-zinc-700">
                    Primary Taxonomy Code <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="primaryTaxonomyCode"
                    type="text"
                    maxLength={10}
                    value={primaryTaxonomyCode}
                    onChange={(e) => setPrimaryTaxonomyCode(e.target.value.toUpperCase())}
                    placeholder="e.g. 207Q00000X"
                    className={fieldClass('primaryTaxonomyCode')}
                    aria-required="true"
                    aria-invalid={!!errors.primaryTaxonomyCode}
                    aria-describedby={
                      errors.primaryTaxonomyCode ? 'primaryTaxonomyCode-error' : 'primaryTaxonomyCode-hint'
                    }
                  />
                  <p id="primaryTaxonomyCode-hint" className="mt-1 text-xs text-zinc-500">
                    Use the CMS taxonomy code. Look up at nucc.org.
                  </p>
                  {errors.primaryTaxonomyCode && (
                    <span id="primaryTaxonomyCode-error" role="alert" className="mt-1 block text-xs text-red-600">
                      {errors.primaryTaxonomyCode}
                    </span>
                  )}
                </div>
                <div>
                  <label htmlFor="primaryTaxonomyDesc" className="mb-1 block text-sm font-medium text-zinc-700">
                    Description <span className="text-zinc-400 text-xs font-normal">(optional)</span>
                  </label>
                  <input
                    id="primaryTaxonomyDesc"
                    type="text"
                    maxLength={200}
                    value={primaryTaxonomyDesc}
                    onChange={(e) => setPrimaryTaxonomyDesc(e.target.value)}
                    placeholder="e.g. Family Medicine"
                    className={fieldClass('primaryTaxonomyDesc')}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="secondaryTaxonomyCode" className="mb-1 block text-sm font-medium text-zinc-700">
                  Secondary Taxonomy Code <span className="text-zinc-400 text-xs font-normal">(optional)</span>
                </label>
                <input
                  id="secondaryTaxonomyCode"
                  type="text"
                  maxLength={10}
                  value={secondaryTaxonomyCode}
                  onChange={(e) => setSecondaryTaxonomyCode(e.target.value.toUpperCase())}
                  className={fieldClass('secondaryTaxonomyCode')}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Section 2: Contact and Address ──────────────────────────────── */}
        {providerType && (
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Contact and Address
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="addressLine1" className="mb-1 block text-sm font-medium text-zinc-700">
                  Address Line 1
                </label>
                <input id="addressLine1" type="text" maxLength={200} value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className={fieldClass('addressLine1')} />
              </div>
              <div>
                <label htmlFor="addressLine2" className="sr-only">Address Line 2</label>
                <input id="addressLine2" type="text" maxLength={100} value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} className={fieldClass('addressLine2')} placeholder="Suite, Floor (optional)" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="mb-1 block text-sm font-medium text-zinc-700">City</label>
                  <input id="city" type="text" maxLength={100} value={city} onChange={(e) => setCity(e.target.value)} className={fieldClass('city')} />
                </div>
                <div>
                  <label htmlFor="state" className="mb-1 block text-sm font-medium text-zinc-700">State</label>
                  <select id="state" value={state} onChange={(e) => setState(e.target.value)} className={fieldClass('state')}>
                    <option value="">—</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="zip" className="mb-1 block text-sm font-medium text-zinc-700">ZIP</label>
                  <input id="zip" type="text" inputMode="numeric" maxLength={10} value={zip} onChange={(e) => setZip(e.target.value)} className={fieldClass('zip')} placeholder="12345" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="mb-1 block text-sm font-medium text-zinc-700">Phone</label>
                  <input id="phone" type="text" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass('phone')} placeholder="(555) 000-0000" />
                </div>
                <div>
                  <label htmlFor="fax" className="mb-1 block text-sm font-medium text-zinc-700">Fax</label>
                  <input id="fax" type="text" inputMode="tel" value={fax} onChange={(e) => setFax(e.target.value)} className={fieldClass('fax')} placeholder="(555) 000-0000" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Section 3: Billing Identifiers ──────────────────────────────── */}
        {providerType && (
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Billing Identifiers
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="deaNumber" className="mb-1 block text-sm font-medium text-zinc-700">
                  DEA Number <span className="text-zinc-400 text-xs font-normal">(optional)</span>
                </label>
                <input
                  id="deaNumber"
                  type="text"
                  maxLength={9}
                  value={deaNumber}
                  onChange={(e) => setDeaNumber(e.target.value.toUpperCase())}
                  onBlur={() => {
                    if (deaNumber && !/^[A-Z]{2}\d{7}$/.test(deaNumber)) {
                      setErrors((p) => ({ ...p, deaNumber: 'DEA number must be 2 letters followed by 7 digits' }));
                    } else {
                      setErrors((p) => { const { deaNumber: _, ...r } = p; return r; });
                    }
                  }}
                  placeholder="AB1234563"
                  className={fieldClass('deaNumber')}
                  aria-invalid={!!errors.deaNumber}
                  aria-describedby={errors.deaNumber ? 'deaNumber-error' : 'deaNumber-hint'}
                />
                <p id="deaNumber-hint" className="mt-1 text-xs text-zinc-500">
                  Format: 2 letters followed by 7 digits. Required only if provider prescribes
                  controlled substances.
                </p>
                {errors.deaNumber && (
                  <span id="deaNumber-error" role="alert" className="mt-1 block text-xs text-red-600">
                    {errors.deaNumber}
                  </span>
                )}
              </div>

              <TaxIdSection
                taxIdType={taxIdType}
                taxId={taxId}
                onTaxIdTypeChange={setTaxIdType}
                onTaxIdChange={setTaxId}
                errors={{ taxIdType: errors.taxIdType, taxId: errors.taxId }}
              />
            </div>
          </div>
        )}

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-6">
          <Link
            href="/providers"
            className="rounded-md px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Cancel
          </Link>
          <button
            type="submit"
            aria-disabled={isPending}
            disabled={isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {isPending ? 'Saving…' : 'Save Provider'}
          </button>
        </div>
      </form>
    </div>
  );
}
