'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { claimsApi } from '@/lib/claimsApi';
import type {
  ClaimFilters,
  CreateClaimInput,
  UpdateClaimInput,
  UpdateClaimStatusInput,
} from '@/types/claim';

// ─── Query key factory ────────────────────────────────────────────────────────

export const claimKeys = {
  all: ['claims'] as const,
  lists: () => [...claimKeys.all, 'list'] as const,
  list: (filters: ClaimFilters) => [...claimKeys.lists(), filters] as const,
  details: () => [...claimKeys.all, 'detail'] as const,
  detail: (id: string) => [...claimKeys.details(), id] as const,
  history: (id: string) => [...claimKeys.all, 'history', id] as const,
  readyEncounters: () => [...claimKeys.all, 'ready-encounters'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useClaimsList(filters: ClaimFilters = {}) {
  return useQuery({
    queryKey: claimKeys.list(filters),
    queryFn: () => claimsApi.list(filters),
  });
}

export function useClaim(id: string) {
  return useQuery({
    queryKey: claimKeys.detail(id),
    queryFn: () => claimsApi.get(id),
    enabled: !!id,
  });
}

export function useClaimHistory(id: string) {
  return useQuery({
    queryKey: claimKeys.history(id),
    queryFn: () => claimsApi.getHistory(id),
    enabled: !!id,
  });
}

export function useReadyEncounters() {
  return useQuery({
    queryKey: claimKeys.readyEncounters(),
    queryFn: () => claimsApi.readyEncounters(),
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClaimInput) => claimsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: claimKeys.lists() });
      // Invalidate ready-encounters so the new page reflects the changed status
      qc.invalidateQueries({ queryKey: claimKeys.readyEncounters() });
    },
  });
}

export function useUpdateClaim(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateClaimInput) => claimsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: claimKeys.detail(id) });
      qc.invalidateQueries({ queryKey: claimKeys.lists() });
    },
  });
}

export function useUpdateClaimStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateClaimStatusInput) => claimsApi.updateStatus(id, data),
    // Optimistic update: immediately reflect new status in the cached detail
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: claimKeys.detail(id) });
      const previous = qc.getQueryData(claimKeys.detail(id));
      qc.setQueryData(claimKeys.detail(id), (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        return { ...(old as object), status: data.status };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Roll back on error
      if (context?.previous) {
        qc.setQueryData(claimKeys.detail(id), context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: claimKeys.detail(id) });
      qc.invalidateQueries({ queryKey: claimKeys.lists() });
      qc.invalidateQueries({ queryKey: claimKeys.history(id) });
    },
  });
}
