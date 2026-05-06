'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ediApi } from '@/lib/ediApi';
import { claimKeys } from '@/hooks/useClaims';
import type { ScrubResult, EdiGenerationResult, EdiFileWithContent, EdiFileMeta } from '@/types/edi';

// ─── Query key factory ────────────────────────────────────────────────────────

export const ediKeys = {
  all: ['edi'] as const,
  file: (claimId: string) => [...ediKeys.all, 'file', claimId] as const,
  files: (claimId: string) => [...ediKeys.all, 'files', claimId] as const,
};

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Scrubs a claim via POST /edi/claims/:id/scrub.
 * Invalidates the claim detail so scrubErrors on the Claim object refreshes.
 * HTTP 200 for both pass and fail — always resolves (never throws on scrub failure).
 */
export function useScrubClaim() {
  const qc = useQueryClient();
  return useMutation<ScrubResult, Error, string>({
    mutationFn: (claimId: string) => ediApi.scrubClaim(claimId),
    onSuccess: (_data, claimId) => {
      // Refresh the claim detail so scrubErrors propagates from the server
      qc.invalidateQueries({ queryKey: claimKeys.detail(claimId) });
      qc.invalidateQueries({ queryKey: claimKeys.lists() });
    },
  });
}

/**
 * Generates an EDI 837P file via POST /edi/claims/:id/generate.
 * Invalidates the EDI file queries so EdiPreviewPanel auto-refreshes.
 */
export function useGenerateEdi() {
  const qc = useQueryClient();
  return useMutation<EdiGenerationResult, Error, { claimId: string; isTest?: boolean }>({
    mutationFn: ({ claimId, isTest }) => ediApi.generateEdi(claimId, isTest),
    onSuccess: (_data, { claimId }) => {
      qc.invalidateQueries({ queryKey: ediKeys.file(claimId) });
      qc.invalidateQueries({ queryKey: ediKeys.files(claimId) });
      // Refresh the claim detail — generation may change claim status
      qc.invalidateQueries({ queryKey: claimKeys.detail(claimId) });
    },
  });
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetches the latest EDI file (with content) for a claim.
 * Only fires when `enabled` is true — used for lazy panel loading.
 * Returns null when the API returns 404 (no file generated yet).
 */
export function useEdiFile(claimId: string, enabled: boolean) {
  return useQuery<EdiFileWithContent | null, Error>({
    queryKey: ediKeys.file(claimId),
    queryFn: async () => {
      try {
        return await ediApi.getEdiFile(claimId);
      } catch (err: unknown) {
        // axios wraps HTTP errors; treat 404 as "no file yet" — return null
        if (
          err &&
          typeof err === 'object' &&
          'response' in err &&
          (err as { response?: { status?: number } }).response?.status === 404
        ) {
          return null;
        }
        throw err;
      }
    },
    enabled: enabled && !!claimId,
    staleTime: 30_000,
  });
}

/**
 * Fetches all EDI file metadata for a claim (no content).
 * Used to determine whether any file has been generated.
 */
export function useEdiFiles(claimId: string) {
  return useQuery<EdiFileMeta[], Error>({
    queryKey: ediKeys.files(claimId),
    queryFn: () => ediApi.listEdiFiles(claimId),
    enabled: !!claimId,
    staleTime: 30_000,
  });
}
