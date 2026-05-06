import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;

// ─── Patients ──────────────────────────────────────────────────────────────

import type {
  PaginatedPatients,
  PatientResponse,
  PatientListItem,
  PatientInsurance,
  CreatePatientInput,
  UpdatePatientInput,
  CreateInsuranceInput,
  UpdateInsuranceInput,
} from '@/types/patient';

const BASE = '/api/v1';

// ─── Providers ─────────────────────────────────────────────────────────────

import type {
  PaginatedProviders,
  ProviderResponse,
  ProviderListItem,
  ProviderSummary,
  CreateProviderInput,
  UpdateProviderInput,
} from '@/types/provider';

export const providersApi = {
  list: (params: { page?: number; limit?: number; isActive?: boolean; type?: string }) =>
    api
      .get<PaginatedProviders>(`${BASE}/providers`, { params })
      .then((r) => r.data),

  search: (params: { q?: string; npi?: string; type?: string }) =>
    api
      .get<ProviderListItem[]>(`${BASE}/providers/search`, { params })
      .then((r) => r.data),

  get: (id: string) =>
    api.get<ProviderResponse>(`${BASE}/providers/${id}`).then((r) => r.data),

  getSummary: (id: string) =>
    api
      .get<ProviderSummary>(`${BASE}/providers/${id}/summary`)
      .then((r) => r.data),

  create: (data: CreateProviderInput) =>
    api.post<ProviderResponse>(`${BASE}/providers`, data).then((r) => r.data),

  update: (id: string, data: UpdateProviderInput) =>
    api
      .patch<ProviderResponse>(`${BASE}/providers/${id}`, data)
      .then((r) => r.data),

  deactivate: (id: string) =>
    api
      .patch<ProviderResponse>(`${BASE}/providers/${id}`, { isActive: false })
      .then((r) => r.data),

  delete: (id: string) => api.delete(`${BASE}/providers/${id}`),
};

// ─── Patients ──────────────────────────────────────────────────────────────

// ─── Payers ────────────────────────────────────────────────────────────────

import type {
  PaginatedPayers,
  PayerResponse,
  PayerListItem,
  PayerSummary,
  CreatePayerInput,
  UpdatePayerInput,
  PayerSearchParams,
} from '@/types/payer';

export const payersApi = {
  list: (params: PayerSearchParams) =>
    api.get<PaginatedPayers>(`${BASE}/payers`, { params }).then((r) => r.data),

  search: (params: { q?: string; ediPayerId?: string }) =>
    api.get<PayerListItem[]>(`${BASE}/payers/search`, { params }).then((r) => r.data),

  getSummaries: () =>
    api.get<PayerSummary[]>(`${BASE}/payers/summary`).then((r) => r.data),

  get: (id: string) =>
    api.get<PayerResponse>(`${BASE}/payers/${id}`).then((r) => r.data),

  create: (data: CreatePayerInput) =>
    api.post<PayerResponse>(`${BASE}/payers`, data).then((r) => r.data),

  update: (id: string, data: UpdatePayerInput) =>
    api.patch<PayerResponse>(`${BASE}/payers/${id}`, data).then((r) => r.data),

  deactivate: (id: string) =>
    api.delete(`${BASE}/payers/${id}`),
};

// ─── Encounters ────────────────────────────────────────────────────────────────

import type {
  PaginatedEncounters,
  Encounter,
  ChargeLine,
  ParsedSuperbill,
  CreateEncounterInput,
  CreateChargeLineInput,
  EncounterFilters,
  EncounterStatus,
} from '@/types/encounter';

export const encountersApi = {
  list: (params: EncounterFilters) =>
    api.get<PaginatedEncounters>(`${BASE}/encounters`, { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Encounter>(`${BASE}/encounters/${id}`).then((r) => r.data),

  create: (data: CreateEncounterInput) =>
    api.post<Encounter>(`${BASE}/encounters`, data).then((r) => r.data),

  update: (id: string, data: Partial<CreateEncounterInput>) =>
    api.patch<Encounter>(`${BASE}/encounters/${id}`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`${BASE}/encounters/${id}`),

  transitionStatus: (id: string, status: Extract<EncounterStatus, 'READY' | 'DRAFT'>) =>
    api.patch<Encounter>(`${BASE}/encounters/${id}/status`, { status }).then((r) => r.data),

  parseSuperbill: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api
      .post<ParsedSuperbill>(`${BASE}/encounters/parse-superbill`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  addLine: (encounterId: string, data: CreateChargeLineInput) =>
    api
      .post<ChargeLine>(`${BASE}/encounters/${encounterId}/lines`, data)
      .then((r) => r.data),

  updateLine: (
    encounterId: string,
    lineId: string,
    data: Partial<CreateChargeLineInput>,
  ) =>
    api
      .patch<ChargeLine>(`${BASE}/encounters/${encounterId}/lines/${lineId}`, data)
      .then((r) => r.data),

  deleteLine: (encounterId: string, lineId: string) =>
    api.delete(`${BASE}/encounters/${encounterId}/lines/${lineId}`),
};

export const patientsApi = {
  list: (page = 1, limit = 25) =>
    api.get<PaginatedPatients>(`${BASE}/patients`, { params: { page, limit } }).then((r) => r.data),

  search: (params: { q?: string; dob?: string; memberId?: string }) =>
    api.get<PatientListItem[]>(`${BASE}/patients/search`, { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<PatientResponse>(`${BASE}/patients/${id}`).then((r) => r.data),

  create: (data: CreatePatientInput) =>
    api.post<PatientResponse>(`${BASE}/patients`, data).then((r) => r.data),

  update: (id: string, data: UpdatePatientInput) =>
    api.patch<PatientResponse>(`${BASE}/patients/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`${BASE}/patients/${id}`),

  // Insurance
  listInsurance: (patientId: string) =>
    api.get<PatientInsurance[]>(`${BASE}/patients/${patientId}/insurance`).then((r) => r.data),

  createInsurance: (patientId: string, data: CreateInsuranceInput) =>
    api.post<PatientInsurance>(`${BASE}/patients/${patientId}/insurance`, data).then((r) => r.data),

  updateInsurance: (patientId: string, insId: string, data: UpdateInsuranceInput) =>
    api.patch<PatientInsurance>(`${BASE}/patients/${patientId}/insurance/${insId}`, data).then((r) => r.data),

  deleteInsurance: (patientId: string, insId: string) =>
    api.delete(`${BASE}/patients/${patientId}/insurance/${insId}`),
};
