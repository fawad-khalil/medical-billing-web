import api from '@/lib/api';
import type {
  ClearinghouseConfigListResponse,
  ClearinghouseConfigResponse,
  TransmissionResponse,
  CreateClearinghouseConfigDto,
  UpdateClearinghouseConfigDto,
  UpdateAckDto,
} from '@/types/clearinghouse';

const BASE = '/api/v1';

export const clearinghouseApi = {
  // ─── Configs ─────────────────────────────────────────────────────────────

  listConfigs: (page = 1, limit = 20) =>
    api
      .get<ClearinghouseConfigListResponse>(`${BASE}/clearinghouse/configs`, {
        params: { page, limit },
      })
      .then((r) => r.data),

  getConfigsByPayer: (payerId: string) =>
    api
      .get<ClearinghouseConfigResponse[]>(
        `${BASE}/clearinghouse/configs/payer/${payerId}`,
      )
      .then((r) => r.data),

  getConfigById: (id: string) =>
    api
      .get<ClearinghouseConfigResponse>(`${BASE}/clearinghouse/configs/${id}`)
      .then((r) => r.data),

  createConfig: (dto: CreateClearinghouseConfigDto) =>
    api
      .post<ClearinghouseConfigResponse>(`${BASE}/clearinghouse/configs`, dto)
      .then((r) => r.data),

  updateConfig: (id: string, dto: UpdateClearinghouseConfigDto) =>
    api
      .patch<ClearinghouseConfigResponse>(
        `${BASE}/clearinghouse/configs/${id}`,
        dto,
      )
      .then((r) => r.data),

  deleteConfig: (id: string) =>
    api.delete(`${BASE}/clearinghouse/configs/${id}`).then((r) => r.data),

  // ─── Submissions ──────────────────────────────────────────────────────────

  submitClaim: (claimId: string) =>
    api
      .post<TransmissionResponse>(
        `${BASE}/clearinghouse/submit/${claimId}`,
      )
      .then((r) => r.data),

  getTransmissions: (claimId: string) =>
    api
      .get<TransmissionResponse[]>(
        `${BASE}/clearinghouse/transmissions/${claimId}`,
      )
      .then((r) => r.data),

  updateAck: (transmissionId: string, dto: UpdateAckDto) =>
    api
      .patch<TransmissionResponse>(
        `${BASE}/clearinghouse/transmissions/${transmissionId}/ack`,
        dto,
      )
      .then((r) => r.data),
};
