'use client';

import { useState, useId } from 'react';
import { useEdiFile } from '@/hooks/useEdi';

// ─── Spinner ──────────────────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface EdiPreviewPanelProps {
  claimId: string;
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function EdiPreviewPanel({ claimId }: EdiPreviewPanelProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const contentId = useId();
  const panelId = `edi-panel-${contentId}`;

  // Lazy fetch — only fires when panel is open
  const { data: ediFile, isLoading, isError } = useEdiFile(claimId, open);

  async function handleCopy() {
    if (!ediFile?.content) return;
    try {
      await navigator.clipboard.writeText(ediFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. non-secure context) — fail silently
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      {/* Toggle header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-700">EDI 837P Preview</h2>
        <button
          type="button"
          onClick={() => setOpen((x) => !x)}
          aria-expanded={open}
          aria-controls={panelId}
          className="text-sm text-blue-600 underline hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {open ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Collapsible body */}
      {open && (
        <div id={panelId}>
          {isLoading && (
            <div className="flex items-center justify-center gap-2 border-t border-zinc-100 px-4 py-6 text-sm text-zinc-500">
              <SpinnerIcon />
              <span>Loading EDI file…</span>
            </div>
          )}

          {isError && (
            <div className="border-t border-zinc-100 px-4 py-4">
              <p className="text-sm text-red-600" role="alert">
                Failed to load the EDI file. Please try again.
              </p>
            </div>
          )}

          {!isLoading && !isError && ediFile === null && (
            <div className="border-t border-zinc-100 px-4 py-4">
              <p className="text-sm text-zinc-500">
                No EDI file has been generated for this claim yet.
              </p>
            </div>
          )}

          {!isLoading && !isError && ediFile !== null && ediFile !== undefined && (
            <>
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 px-4 py-2.5">
                <span className="text-xs text-zinc-500">
                  ISA Control:{' '}
                  <span className="font-mono font-medium text-zinc-800">
                    {ediFile.controlNumber}
                  </span>
                </span>

                <span className="text-xs text-zinc-400">
                  {ediFile.segmentCount} segments
                </span>

                {ediFile.isTest && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    TEST MODE
                  </span>
                )}

                <div className="ml-auto">
                  <button
                    type="button"
                    onClick={handleCopy}
                    aria-label={copied ? 'EDI content copied to clipboard' : 'Copy EDI content to clipboard'}
                    className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    {copied ? 'Copied' : 'Copy EDI'}
                  </button>
                </div>
              </div>

              {/* EDI content */}
              <div className="border-t border-zinc-100 px-4 pb-4">
                <pre
                  tabIndex={0}
                  aria-label="EDI 837P file content"
                  className="max-h-96 overflow-y-auto whitespace-pre-wrap break-all rounded-md bg-zinc-50 p-3 text-xs font-mono text-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  {ediFile.content}
                </pre>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
