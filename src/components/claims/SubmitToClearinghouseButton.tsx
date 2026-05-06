'use client';

import { useState } from 'react';
import { useSubmitClaim } from '@/hooks/useClearinghouse';

function SpinnerIcon() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

interface Props {
  claimId: string;
  ediFileExists: boolean;
  onSuccess: () => void;
}

export function SubmitToClearinghouseButton({ claimId, ediFileExists, onSuccess }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitMutation = useSubmitClaim();

  async function handleConfirm() {
    setSubmitError(null);
    try {
      await submitMutation.mutateAsync(claimId);
      setShowConfirm(false);
      onSuccess();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Submission failed. Please try again.';
      setSubmitError(msg);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSubmitError(null);
          setShowConfirm(true);
        }}
        disabled={!ediFileExists}
        aria-disabled={!ediFileExists}
        title={!ediFileExists ? 'Generate EDI before submitting.' : undefined}
        className={
          ediFileExists
            ? 'rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
            : 'cursor-not-allowed rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white opacity-40'
        }
      >
        Submit to Clearinghouse
      </button>

      {submitError && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {submitError}
        </p>
      )}

      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-clearinghouse-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        >
          <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-xl">
            <h2
              id="submit-clearinghouse-title"
              className="text-base font-semibold text-zinc-900"
            >
              Submit this claim to the clearinghouse?
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              The EDI 837P file will be transmitted to the clearinghouse. Ensure the EDI
              file is correct before submitting.
            </p>
            {submitError && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {submitError}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={submitMutation.isPending}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitMutation.isPending}
                aria-busy={submitMutation.isPending}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                {submitMutation.isPending ? (
                  <span className="flex items-center gap-1.5">
                    <SpinnerIcon /> Submitting...
                  </span>
                ) : (
                  'Submit Claim'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
