export type ProviderType = 'individual' | 'organization';
export type TaxIdType = 'EIN' | 'SSN' | null;

// ─── Response shapes (from API) ───────────────────────────────────────────────

/** Full provider record returned by GET /providers/:id */
export interface ProviderResponse {
  id: string;
  npi: string;
  providerType: ProviderType;
  firstName: string | null;
  lastName: string | null;
  organizationName: string | null;
  credentials: string | null;
  /** Computed at service layer: "Last, First, Credentials" or organizationName */
  displayName: string;
  primaryTaxonomyCode: string;
  primaryTaxonomyDesc: string | null;
  secondaryTaxonomyCode: string | null;
  secondaryTaxonomyDesc: string | null;
  /** Included only in detail endpoint. Not returned in list or summary. */
  deaNumber: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  fax: string | null;
  /**
   * For EIN: 9-digit string.
   * For SSN: '[PROTECTED]' — the actual value is never transmitted to the browser.
   * Null if no tax ID on file.
   */
  taxId: string | null;
  taxIdType: TaxIdType;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** List item DTO — no DEA, no tax ID */
export interface ProviderListItem {
  id: string;
  npi: string;
  providerType: ProviderType;
  displayName: string;
  primaryTaxonomyCode: string;
  isActive: boolean;
  createdAt: string;
}

/** Paginated list response */
export interface PaginatedProviders {
  data: ProviderListItem[];
  total: number;
  page: number;
  limit: number;
}

/** Lightweight summary for charge entry dropdown */
export interface ProviderSummary {
  id: string;
  npi: string;
  providerType: ProviderType;
  displayName: string;
  primaryTaxonomyCode: string;
  isActive: boolean;
}

// ─── Input shapes (sent to API) ───────────────────────────────────────────────

export interface CreateProviderInput {
  npi: string;
  providerType: ProviderType;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  credentials?: string;
  primaryTaxonomyCode: string;
  primaryTaxonomyDesc?: string;
  secondaryTaxonomyCode?: string;
  secondaryTaxonomyDesc?: string;
  deaNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  fax?: string;
  taxId?: string;
  taxIdType?: 'EIN' | 'SSN';
  notes?: string;
}

/** NPI is excluded — immutable after creation */
export type UpdateProviderInput = Partial<Omit<CreateProviderInput, 'npi'>>;

// ─── Search params ────────────────────────────────────────────────────────────

export interface ProviderSearchParams {
  page?: number;
  limit?: number;
  q?: string;
  npi?: string;
  type?: ProviderType;
  isActive?: boolean;
}
