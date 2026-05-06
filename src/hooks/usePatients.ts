'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { patientsApi } from '@/lib/api';
import type { CreatePatientInput, UpdatePatientInput, CreateInsuranceInput, UpdateInsuranceInput } from '@/types/patient';

// ─── Query keys ──────────────────────────────────────────────────────────────

export const patientKeys = {
  all: ['patients'] as const,
  lists: () => [...patientKeys.all, 'list'] as const,
  list: (page: number, limit: number) => [...patientKeys.lists(), { page, limit }] as const,
  search: (query: object) => [...patientKeys.all, 'search', query] as const,
  details: () => [...patientKeys.all, 'detail'] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
  insurance: (patientId: string) => [...patientKeys.detail(patientId), 'insurance'] as const,
};

// ─── Patient list ─────────────────────────────────────────────────────────────

export function usePatients(page = 1, limit = 25) {
  return useQuery({
    queryKey: patientKeys.list(page, limit),
    queryFn: () => patientsApi.list(page, limit),
  });
}

// ─── Debounced search ─────────────────────────────────────────────────────────

export function usePatientSearch(rawQuery: string, debounceMs = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState(rawQuery);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(rawQuery), debounceMs);
    return () => clearTimeout(t);
  }, [rawQuery, debounceMs]);

  // Detect search type
  const params = buildSearchParams(debouncedQuery);
  const enabled = debouncedQuery.trim().length >= 2;

  return useQuery({
    queryKey: patientKeys.search(params),
    queryFn: () => patientsApi.search(params),
    enabled,
  });
}

function buildSearchParams(query: string): { q?: string; dob?: string; memberId?: string } {
  const trimmed = query.trim();
  if (!trimmed) return {};
  // Date pattern: MM/DD/YYYY → convert to YYYY-MM-DD for API
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [m, d, y] = trimmed.split('/');
    return { dob: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` };
  }
  // Alphanumeric no spaces → likely member ID
  if (/^[A-Za-z0-9]+$/.test(trimmed) && trimmed.length >= 4) {
    return { memberId: trimmed };
  }
  return { q: trimmed };
}

// ─── Single patient ───────────────────────────────────────────────────────────

export function usePatient(id: string) {
  return useQuery({
    queryKey: patientKeys.detail(id),
    queryFn: () => patientsApi.get(id),
    enabled: !!id,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePatientInput) => patientsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: patientKeys.lists() });
    },
  });
}

export function useUpdatePatient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePatientInput) => patientsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: patientKeys.detail(id) });
      qc.invalidateQueries({ queryKey: patientKeys.lists() });
    },
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patientsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: patientKeys.lists() });
    },
  });
}

// ─── Insurance ────────────────────────────────────────────────────────────────

export function usePatientInsurance(patientId: string) {
  return useQuery({
    queryKey: patientKeys.insurance(patientId),
    queryFn: () => patientsApi.listInsurance(patientId),
    enabled: !!patientId,
  });
}

export function useCreateInsurance(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInsuranceInput) => patientsApi.createInsurance(patientId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: patientKeys.insurance(patientId) });
    },
  });
}

export function useUpdateInsurance(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ insId, data }: { insId: string; data: UpdateInsuranceInput }) =>
      patientsApi.updateInsurance(patientId, insId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: patientKeys.insurance(patientId) });
    },
  });
}

export function useDeleteInsurance(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (insId: string) => patientsApi.deleteInsurance(patientId, insId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: patientKeys.insurance(patientId) });
    },
  });
}
