'use client';

import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SuperbillDropzone } from '@/components/charges/SuperbillDropzone';
import { DiagnosisCodeList } from '@/components/charges/DiagnosisCodeList';
import { ChargeLineTable } from '@/components/charges/ChargeLineTable';
import { ProviderSummarySelect } from '@/components/providers/ProviderSummarySelect';
import { useCreateEncounter, useTransitionStatus } from '@/hooks/useEncounters';
import { usePatientSearch } from '@/hooks/usePatients';
import type {
  ChargeLineRow,
  CreateChargeLineInput,
  CreateEncounterInput,
  EncounterSource,
  ParsedSuperbill,
} from '@/types/encounter';
import type { ProviderSummary } from '@/types/provider';
import type { PatientListItem } from '@/types/patient';

// ─── Place of service options ─────────────────────────────────────────────────

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

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Validation ───────────────────────────────────────────────────────────────

interface FormErrors {
  patientId?: string;
  providerId?: string;
  dateOfService?: string;
  placeOfService?: string;
  diagnosisCodes?: string;
  chargeLines?: string;
}

function validateForm(
  patientId: string,
  providerId: string,
  dateOfService: string,
  placeOfService: string,
  diagnosisCodes: string[],
  chargeLines: ChargeLineRow[],
): FormErrors {
  const errors: FormErrors = {};
  if (!patientId) errors.patientId = 'Select a patient';
  if (!providerId) errors.providerId = 'Select a provider';
  if (!dateOfService) errors.dateOfService = 'Enter the date of service';
  else if (dateOfService > todayISO()) errors.dateOfService = 'Date of service cannot be in the future';
  if (!placeOfService) errors.placeOfService = 'Select a place of service';
  const filledDx = diagnosisCodes.filter((c) => c.trim());
  if (filledDx.length === 0) errors.diagnosisCodes = 'Add at least one ICD-10 diagnosis code';
  const filledLines = chargeLines.filter((l) => l.cptCode.trim());
  if (filledLines.length === 0) errors.chargeLines = 'Add at least one charge line';
  return errors;
}

// ─── Patient autocomplete ─────────────────────────────────────────────────────

interface PatientComboboxProps {
  value: PatientListItem | null;
  onChange: (p: PatientListItem | null) => void;
  error?: string;
}

function PatientCombobox({ value, onChange, error }: PatientComboboxProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = 'patient-listbox';

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

  function clear() {
    onChange(null);
    setQuery('');
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) { setOpen(true); return; }
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (activeIndex >= 0 && results[activeIndex]) select(results[activeIndex]); }
    else if (e.key === 'Escape') { setOpen(false); setActiveIndex(-1); }
    else if (e.key === 'Tab') { if (activeIndex >= 0 && results[activeIndex]) select(results[activeIndex]); else setOpen(false); }
  }

  const inputBaseClass = `block w-full rounded-md border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${error ? 'border-red-500 bg-red-50' : 'border-zinc-300 bg-white'}`;

  return (
    <div ref={containerRef} className="relative">
      {value && !open ? (
        <div className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${error ? 'border-red-500 bg-red-50' : 'border-zinc-300 bg-white'}`}>
          <span className="text-zinc-900">{value.lastName}, {value.firstName}</span>
          <button type="button" onClick={clear} aria-label="Clear patient" className="text-zinc-400 hover:text-zinc-600">×</button>
        </div>
      ) : (
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls={open ? listboxId : undefined}
          aria-activedescendant={activeIndex >= 0 ? `patient-option-${activeIndex}` : undefined}
          value={query}
          placeholder="Search by name or chart number"
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIndex(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className={inputBaseClass}
        />
      )}

      {open && !value && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Patient options"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg"
        >
          <li aria-live="polite" className="sr-only">
            {results.length} patient{results.length !== 1 ? 's' : ''} found
          </li>
          {isLoading && <li className="px-3 py-2 text-sm text-zinc-500">Searching...</li>}
          {!isLoading && results.length === 0 && (
            <li className="px-3 py-2 text-sm text-zinc-500">
              {query.length >= 2 ? 'No patients match your search' : 'Type to search patients'}
            </li>
          )}
          {results.map((p, idx) => (
            <li
              key={p.id}
              id={`patient-option-${idx}`}
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

// ─── Shared encounter form ────────────────────────────────────────────────────

interface EncounterFormState {
  patient: PatientListItem | null;
  provider: ProviderSummary | null;
  dateOfService: string;
  placeOfService: string;
  notes: string;
  diagnosisCodes: string[];
  chargeLines: ChargeLineRow[];
  aiExtractedDx: Set<number>;
  aiExtractedLines: Set<string>;
}

function emptyFormState(): EncounterFormState {
  return {
    patient: null,
    provider: null,
    dateOfService: todayISO(),
    placeOfService: '11',
    notes: '',
    diagnosisCodes: [''],
    chargeLines: [{ cptCode: '', diagnosisPointers: [1], units: 1, fee: '', modifiers: [] }],
    aiExtractedDx: new Set(),
    aiExtractedLines: new Set(),
  };
}

interface SharedFormProps {
  form: EncounterFormState;
  setForm: React.Dispatch<React.SetStateAction<EncounterFormState>>;
  errors: FormErrors;
  submitting: boolean;
  onSaveDraft: () => void;
  onSaveReady: () => void;
  submitError: string | null;
}

function SharedEncounterForm({
  form,
  setForm,
  errors,
  submitting,
  onSaveDraft,
  onSaveReady,
  submitError,
}: SharedFormProps) {
  function setField<K extends keyof EncounterFormState>(key: K, value: EncounterFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Keyboard shortcut: Ctrl+S / Cmd+S → Save as Draft
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSaveDraft();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSaveDraft]);

  return (
    <div className="space-y-6">
      {/* Header grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Patient */}
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Patient <span aria-hidden="true">*</span>
          </label>
          <PatientCombobox
            value={form.patient}
            onChange={(p) => setField('patient', p)}
            error={errors.patientId}
          />
          {errors.patientId && (
            <p className="mt-1 text-xs text-red-600" role="alert">{errors.patientId}</p>
          )}
        </div>

        {/* Provider */}
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Provider <span aria-hidden="true">*</span>
          </label>
          <ProviderSummarySelect
            value={form.provider}
            onChange={(p) => setField('provider', p)}
            placeholder="Select provider"
          />
          {errors.providerId && (
            <p className="mt-1 text-xs text-red-600" role="alert">{errors.providerId}</p>
          )}
        </div>

        {/* Date of Service */}
        <div>
          <label htmlFor="enc-dos" className="mb-1 block text-sm font-medium text-zinc-700">
            Date of Service <span aria-hidden="true">*</span>
          </label>
          <input
            id="enc-dos"
            type="date"
            value={form.dateOfService}
            max={todayISO()}
            onChange={(e) => setField('dateOfService', e.target.value)}
            className={`block w-full rounded-md border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${errors.dateOfService ? 'border-red-500 bg-red-50' : 'border-zinc-300 bg-white'}`}
          />
          {errors.dateOfService && (
            <p className="mt-1 text-xs text-red-600" role="alert">{errors.dateOfService}</p>
          )}
        </div>

        {/* Place of Service */}
        <div>
          <label htmlFor="enc-pos" className="mb-1 block text-sm font-medium text-zinc-700">
            Place of Service <span aria-hidden="true">*</span>
          </label>
          <select
            id="enc-pos"
            value={form.placeOfService}
            aria-label="Place of service"
            onChange={(e) => setField('placeOfService', e.target.value)}
            className={`block w-full rounded-md border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${errors.placeOfService ? 'border-red-500 bg-red-50' : 'border-zinc-300 bg-white'}`}
          >
            <option value="">Select place of service</option>
            {POS_OPTIONS.map((o) => (
              <option key={o.code} value={o.code}>
                {o.code} – {o.label}
              </option>
            ))}
          </select>
          {errors.placeOfService && (
            <p className="mt-1 text-xs text-red-600" role="alert">{errors.placeOfService}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="enc-notes" className="mb-1 block text-sm font-medium text-zinc-700">
          Notes
        </label>
        <textarea
          id="enc-notes"
          rows={2}
          value={form.notes}
          placeholder="Internal notes — not sent to payer"
          onChange={(e) => setField('notes', e.target.value)}
          className="block w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        />
      </div>

      {/* Diagnosis codes */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-zinc-700">
          Diagnosis Codes (ICD-10)
        </h2>
        {errors.diagnosisCodes && (
          <p className="mb-1 text-xs text-red-600" role="alert">{errors.diagnosisCodes}</p>
        )}
        <DiagnosisCodeList
          codes={form.diagnosisCodes}
          onChange={(codes) => setField('diagnosisCodes', codes)}
          aiExtracted={form.aiExtractedDx}
          onFieldEdited={(idx) => {
            const next = new Set(form.aiExtractedDx);
            next.delete(idx);
            setField('aiExtractedDx', next);
          }}
        />
      </div>

      {/* Charge lines */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-zinc-700">Charge Lines</h2>
        {errors.chargeLines && (
          <p className="mb-1 text-xs text-red-600" role="alert">{errors.chargeLines}</p>
        )}
        <ChargeLineTable
          lines={form.chargeLines}
          diagnosisCodes={form.diagnosisCodes.filter((c) => c.trim())}
          onChange={(lines) => setField('chargeLines', lines)}
          aiExtracted={form.aiExtractedLines}
          onFieldEdited={(key) => {
            const next = new Set(form.aiExtractedLines);
            next.delete(key);
            setField('aiExtractedLines', next);
          }}
        />
      </div>

      {/* Submit error */}
      {submitError && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center gap-3 border-t border-zinc-200 pt-4">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={submitting}
          aria-keyshortcuts="Control+s Meta+s"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {submitting ? 'Saving...' : 'Save as Draft'}
        </button>
        <button
          type="button"
          onClick={onSaveReady}
          disabled={submitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {submitting ? 'Saving...' : 'Save & Mark Ready'}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ActiveTab = 'upload' | 'manual';

function NewEncounterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<ActiveTab>('upload');
  const [form, setForm] = useState<EncounterFormState>(emptyFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedSuperbill | null>(null);

  const createEncounter = useCreateEncounter();

  // Pre-fill patientId from URL ?patientId=
  useEffect(() => {
    const pid = searchParams.get('patientId');
    if (pid) {
      // We only have the ID; the autocomplete display will show the ID as a fallback
      // In a real scenario you'd fetch the patient record here, but we keep the form
      // layer simple — the user can search and reselect.
      // This is a best-effort pre-fill signal.
    }
  }, [searchParams]);

  function applyParsedSuperbill(result: ParsedSuperbill) {
    setParsedResult(result);

    const dxCodes = result.diagnosisCodes.length > 0 ? result.diagnosisCodes : [''];
    const dxSet = new Set(dxCodes.map((_, i) => i));

    const lines: ChargeLineRow[] = result.chargeLines.length > 0
      ? result.chargeLines.map((l) => ({
          cptCode: l.cptCode,
          diagnosisPointers: l.diagnosisPointers,
          units: l.units,
          fee: l.fee,
          modifiers: l.modifiers,
        }))
      : [{ cptCode: '', diagnosisPointers: [1], units: 1, fee: '', modifiers: [] }];

    const lineSet = new Set<string>();
    lines.forEach((_, i) => {
      lineSet.add(`line-${i}-cptCode`);
      lineSet.add(`line-${i}-fee`);
      lineSet.add(`line-${i}-diagnosisPointers`);
    });

    setForm((prev) => ({
      ...prev,
      dateOfService: result.dateOfService ?? prev.dateOfService,
      placeOfService: result.placeOfService ?? prev.placeOfService,
      diagnosisCodes: dxCodes,
      chargeLines: lines,
      aiExtractedDx: dxSet,
      aiExtractedLines: lineSet,
    }));
  }

  function buildInput(source: EncounterSource): CreateEncounterInput | null {
    const errs = validateForm(
      form.patient?.id ?? '',
      form.provider?.id ?? '',
      form.dateOfService,
      form.placeOfService,
      form.diagnosisCodes,
      form.chargeLines,
    );
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return null;
    }
    setErrors({});

    const lines: CreateChargeLineInput[] = form.chargeLines
      .filter((l) => l.cptCode.trim())
      .map((l) => ({
        cptCode: l.cptCode.trim(),
        diagnosisPointers: l.diagnosisPointers,
        units: l.units,
        fee: l.fee,
        modifiers: l.modifiers.filter(Boolean),
      }));

    return {
      patientId: form.patient!.id,
      providerId: form.provider!.id,
      dateOfService: form.dateOfService,
      placeOfService: form.placeOfService,
      source,
      diagnosisCodes: form.diagnosisCodes.filter((c) => c.trim()),
      notes: form.notes.trim() || undefined,
      chargeLines: lines,
    };
  }

  async function handleSaveDraft() {
    const source: EncounterSource = parsedResult ? 'PARSED' : 'MANUAL';
    const input = buildInput(source);
    if (!input) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const enc = await createEncounter.mutateAsync(input);
      router.push(`/charges/${enc.id}`);
    } catch {
      setSubmitError('Could not save — check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const handleSaveDraftCb = useCallback(handleSaveDraft, [form, parsedResult, createEncounter, router]);

  async function handleSaveReady() {
    const source: EncounterSource = parsedResult ? 'PARSED' : 'MANUAL';
    const input = buildInput(source);
    if (!input) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const enc = await createEncounter.mutateAsync(input);
      // Transition to READY immediately
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1/encounters/${enc.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(typeof window !== 'undefined' && localStorage.getItem('access_token')
              ? { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
              : {}),
          },
          body: JSON.stringify({ status: 'READY' }),
        });
      } catch {
        // Non-critical — encounter was saved, status transition failed
      }
      router.push(`/charges/${enc.id}`);
    } catch {
      setSubmitError('Could not save — check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const sharedFormProps: SharedFormProps = {
    form,
    setForm,
    errors,
    submitting,
    onSaveDraft: handleSaveDraftCb,
    onSaveReady: handleSaveReady,
    submitError,
  };

  return (
    <div className="px-6 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-zinc-500">
        <Link href="/charges" className="hover:text-zinc-700">Charges</Link>
        <span aria-hidden="true">/</span>
        <span className="text-zinc-900">New Encounter</span>
      </nav>

      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">New Encounter</h1>

      {/* Tab strip */}
      <div
        role="tablist"
        aria-label="Encounter entry method"
        className="mb-6 flex gap-0 border-b border-zinc-200"
      >
        {([
          { key: 'upload', label: 'Upload Superbill' },
          { key: 'manual', label: 'Enter Manually' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            role="tab"
            id={`tab-${tab.key}`}
            aria-selected={activeTab === tab.key}
            aria-controls={`panel-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Upload tab */}
      <div
        role="tabpanel"
        id="panel-upload"
        aria-labelledby="tab-upload"
        hidden={activeTab !== 'upload'}
      >
        <div className="mb-6">
          <SuperbillDropzone
            onParsed={(result) => {
              applyParsedSuperbill(result);
            }}
            onError={() => {
              // Error is shown within the dropzone component
            }}
          />
          {parsedResult && (
            <p className="mt-2 text-xs text-zinc-400">
              AI parsed · {parsedResult.parseMethod} path · confidence: {parsedResult.confidence}
            </p>
          )}
        </div>
        <SharedEncounterForm {...sharedFormProps} />
      </div>

      {/* Manual tab */}
      <div
        role="tabpanel"
        id="panel-manual"
        aria-labelledby="tab-manual"
        hidden={activeTab !== 'manual'}
      >
        <SharedEncounterForm {...sharedFormProps} />
      </div>
    </div>
  );
}

export default function NewEncounterPage() {
  return (
    <Suspense>
      <NewEncounterContent />
    </Suspense>
  );
}
