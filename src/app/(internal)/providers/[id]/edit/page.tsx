'use client';

import { use, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { NpiField } from '@/components/providers/NpiField';
import { TaxIdSection } from '@/components/providers/TaxIdSection';
import { useProvider, useUpdateProvider, useDeactivateProvider } from '@/hooks/useProviders';
import type { ProviderType, UpdateProviderInput } from '@/types/provider';

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

export default function EditProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: provider, isLoading, isError } = useProvider(id);
  const { mutateAsync: updateProvider, isPending } = useUpdateProvider(id);
  const deactivateMutation = useDeactivateProvider(id);

  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  // ── Individual identity ────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [credentials, setCredentials] = useState('');
  const [credentialsOther, setCredentialsOther] = useState('');
  const credentialsOtherRef = useRef<HTMLInputElement>(null);

  // ── Organization identity ──────────────────────────────────────────────────
  const [organizationName, setOrganizationName] = useState('');

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

  // Populate form when provider data arrives — legitimate use, not a cascading render
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!provider) return;
    setFirstName(provider.firstName ?? '');
    setLastName(provider.lastName ?? '');
    setOrganizationName(provider.organizationName ?? '');

    // Credentials: detect if it's a known value or "Other"
    const knownCredentials = ['MD', 'DO', 'NP', 'PA-C'];
    if (provider.credentials) {
      if (knownCredentials.includes(provider.credentials)) {
        setCredentials(provider.credentials);
      } else {
        setCredentials('Other');
        setCredentialsOther(provider.credentials);
      }
    }

    setPrimaryTaxonomyCode(provider.primaryTaxonomyCode ?? '');
    setPrimaryTaxonomyDesc(provider.primaryTaxonomyDesc ?? '');
    setSecondaryTaxonomyCode(provider.secondaryTaxonomyCode ?? '');
    setSecondaryTaxonomyDesc(provider.secondaryTaxonomyDesc ?? '');
    setDeaNumber(provider.deaNumber ?? '');
    setAddressLine1(provider.addressLine1 ?? '');
    setAddressLine2(provider.addressLine2 ?? '');
    setCity(provider.city ?? '');
    setState(provider.state ?? '');
    setZip(provider.zip ?? '');
    setPhone(provider.phone ?? '');
    setFax(provider.fax ?? '');
    setTaxIdType((provider.taxIdType as 'EIN' | 'SSN' | null) ?? '');
    // For SSN, taxId from API is '[PROTECTED]'; we store '' so TaxIdSection renders in read-only mode
    setTaxId(provider.taxIdType === 'SSN' ? '' : (provider.taxId ?? ''));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [provider]);

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!provider) return e;

    if (provider.providerType === 'individual') {
      if (!firstName.trim()) e.firstName = 'First name is required';
      if (!lastName.trim()) e.lastName = 'Last name is required';
    }
    if (provider.providerType === 'organization') {
      if (!organizationName.trim()) e.organizationName = 'Organization name is required';
    }
    if (!primaryTaxonomyCode.trim()) e.primaryTaxonomyCode = 'Primary taxonomy code is required';

    if (deaNumber && !/^[A-Z]{2}\d{7}$/.test(deaNumber)) {
      e.deaNumber = 'DEA number must be 2 letters followed by 7 digits';
    }

    if (taxId && !taxIdType) {
      e.taxIdType = 'Select EIN or SSN to specify the Tax ID type';
    }
    if (taxIdType && taxIdType !== 'SSN' && !taxId) {
      // SSN fields are [PROTECTED] in edit mode — no validation needed
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

    const data: UpdateProviderInput = {
      ...(provider?.providerType === 'individual'
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
      // Only include taxId/taxIdType if not SSN-protected
      ...(taxIdType === 'SSN'
        ? {} // don't touch encrypted SSN
        : {
            taxId: taxId || undefined,
            taxIdType: (taxIdType as 'EIN' | 'SSN') || undefined,
          }),
    };

    try {
      await updateProvider(data);
      router.push(`/providers/${id}`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setApiError(msg ?? 'Failed to save changes. Please try again.');
    }
  }

  async function handleDeactivate() {
    try {
      await deactivateMutation.mutateAsync();
      router.push(`/providers/${id}`);
    } catch {
      setApiError('Failed to deactivate provider. Please try again.');
    }
  }

  const fieldClass = (name: string) =>
    `block w-full rounded-md border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
      errors[name] ? 'border-red-500' : 'border-zinc-300'
    }`;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-100 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-zinc-100" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !provider) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8">
        <p className="text-sm text-red-600">
          Failed to load provider.{' '}
          <Link href="/providers" className="underline">Go back</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-zinc-500">
        <Link href="/providers" className="hover:text-zinc-700">Providers</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/providers/${id}`} className="hover:text-zinc-700">{provider.displayName}</Link>
        <span aria-hidden="true">/</span>
        <span className="text-zinc-900">Edit</span>
      </nav>

      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Edit Provider</h1>

      {apiError && (
        <div role="alert" className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {apiError}
        </div>
      )}

      {/* Deactivation confirmation */}
      {showDeactivateConfirm && (
        <div role="alert" className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-4">
          <p className="text-sm font-medium text-red-800">
            Deactivate {provider.displayName}? This provider will no longer appear in dropdowns.
            Existing charges and claims will not be affected.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={deactivateMutation.isPending}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              {deactivateMutation.isPending ? 'Deactivating…' : 'Confirm deactivate'}
            </button>
            <button
              type="button"
              onClick={() => setShowDeactivateConfirm(false)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        {/* ── Identity ─────────────────────────────────────────────────────── */}
        <div>
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">Identity</p>

          {/* Provider type — read-only label */}
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-zinc-500">Provider type:</span>
            <span className="rounded-full bg-blue-50 px-3 py-0.5 text-sm font-medium text-blue-700 capitalize">
              {provider.providerType}
            </span>
            <span className="text-xs text-zinc-400">(cannot be changed after creation)</span>
          </div>

          {provider.providerType === 'individual' && (
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

          {provider.providerType === 'organization' && (
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

          {/* NPI — read-only in edit mode */}
          <div className="mt-4">
            <NpiField
              value={provider.npi}
              onChange={() => {/* immutable */}}
              readOnly
            />
          </div>
        </div>

        {/* ── Taxonomy ─────────────────────────────────────────────────────── */}
        <div>
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">Taxonomy</p>
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
                  className={fieldClass('primaryTaxonomyCode')}
                  aria-required="true"
                  aria-invalid={!!errors.primaryTaxonomyCode}
                  aria-describedby={
                    errors.primaryTaxonomyCode
                      ? 'primaryTaxonomyCode-error'
                      : 'primaryTaxonomyCode-hint'
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

        {/* ── Contact and Address ───────────────────────────────────────────── */}
        <div>
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Contact and Address
          </p>
          <div className="space-y-4">
            <div>
              <label htmlFor="addressLine1" className="mb-1 block text-sm font-medium text-zinc-700">Address Line 1</label>
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
                <input id="zip" type="text" inputMode="numeric" maxLength={10} value={zip} onChange={(e) => setZip(e.target.value)} className={fieldClass('zip')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-medium text-zinc-700">Phone</label>
                <input id="phone" type="text" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass('phone')} />
              </div>
              <div>
                <label htmlFor="fax" className="mb-1 block text-sm font-medium text-zinc-700">Fax</label>
                <input id="fax" type="text" inputMode="tel" value={fax} onChange={(e) => setFax(e.target.value)} className={fieldClass('fax')} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Billing Identifiers ───────────────────────────────────────────── */}
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
                Format: 2 letters followed by 7 digits.
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
              readOnly={provider.taxIdType === 'SSN'}
              errors={{ taxIdType: errors.taxIdType, taxId: errors.taxId }}
            />
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-zinc-200 pt-6">
          {/* Deactivate — tertiary, left-aligned */}
          {provider.isActive && (
            <button
              type="button"
              onClick={() => setShowDeactivateConfirm(true)}
              className="rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              Deactivate Provider
            </button>
          )}
          {!provider.isActive && (
            <span className="text-sm text-zinc-400 italic">Provider is inactive</span>
          )}

          <div className="flex items-center gap-3">
            <Link
              href={`/providers/${id}`}
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
              {isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
