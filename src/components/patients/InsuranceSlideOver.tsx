'use client';

import { useEffect, useRef, useState } from 'react';
import type { PatientInsurance, CreateInsuranceInput } from '@/types/patient';

interface InsuranceSlideOverProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateInsuranceInput) => Promise<void>;
  initial?: PatientInsurance | null;
}

const PRIORITY_LABELS = { 1: 'Primary', 2: 'Secondary', 3: 'Tertiary' } as const;
const RELATIONSHIP_OPTIONS = ['self', 'spouse', 'child', 'parent', 'other'];

function useDobMask(initial = '') {
  const [value, setValue] = useState(initial);
  const handle = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    let masked = digits;
    if (digits.length > 4) masked = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    else if (digits.length > 2) masked = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    setValue(masked);
  };
  return [value, handle, setValue] as const;
}

export function InsuranceSlideOver({ open, onClose, onSave, initial }: InsuranceSlideOverProps) {
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const [priority, setPriority] = useState<1 | 2 | 3>(initial?.priority ?? 1);
  const [payerName, setPayerName] = useState(initial?.payerNameSnapshot ?? '');
  const [memberId, setMemberId] = useState(initial?.memberId ?? '');
  const [groupNumber, setGroupNumber] = useState(initial?.groupNumber ?? '');
  const [planName, setPlanName] = useState(initial?.planName ?? '');
  const [patientIsSubscriber, setPatientIsSubscriber] = useState(true);
  const [subFirstName, setSubFirstName] = useState(initial?.subscriberFirstName ?? '');
  const [subLastName, setSubLastName] = useState(initial?.subscriberLastName ?? '');
  const [subDob, setSubDob, setSubDobRaw] = useDobMask('');
  const [subRelationship, setSubRelationship] = useState(initial?.subscriberRelationship ?? '');
  const [effectiveDate, setEffectiveDate, setEffectiveRaw] = useDobMask(initial?.effectiveDate ? formatToDisplay(initial.effectiveDate) : '');
  const [terminationDate, setTerminationDate, setTerminationRaw] = useDobMask(initial?.terminationDate ? formatToDisplay(initial.terminationDate) : '');
  const [eligibilityStatus, setEligibilityStatus] = useState<'active' | 'inactive' | 'unverified'>(initial?.eligibilityStatus ?? 'unverified');
  const [showFinancials, setShowFinancials] = useState(false);
  const [copay, setCopay] = useState(initial?.copayAmount?.toString() ?? '');
  const [deductible, setDeductible] = useState(initial?.deductibleAmount?.toString() ?? '');
  const [deductibleMet, setDeductibleMet] = useState(initial?.deductibleMet?.toString() ?? '');

  // Focus first element when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => firstFocusRef.current?.focus(), 50);
      setDirty(false);
      setError(null);
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        if (dirty) {
          if (confirm('Discard unsaved changes?')) onClose();
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, dirty, onClose]);

  function formatToDisplay(iso: string) {
    const [y, m, d] = iso.split('-');
    return `${m}/${d}/${y}`;
  }

  function displayToIso(display: string): string | null {
    const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    return `${match[3]}-${match[1]}-${match[2]}`;
  }

  const markDirty = () => setDirty(true);

  async function handleSave() {
    setError(null);
    if (!payerName.trim()) { setError('Payer name is required'); return; }
    if (!memberId.trim()) { setError('Member ID is required'); return; }
    const isoEffective = displayToIso(effectiveDate);
    if (!isoEffective) { setError('Enter effective date as MM/DD/YYYY'); return; }
    if (!patientIsSubscriber) {
      if (!subFirstName.trim() || !subLastName.trim()) { setError('Subscriber name is required'); return; }
    }

    const data: CreateInsuranceInput = {
      payerId: '00000000-0000-0000-0000-000000000000', // Phase 1 stub — payers module not yet built
      payerNameSnapshot: payerName.trim(),
      priority,
      memberId: memberId.trim(),
      groupNumber: groupNumber.trim() || undefined,
      planName: planName.trim() || undefined,
      effectiveDate: isoEffective,
      terminationDate: displayToIso(terminationDate) ?? undefined,
      patientIsSubscriber,
      subscriberFirstName: patientIsSubscriber ? undefined : subFirstName,
      subscriberLastName: patientIsSubscriber ? undefined : subLastName,
      subscriberDob: patientIsSubscriber ? undefined : (displayToIso(subDob) ?? undefined),
      subscriberRelationship: patientIsSubscriber ? undefined : subRelationship,
      copayAmount: copay ? parseFloat(copay) : undefined,
      deductibleAmount: deductible ? parseFloat(deductible) : undefined,
      deductibleMet: deductibleMet ? parseFloat(deductibleMet) : undefined,
      eligibilityStatus,
    };

    setSaving(true);
    try {
      await onSave(data);
      onClose();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message ?? 'Failed to save insurance. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={() => { if (!dirty) onClose(); }} aria-hidden="true" />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="insurance-panel-title"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h2 id="insurance-panel-title" className="text-base font-semibold text-zinc-900">
            {initial ? 'Edit Insurance' : 'Add Insurance'}
          </h2>
          <button
            ref={firstFocusRef}
            type="button"
            onClick={() => { if (dirty && !confirm('Discard changes?')) return; onClose(); }}
            className="text-zinc-400 hover:text-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            aria-label="Close panel"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div role="alert" className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Priority */}
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-zinc-700">Coverage Priority <span aria-hidden="true">*</span></legend>
            <div role="radiogroup" aria-label="Coverage priority" className="flex gap-1">
              {([1, 2, 3] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={priority === p}
                  onClick={() => { setPriority(p); markDirty(); }}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                    priority === p
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Payer */}
          <div>
            <label htmlFor="ins-payer" className="mb-1 block text-sm font-medium text-zinc-700">
              Payer Name <span aria-hidden="true">*</span>
            </label>
            <input
              id="ins-payer"
              type="text"
              value={payerName}
              onChange={(e) => { setPayerName(e.target.value); markDirty(); }}
              className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              placeholder="e.g., Aetna PPO"
            />
            <p className="mt-1 text-xs text-zinc-500">Payer typeahead available in Phase 2.</p>
          </div>

          {/* Member ID + Group */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ins-member-id" className="mb-1 block text-sm font-medium text-zinc-700">
                Member ID <span aria-hidden="true">*</span>
              </label>
              <input
                id="ins-member-id"
                type="text"
                value={memberId}
                onChange={(e) => { setMemberId(e.target.value); markDirty(); }}
                className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                placeholder="Found on insurance card"
              />
            </div>
            <div>
              <label htmlFor="ins-group" className="mb-1 block text-sm font-medium text-zinc-700">Group #</label>
              <input
                id="ins-group"
                type="text"
                value={groupNumber}
                onChange={(e) => { setGroupNumber(e.target.value); markDirty(); }}
                className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              />
            </div>
          </div>

          {/* Plan name */}
          <div>
            <label htmlFor="ins-plan" className="mb-1 block text-sm font-medium text-zinc-700">Plan Name</label>
            <input
              id="ins-plan"
              type="text"
              value={planName}
              onChange={(e) => { setPlanName(e.target.value); markDirty(); }}
              className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              placeholder="e.g., Aetna Open Choice PPO"
            />
          </div>

          {/* Subscriber toggle */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 cursor-pointer">
              <input
                type="checkbox"
                checked={patientIsSubscriber}
                onChange={(e) => { setPatientIsSubscriber(e.target.checked); markDirty(); }}
                className="rounded border-zinc-300 text-blue-600 focus:ring-blue-600"
              />
              Patient is the subscriber
            </label>
          </div>

          {!patientIsSubscriber && (
            <div className="space-y-4 rounded-md border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Subscriber Information</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sub-first" className="mb-1 block text-sm font-medium text-zinc-700">First Name *</label>
                  <input id="sub-first" type="text" value={subFirstName} onChange={(e) => { setSubFirstName(e.target.value); markDirty(); }} className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" />
                </div>
                <div>
                  <label htmlFor="sub-last" className="mb-1 block text-sm font-medium text-zinc-700">Last Name *</label>
                  <input id="sub-last" type="text" value={subLastName} onChange={(e) => { setSubLastName(e.target.value); markDirty(); }} className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sub-dob" className="mb-1 block text-sm font-medium text-zinc-700">Date of Birth</label>
                  <input id="sub-dob" type="text" inputMode="numeric" value={subDob} onChange={(e) => { setSubDob(e.target.value); markDirty(); }} placeholder="MM/DD/YYYY" className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" />
                </div>
                <div>
                  <label htmlFor="sub-rel" className="mb-1 block text-sm font-medium text-zinc-700">Relationship</label>
                  <select id="sub-rel" value={subRelationship} onChange={(e) => { setSubRelationship(e.target.value); markDirty(); }} className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                    <option value="">Select…</option>
                    {RELATIONSHIP_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Coverage dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ins-effective" className="mb-1 block text-sm font-medium text-zinc-700">Effective Date *</label>
              <input id="ins-effective" type="text" inputMode="numeric" value={effectiveDate} onChange={(e) => { setEffectiveDate(e.target.value); markDirty(); }} placeholder="MM/DD/YYYY" className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" />
            </div>
            <div>
              <label htmlFor="ins-termination" className="mb-1 block text-sm font-medium text-zinc-700">Termination Date</label>
              <input id="ins-termination" type="text" inputMode="numeric" value={terminationDate} onChange={(e) => { setTerminationDate(e.target.value); markDirty(); }} placeholder="MM/DD/YYYY" className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" />
            </div>
          </div>

          {/* Eligibility */}
          <div>
            <label htmlFor="ins-eligibility" className="mb-1 block text-sm font-medium text-zinc-700">Eligibility Status</label>
            <select id="ins-eligibility" value={eligibilityStatus} onChange={(e) => { setEligibilityStatus(e.target.value as 'unverified' | 'active' | 'inactive'); markDirty(); }} className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
              <option value="unverified">Unverified</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Financials (collapsed) */}
          <div>
            <button
              type="button"
              onClick={() => setShowFinancials((v) => !v)}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
              aria-expanded={showFinancials}
            >
              <svg className={`h-4 w-4 transition-transform ${showFinancials ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
              Copay / Deductible (optional)
            </button>
            {showFinancials && (
              <div className="mt-3 grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="ins-copay" className="mb-1 block text-sm font-medium text-zinc-700">Copay</label>
                  <input id="ins-copay" type="text" inputMode="decimal" value={copay} onChange={(e) => { setCopay(e.target.value); markDirty(); }} placeholder="0.00" className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" />
                </div>
                <div>
                  <label htmlFor="ins-deductible" className="mb-1 block text-sm font-medium text-zinc-700">Deductible</label>
                  <input id="ins-deductible" type="text" inputMode="decimal" value={deductible} onChange={(e) => { setDeductible(e.target.value); markDirty(); }} placeholder="0.00" className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" />
                </div>
                <div>
                  <label htmlFor="ins-ded-met" className="mb-1 block text-sm font-medium text-zinc-700">Met</label>
                  <input id="ins-ded-met" type="text" inputMode="decimal" value={deductibleMet} onChange={(e) => { setDeductibleMet(e.target.value); markDirty(); }} placeholder="0.00" className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-200 px-6 py-4">
          <button
            type="button"
            onClick={() => { if (dirty && !confirm('Discard changes?')) return; onClose(); }}
            disabled={saving}
            className="rounded-md px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {saving ? 'Saving…' : 'Save Insurance'}
          </button>
        </div>
      </div>
    </>
  );
}
