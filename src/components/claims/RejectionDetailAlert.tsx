export function RejectionDetailAlert({
  ackCode,
  ackDescription,
  errorMessage,
}: {
  ackCode: string | null;
  ackDescription: string | null;
  errorMessage: string | null;
}) {
  const detail = ackDescription ?? errorMessage ?? 'No details available.';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-lg border border-red-300 bg-red-50 p-4"
    >
      <div className="flex items-start gap-3">
        <svg
          className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <p className="text-sm font-semibold text-red-800">Claim Rejected</p>
          {ackCode && (
            <p className="mt-0.5 text-xs text-red-700">
              ACK Code: <span className="font-mono">{ackCode}</span>
            </p>
          )}
          <p className="mt-1 text-sm text-red-700">{detail}</p>
          <p className="mt-2 text-xs text-red-600">
            Correct the claim and resubmit, or contact the clearinghouse for details.
          </p>
        </div>
      </div>
    </div>
  );
}
