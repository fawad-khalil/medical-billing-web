// ─── Scrub ────────────────────────────────────────────────────────────────────

export interface ScrubViolation {
  ruleId: string;
  severity: 'ERROR' | 'WARNING';
  field: string;
  message: string;
}

export interface ScrubResult {
  passed: boolean;
  violations: ScrubViolation[];
  claimId: string;
  status: string;
}

// ─── EDI file metadata ────────────────────────────────────────────────────────

export interface EdiFileMeta {
  fileId: string;
  controlNumber: string;
  segmentCount: number;
  isTest: boolean;
  generatedAt: string;
  submittedAt: string | null;
}

export interface EdiFileWithContent extends EdiFileMeta {
  content: string;
}

// ─── Generation result ────────────────────────────────────────────────────────

export interface EdiGenerationResult {
  fileId: string;
  controlNumber: string;
  segmentCount: number;
  generatedAt: string;
}
