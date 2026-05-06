export type PayerType =
  | 'MEDICARE'
  | 'MEDICAID'
  | 'PRIMARY'
  | 'SECONDARY'
  | 'TERTIARY'
  | 'WORKERS_COMP'
  | 'AUTO'
  | 'OTHER';

export type ClaimType = 'PROFESSIONAL' | 'INSTITUTIONAL';

export interface PayerResponse {
  id: string;
  name: string;
  ediPayerId: string;
  payerType: PayerType;
  claimTypes: ClaimType[];
  timelyFilingDays: number;
  acceptsElectronic: boolean;
  claimsAddressLine1: string | null;
  claimsAddressLine2: string | null;
  claimsCity: string | null;
  claimsState: string | null;
  claimsZip: string | null;
  phone: string | null;
  fax: string | null;
  appealsAddressLine1: string | null;
  appealsAddressLine2: string | null;
  appealsCity: string | null;
  appealsState: string | null;
  appealsZip: string | null;
  portalUrl: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PayerListItem {
  id: string;
  name: string;
  ediPayerId: string;
  payerType: PayerType;
  claimTypes: ClaimType[];
  timelyFilingDays: number;
  acceptsElectronic: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface PaginatedPayers {
  data: PayerListItem[];
  total: number;
  page: number;
  limit: number;
}


export interface PayerSummary {
  id: string;
  name: string;
  ediPayerId: string;
  payerType: PayerType;
  claimTypes: ClaimType[];
  isActive: boolean;
}

export interface CreatePayerInput {
  name: string;
  payerType: PayerType;
  ediPayerId: string;
  claimTypes: ClaimType[];
  timelyFilingDays?: number;
  acceptsElectronic?: boolean;
  claimsAddressLine1?: string;
  claimsAddressLine2?: string;
  claimsCity?: string;
  claimsState?: string;
  claimsZip?: string;
  phone?: string;
  fax?: string;
  appealsAddressLine1?: string;
  appealsAddressLine2?: string;
  appealsCity?: string;
  appealsState?: string;
  appealsZip?: string;
  portalUrl?: string;
  notes?: string;
}

export type UpdatePayerInput = Partial<CreatePayerInput>;

export interface PayerSearchParams {
  page?: number;
  limit?: number;
  q?: string;
  ediPayerId?: string;
  payerType?: PayerType[];
  isActive?: boolean;
}
