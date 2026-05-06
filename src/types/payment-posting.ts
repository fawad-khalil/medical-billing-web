export type PaymentType = 'INSURANCE' | 'PATIENT' | 'ADJUSTMENT';
export type BatchStatus = 'OPEN' | 'POSTED' | 'VOIDED';

export interface PaymentBatch {
  id: string;
  batchNumber: string;
  paymentDate: string;
  paymentType: PaymentType;
  payerId?: string;
  payerNameSnapshot?: string;
  checkNumber?: string;
  checkDate?: string;
  totalAmount: string;
  status: BatchStatus;
  postedAt?: string;
  postedBy?: string;
  voidedAt?: string;
  voidedBy?: string;
  voidReason?: string;
  eraFileReference?: string;
  notes?: string;
  lines?: PaymentLine[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentLine {
  id: string;
  tenantId: string;
  batchId: string;
  claimId: string;
  claimLineId?: string;
  paidAmount: string;
  adjustmentAmount: string;
  patientResponsibilityAmount: string;
  carcCode?: string;
  rarcCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BalanceCheck {
  batchId: string;
  batchTotal: string;
  linesPaidSum: string;
  difference: string;
  isBalanced: boolean;
}

export interface ClaimBalance {
  claimId: string;
  claimNumber: string;
  totalCharge: string;
  totalPaid: string;
  totalAdjusted: string;
  totalPatientResponsibility: string;
  outstandingBalance: string;
  lastPostedAt: string | null;
  batchCount: number;
}

export interface PaginatedBatches {
  data: PaymentBatch[];
  total: number;
  page: number;
  limit: number;
}

export interface BatchFilters {
  page?: number;
  limit?: number;
  status?: BatchStatus;
  paymentType?: PaymentType;
  payerId?: string;
  dateFrom?: string;
  dateTo?: string;
  batchNumber?: string;
}

export interface CreateBatchInput {
  paymentDate: string;
  paymentType: PaymentType;
  payerId?: string;
  checkNumber?: string;
  checkDate?: string;
  totalAmount: string;
  notes?: string;
}

export interface UpdateBatchInput {
  checkNumber?: string;
  checkDate?: string;
  notes?: string;
}

export interface CreateLineInput {
  claimId: string;
  claimLineId?: string;
  paidAmount: string;
  adjustmentAmount?: string;
  patientResponsibilityAmount?: string;
  carcCode?: string;
  rarcCode?: string;
  notes?: string;
}

export interface UpdateLineInput {
  paidAmount?: string;
  adjustmentAmount?: string;
  patientResponsibilityAmount?: string;
  carcCode?: string;
  rarcCode?: string;
  notes?: string;
}

export interface VoidBatchInput {
  reason: string;
}
