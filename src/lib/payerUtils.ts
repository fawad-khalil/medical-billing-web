import type { BadgeVariant } from '@/components/ui/Badge';
import type { PayerType, ClaimType } from '@/types/payer';

export function payerTypeToBadgeVariant(payerType: PayerType): BadgeVariant {
  const map: Record<PayerType, BadgeVariant> = {
    MEDICARE:     'medicare',
    MEDICAID:     'medicaid',
    PRIMARY:      'payerPrimary',
    SECONDARY:    'payerSecondary',
    TERTIARY:     'payerTertiary',
    WORKERS_COMP: 'workersComp',
    AUTO:         'auto',
    OTHER:        'other',
  };
  return map[payerType];
}

export function formatClaimTypes(claimTypes: ClaimType[]): string {
  const map: Record<ClaimType, string> = {
    PROFESSIONAL:  'Prof',
    INSTITUTIONAL: 'Inst',
  };
  return claimTypes.map((ct) => map[ct]).join(' · ');
}

export function payerTypeLabel(payerType: PayerType): string {
  const map: Record<PayerType, string> = {
    MEDICARE:     'Medicare',
    MEDICAID:     'Medicaid',
    PRIMARY:      'Primary',
    SECONDARY:    'Secondary',
    TERTIARY:     'Tertiary',
    WORKERS_COMP: 'Workers Comp',
    AUTO:         'Auto',
    OTHER:        'Other',
  };
  return map[payerType];
}
