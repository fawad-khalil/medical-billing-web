'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clearinghouseApi } from '@/lib/clearinghouseApi';
import { claimKeys } from '@/hooks/useClaims';
import type {
  CreateClearinghouseConfigDto,
  UpdateClearinghouseConfigDto,
  UpdateAckDto,
} from '@/types/clearinghouse';

// ─── Query key factory ────────────────────────────────────────────────────────

export const clearinghouseKeys = {
  all: ['clearinghouse'] as const,
  configs: () => [...clearinghouseKeys.all, 'configs'] as const,
  configsByPayer: (payerId: string) =>
    [...clearinghouseKeys.configs(), 'payer', payerId] as const,
  transmissions: (claimId: string) =>
    [...clearinghouseKeys.all, 'transmissions', claimId] as const,
};

// ─── Config queries ───────────────────────────────────────────────────────────

export function useClearinghouseConfigs(page = 1, limit = 20) {
  return useQuery({
    queryKey: [...clearinghouseKeys.configs(), page, limit],
    queryFn: () => clearinghouseApi.listConfigs(page, limit),
    staleTime: 60_000,
  });
}

export function useClearinghouseConfigsByPayer(payerId: string | undefined) {
  return useQuery({
    queryKey: clearinghouseKeys.configsByPayer(payerId ?? ''),
    queryFn: () => clearinghouseApi.getConfigsByPayer(payerId!),
    enabled: !!payerId,
    staleTime: 60_000,
  });
}

// ─── Config mutations ─────────────────────────────────────────────────────────

export function useCreateClearinghouseConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateClearinghouseConfigDto) =>
      clearinghouseApi.createConfig(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clearinghouseKeys.configs() });
    },
  });
}

export function useUpdateClearinghouseConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateClearinghouseConfigDto }) =>
      clearinghouseApi.updateConfig(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clearinghouseKeys.configs() });
    },
  });
}

export function useDeleteClearinghouseConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clearinghouseApi.deleteConfig(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clearinghouseKeys.configs() });
    },
  });
}

// ─── Submission mutations ─────────────────────────────────────────────────────

export function useSubmitClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (claimId: string) => clearinghouseApi.submitClaim(claimId),
    onSuccess: (_data, claimId) => {
      qc.invalidateQueries({ queryKey: clearinghouseKeys.transmissions(claimId) });
      qc.invalidateQueries({ queryKey: claimKeys.detail(claimId) });
      qc.invalidateQueries({ queryKey: claimKeys.lists() });
    },
  });
}

// ─── Transmission queries ─────────────────────────────────────────────────────

export function useTransmissions(claimId: string) {
  return useQuery({
    queryKey: clearinghouseKeys.transmissions(claimId),
    queryFn: () => clearinghouseApi.getTransmissions(claimId),
    enabled: !!claimId,
    staleTime: 30_000,
  });
}

// ─── ACK mutation ─────────────────────────────────────────────────────────────

export function useUpdateAck(claimId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAckDto }) =>
      clearinghouseApi.updateAck(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clearinghouseKeys.transmissions(claimId) });
      qc.invalidateQueries({ queryKey: claimKeys.detail(claimId) });
    },
  });
}
