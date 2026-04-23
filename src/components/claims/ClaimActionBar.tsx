'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClaimStatusBadge } from './ClaimStatusBadge';
import { useUpdateClaimStatus } from '@/hooks/useClaims';
import type { ClaimStatus } from '@/types/claim';

// ─── Spinner ──────────────────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  titleId: string;
  title: string;
  body: string;
  confirmLabel: string;
  confirmClassName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function ConfirmDialog({
  titleId,
  title,
  body,
  confirmLabel,
  confirmClassName,
  onConfirm,
  onCancel,
  isPending,
}: ConfirmDialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-xl">
        <h2 id={titleId} className="text-base font-semibold text-zinc-900">
          {title}
        </h2>
        <p className="mt-2 text-sm text-zinc-600">{body}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`${confirmClassName} px-3 py-1.5 text-sm font-medium disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600`}
          >
            {isPending ? (
              <span className="flex items-center gap-1.5">
                <SpinnerIcon /> Saving...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Action bar ───────────────────────────────────────────────────────────────

interface ClaimActionBarProps {
  claimId: string;
  status: ClaimStatus;
}

type DialogType = 'submit' | 'void' | 'backToDraft' | null;

export function ClaimActionBar({ claimId, status }: ClaimActionBarProps) {
  const [openDialog, setOpenDialog] = useState<DialogType>(null);
  const updateStatus = useUpdateClaimStatus(claimId);

  const isPending = updateStatus.isPending;

  async function transition(toStatus: ClaimStatus, notes?: string) {
    await updateStatus.mutateAsync({ status: toStatus, notes });
    setOpenDialog(null);
  }

  // ─── PAID ────────────────────────────────────────────────────────────────

  if (status === 'PAID') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
        <ClaimStatusBadge status="PAID" />
        <p className="text-sm text-green-800">This claim has been paid in full.</p>
      </div>
    );
  }

  // ─── VOIDED ──────────────────────────────────────────────────────────────

  if (status === 'VOIDED') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
        <ClaimStatusBadge status="VOIDED" />
        <p className="text-sm text-zinc-500">
          This claim has been voided. The encounter is available for re-billing.
        </p>
      </div>
    );
  }

  // ─── Per-status button definitions ───────────────────────────────────────

  function renderButtons() {
    switch (status) {
      case 'DRAFT':
        return (
          <>
            <button
              type="button"
              onClick={() => transition('SCRUBBED')}
              disabled={isPending}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {isPending ? <span className="flex items-center gap-1.5"><SpinnerIcon /> Saving...</span> : 'Scrub Claim'}
            </button>
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Scrub the claim before submitting."
              className="cursor-not-allowed rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white opacity-40"
            >
              Submit
            </button>
          </>
        );

      case 'SCRUBBED':
        return (
          <>
            <button
              type="button"
              onClick={() => setOpenDialog('backToDraft')}
              disabled={isPending}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Back to Draft
            </button>
            <button
              type="button"
              onClick={() => setOpenDialog('submit')}
              disabled={isPending}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Submit Claim
            </button>
          </>
        );

      case 'SUBMITTED':
        return (
          <>
            <button
              type="button"
              onClick={() => transition('ACCEPTED')}
              disabled={isPending}
              className="rounded-md border border-teal-600 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-100 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
            >
              {isPending ? <span className="flex items-center gap-1.5"><SpinnerIcon /> Saving...</span> : 'Mark Accepted'}
            </button>
            <button
              type="button"
              onClick={() => transition('REJECTED')}
              disabled={isPending}
              className="rounded-md border border-orange-400 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
            >
              {isPending ? <span className="flex items-center gap-1.5"><SpinnerIcon /> Saving...</span> : 'Mark Rejected'}
            </button>
          </>
        );

      case 'ACCEPTED':
        return (
          <>
            <Link
              href={`/payments/post?claimId=${claimId}`}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Post Payment &rarr;
            </Link>
            <button
              type="button"
              onClick={() => transition('DENIED')}
              disabled={isPending}
              className="rounded-md border border-red-400 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              {isPending ? <span className="flex items-center gap-1.5"><SpinnerIcon /> Saving...</span> : 'Mark Denied'}
            </button>
          </>
        );

      case 'REJECTED':
        return (
          <>
            <button
              type="button"
              onClick={() => transition('SCRUBBED')}
              disabled={isPending}
              className="rounded-md border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {isPending ? <span className="flex items-center gap-1.5"><SpinnerIcon /> Saving...</span> : 'Correct & Resubmit'}
            </button>
            <button
              type="button"
              onClick={() => setOpenDialog('void')}
              disabled={isPending}
              className="rounded-md border border-red-600 bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              Void Claim
            </button>
          </>
        );

      case 'DENIED':
        return (
          <>
            <Link
              href={`/denials?claimId=${claimId}`}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Manage Denial &rarr;
            </Link>
            <button
              type="button"
              onClick={() => setOpenDialog('void')}
              disabled={isPending}
              className="rounded-md border border-red-600 bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              Void Claim
            </button>
          </>
        );

      case 'APPEALED':
        return (
          <>
            <Link
              href={`/payments/post?claimId=${claimId}`}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Post Payment &rarr;
            </Link>
            <button
              type="button"
              onClick={() => transition('DENIED')}
              disabled={isPending}
              className="rounded-md border border-red-400 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              {isPending ? <span className="flex items-center gap-1.5"><SpinnerIcon /> Saving...</span> : 'Mark Denied Again'}
            </button>
            <button
              type="button"
              onClick={() => setOpenDialog('void')}
              disabled={isPending}
              className="rounded-md border border-red-600 bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              Void Claim
            </button>
          </>
        );

      default:
        return null;
    }
  }

  // ─── Context banners ──────────────────────────────────────────────────────

  function renderContextBanner() {
    if (status === 'REJECTED') {
      return (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This claim was rejected by the payer or clearinghouse. Review the rejection reason, correct
          the claim, and resubmit.
        </div>
      );
    }
    if (status === 'DENIED') {
      return (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          This claim was denied by the payer. Manage the denial to file an appeal or write off the
          balance.
        </div>
      );
    }
    return null;
  }

  return (
    <>
      <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <ClaimStatusBadge status={status} />
          <div className="flex items-center gap-2">{renderButtons()}</div>
        </div>
        {renderContextBanner()}
      </div>

      {/* Submit confirm */}
      {openDialog === 'submit' && (
        <ConfirmDialog
          titleId="confirm-submit-title"
          title="Submit this claim?"
          body="Once submitted, you cannot edit the charge lines."
          confirmLabel="Submit Claim"
          confirmClassName="rounded-md bg-blue-600 text-white hover:bg-blue-700"
          onConfirm={() => transition('SUBMITTED')}
          onCancel={() => setOpenDialog(null)}
          isPending={isPending}
        />
      )}

      {/* Void confirm */}
      {openDialog === 'void' && (
        <ConfirmDialog
          titleId="confirm-void-title"
          title="Void this claim?"
          body="The encounter will return to a billable state."
          confirmLabel="Void Claim"
          confirmClassName="rounded-md bg-red-600 text-white hover:bg-red-700"
          onConfirm={() => transition('VOIDED')}
          onCancel={() => setOpenDialog(null)}
          isPending={isPending}
        />
      )}

      {/* Back to Draft confirm */}
      {openDialog === 'backToDraft' && (
        <ConfirmDialog
          titleId="confirm-draft-title"
          title="Move back to Draft?"
          body="The claim will return to Draft status and can be edited before re-scrubbing."
          confirmLabel="Yes, Move to Draft"
          confirmClassName="rounded-md bg-blue-600 text-white hover:bg-blue-700"
          onConfirm={() => transition('DRAFT')}
          onCancel={() => setOpenDialog(null)}
          isPending={isPending}
        />
      )}
    </>
  );
}
