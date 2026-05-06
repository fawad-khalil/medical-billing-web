import api from '@/lib/api';
import type {
  ScrubResult,
  EdiGenerationResult,
  EdiFileWithContent,
  EdiFileMeta,
} from '@/types/edi';

const BASE = '/api/v1';

export const ediApi = {
  // POST /edi/claims/:id/scrub
  // HTTP 200 for both pass and fail
  scrubClaim: (claimId: string) =>
    api
      .post<ScrubResult>(`${BASE}/edi/claims/${claimId}/scrub`)
      .then((r) => r.data),

  // POST /edi/claims/:id/generate?isTest=true
  // HTTP 201 on success
  generateEdi: (claimId: string, isTest = true) =>
    api
      .post<EdiGenerationResult>(`${BASE}/edi/claims/${claimId}/generate`, null, {
        params: { isTest },
      })
      .then((r) => r.data),

  // GET /edi/claims/:id/file — returns latest file with decrypted content, 404 if none
  getEdiFile: (claimId: string) =>
    api
      .get<EdiFileWithContent>(`${BASE}/edi/claims/${claimId}/file`)
      .then((r) => r.data),

  // GET /edi/claims/:id/files — returns array of file metadata (no content)
  listEdiFiles: (claimId: string) =>
    api
      .get<EdiFileMeta[]>(`${BASE}/edi/claims/${claimId}/files`)
      .then((r) => r.data),
};
