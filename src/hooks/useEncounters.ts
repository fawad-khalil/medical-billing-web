'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { encountersApi } from '@/lib/api';
import type {
  EncounterFilters,
  CreateEncounterInput,
  CreateChargeLineInput,
  EncounterStatus,
} from '@/types/encounter';

// ─── Query key factory ────────────────────────────────────────────────────────

export const encounterKeys = {
  all: ['encounters'] as const,
  lists: () => [...encounterKeys.all, 'list'] as const,
  list: (filters: EncounterFilters) => [...encounterKeys.lists(), filters] as const,
  details: () => [...encounterKeys.all, 'detail'] as const,
  detail: (id: string) => [...encounterKeys.details(), id] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useEncounters(filters: EncounterFilters = {}) {
  return useQuery({
    queryKey: encounterKeys.list(filters),
    queryFn: () => encountersApi.list(filters),
  });
}

export function useEncounter(id: string) {
  return useQuery({
    queryKey: encounterKeys.detail(id),
    queryFn: () => encountersApi.get(id),
    enabled: !!id,
  });
}

// ─── Encounter mutations ──────────────────────────────────────────────────────

export function useCreateEncounter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEncounterInput) => encountersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: encounterKeys.lists() });
    },
  });
}

export function useUpdateEncounter(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateEncounterInput>) => encountersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: encounterKeys.detail(id) });
      qc.invalidateQueries({ queryKey: encounterKeys.lists() });
    },
  });
}

export function useDeleteEncounter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => encountersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: encounterKeys.lists() });
    },
  });
}

export function useTransitionStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: Extract<EncounterStatus, 'READY' | 'DRAFT'>) =>
      encountersApi.transitionStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: encounterKeys.detail(id) });
      qc.invalidateQueries({ queryKey: encounterKeys.lists() });
    },
  });
}

// ─── Parse superbill (stateless — no cache invalidation) ─────────────────────

export function useParseSuperbill() {
  return useMutation({
    mutationFn: (file: File) => encountersApi.parseSuperbill(file),
  });
}

// ─── Charge line mutations ────────────────────────────────────────────────────

export function useAddChargeLine(encounterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateChargeLineInput) =>
      encountersApi.addLine(encounterId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: encounterKeys.detail(encounterId) });
    },
  });
}

export function useUpdateChargeLine(encounterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lineId, data }: { lineId: string; data: Partial<CreateChargeLineInput> }) =>
      encountersApi.updateLine(encounterId, lineId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: encounterKeys.detail(encounterId) });
    },
  });
}

export function useDeleteChargeLine(encounterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lineId: string) => encountersApi.deleteLine(encounterId, lineId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: encounterKeys.detail(encounterId) });
    },
  });
}
