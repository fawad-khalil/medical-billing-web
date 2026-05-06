'use client';

import { useRef, useState } from 'react';
import { useParseSuperbill } from '@/hooks/useEncounters';
import type { ParsedSuperbill } from '@/types/encounter';

type DropzoneState = 'idle' | 'drag-over' | 'selected' | 'parsing' | 'error';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

interface SuperbillDropzoneProps {
  onParsed: (result: ParsedSuperbill) => void;
  onError: (msg: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

export function SuperbillDropzone({ onParsed, onError }: SuperbillDropzoneProps) {
  const [dropState, setDropState] = useState<DropzoneState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const parseBtn = useRef<HTMLButtonElement>(null);

  const parseMutation = useParseSuperbill();

  function validateAndSetFile(f: File): string | null {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return 'Unsupported file type. Upload a PDF, JPEG, PNG, or WebP.';
    }
    if (f.size > MAX_BYTES) {
      return 'File is too large. Maximum size is 10 MB.';
    }
    return null;
  }

  function handleFileChange(f: File) {
    const err = validateAndSetFile(f);
    if (err) {
      setParseError(err);
      setDropState('error');
      onError(err);
      return;
    }
    setFile(f);
    setParseError(null);
    setDropState('selected');
    // Move focus to Parse button after a tick (allows state to flush)
    setTimeout(() => parseBtn.current?.focus(), 0);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFileChange(f);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (dropState !== 'parsing') setDropState('drag-over');
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only reset if leaving the zone entirely (not a child element)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropState(file ? 'selected' : 'idle');
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (dropState === 'parsing') return;
    const f = e.dataTransfer.files[0];
    if (f) handleFileChange(f);
  }

  function handleZoneKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  }

  function handleRemove() {
    setFile(null);
    setDropState('idle');
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleParse() {
    if (!file) return;
    setDropState('parsing');
    setParseError(null);
    try {
      const result = await parseMutation.mutateAsync(file);
      onParsed(result);
      // Stay visible so user can re-upload if needed; return to selected state
      setDropState('selected');
    } catch {
      const msg = 'Could not parse this superbill. Please enter manually or try again.';
      setParseError(msg);
      setDropState('error');
      onError(msg);
    }
  }

  // ─── Zone appearance ────────────────────────────────────────────────────────

  const zoneBase =
    'relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors duration-150 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';

  const zoneColor =
    dropState === 'drag-over'
      ? 'border-blue-400 bg-blue-50'
      : dropState === 'error'
      ? 'border-red-400 bg-red-50'
      : 'border-zinc-300 bg-zinc-50 hover:border-zinc-400';

  return (
    <div>
      {/* Hidden real file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleInputChange}
      />

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload superbill — drop here or click to browse"
        aria-busy={dropState === 'parsing'}
        className={`${zoneBase} ${zoneColor}`}
        onClick={() => dropState !== 'parsing' && fileInputRef.current?.click()}
        onKeyDown={handleZoneKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {dropState === 'idle' && (
          <>
            <UploadIcon className="h-8 w-8 text-zinc-400" />
            <div>
              <p className="text-sm font-medium text-zinc-700">
                Drop superbill here, or click to browse
              </p>
              <p className="mt-1 text-xs text-zinc-500">PDF, JPG, PNG, WebP · max 10 MB</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Browse file
            </button>
          </>
        )}

        {dropState === 'drag-over' && (
          <>
            <UploadIcon className="h-8 w-8 text-blue-500" />
            <p className="text-sm font-medium text-blue-700">Drop to upload</p>
          </>
        )}

        {dropState === 'selected' && file && (
          <>
            <FileIcon className="h-8 w-8 text-zinc-600" />
            <div>
              <p className="text-sm font-medium text-zinc-900">{file.name}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{formatBytes(file.size)}</p>
            </div>
            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleRemove}
                className="text-sm text-zinc-500 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                × Remove
              </button>
              <button
                ref={parseBtn}
                type="button"
                onClick={handleParse}
                className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Parse Superbill
              </button>
            </div>
          </>
        )}

        {dropState === 'parsing' && (
          <>
            <SpinnerIcon className="h-8 w-8 animate-spin text-blue-600" />
            <div>
              <p className="text-sm font-medium text-zinc-700">Parsing superbill...</p>
              <p className="mt-1 text-xs text-zinc-500">This usually takes 3–8 seconds</p>
            </div>
            <div aria-live="assertive" className="sr-only">
              Parsing superbill
            </div>
          </>
        )}

        {dropState === 'error' && (
          <>
            <div
              role="alert"
              className="w-full rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-medium text-amber-800">
                Could not parse this file. Please enter manually or try again.
              </p>
              {parseError && (
                <p className="mt-1 text-xs text-amber-700">{parseError}</p>
              )}
              <button
                type="button"
                onClick={handleRemove}
                className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Try again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
