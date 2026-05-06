'use client';

import { useState } from 'react';
import { CredentialField } from './CredentialField';
import type {
  ClearinghouseConfigResponse,
  ClearinghouseType,
  SubmissionMethod,
  CreateClearinghouseConfigDto,
  UpdateClearinghouseConfigDto,
} from '@/types/clearinghouse';

interface Props {
  /** When provided, the form is in edit mode */
  existing?: ClearinghouseConfigResponse;
  onSubmit: (dto: CreateClearinghouseConfigDto | UpdateClearinghouseConfigDto) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

export function ClearinghouseConfigForm({
  existing,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
}: Props) {
  const [payerId, setPayerId] = useState(existing?.payerId ?? '');
  const [clearinghouse, setClearinghouse] = useState<ClearinghouseType>(
    existing?.clearinghouse ?? 'WAYSTAR',
  );
  const [submissionMethod, setSubmissionMethod] = useState<SubmissionMethod>(
    existing?.submissionMethod ?? 'SFTP',
  );
  const [submitterId, setSubmitterId] = useState(existing?.submitterId ?? '');
  const [isTest, setIsTest] = useState(existing?.isTest ?? true);
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);

  // SFTP fields
  const [sftpHost, setSftpHost] = useState(existing?.sftpHost ?? '');
  const [sftpPort, setSftpPort] = useState(String(existing?.sftpPort ?? '22'));
  const [sftpUsername, setSftpUsername] = useState(existing?.sftpUsername ?? '');
  const [sftpPassword, setSftpPassword] = useState('');
  const [sftpPath837, setSftpPath837] = useState(existing?.sftpPath837 ?? '');
  const [sftpPath835, setSftpPath835] = useState(existing?.sftpPath835 ?? '');
  const [sftpPath277, setSftpPath277] = useState(existing?.sftpPath277 ?? '');

  // REST fields
  const [apiEndpoint, setApiEndpoint] = useState(existing?.apiEndpoint ?? '');
  const [apiKey, setApiKey] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const dto: CreateClearinghouseConfigDto = {
      payerId,
      clearinghouse,
      submissionMethod,
      submitterId,
      isTest,
      isActive,
      ...(submissionMethod === 'SFTP'
        ? {
            sftpHost: sftpHost || undefined,
            sftpPort: sftpPort ? parseInt(sftpPort, 10) : undefined,
            sftpUsername: sftpUsername || undefined,
            sftpPassword: sftpPassword || undefined,
            sftpPath837: sftpPath837 || undefined,
            sftpPath835: sftpPath835 || undefined,
            sftpPath277: sftpPath277 || undefined,
          }
        : {
            apiEndpoint: apiEndpoint || undefined,
            apiKey: apiKey || undefined,
          }),
    };
    await onSubmit(dto);
  }

  const fieldClass =
    'block w-full rounded-md border border-zinc-300 py-1.5 px-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-zinc-700';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {/* Payer ID */}
      {!existing && (
        <div>
          <label htmlFor="payerId" className={labelClass}>
            Payer ID <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="payerId"
            type="text"
            value={payerId}
            onChange={(e) => setPayerId(e.target.value)}
            required
            placeholder="UUID of the payer"
            className={`mt-1 ${fieldClass}`}
          />
        </div>
      )}

      {/* Clearinghouse */}
      {!existing && (
        <div>
          <label htmlFor="clearinghouse" className={labelClass}>
            Clearinghouse <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <select
            id="clearinghouse"
            value={clearinghouse}
            onChange={(e) => setClearinghouse(e.target.value as ClearinghouseType)}
            className={`mt-1 ${fieldClass}`}
          >
            <option value="WAYSTAR">Waystar</option>
            <option value="CHANGE_HEALTHCARE">Change Healthcare</option>
            <option value="AVAILITY">Availity</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      )}

      {/* Submission method */}
      <div>
        <span className={labelClass}>Submission Method</span>
        <div className="mt-1 flex gap-4">
          {(['SFTP', 'REST'] as SubmissionMethod[]).map((m) => (
            <label key={m} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
              <input
                type="radio"
                name="submissionMethod"
                value={m}
                checked={submissionMethod === m}
                onChange={() => setSubmissionMethod(m)}
                className="text-blue-600"
              />
              {m}
            </label>
          ))}
        </div>
      </div>

      {/* Submitter ID */}
      <div>
        <label htmlFor="submitterId" className={labelClass}>
          Submitter ID (NM1*41) <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <input
          id="submitterId"
          type="text"
          value={submitterId}
          onChange={(e) => setSubmitterId(e.target.value)}
          required
          maxLength={50}
          className={`mt-1 ${fieldClass}`}
        />
      </div>

      {/* SFTP fields */}
      {submissionMethod === 'SFTP' && (
        <fieldset className="space-y-4 rounded-md border border-zinc-200 p-4">
          <legend className="px-1 text-sm font-medium text-zinc-700">SFTP Configuration</legend>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sftpHost" className={labelClass}>SFTP Host</label>
              <input id="sftpHost" type="text" value={sftpHost} onChange={(e) => setSftpHost(e.target.value)} className={`mt-1 ${fieldClass}`} />
            </div>
            <div>
              <label htmlFor="sftpPort" className={labelClass}>Port</label>
              <input id="sftpPort" type="number" value={sftpPort} onChange={(e) => setSftpPort(e.target.value)} min={1} max={65535} className={`mt-1 ${fieldClass}`} />
            </div>
          </div>
          <div>
            <label htmlFor="sftpUsername" className={labelClass}>Username</label>
            <input id="sftpUsername" type="text" value={sftpUsername} onChange={(e) => setSftpUsername(e.target.value)} autoComplete="username" className={`mt-1 ${fieldClass}`} />
          </div>
          <CredentialField
            id="sftpPassword"
            label="Password"
            hasExistingCredential={existing?.hasSftpPassword}
            value={sftpPassword}
            onChange={setSftpPassword}
          />
          <div>
            <label htmlFor="sftpPath837" className={labelClass}>837 Upload Path</label>
            <input id="sftpPath837" type="text" value={sftpPath837} onChange={(e) => setSftpPath837(e.target.value)} placeholder="/inbox" className={`mt-1 ${fieldClass}`} />
          </div>
          <div>
            <label htmlFor="sftpPath835" className={labelClass}>835 Download Path</label>
            <input id="sftpPath835" type="text" value={sftpPath835} onChange={(e) => setSftpPath835(e.target.value)} placeholder="/era" className={`mt-1 ${fieldClass}`} />
          </div>
          <div>
            <label htmlFor="sftpPath277" className={labelClass}>277 ACK Path</label>
            <input id="sftpPath277" type="text" value={sftpPath277} onChange={(e) => setSftpPath277(e.target.value)} placeholder="/277" className={`mt-1 ${fieldClass}`} />
          </div>
        </fieldset>
      )}

      {/* REST fields */}
      {submissionMethod === 'REST' && (
        <fieldset className="space-y-4 rounded-md border border-zinc-200 p-4">
          <legend className="px-1 text-sm font-medium text-zinc-700">REST API Configuration</legend>
          <div>
            <label htmlFor="apiEndpoint" className={labelClass}>API Endpoint</label>
            <input id="apiEndpoint" type="url" value={apiEndpoint} onChange={(e) => setApiEndpoint(e.target.value)} placeholder="https://api.waystar.com/v1/claims" className={`mt-1 ${fieldClass}`} />
          </div>
          <CredentialField
            id="apiKey"
            label="API Key"
            hasExistingCredential={existing?.hasApiKey}
            value={apiKey}
            onChange={setApiKey}
          />
        </fieldset>
      )}

      {/* Flags */}
      <div className="flex gap-6">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={isTest}
            onChange={(e) => setIsTest(e.target.checked)}
            className="rounded text-blue-600"
          />
          Test mode (ISA15=T)
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded text-blue-600"
          />
          Active
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : existing ? 'Save Changes' : 'Add Configuration'}
        </button>
      </div>
    </form>
  );
}
