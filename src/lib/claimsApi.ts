import api from '@/lib/api';
import type {
  PaginatedClaims,
  Claim,
  ClaimLine,
  ClaimStatusHistory,
  ReadyEncounter,
  ClaimFilters,
  CreateClaimInput,
  UpdateClaimInput,
  UpdateClaimStatusInput,
} from '@/types/claim';

const BASE = '/api/v1';

export const claimsApi = {
  // ─── List ──────────────────────────────────────────────────────────────────

  list: (params: ClaimFilters) =>
    api.get<PaginatedClaims>(`${BASE}/claims`, { params }).then((r) => r.data),

  // ─── Ready encounters (for new claim picker) ───────────────────────────────

  readyEncounters: () =>
    api.get<ReadyEncounter[]>(`${BASE}/claims/ready-encounters`).then((r) => r.data),

  // ─── Single claim ──────────────────────────────────────────────────────────

  get: (id: string) =>
    api.get<Claim>(`${BASE}/claims/${id}`).then((r) => r.data),

  // ─── Claim lines ───────────────────────────────────────────────────────────

  getLines: (id: string) =>
    api.get<ClaimLine[]>(`${BASE}/claims/${id}/lines`).then((r) => r.data),

  // ─── Status history ────────────────────────────────────────────────────────

  getHistory: (id: string) =>
    api.get<ClaimStatusHistory[]>(`${BASE}/claims/${id}/history`).then((r) => r.data),

  // ─── Mutations ─────────────────────────────────────────────────────────────

  create: (data: CreateClaimInput) =>
    api.post<Claim>(`${BASE}/claims`, data).then((r) => r.data),

  update: (id: string, data: UpdateClaimInput) =>
    api.patch<Claim>(`${BASE}/claims/${id}`, data).then((r) => r.data),

  updateStatus: (id: string, data: UpdateClaimStatusInput) =>
    api.patch<Claim>(`${BASE}/claims/${id}/status`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`${BASE}/claims/${id}`),
};
