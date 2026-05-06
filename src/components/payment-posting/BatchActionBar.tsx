'use client';

import { useState } from 'react';
import { BatchBalanceIndicator } from './BatchBalanceIndicator';
import { PostBatchConfirmDialog } from './PostBatchConfirmDialog';
import { VoidBatchModal } from './VoidBatchModal';
import type { PaymentBatch } from '@/types/payment-posting';

interface OpenActionBarProps {
  batch: PaymentBatch;
  linesPaidSum: number;
  onPosted: () => void;
}

function OpenActionBar({ batch, linesPaidSum, onPosted }: OpenActionBarProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const batchTotal = parseFloat(batch.totalAmount);
  const diffCents = Math.round(batchTotal * 100) - Math.round(linesPaidSum * 100);
  const isBalanced = diffCents === 0;

  return (
    <>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3">
        <BatchBalanceIndicator batchTotal={batchTotal} linesPaidSum={linesPaidSum} />
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          disabled={!isBalanced}
          aria-disabled={!isBalanced}
          title={
            !isBalanced
              ? `Batch must be balanced before posting. ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(diffCents / 100))} ${diffCents > 0 ? 'still needs to be allocated' : 'over-posted'}.`
              : undefined
          }
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Post Batch
        </button>
      </div>
      {showConfirm && (
        <PostBatchConfirmDialog
          batch={batch}
          onClose={() => setShowConfirm(false)}
          onPosted={onPosted}
        />
      )}
    </>
  );
}

interface PostedActionBarProps {
  batch: PaymentBatch;
  onVoided: () => void;
}

function PostedActionBar({ batch, onVoided }: PostedActionBarProps) {
  const [showVoid, setShowVoid] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3">
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2">
          <svg className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-medium text-green-800">This batch is posted. Payment lines are locked.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowVoid(true)}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          Void Batch
        </button>
      </div>
      {showVoid && (
        <VoidBatchModal
          batch={batch}
          onClose={() => setShowVoid(false)}
        />
      )}
    </>
  );
}

interface BatchActionBarProps {
  batch: PaymentBatch;
  linesPaidSum?: number;
  onPosted?: () => void;
  onVoided?: () => void;
}

export function BatchActionBar({ batch, linesPaidSum = 0, onPosted, onVoided }: BatchActionBarProps) {
  if (batch.status === 'OPEN') {
    return <OpenActionBar batch={batch} linesPaidSum={linesPaidSum} onPosted={onPosted ?? (() => {})} />;
  }
  if (batch.status === 'POSTED') {
    return <PostedActionBar batch={batch} onVoided={onVoided ?? (() => {})} />;
  }
  return null;
}
