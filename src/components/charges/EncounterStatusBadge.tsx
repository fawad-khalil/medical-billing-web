import { Badge } from '@/components/ui/Badge';
import type { EncounterStatus } from '@/types/encounter';

const statusVariant: Record<EncounterStatus, 'draft' | 'ready' | 'billed'> = {
  DRAFT:  'draft',
  READY:  'ready',
  BILLED: 'billed',
};

interface EncounterStatusBadgeProps {
  status: EncounterStatus;
}

export function EncounterStatusBadge({ status }: EncounterStatusBadgeProps) {
  return <Badge variant={statusVariant[status]} />;
}
