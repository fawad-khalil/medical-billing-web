'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { providersApi } from '@/lib/api';
import type {
  CreateProviderInput,
  UpdateProviderInput,
  ProviderType,
} from '@/types/provider';

// ─── Query keys ──────────────────────────────────────────────────────────────

export const providerKeys = {
  all: ['providers'] as const,
  lists: () => [...providerKeys.all, 'list'] as const,
  list: (params: object) => [...providerKeys.lists(), params] as const,
  search: (params: object) => [...providerKeys.all, 'search', params] as const,
  details: () => [...providerKeys.all, 'detail'] as const,
  detail: (id: string) => [...providerKeys.details(), id] as const,
  summary: (id: string) => [...providerKeys.detail(id), 'summary'] as const,
};

// ─── Provider list ────────────────────────────────────────────────────────────

export function useProviders(params: {
  page?: number;
  limit?: number;
  q?: string;
  npi?: string;
  type?: ProviderType;
  isActive?: boolean;
}) {
  const { page = 1, limit = 25, isActive = true, ...rest } = params;
  const queryParams = { page, limit, isActive, ...rest };

  return useQuery({
    queryKey: providerKeys.list(queryParams),
    queryFn: () => providersApi.list(queryParams),
  });
}

// ─── Search (debounced name, immediate NPI) ───────────────────────────────────

export function useProviderSearch(
  query: string,
  type?: ProviderType,
  debounceMs = 300,
) {
  const isNpi = /^\d+$/.test(query.trim()) && query.trim().length === 10;
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const delay = isNpi ? 0 : debounceMs;
    const t = setTimeout(() => setDebouncedQuery(query), delay);
    return () => clearTimeout(t);
  }, [query, isNpi, debounceMs]);

  const enabled = isNpi
    ? debouncedQuery.trim().length === 10
    : debouncedQuery.trim().length >= 2;

  const params = isNpi
    ? { npi: debouncedQuery.trim(), ...(type ? { type } : {}) }
    : { q: debouncedQuery.trim(), ...(type ? { type } : {}) };

  return useQuery({
    queryKey: providerKeys.search(params),
    queryFn: () => providersApi.search(params),
    enabled,
  });
}

// ─── Single provider ──────────────────────────────────────────────────────────

export function useProvider(id: string) {
  return useQuery({
    queryKey: providerKeys.detail(id),
    queryFn: () => providersApi.get(id),
    enabled: !!id,
  });
}

// ─── Summary (for charge entry dropdown) ─────────────────────────────────────

export function useProviderSummary(id: string) {
  return useQuery({
    queryKey: providerKeys.summary(id),
    queryFn: () => providersApi.getSummary(id),
    enabled: !!id,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProviderInput) => providersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: providerKeys.lists() });
    },
  });
}

export function useUpdateProvider(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProviderInput) => providersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: providerKeys.detail(id) });
      qc.invalidateQueries({ queryKey: providerKeys.lists() });
    },
  });
}

export function useDeactivateProvider(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => providersApi.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: providerKeys.detail(id) });
      qc.invalidateQueries({ queryKey: providerKeys.lists() });
    },
  });
}
