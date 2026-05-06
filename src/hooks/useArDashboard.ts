'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { arApi } from '@/lib/arApi';
import type {
  ArFilters,
  ArAgingFilters,
  WorklistFilters,
  ArByPayerFilters,
} from '@/types/ar-dashboard';

const STALE = 5 * 60 * 1000; // 5 minutes
const REFRESH_INTERVAL = 5 * 60 * 1000;

export const arKeys = {
  all: ['ar'] as const,
  summary: (f: ArFilters) => ['ar', 'summary', f] as const,
  aging: (f: ArAgingFilters) => ['ar', 'aging', f] as const,
  worklist: (f: WorklistFilters) => ['ar', 'worklist', f] as const,
  byPayer: (f: ArByPayerFilters) => ['ar', 'by-payer', f] as const,
};

export function useArSummary(filters: ArFilters = {}) {
  return useQuery({
    queryKey: arKeys.summary(filters),
    queryFn: () => arApi.getSummary(filters),
    staleTime: STALE,
  });
}

export function useArAging(opts: ArAgingFilters = {}) {
  return useQuery({
    queryKey: arKeys.aging(opts),
    queryFn: () => arApi.getAging(opts),
    staleTime: STALE,
  });
}

export function useArWorklist(opts: WorklistFilters = {}) {
  return useQuery({
    queryKey: arKeys.worklist(opts),
    queryFn: () => arApi.getWorklist(opts),
    staleTime: STALE,
  });
}

export function useArByPayer(opts: ArByPayerFilters = {}) {
  return useQuery({
    queryKey: arKeys.byPayer(opts),
    queryFn: () => arApi.getByPayer(opts),
    staleTime: STALE,
  });
}

export function useArAutoRefresh() {
  const qc = useQueryClient();
  useEffect(() => {
    const id = setInterval(() => {
      qc.invalidateQueries({ queryKey: arKeys.all });
    }, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [qc]);
}
