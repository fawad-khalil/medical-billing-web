import api from './api';
import type {
  PaginatedBatches,
  PaymentBatch,
  PaymentLine,
  BalanceCheck,
  ClaimBalance,
  BatchFilters,
  CreateBatchInput,
  UpdateBatchInput,
  CreateLineInput,
  UpdateLineInput,
  VoidBatchInput,
} from '@/types/payment-posting';

const BASE = '/api/v1/payment-posting';

export const paymentPostingApi = {
  // ─── Batches ──────────────────────────────────────────────────────────────

  listBatches: (params: BatchFilters) =>
    api.get<PaginatedBatches>(`${BASE}/batches`, { params }).then((r) => r.data),

  getBatch: (id: string) =>
    api.get<PaymentBatch>(`${BASE}/batches/${id}`).then((r) => r.data),

  createBatch: (data: CreateBatchInput) =>
    api.post<PaymentBatch>(`${BASE}/batches`, data).then((r) => r.data),

  updateBatch: (id: string, data: UpdateBatchInput) =>
    api.patch<PaymentBatch>(`${BASE}/batches/${id}`, data).then((r) => r.data),

  deleteBatch: (id: string) =>
    api.delete(`${BASE}/batches/${id}`),

  // ─── Lines ────────────────────────────────────────────────────────────────

  getLines: (batchId: string) =>
    api.get<PaymentLine[]>(`${BASE}/batches/${batchId}/lines`).then((r) => r.data),

  addLine: (batchId: string, data: CreateLineInput) =>
    api.post<PaymentLine>(`${BASE}/batches/${batchId}/lines`, data).then((r) => r.data),

  updateLine: (batchId: string, lineId: string, data: UpdateLineInput) =>
    api.patch<PaymentLine>(`${BASE}/batches/${batchId}/lines/${lineId}`, data).then((r) => r.data),

  removeLine: (batchId: string, lineId: string) =>
    api.delete(`${BASE}/batches/${batchId}/lines/${lineId}`),

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  postBatch: (id: string) =>
    api.post<PaymentBatch>(`${BASE}/batches/${id}/post`).then((r) => r.data),

  voidBatch: (id: string, data: VoidBatchInput) =>
    api.post<PaymentBatch>(`${BASE}/batches/${id}/void`, data).then((r) => r.data),

  getBalanceCheck: (id: string) =>
    api.get<BalanceCheck>(`${BASE}/batches/${id}/balance-check`).then((r) => r.data),

  // ─── Claim balance ────────────────────────────────────────────────────────

  getClaimBalance: (claimId: string) =>
    api.get<ClaimBalance>(`${BASE}/claims/${claimId}/balance`).then((r) => r.data),
};
