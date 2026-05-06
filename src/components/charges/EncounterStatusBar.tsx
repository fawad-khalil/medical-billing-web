'use client';

import { useState } from 'react';
import Link from 'next/link';
import { EncounterStatusBadge } from './EncounterStatusBadge';
import { useTransitionStatus } from '@/hooks/useEncounters';
import type { EncounterStatus } from '@/types/encounter';

interface EncounterStatusBarProps {
  status: EncounterStatus;
  encounterId: string;
  hasLines: boolean;
  onStatusChange?: () => void;
}

function SpinnerIcon() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function EncounterStatusBar({
  status,
  encounterId,
  hasLines,
  onStatusChange,
}: EncounterStatusBarProps) {
  const [confirmReopen, setConfirmReopen] = useState(false);
  const transition = useTransitionStatus(encounterId);

  async function handleMarkReady() {
    await transition.mutateAsync('READY');
    onStatusChange?.();
  }

  async function handleReopen() {
    await transition.mutateAsync('DRAFT');
    setConfirmReopen(false);
    onStatusChange?.();
  }

  const isLoading = transition.isPending;

  if (status === 'BILLED') {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <EncounterStatusBadge status="BILLED" />
          <p className="text-sm text-amber-800">
            This encounter is locked — a claim has been submitted. To make corrections, void the
            claim first.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'READY') {
    return (
      <>
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3">
          <EncounterStatusBadge status="READY" />
          <div className="flex items-center gap-2">
            {/* Reopen */}
            <button
              type="button"
              onClick={() => setConfirmReopen(true)}
              disabled={isLoading}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <SpinnerIcon /> Saving...
                </span>
              ) : (
                'Reopen as Draft'
              )}
            </button>
            {/* Generate Claim — Phase 2 stub */}
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Claim generation will be available in Phase 2."
              className="cursor-not-allowed rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white opacity-50"
            >
              Generate Claim
            </button>
          </div>
        </div>

        {/* Reopen confirm dialog */}
        {confirmReopen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reopen-dialog-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          >
            <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-xl">
              <h2
                id="reopen-dialog-title"
                className="text-base font-semibold text-zinc-900"
              >
                Reopen this encounter?
              </h2>
              <p className="mt-2 text-sm text-zinc-600">
                The status will change from Ready to Draft.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmReopen(false)}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReopen}
                  disabled={isLoading}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-1.5">
                      <SpinnerIcon /> Saving...
                    </span>
                  ) : (
                    'Reopen'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // DRAFT
  const canMarkReady = hasLines;

  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3">
      <EncounterStatusBadge status="DRAFT" />
      <div className="flex items-center gap-2">
        <Link
          href={`/charges/${encounterId}/edit`}
          className="rounded-md border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={handleMarkReady}
          disabled={!canMarkReady || isLoading}
          aria-disabled={!canMarkReady}
          title={
            !canMarkReady
              ? 'Add at least one charge line and one diagnosis code first'
              : undefined
          }
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <SpinnerIcon /> Saving...
            </span>
          ) : (
            'Mark Ready'
          )}
        </button>
      </div>
    </div>
  );
}
