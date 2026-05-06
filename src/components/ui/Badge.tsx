import type { ReactNode } from 'react';

export type BadgeVariant =
  | 'active'
  | 'inactive'
  | 'unverified'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'individual'
  | 'organization'
  // Payer-type variants
  | 'medicare'
  | 'medicaid'
  | 'payerPrimary'
  | 'payerSecondary'
  | 'payerTertiary'
  | 'workersComp'
  | 'auto'
  | 'other'
  // Encounter status variants
  | 'draft'
  | 'ready'
  | 'billed'
  // Encounter source variants
  | 'sourceAi'
  | 'sourceManual'
  // Claim status variants
  | 'claimDraft'
  | 'claimScrubbed'
  | 'claimSubmitted'
  | 'claimAccepted'
  | 'claimRejected'
  | 'claimPaid'
  | 'claimDenied'
  | 'claimAppealed'
  | 'claimVoided'
  // Payment batch status variants
  | 'batchOpen'
  | 'batchPosted'
  | 'batchVoided'
  // Payment type variants
  | 'paymentInsurance'
  | 'paymentPatient'
  | 'paymentAdjustment'
  // AR aging bucket variants
  | 'aging0to30'
  | 'aging31to60'
  | 'aging61to90'
  | 'aging91to120'
  | 'aging120plus';

const variantClasses: Record<BadgeVariant, string> = {
  active:         'bg-green-100 text-green-800',
  inactive:       'bg-zinc-100 text-zinc-700',
  unverified:     'bg-amber-100 text-amber-700',
  primary:        'bg-blue-100 text-blue-700',
  secondary:      'bg-violet-100 text-violet-700',
  tertiary:       'bg-zinc-100 text-zinc-600',
  individual:     'bg-blue-100 text-blue-700',
  organization:   'bg-violet-100 text-violet-700',
  medicare:       'bg-blue-100 text-blue-700',
  medicaid:       'bg-green-100 text-green-800',
  payerPrimary:   'bg-indigo-100 text-indigo-700',
  payerSecondary: 'bg-purple-100 text-purple-700',
  payerTertiary:  'bg-zinc-100 text-zinc-600',
  workersComp:    'bg-orange-100 text-orange-700',
  auto:           'bg-yellow-100 text-yellow-800',
  other:          'bg-zinc-100 text-zinc-700',
  // Encounter status
  draft:          'bg-zinc-100 text-zinc-600',
  ready:          'bg-blue-100 text-blue-700',
  billed:         'bg-green-100 text-green-800',
  // Encounter source
  sourceAi:       'bg-amber-100 text-amber-700',
  sourceManual:   'bg-zinc-100 text-zinc-500',
  // Claim status
  claimDraft:     'bg-zinc-100 text-zinc-600',
  claimScrubbed:  'bg-teal-100 text-teal-800',
  claimSubmitted: 'bg-blue-100 text-blue-700',
  claimAccepted:  'bg-teal-200 text-teal-900',
  claimRejected:  'bg-orange-100 text-orange-700',
  claimPaid:      'bg-green-100 text-green-800',
  claimDenied:    'bg-red-100 text-red-700',
  claimAppealed:  'bg-purple-100 text-purple-700',
  claimVoided:    'bg-zinc-100 text-zinc-400',
  // Payment batch status
  batchOpen:          'bg-amber-100 text-amber-700',
  batchPosted:        'bg-green-100 text-green-800',
  batchVoided:        'bg-zinc-100 text-zinc-400',
  // Payment type
  paymentInsurance:   'bg-blue-100 text-blue-700',
  paymentPatient:     'bg-violet-100 text-violet-700',
  paymentAdjustment:  'bg-orange-100 text-orange-700',
  // AR aging buckets
  aging0to30:         'bg-green-100 text-green-800',
  aging31to60:        'bg-amber-100 text-amber-800',
  aging61to90:        'bg-orange-100 text-orange-800',
  aging91to120:       'bg-red-100 text-red-700',
  aging120plus:       'bg-red-200 text-red-900',
};

const variantLabels: Record<BadgeVariant, string> = {
  active:         'Active',
  inactive:       'Inactive',
  unverified:     'Unverified',
  primary:        'Primary',
  secondary:      'Secondary',
  tertiary:       'Tertiary',
  individual:     'Individual',
  organization:   'Organization',
  medicare:       'Medicare',
  medicaid:       'Medicaid',
  payerPrimary:   'Primary',
  payerSecondary: 'Secondary',
  payerTertiary:  'Tertiary',
  workersComp:    'Workers Comp',
  auto:           'Auto',
  other:          'Other',
  // Encounter status
  draft:          'Draft',
  ready:          'Ready',
  billed:         'Billed',
  // Encounter source
  sourceAi:       'AI',
  sourceManual:   'Manual',
  // Claim status
  claimDraft:     'Draft',
  claimScrubbed:  'Scrubbed',
  claimSubmitted: 'Submitted',
  claimAccepted:  'Accepted',
  claimRejected:  'Rejected',
  claimPaid:      'Paid',
  claimDenied:    'Denied',
  claimAppealed:  'Appealed',
  claimVoided:    'Voided',
  // Payment batch status
  batchOpen:          'Open',
  batchPosted:        'Posted',
  batchVoided:        'Voided',
  // Payment type
  paymentInsurance:   'Insurance',
  paymentPatient:     'Patient',
  paymentAdjustment:  'Adjustment',
  // AR aging buckets
  aging0to30:         '0–30 days',
  aging31to60:        '31–60 days',
  aging61to90:        '61–90 days',
  aging91to120:       '91–120 days',
  aging120plus:       '120+ days',
};

interface BadgeProps {
  variant: BadgeVariant;
  children?: ReactNode;
  className?: string;
}

export function Badge({ variant, children, className = '' }: BadgeProps) {
  const label = children ?? variantLabels[variant];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
      aria-label={`Status: ${label}`}
    >
      {label}
    </span>
  );
}
