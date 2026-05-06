'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { InsuranceCard } from '@/components/patients/InsuranceCard';
import { InsuranceSlideOver } from '@/components/patients/InsuranceSlideOver';
import {
  usePatient,
  usePatientInsurance,
  useCreateInsurance,
  useUpdateInsurance,
  useDeleteInsurance,
} from '@/hooks/usePatients';

import type { PatientInsurance, CreateInsuranceInput } from '@/types/patient';

function computeAge(dobIso: string): number {
  const dob = new Date(dobIso);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

function formatDob(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

function DataField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-zinc-900">{value || <span className="text-zinc-400">—</span>}</dd>
    </div>
  );
}

type Tab = 'demographics' | 'insurance' | 'claims';

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<Tab>('demographics');
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<PatientInsurance | null>(null);

  const { data: patient, isLoading, isError } = usePatient(id);
  const { data: insurances = [] } = usePatientInsurance(id);
  const createInsurance = useCreateInsurance(id);
  const updateInsurance = useUpdateInsurance(id);
  const deleteInsurance = useDeleteInsurance(id);

  function handleOpenAdd() {
    setEditingInsurance(null);
    setSlideOverOpen(true);
  }

  function handleEdit(ins: PatientInsurance) {
    setEditingInsurance(ins);
    setSlideOverOpen(true);
  }

  async function handleDelete(ins: PatientInsurance) {
    if (!confirm(`Remove ${ins.priority === 1 ? 'primary' : ins.priority === 2 ? 'secondary' : 'tertiary'} coverage from ${ins.payerNameSnapshot}?`)) return;
    await deleteInsurance.mutateAsync(ins.id);
  }

  async function handleSaveInsurance(data: CreateInsuranceInput) {
    if (editingInsurance) {
      await updateInsurance.mutateAsync({ insId: editingInsurance.id, data });
    } else {
      await createInsurance.mutateAsync(data);
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

  if (isError || !patient) {
    return (
      <div className="px-6 py-8">
        <p className="text-sm text-red-600">Failed to load patient. <Link href="/patients" className="underline">Go back</Link></p>
      </div>
    );
  }

  const primaryPayer = insurances.find((i) => i.priority === 1 && i.isActive);

  return (
    <>
      <div className="px-6 py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-zinc-500">
          <Link href="/patients" className="hover:text-zinc-700">Patients</Link>
          <span aria-hidden="true">/</span>
          <span className="text-zinc-900">{patient.lastName}, {patient.firstName}</span>
        </nav>

        {/* Patient header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-zinc-900">
                {patient.lastName}, {patient.firstName}{patient.middleName ? ` ${patient.middleName[0]}.` : ''}
              </h1>
              <Badge variant={patient.isActive ? 'active' : 'inactive'} />
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              {patient.chartNumber && <>Chart #: {patient.chartNumber} · </>}
              {primaryPayer && <>Primary: {primaryPayer.payerNameSnapshot} · </>}
              DOB: {formatDob(patient.dateOfBirth)} (Age: {computeAge(patient.dateOfBirth)})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              onClick={() => setActiveTab('demographics')}
            >
              Edit Demographics
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Patient sections"
          className="mb-6 flex gap-0 border-b border-zinc-200"
        >
          {([
            { key: 'demographics', label: 'Demographics' },
            { key: 'insurance', label: `Insurance (${insurances.filter((i) => i.isActive).length})` },
            { key: 'claims', label: 'Claims (0)' },
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

        {/* Demographics panel */}
        {activeTab === 'demographics' && (
          <div role="tabpanel" id="panel-demographics" aria-labelledby="tab-demographics">
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-lg border border-zinc-200 bg-white p-6">
              <DataField label="First Name" value={patient.firstName} />
              <DataField label="Last Name" value={patient.lastName} />
              <DataField label="Middle Name" value={patient.middleName} />
              <DataField label="Date of Birth" value={`${formatDob(patient.dateOfBirth)} (Age: ${computeAge(patient.dateOfBirth)})`} />
              <DataField label="Sex" value={patient.sex === 'M' ? 'Male' : patient.sex === 'F' ? 'Female' : 'Unknown'} />
              <DataField label="Chart Number" value={patient.chartNumber} />
              <DataField label="Phone" value={patient.phone} />
              <DataField label="Email" value={patient.email} />
              <DataField label="Address" value={[patient.addressLine1, patient.addressLine2, patient.city, patient.state, patient.zip].filter(Boolean).join(', ')} />
              <DataField label="SSN Last 4" value={patient.ssnLast4 ? `***-**-${patient.ssnLast4}` : null} />
              <DataField label="MBI" value={patient.mbi} />
              {patient.notes && (
                <div className="col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Notes</dt>
                  <dd className="mt-0.5 text-sm text-zinc-700 whitespace-pre-wrap">{patient.notes}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Insurance panel */}
        {activeTab === 'insurance' && (
          <div role="tabpanel" id="panel-insurance" aria-labelledby="tab-insurance">
            {insurances.length === 0 ? (
              <EmptyState
                heading="No insurance on file"
                message="Claims require at least one active coverage."
                action={{ label: '+ Add Insurance', onClick: handleOpenAdd }}
              />
            ) : (
              <div className="space-y-3">
                {insurances
                  .filter((i) => i.isActive && !i.deletedAt)
                  .sort((a, b) => a.priority - b.priority)
                  .map((ins) => (
                    <InsuranceCard
                      key={ins.id}
                      insurance={ins}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="mt-2 rounded-md border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  + Add Insurance
                </button>
              </div>
            )}
          </div>
        )}

        {/* Claims panel (stub) */}
        {activeTab === 'claims' && (
          <div role="tabpanel" id="panel-claims" aria-labelledby="tab-claims">
            <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-zinc-700">Claims will appear here once the Claims module is built</p>
              <ul className="mt-2 text-sm text-zinc-500 list-disc list-inside text-left inline-block">
                <li>Claim ID, date of service, status</li>
                <li>Payer, billed amount, paid amount</li>
                <li>Quick links to submit, resubmit, or appeal</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <InsuranceSlideOver
        open={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        onSave={handleSaveInsurance}
        initial={editingInsurance}
      />
    </>
  );
}
