export type ClearinghouseType = 'WAYSTAR' | 'CHANGE_HEALTHCARE' | 'AVAILITY' | 'OTHER';
export type SubmissionMethod = 'SFTP' | 'REST';
export type TransmissionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'ERROR';

export interface ClearinghouseConfigResponse {
  id: string;
  tenantId: string;
  payerId: string;
  clearinghouse: ClearinghouseType;
  submissionMethod: SubmissionMethod;
  submitterId: string;
  sftpHost: string | null;
  sftpPort: number | null;
  sftpUsername: string | null;
  hasSftpPassword: boolean;
  sftpPath837: string | null;
  sftpPath835: string | null;
  sftpPath277: string | null;
  hasApiKey: boolean;
  apiEndpoint: string | null;
  isTest: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ClearinghouseConfigListResponse {
  items: ClearinghouseConfigResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TransmissionResponse {
  id: string;
  tenantId: string;
  claimId: string;
  ediFileId: string;
  configId: string;
  clearinghouse: string;
  submissionMethod: string;
  submittedAt: string;
  isaControlNumber: string;
  clearinghouseControlNumber: string | null;
  status: TransmissionStatus;
  ackReceivedAt: string | null;
  ackCode: string | null;
  ackDescription: string | null;
  errorMessage: string | null;
  attemptNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClearinghouseConfigDto {
  payerId: string;
  clearinghouse: ClearinghouseType;
  submissionMethod: SubmissionMethod;
  submitterId: string;
  sftpHost?: string;
  sftpPort?: number;
  sftpUsername?: string;
  sftpPassword?: string;
  sftpPath837?: string;
  sftpPath835?: string;
  sftpPath277?: string;
  apiKey?: string;
  apiEndpoint?: string;
  isTest?: boolean;
  isActive?: boolean;
}

export interface UpdateClearinghouseConfigDto {
  submissionMethod?: SubmissionMethod;
  submitterId?: string;
  sftpHost?: string;
  sftpPort?: number;
  sftpUsername?: string;
  sftpPassword?: string;
  sftpPath837?: string;
  sftpPath835?: string;
  sftpPath277?: string;
  apiKey?: string;
  apiEndpoint?: string;
  isTest?: boolean;
  isActive?: boolean;
}

export interface UpdateAckDto {
  status: TransmissionStatus;
  ackCode?: string;
  ackDescription?: string;
  clearinghouseControlNumber?: string;
  rawResponse?: string;
  ackReceivedAt?: string;
}
