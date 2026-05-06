import { Badge } from '@/components/ui/Badge';
import type { PatientInsurance } from '@/types/patient';

interface InsuranceCardProps {
  insurance: PatientInsurance;
  onEdit: (ins: PatientInsurance) => void;
  onDelete: (ins: PatientInsurance) => void;
}

const priorityLabel = { 1: 'Primary', 2: 'Secondary', 3: 'Tertiary' } as const;
const priorityVariant = { 1: 'primary', 2: 'secondary', 3: 'tertiary' } as const;

function formatDate(d: string | null) {
  if (!d) return null;
  const [y, m, day] = d.split('-');
  return `${m}/${day}/${y}`;
}

function formatCurrency(n: number | null) {
  if (n === null) return null;
  return `$${n.toFixed(2)}`;
}

export function InsuranceCard({ insurance, onEdit, onDelete }: InsuranceCardProps) {
  const eligVariant =
    insurance.eligibilityStatus === 'active'
      ? 'active'
      : insurance.eligibilityStatus === 'inactive'
      ? 'inactive'
      : 'unverified';

  const effectiveRange = insurance.terminationDate
    ? `${formatDate(insurance.effectiveDate)} – ${formatDate(insurance.terminationDate)}`
    : `${formatDate(insurance.effectiveDate)} – present`;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Badge variant={priorityVariant[insurance.priority]}>
            {priorityLabel[insurance.priority]}
          </Badge>
          <h3 className="text-sm font-medium text-zinc-900">{insurance.payerNameSnapshot}</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(insurance)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(insurance)}
            className="text-sm font-medium text-red-600 hover:text-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            aria-label={`Remove ${priorityLabel[insurance.priority]} insurance`}
          >
            Remove
          </button>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Member ID</dt>
          <dd className="text-zinc-900">{insurance.memberId}</dd>
        </div>
        {insurance.groupNumber && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Group #</dt>
            <dd className="text-zinc-900">{insurance.groupNumber}</dd>
          </div>
        )}
        {insurance.planName && (
          <div className="col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Plan</dt>
            <dd className="text-zinc-900">{insurance.planName}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Coverage</dt>
          <dd className="text-zinc-700">{effectiveRange}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Eligibility</dt>
          <dd><Badge variant={eligVariant} /></dd>
        </div>
      </dl>

      {(insurance.copayAmount !== null || insurance.deductibleAmount !== null) && (
        <div className="mt-3 flex gap-4 border-t border-zinc-100 pt-3 text-sm text-zinc-600">
          {insurance.copayAmount !== null && (
            <span>Copay: <strong className="text-zinc-900">{formatCurrency(insurance.copayAmount)}</strong></span>
          )}
          {insurance.deductibleAmount !== null && (
            <span>
              Deductible: <strong className="text-zinc-900">{formatCurrency(insurance.deductibleAmount)}</strong>
              {insurance.deductibleMet !== null && (
                <span className="text-zinc-500"> (met: {formatCurrency(insurance.deductibleMet)})</span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
