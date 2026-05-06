export interface PatientListItem {
  id: string;
  firstName: string;
  lastName: string;
  chartNumber: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PatientResponse {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  dateOfBirth: string;
  sex: 'M' | 'F' | 'U';
  ssnLast4: string | null;
  mbi: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  chartNumber: string | null;
  externalEmrId: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientInsurance {
  id: string;
  tenantId: string;
  patientId: string;
  priority: 1 | 2 | 3;
  payerId: string;
  payerNameSnapshot: string;
  memberId: string;
  groupNumber: string | null;
  planName: string | null;
  subscriberFirstName: string | null;
  subscriberLastName: string | null;
  subscriberRelationship: string | null;
  effectiveDate: string;
  terminationDate: string | null;
  copayAmount: number | null;
  deductibleAmount: number | null;
  deductibleMet: number | null;
  eligibilityStatus: 'active' | 'inactive' | 'unverified' | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PaginatedPatients {
  data: PatientListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatePatientInput {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  sex: 'M' | 'F' | 'U';
  ssnLast4?: string;
  ssn?: string;
  mbi?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  chartNumber?: string;
  externalEmrId?: string;
  notes?: string;
}

export type UpdatePatientInput = Partial<CreatePatientInput>;

export interface CreateInsuranceInput {
  payerId: string;
  payerNameSnapshot: string;
  priority: 1 | 2 | 3;
  memberId: string;
  groupNumber?: string;
  planName?: string;
  effectiveDate: string;
  terminationDate?: string;
  patientIsSubscriber?: boolean;
  subscriberFirstName?: string;
  subscriberLastName?: string;
  subscriberDob?: string;
  subscriberRelationship?: string;
  copayAmount?: number;
  deductibleAmount?: number;
  deductibleMet?: number;
  eligibilityStatus?: 'active' | 'inactive' | 'unverified';
}

export type UpdateInsuranceInput = Partial<CreateInsuranceInput>;
