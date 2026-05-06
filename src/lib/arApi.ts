import api from '@/lib/api';
import type {
  ArSummaryDto,
  ArAgingListDto,
  WorklistDto,
  ArByPayerDto,
  ArFilters,
  ArAgingFilters,
  WorklistFilters,
  ArByPayerFilters,
} from '@/types/ar-dashboard';

const BASE = '/api/v1';

export const arApi = {
  getSummary: (params: ArFilters = {}): Promise<ArSummaryDto> =>
    api.get<ArSummaryDto>(`${BASE}/ar/summary`, { params }).then((r) => r.data),

  getAging: (params: ArAgingFilters = {}): Promise<ArAgingListDto> =>
    api.get<ArAgingListDto>(`${BASE}/ar/aging`, { params }).then((r) => r.data),

  getWorklist: (params: WorklistFilters = {}): Promise<WorklistDto> =>
    api.get<WorklistDto>(`${BASE}/ar/worklist`, { params }).then((r) => r.data),

  getByPayer: (params: ArByPayerFilters = {}): Promise<ArByPayerDto> =>
    api.get<ArByPayerDto>(`${BASE}/ar/by-payer`, { params }).then((r) => r.data),
};
