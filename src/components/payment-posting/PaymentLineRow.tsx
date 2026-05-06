'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CARCCodeSelect } from './CARCCodeSelect';
import { useUpdateLine, useRemoveLine } from '@/hooks/usePaymentBatches';
import type { PaymentLine } from '@/types/payment-posting';

interface PaymentLineRowProps {
  batchId: string;
  line: PaymentLine;
  claimNumber?: string;
  patientName?: string;
  dateOfService?: string;
  billedAmount?: string;
  readOnly?: boolean;
  onPaidAmountChange?: (lineId: string, value: string) => void;
}

function formatDOS(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y.slice(2)}`;
}

function formatCurrency(v: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(v || '0'));
}

export function PaymentLineRow({
  batchId,
  line,
  claimNumber = '—',
  patientName = '—',
  dateOfService,
  billedAmount,
  readOnly = false,
  onPaidAmountChange,
}: PaymentLineRowProps) {
  const [paidAmount, setPaidAmount] = useState(line.paidAmount);
  const [adjustmentAmount, setAdjustmentAmount] = useState(line.adjustmentAmount);
  const [carcCode, setCarcCode] = useState<string | null>(line.carcCode ?? null);
  const [patientResp, setPatientResp] = useState(line.patientResponsibilityAmount);
  const [saveError, setSaveError] = useState('');

  const updateLine = useUpdateLine(batchId);
  const removeLine = useRemoveLine(batchId);

  async function autoSave(field: string, value: string | null) {
    setSaveError('');
    try {
      await updateLine.mutateAsync({
        lineId: line.id,
        data: { [field]: value ?? undefined },
      });
    } catch {
      setSaveError('Failed to save — check your connection.');
    }
  }

  async function handleRemove() {
    try {
      await removeLine.mutateAsync(line.id);
    } catch {
      setSaveError('Failed to remove line.');
    }
  }

  return (
    <>
      <tr className="divide-x divide-zinc-100">
        <td className="px-3 py-2 text-sm">
          <Link
            href={`/claims/${line.claimId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-blue-600 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {claimNumber}
          </Link>
        </td>
        <td className="px-3 py-2 text-sm text-zinc-700">{patientName}</td>
        <td className="px-3 py-2 text-sm text-zinc-500">{dateOfService ? formatDOS(dateOfService) : '—'}</td>
        <td className="px-3 py-2 text-right text-sm text-zinc-700">{billedAmount ? formatCurrency(billedAmount) : '—'}</td>

        {/* Paid Amount */}
        <td className="px-3 py-2">
          {readOnly ? (
            <span className="text-sm text-zinc-900">{formatCurrency(paidAmount)}</span>
          ) : (
            <div className="relative w-24">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={paidAmount}
                aria-label={`Paid amount for ${claimNumber}`}
                onChange={(e) => {
                  setPaidAmount(e.target.value);
                  onPaidAmountChange?.(line.id, e.target.value);
                }}
                onBlur={() => autoSave('paidAmount', parseFloat(paidAmount || '0').toFixed(2))}
                className="w-full rounded border border-zinc-300 py-1 pl-5 pr-1 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              />
            </div>
          )}
        </td>

        {/* Adjustment */}
        <td className="px-3 py-2">
          {readOnly ? (
            <span className="text-sm text-zinc-900">{formatCurrency(adjustmentAmount)}</span>
          ) : (
            <div className="relative w-24">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={adjustmentAmount}
                aria-label={`Adjustment amount for ${claimNumber}`}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                onBlur={() => autoSave('adjustmentAmount', parseFloat(adjustmentAmount || '0').toFixed(2))}
                className="w-full rounded border border-zinc-300 py-1 pl-5 pr-1 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              />
            </div>
          )}
        </td>

        {/* CARC */}
        <td className="px-3 py-2">
          {readOnly ? (
            <span className="font-mono text-sm text-zinc-700">{carcCode ?? '—'}</span>
          ) : (
            <div className="w-28" onBlur={() => autoSave('carcCode', carcCode)}>
              <CARCCodeSelect value={carcCode} onChange={(c) => { setCarcCode(c); autoSave('carcCode', c); }} />
            </div>
          )}
        </td>

        {/* Pt. Resp */}
        <td className="px-3 py-2">
          {readOnly ? (
            <span className="text-sm text-zinc-900">{formatCurrency(patientResp)}</span>
          ) : (
            <div className="relative w-24">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={patientResp}
                aria-label={`Patient responsibility for ${claimNumber}`}
                onChange={(e) => setPatientResp(e.target.value)}
                onBlur={() => autoSave('patientResponsibilityAmount', parseFloat(patientResp || '0').toFixed(2))}
                className="w-full rounded border border-zinc-300 py-1 pl-5 pr-1 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              />
            </div>
          )}
        </td>

        {!readOnly && (
          <td className="px-3 py-2 text-center">
            <button
              type="button"
              onClick={handleRemove}
              disabled={removeLine.isPending}
              aria-label={`Remove payment line for ${claimNumber}`}
              className="text-zinc-400 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-40"
            >
              ×
            </button>
          </td>
        )}
      </tr>
      {saveError && (
        <tr>
          <td colSpan={readOnly ? 8 : 9}>
            <p role="alert" className="px-3 pb-1 text-xs text-red-600">{saveError}</p>
          </td>
        </tr>
      )}
    </>
  );
}
