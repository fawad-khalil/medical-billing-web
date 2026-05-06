'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreatePatient } from '@/hooks/usePatients';
import type { CreatePatientInput } from '@/types/patient';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

function useDobMask(initial = '') {
  const [value, setValue] = useState(initial);
  const handle = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    let masked = digits;
    if (digits.length > 4) masked = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    else if (digits.length > 2) masked = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    setValue(masked);
  };
  return [value, handle] as const;
}

function toIso(display: string): string | null {
  const m = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[1]}-${m[2]}` : null;
}

interface FieldError { [key: string]: string }

export default function NewPatientPage() {
  const router = useRouter();
  const { mutateAsync: createPatient, isPending } = useCreatePatient();
  const firstNameRef = useRef<HTMLInputElement>(null);

  // Section 1 — required
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [dob, setDob] = useDobMask('');
  const [sex, setSex] = useState<'M' | 'F' | 'U' | ''>('');

  // Section 2 — optional
  const [chartNumber, setChartNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setStateName] = useState('');
  const [zip, setZip] = useState('');
  const [email, setEmail] = useState('');

  // Section 3 — advanced (collapsed)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [ssnLast4, setSsnLast4] = useState('');
  const [mbi, setMbi] = useState('');
  const [externalEmrId, setExternalEmrId] = useState('');

  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FieldError>({});
  const [apiError, setApiError] = useState<string | null>(null);

  function validate(): FieldError {
    const e: FieldError = {};
    if (!firstName.trim()) e.firstName = 'First name is required';
    if (!lastName.trim()) e.lastName = 'Last name is required';
    if (!dob) e.dob = 'Date of birth is required';
    else if (!toIso(dob)) e.dob = 'Enter date as MM/DD/YYYY';
    if (!sex) e.sex = 'Select a sex for the patient';
    if (ssnLast4 && !/^\d{4}$/.test(ssnLast4)) e.ssnLast4 = 'Enter exactly 4 digits';
    if (zip && !/^\d{5}(-\d{4})?$/.test(zip)) e.zip = 'Enter a 5-digit or 9-digit ZIP code';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Focus first error field
      const first = Object.keys(errs)[0];
      document.getElementById(first)?.focus();
      return;
    }
    setErrors({});

    const data: CreatePatientInput = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      middleName: middleName.trim() || undefined,
      dateOfBirth: toIso(dob)!,
      sex: sex as 'M' | 'F' | 'U',
      ssnLast4: ssnLast4 || undefined,
      mbi: mbi || undefined,
      externalEmrId: externalEmrId || undefined,
      addressLine1: addressLine1 || undefined,
      addressLine2: addressLine2 || undefined,
      city: city || undefined,
      state: state || undefined,
      zip: zip || undefined,
      phone: phone || undefined,
      email: email || undefined,
      chartNumber: chartNumber || undefined,
      notes: notes || undefined,
    };

    try {
      const patient = await createPatient(data);
      router.push(`/patients/${patient.id}?created=1`);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setApiError(e?.response?.data?.message ?? 'Failed to save patient. Please try again.');
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
        <Link href="/patients" className="hover:text-zinc-700">Patients</Link>
        <span aria-hidden="true">/</span>
        <span className="text-zinc-900">New Patient</span>
      </nav>

      <h1 className="mb-1 text-2xl font-semibold text-zinc-900">New Patient</h1>
      <p className="mb-6 text-sm text-zinc-500">Minimum required: Name + DOB + Sex. Insurance can be added after saving.</p>

      {apiError && (
        <div role="alert" className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* ── Section 1: Required ── */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-zinc-700">
                First Name <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                ref={firstNameRef}
                id="firstName"
                type="text"
                autoFocus
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onBlur={() => !firstName.trim() && setErrors((p) => ({ ...p, firstName: 'First name is required' }))}
                className={fieldClass('firstName')}
                aria-required="true"
                aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
              />
              {errors.firstName && <span id="firstName-error" role="alert" className="mt-1 block text-xs text-red-600">{errors.firstName}</span>}
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
                onBlur={() => !lastName.trim() && setErrors((p) => ({ ...p, lastName: 'Last name is required' }))}
                className={fieldClass('lastName')}
                aria-required="true"
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
              />
              {errors.lastName && <span id="lastName-error" role="alert" className="mt-1 block text-xs text-red-600">{errors.lastName}</span>}
            </div>
          </div>

          <div>
            <label htmlFor="middleName" className="mb-1 block text-sm font-medium text-zinc-700">Middle Name</label>
            <input id="middleName" type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} className={fieldClass('middleName')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dob" className="mb-1 block text-sm font-medium text-zinc-700">
                Date of Birth <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="dob"
                type="text"
                inputMode="numeric"
                placeholder="MM/DD/YYYY"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                onBlur={() => {
                  if (!dob) setErrors((p) => ({ ...p, dob: 'Date of birth is required' }));
                  else if (!toIso(dob)) setErrors((p) => ({ ...p, dob: 'Enter date as MM/DD/YYYY' }));
                  else setErrors((p) => { const { dob: _, ...rest } = p; return rest; });
                }}
                className={fieldClass('dob')}
                aria-required="true"
                aria-invalid={!!errors.dob}
                aria-describedby={errors.dob ? 'dob-error' : undefined}
              />
              {errors.dob && <span id="dob-error" role="alert" className="mt-1 block text-xs text-red-600">{errors.dob}</span>}
            </div>
            <div>
              <fieldset>
                <legend className="mb-1 block text-sm font-medium text-zinc-700">
                  Sex <span className="text-red-500" aria-hidden="true">*</span>
                </legend>
                <div
                  role="radiogroup"
                  aria-required="true"
                  aria-invalid={!!errors.sex}
                  aria-describedby={errors.sex ? 'sex-error' : undefined}
                  className="flex gap-1"
                >
                  {(['M', 'F', 'U'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={sex === s}
                      onClick={() => { setSex(s); setErrors((p) => { const { sex: _, ...r } = p; return r; }); }}
                      className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                        sex === s ? 'border-blue-600 bg-blue-600 text-white' : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      {s === 'M' ? 'Male' : s === 'F' ? 'Female' : 'Unknown'}
                    </button>
                  ))}
                </div>
                {errors.sex && <span id="sex-error" role="alert" className="mt-1 block text-xs text-red-600">{errors.sex}</span>}
              </fieldset>
            </div>
          </div>
        </div>

        {/* ── Section 2: Optional ── */}
        <div className="mt-8">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">Additional Information</p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="chartNumber" className="mb-1 block text-sm font-medium text-zinc-700">Chart Number</label>
                <input id="chartNumber" type="text" value={chartNumber} onChange={(e) => setChartNumber(e.target.value)} className={fieldClass('chartNumber')} />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-medium text-zinc-700">Phone</label>
                <input id="phone" type="text" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass('phone')} placeholder="(555) 000-0000" />
              </div>
            </div>
            <div>
              <label htmlFor="addressLine1" className="mb-1 block text-sm font-medium text-zinc-700">Address</label>
              <input id="addressLine1" type="text" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className={fieldClass('addressLine1')} placeholder="Street address" />
            </div>
            <div>
              <label htmlFor="addressLine2" className="sr-only">Address line 2</label>
              <input id="addressLine2" type="text" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} className={fieldClass('addressLine2')} placeholder="Apt, Suite, Unit (optional)" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label htmlFor="city" className="mb-1 block text-sm font-medium text-zinc-700">City</label>
                <input id="city" type="text" value={city} onChange={(e) => setCity(e.target.value)} className={fieldClass('city')} />
              </div>
              <div>
                <label htmlFor="state" className="mb-1 block text-sm font-medium text-zinc-700">State</label>
                <select id="state" value={state} onChange={(e) => setStateName(e.target.value)} className={fieldClass('state')}>
                  <option value="">—</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="zip" className="mb-1 block text-sm font-medium text-zinc-700">Zip</label>
                <input id="zip" type="text" inputMode="numeric" value={zip} onChange={(e) => setZip(e.target.value)} className={fieldClass('zip')} placeholder="12345" aria-describedby={errors.zip ? 'zip-error' : undefined} aria-invalid={!!errors.zip} />
                {errors.zip && <span id="zip-error" role="alert" className="mt-1 block text-xs text-red-600">{errors.zip}</span>}
              </div>
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass('email')} aria-describedby={errors.email ? 'email-error' : undefined} aria-invalid={!!errors.email} />
              {errors.email && <span id="email-error" role="alert" className="mt-1 block text-xs text-red-600">{errors.email}</span>}
            </div>
          </div>
        </div>

        {/* ── Section 3: Advanced (collapsed) ── */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            aria-expanded={showAdvanced}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <svg className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
            Advanced fields (SSN, MBI, EMR ID)
          </button>
          {showAdvanced && (
            <div className="mt-3 grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="ssnLast4" className="mb-1 block text-sm font-medium text-zinc-700">SSN Last 4</label>
                <input
                  id="ssnLast4"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={ssnLast4}
                  onChange={(e) => setSsnLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className={fieldClass('ssnLast4')}
                  aria-describedby="ssnLast4-hint"
                />
                <p id="ssnLast4-hint" className="mt-1 text-xs text-zinc-500">Last 4 digits only — do not enter full SSN</p>
                {errors.ssnLast4 && <span role="alert" className="mt-1 block text-xs text-red-600">{errors.ssnLast4}</span>}
              </div>
              <div>
                <label htmlFor="mbi" className="mb-1 block text-sm font-medium text-zinc-700">MBI</label>
                <input id="mbi" type="text" value={mbi} onChange={(e) => setMbi(e.target.value.toUpperCase())} className={fieldClass('mbi')} aria-describedby="mbi-hint" />
                <p id="mbi-hint" className="mt-1 text-xs text-zinc-500">Medicare patients only</p>
              </div>
              <div>
                <label htmlFor="externalEmrId" className="mb-1 block text-sm font-medium text-zinc-700">EMR ID</label>
                <input id="externalEmrId" type="text" value={externalEmrId} onChange={(e) => setExternalEmrId(e.target.value)} className={fieldClass('externalEmrId')} aria-describedby="emr-hint" />
                <p id="emr-hint" className="mt-1 text-xs text-zinc-500">Client&apos;s EHR/EMR reference</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Biller Notes ── */}
        <div className="mt-6">
          <label htmlFor="notes" className="mb-1 block text-sm font-medium text-zinc-700">Biller Notes</label>
          <textarea
            id="notes"
            rows={3}
            maxLength={1000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          />
          <p className={`mt-1 text-right text-xs ${notes.length >= 900 ? (notes.length >= 1000 ? 'text-red-600' : 'text-amber-600') : 'text-zinc-400'}`}>
            {notes.length}/1000
          </p>
          <p className="text-xs text-zinc-500">Internal notes only. Do not enter diagnoses or clinical information.</p>
        </div>

        {/* ── Footer ── */}
        <div className="mt-8 flex items-center justify-end gap-3 border-t border-zinc-200 pt-6">
          <Link
            href="/patients"
            className="rounded-md px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {isPending ? 'Saving…' : 'Save Patient'}
          </button>
        </div>
      </form>
    </div>
  );
}
