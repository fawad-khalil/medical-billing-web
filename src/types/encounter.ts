// ─── Enums ────────────────────────────────────────────────────────────────────

export type EncounterStatus = 'DRAFT' | 'READY' | 'BILLED';
export type EncounterSource = 'MANUAL' | 'PARSED';

// ─── List / paginated ─────────────────────────────────────────────────────────

export interface EncounterListItem {
  id: string;
  patientId: string;
  providerId: string;
  dateOfService: string; // 'YYYY-MM-DD'
  placeOfService: string; // 2-char e.g. '11'
  status: EncounterStatus;
  source: EncounterSource;
  diagnosisCodeCount: number;
  lineCount: number;
  totalFee: string;
  createdAt: string;
}

export interface PaginatedEncounters {
  data: EncounterListItem[];
  total: number;
  page: number;
  limit: number;
}

// ─── Charge line ──────────────────────────────────────────────────────────────

export interface ChargeLine {
  id: string;
  encounterId: string;
  cptCode: string;
  diagnosisPointers: number[]; // 1-based indexes into encounter.diagnosisCodes
  units: number;
  fee: string;
  modifiers: string[] | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Full encounter (detail) ──────────────────────────────────────────────────

export interface Encounter extends EncounterListItem {
  diagnosisCodes: string[];
  notes: string | null;
  chargeLines: ChargeLine[];
  deletedAt: string | null;
}

// ─── Parsed superbill ─────────────────────────────────────────────────────────

export interface ParsedSuperbill {
  patientName: string | null;
  dateOfService: string | null;
  providerNpi: string | null;
  placeOfService: string | null;
  diagnosisCodes: string[];
  chargeLines: Array<{
    cptCode: string;
    diagnosisPointers: number[];
    units: number;
    fee: string;
    modifiers: string[];
  }>;
  confidence: 'high' | 'medium' | 'low';
  rawText: string | null;
  parseMethod: 'text' | 'vision' | 'stub';
}

// ─── Input shapes ─────────────────────────────────────────────────────────────

export interface CreateChargeLineInput {
  cptCode: string;
  diagnosisPointers: number[];
  units: number;
  fee: string;
  modifiers?: string[];
}

export interface CreateEncounterInput {
  patientId: string;
  providerId: string;
  dateOfService: string;
  placeOfService: string;
  source: EncounterSource;
  diagnosisCodes: string[];
  notes?: string;
  chargeLines?: CreateChargeLineInput[];
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface EncounterFilters {
  status?: EncounterStatus;
  source?: EncounterSource;
  dateFrom?: string;
  dateTo?: string;
  patientId?: string;
  providerId?: string;
  page?: number;
  limit?: number;
}

// ─── Form row (local state, not sent to API directly) ────────────────────────

export interface ChargeLineRow {
  cptCode: string;
  diagnosisPointers: number[]; // 1-based
  units: number;
  fee: string;
  modifiers: string[];
}
