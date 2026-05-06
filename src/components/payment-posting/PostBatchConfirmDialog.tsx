'use client';

import { useEffect, useRef, useState } from 'react';
import { paymentPostingApi } from '@/lib/paymentPostingApi';
import { usePostBatch } from '@/hooks/usePaymentBatches';
import type { PaymentBatch } from '@/types/payment-posting';

interface PostBatchConfirmDialogProps {
  batch: PaymentBatch;
  onClose: () => void;
  onPosted: () => void;
}

export function PostBatchConfirmDialog({ batch, onClose, onPosted }: PostBatchConfirmDialogProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [error, setError] = useState('');
  const postBatch = usePostBatch(batch.id);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  async function handlePost() {
    setError('');
    try {
      // Race-condition guard: verify balance one more time before committing
      const check = await paymentPostingApi.getBalanceCheck(batch.id);
      if (!check.isBalanced) {
        setError('Batch balance changed — please review before posting.');
        onClose();
        return;
      }
      await postBatch.mutateAsync();
      onPosted();
    } catch {
      setError('Failed to post batch. Please try again.');
    }
  }

  const lineCount = batch.lines?.length ?? 0;
  const fmt = (v: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(v));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-dialog-title"
        className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-xl"
      >
        <h2
          ref={headingRef}
          id="post-dialog-title"
          tabIndex={-1}
          className="text-lg font-semibold text-zinc-900 outline-none"
        >
          Post this payment batch?
        </h2>

        <div className="mt-3 space-y-0.5 text-sm text-zinc-700">
          <p className="font-mono font-medium text-zinc-900">{batch.batchNumber}</p>
          {batch.payerNameSnapshot && (
            <p>{batch.payerNameSnapshot}{batch.checkNumber ? ` · Check #${batch.checkNumber}` : ''} · {fmt(batch.totalAmount)}</p>
          )}
          <p>{lineCount} payment line{lineCount !== 1 ? 's' : ''}</p>
        </div>

        <p className="mt-4 text-sm text-zinc-600">
          Once posted, this batch and its payment lines cannot be modified. Claims will be updated with the posted payment amounts.
        </p>
        <p className="mt-1 text-sm text-zinc-400">
          To undo a posted batch, use Void Batch.
        </p>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-3 border-t border-zinc-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={postBatch.isPending}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePost}
            disabled={postBatch.isPending}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            {postBatch.isPending && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {postBatch.isPending ? 'Posting…' : 'Post Batch'}
          </button>
        </div>
      </div>
    </div>
  );
}
