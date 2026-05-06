// ─── Enums ────────────────────────────────────────────────────────────────────

export type ClaimStatus =
  | 'DRAFT'
  | 'SCRUBBED'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PAID'
  | 'DENIED'
  | 'APPEALED'
  | 'VOIDED';

// ─── List item ────────────────────────────────────────────────────────────────

export interface ClaimListItem {
  id: string;
  claimNumber: string;          // e.g. "CLM-2026-00123"
  encounterId: string;
  patientId: string;
  patientName: string;          // "Last, First"
  payerId: string;
  payerName: string;
  providerId: string;
  providerName: string;
  dateOfService: string;        // 'YYYY-MM-DD'
  billedAmount: string;         // decimal string
  status: ClaimStatus;
  submittedAt: string | null;   // ISO datetime
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedClaims {
  data: ClaimListItem[];
  total: number;
  page: number;
  limit: number;
}

// ─── Claim line ───────────────────────────────────────────────────────────────

export interface ClaimLine {
  id: string;
  claimId: string;
  cptCode: string;
  modifiers: string[] | null;
  diagnosisPointers: number[];  // 1-based indexes into claim's dx codes
  units: number;
  fee: string;                  // billed fee
  allowedAmount: string | null;
  paidAmount: string | null;
  adjustmentAmount: string | null;
  adjustmentCode: string | null;
  createdAt: string;
}

// ─── Status history ───────────────────────────────────────────────────────────

export interface ClaimStatusHistory {
  id: string;
  claimId: string;
  fromStatus: ClaimStatus | null;
  toStatus: ClaimStatus;
  notes: string | null;
  createdAt: string;
  createdBy: string | null;
}

// ─── Full claim (detail) ──────────────────────────────────────────────────────

export interface Claim extends ClaimListItem {
  diagnosisCodes: string[];
  notes: string | null;
  claimLines: ClaimLine[];
  hasActiveInsurance: boolean;
  scrubErrors: string[] | null;
}

// ─── Ready encounter (for new-claim picker) ───────────────────────────────────

export interface ReadyEncounter {
  encounterId: string;
  label: string;               // "MM/DD/YY — Last, First — Provider (N lines, $XXX.XX)"
  patientId: string;
  patientName: string;
  payerId: string | null;
  payerName: string | null;
  providerId: string;
  providerName: string;
  dateOfService: string;
  billedAmount: string;
  lineCount: number;
  hasActiveInsurance: boolean;
  diagnosisCodes: string[];
  chargeLinesPreview: Array<{
    cptCode: string;
    modifiers: string[] | null;
    diagnosisPointers: number[];
    units: number;
    fee: string;
  }>;
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface ClaimFilters {
  status?: ClaimStatus;
  payerId?: string;
  dateFrom?: string;
  dateTo?: string;
  claimNumber?: string;
  page?: number;
  limit?: number;
}

// ─── Input shapes ─────────────────────────────────────────────────────────────

export interface CreateClaimInput {
  encounterId: string;
}

export interface UpdateClaimInput {
  notes?: string;
}

export interface UpdateClaimStatusInput {
  status: ClaimStatus;
  notes?: string;
}
