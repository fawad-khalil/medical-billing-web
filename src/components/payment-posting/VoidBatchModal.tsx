'use client';

import { useEffect, useRef, useState } from 'react';
import { useVoidBatch } from '@/hooks/usePaymentBatches';
import type { PaymentBatch } from '@/types/payment-posting';

interface VoidBatchModalProps {
  batch: PaymentBatch;
  onClose: () => void;
}

export function VoidBatchModal({ batch, onClose }: VoidBatchModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const voidBatch = useVoidBatch(batch.id);
  const canSubmit = reason.trim().length >= 10;

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function handleSubmit() {
    if (!canSubmit) {
      setError('Please enter a reason of at least 10 characters.');
      return;
    }
    try {
      await voidBatch.mutateAsync({ reason });
      onClose();
    } catch {
      setError('Failed to void batch. Please try again.');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onKeyDown={handleKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="void-dialog-title"
        className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-xl"
      >
        <h2 id="void-dialog-title" className="text-lg font-semibold text-zinc-900">
          Void this payment batch?
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {batch.batchNumber} · {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(batch.totalAmount))} · {batch.lines?.length ?? 0} payment lines
        </p>

        <div className="mt-4 rounded-md border border-red-100 bg-red-50 p-3 text-sm text-zinc-700">
          <p className="font-medium text-red-800 mb-1">This will:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Reverse all payment amounts on the associated claims</li>
            <li>Mark this batch as Voided</li>
            <li>Cannot be undone</li>
          </ul>
        </div>

        <div className="mt-4">
          <label htmlFor="void-reason" className="block text-sm font-medium text-zinc-700 mb-1">
            Void reason <span aria-hidden="true">*</span>
          </label>
          <textarea
            ref={textareaRef}
            id="void-reason"
            rows={3}
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(''); }}
            placeholder="e.g. Check returned by bank, duplicate payment entry..."
            className={`w-full rounded-md border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              error ? 'border-red-500 bg-red-50' : 'border-zinc-300'
            }`}
          />
          {error && (
            <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-zinc-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={voidBatch.isPending}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || voidBatch.isPending}
            aria-disabled={!canSubmit || voidBatch.isPending}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {voidBatch.isPending ? 'Voiding…' : 'Void Batch'}
          </button>
        </div>
      </div>
    </div>
  );
}
