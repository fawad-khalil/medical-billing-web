import { Badge } from '@/components/ui/Badge';
import type { BadgeVariant } from '@/components/ui/Badge';
import type { ClaimStatus } from '@/types/claim';

const STATUS_VARIANT: Record<ClaimStatus, BadgeVariant> = {
  DRAFT:     'claimDraft',
  SCRUBBED:  'claimScrubbed',
  SUBMITTED: 'claimSubmitted',
  ACCEPTED:  'claimAccepted',
  REJECTED:  'claimRejected',
  PAID:      'claimPaid',
  DENIED:    'claimDenied',
  APPEALED:  'claimAppealed',
  VOIDED:    'claimVoided',
};

interface ClaimStatusBadgeProps {
  status: ClaimStatus;
  className?: string;
}

export function ClaimStatusBadge({ status, className }: ClaimStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANT[status]} className={className} />;
}
