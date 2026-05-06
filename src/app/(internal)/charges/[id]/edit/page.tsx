'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DiagnosisCodeList } from '@/components/charges/DiagnosisCodeList';
import { ChargeLineTable } from '@/components/charges/ChargeLineTable';
import { ProviderSummarySelect } from '@/components/providers/ProviderSummarySelect';
import { useEncounter, useUpdateEncounter, useTransitionStatus } from '@/hooks/useEncounters';
import type { ChargeLineRow, CreateEncounterInput } from '@/types/encounter';
import type { ProviderSummary } from '@/types/provider';
import type { PatientListItem } from '@/types/patient';
import { usePatientSearch } from '@/hooks/usePatients';
import { useRef, useCallback } from 'react';

const POS_OPTIONS = [
  { code: '11', label: 'Office' },
  { code: '12', label: 'Home' },
  { code: '21', label: 'Inpatient Hospital' },
  { code: '22', label: 'Outpatient Hospital' },
  { code: '23', label: 'Emergency Room' },
  { code: '24', label: 'ASC' },
  { code: '02', label: 'Telehealth' },
  { code: '10', label: 'Telehealth Home' },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDOS(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

interface FormErrors {
  dateOfService?: string;
  placeOfService?: string;
  diagnosisCodes?: string;
  chargeLines?: string;
}

function validateForm(
  dateOfService: string,
  placeOfService: string,
  diagnosisCodes: string[],
  chargeLines: ChargeLineRow[],
): FormErrors {
  const errors: FormErrors = {};
  if (!dateOfService) errors.dateOfService = 'Enter the date of service';
  else if (dateOfService > todayISO()) errors.dateOfService = 'Date of service cannot be in the future';
  if (!placeOfService) errors.placeOfService = 'Select a place of service';
  if (diagnosisCodes.filter((c) => c.trim()).length === 0)
    errors.diagnosisCodes = 'Add at least one ICD-10 diagnosis code';
  if (chargeLines.filter((l) => l.cptCode.trim()).length === 0)
    errors.chargeLines = 'Add at least one charge line';
  return errors;
}

// Simple patient combobox (same as in new page)
interface PatientComboboxProps {
  value: PatientListItem | null;
  onChange: (p: PatientListItem | null) => void;
  disabled?: boolean;
}

function PatientCombobox({ value, onChange, disabled }: PatientComboboxProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: results = [], isLoading } = usePatientSearch(query);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  function select(p: PatientListItem) {
    onChange(p);
    setQuery('');
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      {value ? (
        <div className="flex items-center justify-between rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm">
          <span className="text-zinc-900">{value.lastName}, {value.firstName}</span>
          {!disabled && (
            <button type="button" onClick={() => onChange(null)} aria-label="Clear patient" className="text-zinc-400 hover:text-zinc-600">×</button>
          )}
        </div>
      ) : (
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          value={query}
          placeholder="Search by name or chart number"
          disabled={disabled}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIndex(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!open && e.key === 'ArrowDown') { setOpen(true); return; }
            if (e.key === 'Escape') { setOpen(false); }
            if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
              e.preventDefault(); select(results[activeIndex]);
            }
            if (e.key === 'ArrowDown') setActiveIndex((i) => Math.min(i + 1, results.length - 1));
            if (e.key === 'ArrowUp') setActiveIndex((i) => Math.max(i - 1, -1));
          }}
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        />
      )}
      {open && !value && (
        <ul role="listbox" aria-label="Patient options" className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg">
          {isLoading && <li className="px-3 py-2 text-sm text-zinc-500">Searching...</li>}
          {!isLoading && results.length === 0 && <li className="px-3 py-2 text-sm text-zinc-500">{query.length >= 2 ? 'No patients found' : 'Type to search'}</li>}
          {results.map((p, idx) => (
            <li
              key={p.id}
              role="option"
              aria-selected={false}
              onMouseDown={(e) => { e.preventDefault(); select(p); }}
              onMouseEnter={() => setActiveIndex(idx)}
              className={`cursor-pointer px-3 py-2 text-sm ${idx === activeIndex ? 'bg-blue-50' : 'hover:bg-zinc-50'}`}
            >
              <span className="font-medium text-zinc-900">{p.lastName}, {p.firstName}</span>
              {p.chartNumber && <span className="ml-2 text-xs text-zinc-500">#{p.chartNumber}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function EditEncounterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: encounter, isLoading, isError } = useEncounter(id);
  const updateEncounter = useUpdateEncounter(id);
  const transitionStatus = useTransitionStatus(id);

  const [patient, setPatient] = useState<PatientListItem | null>(null);
  const [provider, setProvider] = useState<ProviderSummary | null>(null);
  const [dateOfService, setDateOfService] = useState('');
  const [placeOfService, setPlaceOfService] = useState('11');
  const [notes, setNotes] = useState('');
  const [diagnosisCodes, setDiagnosisCodes] = useState<string[]>(['']);
  const [chargeLines, setChargeLines] = useState<ChargeLineRow[]>([
    { cptCode: '', diagnosisPointers: [1], units: 1, fee: '', modifiers: [] },
  ]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Populate form from loaded encounter
  useEffect(() => {
    if (encounter && !initialized) {
      setDateOfService(encounter.dateOfService);
      setPlaceOfService(encounter.placeOfService);
      setNotes(encounter.notes ?? '');
      setDiagnosisCodes(encounter.diagnosisCodes.length > 0 ? encounter.diagnosisCodes : ['']);
      setChargeLines(
        encounter.chargeLines.length > 0
          ? encounter.chargeLines.map((l) => ({
              cptCode: l.cptCode,
              diagnosisPointers: l.diagnosisPointers,
              units: l.units,
              fee: l.fee,
              modifiers: l.modifiers ?? [],
            }))
          : [{ cptCode: '', diagnosisPointers: [1], units: 1, fee: '', modifiers: [] }],
      );
      setInitialized(true);
    }
  }, [encounter, initialized]);

  // Keyboard shortcut: Ctrl+S / Cmd+S → Save
  const handleSaveChanges = useCallback(async () => {
    const errs = validateForm(dateOfService, placeOfService, diagnosisCodes, chargeLines);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    setSubmitError(null);
    try {
      const input: Partial<CreateEncounterInput> = {
        dateOfService,
        placeOfService,
        notes: notes.trim() || undefined,
        diagnosisCodes: diagnosisCodes.filter((c) => c.trim()),
        chargeLines: chargeLines.filter((l) => l.cptCode.trim()).map((l) => ({
          cptCode: l.cptCode.trim(),
          diagnosisPointers: l.diagnosisPointers,
          units: l.units,
          fee: l.fee,
          modifiers: l.modifiers.filter(Boolean),
        })),
        ...(patient ? { patientId: patient.id } : {}),
        ...(provider ? { providerId: provider.id } : {}),
      };
      await updateEncounter.mutateAsync(input);
      router.push(`/charges/${id}`);
    } catch {
      setSubmitError('Could not save — check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }, [dateOfService, placeOfService, diagnosisCodes, chargeLines, notes, patient, provider, id, updateEncounter, router]);

  async function handleSaveAndMarkReady() {
    const errs = validateForm(dateOfService, placeOfService, diagnosisCodes, chargeLines);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    setSubmitError(null);
    try {
      const input: Partial<CreateEncounterInput> = {
        dateOfService,
        placeOfService,
        notes: notes.trim() || undefined,
        diagnosisCodes: diagnosisCodes.filter((c) => c.trim()),
        chargeLines: chargeLines.filter((l) => l.cptCode.trim()).map((l) => ({
          cptCode: l.cptCode.trim(),
          diagnosisPointers: l.diagnosisPointers,
          units: l.units,
          fee: l.fee,
          modifiers: l.modifiers.filter(Boolean),
        })),
        ...(patient ? { patientId: patient.id } : {}),
        ...(provider ? { providerId: provider.id } : {}),
      };
      await updateEncounter.mutateAsync(input);
      try {
        await transitionStatus.mutateAsync('READY');
      } catch {
        // Non-critical
      }
      router.push(`/charges/${id}`);
    } catch {
      setSubmitError('Could not save — check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        void handleSaveChanges();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [handleSaveChanges]);

  if (isLoading) {
    return (
      <div className="px-6 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-100 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-zinc-100" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !encounter) {
    return (
      <div className="px-6 py-8">
        <p className="text-sm text-red-600">
          Failed to load encounter.{' '}
          <Link href="/charges" className="underline">Go back to Charges</Link>
        </p>
      </div>
    );
  }

  const isLocked = encounter.status === 'BILLED';

  return (
    <div className="px-6 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-zinc-500">
        <Link href="/charges" className="hover:text-zinc-700">Charges</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/charges/${id}`} className="hover:text-zinc-700">{formatDOS(encounter.dateOfService)}</Link>
        <span aria-hidden="true">/</span>
        <span className="text-zinc-900">Edit</span>
      </nav>

      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Edit Encounter</h1>

      {/* Locked banner */}
      {isLocked && (
        <div role="alert" className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This encounter is locked — a claim has been submitted. Viewing only.
        </div>
      )}

      <div className="space-y-6">
        {/* Header grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Patient</label>
            <PatientCombobox value={patient} onChange={setPatient} disabled={isLocked} />
            {!patient && encounter.patientId && (
              <p className="mt-1 text-xs text-zinc-500">Current: {encounter.patientId}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Provider</label>
            <ProviderSummarySelect value={provider} onChange={setProvider} disabled={isLocked} placeholder="Keep existing provider" />
            {!provider && encounter.providerId && (
              <p className="mt-1 text-xs text-zinc-500">Current: {encounter.providerId}</p>
            )}
          </div>

          <div>
            <label htmlFor="edit-dos" className="mb-1 block text-sm font-medium text-zinc-700">
              Date of Service <span aria-hidden="true">*</span>
            </label>
            <input
              id="edit-dos"
              type="date"
              value={dateOfService}
              max={todayISO()}
              readOnly={isLocked}
              onChange={(e) => setDateOfService(e.target.value)}
              className={`block w-full rounded-md border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                isLocked ? 'border-zinc-200 bg-zinc-50 text-zinc-400 cursor-not-allowed' : errors.dateOfService ? 'border-red-500 bg-red-50' : 'border-zinc-300 bg-white'
              }`}
            />
            {errors.dateOfService && <p className="mt-1 text-xs text-red-600" role="alert">{errors.dateOfService}</p>}
          </div>

          <div>
            <label htmlFor="edit-pos" className="mb-1 block text-sm font-medium text-zinc-700">
              Place of Service <span aria-hidden="true">*</span>
            </label>
            <select
              id="edit-pos"
              value={placeOfService}
              disabled={isLocked}
              aria-label="Place of service"
              onChange={(e) => setPlaceOfService(e.target.value)}
              className={`block w-full rounded-md border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                isLocked ? 'border-zinc-200 bg-zinc-50 text-zinc-400 cursor-not-allowed' : errors.placeOfService ? 'border-red-500 bg-red-50' : 'border-zinc-300 bg-white'
              }`}
            >
              {POS_OPTIONS.map((o) => (
                <option key={o.code} value={o.code}>{o.code} – {o.label}</option>
              ))}
            </select>
            {errors.placeOfService && <p className="mt-1 text-xs text-red-600" role="alert">{errors.placeOfService}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="edit-notes" className="mb-1 block text-sm font-medium text-zinc-700">Notes</label>
          <textarea
            id="edit-notes"
            rows={2}
            value={notes}
            readOnly={isLocked}
            placeholder="Internal notes — not sent to payer"
            onChange={(e) => setNotes(e.target.value)}
            className={`block w-full resize-y rounded-md border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              isLocked ? 'border-zinc-200 bg-zinc-50 text-zinc-400 cursor-not-allowed' : 'border-zinc-300 bg-white'
            }`}
          />
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-700">Diagnosis Codes (ICD-10)</h2>
          {errors.diagnosisCodes && <p className="mb-1 text-xs text-red-600" role="alert">{errors.diagnosisCodes}</p>}
          <DiagnosisCodeList
            codes={diagnosisCodes}
            onChange={setDiagnosisCodes}
          />
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-700">Charge Lines</h2>
          {errors.chargeLines && <p className="mb-1 text-xs text-red-600" role="alert">{errors.chargeLines}</p>}
          <ChargeLineTable
            lines={chargeLines}
            diagnosisCodes={diagnosisCodes.filter((c) => c.trim())}
            onChange={setChargeLines}
            locked={isLocked}
          />
        </div>

        {submitError && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        {!isLocked && (
          <div className="flex items-center gap-3 border-t border-zinc-200 pt-4">
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={submitting}
              aria-keyshortcuts="Control+s Meta+s"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            {encounter.status === 'DRAFT' && (
              <button
                type="button"
                onClick={handleSaveAndMarkReady}
                disabled={submitting}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                {submitting ? 'Saving...' : 'Save & Mark Ready'}
              </button>
            )}
            <Link
              href={`/charges/${id}`}
              className="text-sm text-zinc-500 hover:text-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Cancel
            </Link>
          </div>
        )}

        {isLocked && (
          <div className="pt-4">
            <Link
              href={`/charges/${id}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Back to encounter
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
