'use client';

import { useState } from 'react';
import { CARCCodeSelect } from './CARCCodeSelect';
import { useAddLine } from '@/hooks/usePaymentBatches';

interface LineEntryPanelProps {
  batchId: string;
  claimId: string;
  claimNumber: string;
  claimPatientName?: string;
  claimDateOfService?: string;
  claimTotalCharge?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function LineEntryPanel({
  batchId,
  claimId,
  claimNumber,
  claimPatientName,
  claimDateOfService,
  claimTotalCharge,
  onSuccess,
  onCancel,
}: LineEntryPanelProps) {
  const [paidAmount, setPaidAmount] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [carcCode, setCarcCode] = useState<string | null>(null);
  const [patientResponsibility, setPatientResponsibility] = useState('');
  const [rarcCode, setRarcCode] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  const addLine = useAddLine(batchId);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!paidAmount || parseFloat(paidAmount) < 0) {
      errs.paidAmount = 'Enter the paid amount';
    }
    if (parseFloat(adjustmentAmount || '0') > 0 && !carcCode) {
      errs.carcCode = 'A CARC code is required when an adjustment is entered';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setServerError('');
    try {
      await addLine.mutateAsync({
        claimId,
        paidAmount: parseFloat(paidAmount || '0').toFixed(2),
        adjustmentAmount: parseFloat(adjustmentAmount || '0').toFixed(2),
        patientResponsibilityAmount: parseFloat(patientResponsibility || '0').toFixed(2),
        carcCode: carcCode ?? undefined,
        rarcCode: rarcCode || undefined,
        notes: notes || undefined,
      });
      onSuccess();
    } catch {
      setServerError('Failed to add line. Please try again.');
    }
  }

  function formatCurrency(v: string): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(v || '0'));
  }

  function formatDOS(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${m}/${d}/${y.slice(2)}`;
  }

  return (
    <div
      role="region"
      aria-label={`Add payment line for ${claimNumber}`}
      className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 transition-all duration-200 motion-reduce:transition-none"
    >
      <div className="mb-3 flex items-center gap-2 text-sm text-zinc-600">
        <span className="font-mono font-medium text-blue-600">{claimNumber}</span>
        {claimPatientName && <span>· {claimPatientName}</span>}
        {claimDateOfService && <span>· {formatDOS(claimDateOfService)}</span>}
        {claimTotalCharge && <span>· Billed: {formatCurrency(claimTotalCharge)}</span>}
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">
            Paid Amount <span aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              aria-label={`Paid amount for ${claimNumber}`}
              className={`w-full rounded-md border py-1.5 pl-6 pr-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${errors.paidAmount ? 'border-red-500 bg-red-50' : 'border-zinc-300 bg-white'}`}
            />
          </div>
          {errors.paidAmount && <p className="mt-0.5 text-xs text-red-600">{errors.paidAmount}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">Adjustment Amt</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={adjustmentAmount}
              onChange={(e) => setAdjustmentAmount(e.target.value)}
              aria-label={`Adjustment amount for ${claimNumber}`}
              className="w-full rounded-md border border-zinc-300 bg-white py-1.5 pl-6 pr-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">CARC Code</label>
          <CARCCodeSelect value={carcCode} onChange={setCarcCode} />
          {errors.carcCode && <p className="mt-0.5 text-xs text-red-600">{errors.carcCode}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">Pt. Resp.</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={patientResponsibility}
              onChange={(e) => setPatientResponsibility(e.target.value)}
              aria-label={`Patient responsibility for ${claimNumber}`}
              className="w-full rounded-md border border-zinc-300 bg-white py-1.5 pl-6 pr-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            />
          </div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">RARC Code (optional)</label>
          <input
            type="text"
            value={rarcCode}
            onChange={(e) => setRarcCode(e.target.value)}
            placeholder="e.g. N30"
            className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-zinc-700 mb-1">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal note…"
            className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          />
        </div>
      </div>

      {serverError && (
        <p role="alert" className="mt-2 text-sm text-red-600">{serverError}</p>
      )}

      <div className="mt-4 flex justify-end gap-3 border-t border-blue-200 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={addLine.isPending}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
        >
          {addLine.isPending ? 'Adding…' : 'Add to Batch'}
        </button>
      </div>
    </div>
  );
}
