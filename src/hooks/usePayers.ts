'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { payersApi } from '@/lib/api';
import type { CreatePayerInput, UpdatePayerInput, PayerSearchParams } from '@/types/payer';

export const payerKeys = {
  all: ['payers'] as const,
  lists: () => [...payerKeys.all, 'list'] as const,
  list: (params: object) => [...payerKeys.lists(), params] as const,
  search: (params: object) => [...payerKeys.all, 'search', params] as const,
  summaries: () => [...payerKeys.all, 'summary'] as const,
  details: () => [...payerKeys.all, 'detail'] as const,
  detail: (id: string) => [...payerKeys.details(), id] as const,
};

export function usePayers(params: PayerSearchParams) {
  return useQuery({
    queryKey: payerKeys.list(params),
    queryFn: () => payersApi.list(params),
  });
}

export function usePayerSearch(query: string, ediPayerId?: string, debounceMs = 300) {
  const isEdi = /^\d+$/.test(query.trim()) && query.trim().length >= 2;
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isEdi) {
      setDebouncedQuery(query);
      return;
    }
    const t = setTimeout(() => setDebouncedQuery(query), debounceMs);
    return () => clearTimeout(t);
  }, [query, isEdi, debounceMs]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const searchEdi = ediPayerId ?? (isEdi ? debouncedQuery.trim() : undefined);
  const searchQ = !isEdi && debouncedQuery.trim().length >= 2 ? debouncedQuery.trim() : undefined;
  const enabled = !!(searchEdi || searchQ);
  const params = { q: searchQ, ediPayerId: searchEdi };

  return useQuery({
    queryKey: payerKeys.search(params),
    queryFn: () => payersApi.search(params),
    enabled,
  });
}

export function usePayer(id: string) {
  return useQuery({
    queryKey: payerKeys.detail(id),
    queryFn: () => payersApi.get(id),
    enabled: !!id,
  });
}

export function usePayerSummaries() {
  return useQuery({
    queryKey: payerKeys.summaries(),
    queryFn: () => payersApi.getSummaries(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePayerInput) => payersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: payerKeys.lists() });
      qc.invalidateQueries({ queryKey: payerKeys.summaries() });
    },
  });
}

export function useUpdatePayer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePayerInput) => payersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: payerKeys.detail(id) });
      qc.invalidateQueries({ queryKey: payerKeys.lists() });
      qc.invalidateQueries({ queryKey: payerKeys.summaries() });
    },
  });
}

export function useDeactivatePayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => payersApi.deactivate(id),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: payerKeys.detail(id) });
      qc.invalidateQueries({ queryKey: payerKeys.lists() });
      qc.invalidateQueries({ queryKey: payerKeys.summaries() });
    },
  });
}
