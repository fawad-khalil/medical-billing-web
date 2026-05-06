'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentPostingApi } from '@/lib/paymentPostingApi';
import type {
  BatchFilters,
  CreateBatchInput,
  UpdateBatchInput,
  CreateLineInput,
  UpdateLineInput,
  VoidBatchInput,
} from '@/types/payment-posting';

// ─── Query key factory ────────────────────────────────────────────────────────

export const batchKeys = {
  all: ['payment-batches'] as const,
  lists: () => [...batchKeys.all, 'list'] as const,
  list: (filters: BatchFilters) => [...batchKeys.lists(), filters] as const,
  details: () => [...batchKeys.all, 'detail'] as const,
  detail: (id: string) => [...batchKeys.details(), id] as const,
  balance: (id: string) => [...batchKeys.all, 'balance', id] as const,
  claimBalance: (claimId: string) => [...batchKeys.all, 'claim-balance', claimId] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function usePaymentBatches(filters: BatchFilters = {}) {
  return useQuery({
    queryKey: batchKeys.list(filters),
    queryFn: () => paymentPostingApi.listBatches(filters),
  });
}

export function usePaymentBatch(id: string) {
  return useQuery({
    queryKey: batchKeys.detail(id),
    queryFn: () => paymentPostingApi.getBatch(id),
    enabled: !!id,
  });
}

export function useBatchBalance(id: string, enabled = false) {
  return useQuery({
    queryKey: batchKeys.balance(id),
    queryFn: () => paymentPostingApi.getBalanceCheck(id),
    enabled: !!id && enabled,
  });
}

export function useClaimBalance(claimId: string) {
  return useQuery({
    queryKey: batchKeys.claimBalance(claimId),
    queryFn: () => paymentPostingApi.getClaimBalance(claimId),
    enabled: !!claimId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBatchInput) => paymentPostingApi.createBatch(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: batchKeys.lists() });
    },
  });
}

export function useUpdateBatch(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateBatchInput) => paymentPostingApi.updateBatch(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: batchKeys.detail(id) });
      qc.invalidateQueries({ queryKey: batchKeys.lists() });
    },
  });
}

export function useAddLine(batchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLineInput) => paymentPostingApi.addLine(batchId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: batchKeys.detail(batchId) });
    },
  });
}

export function useUpdateLine(batchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lineId, data }: { lineId: string; data: UpdateLineInput }) =>
      paymentPostingApi.updateLine(batchId, lineId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: batchKeys.detail(batchId) });
    },
  });
}

export function useRemoveLine(batchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lineId: string) => paymentPostingApi.removeLine(batchId, lineId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: batchKeys.detail(batchId) });
    },
  });
}

export function usePostBatch(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => paymentPostingApi.postBatch(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: batchKeys.detail(id) });
      qc.invalidateQueries({ queryKey: batchKeys.lists() });
    },
  });
}

export function useVoidBatch(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: VoidBatchInput) => paymentPostingApi.voidBatch(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: batchKeys.detail(id) });
      qc.invalidateQueries({ queryKey: batchKeys.lists() });
    },
  });
}
