import { Badge } from '@/components/ui/Badge';
import type { EncounterSource } from '@/types/encounter';

const sourceVariant: Record<EncounterSource, 'sourceAi' | 'sourceManual'> = {
  PARSED: 'sourceAi',
  MANUAL: 'sourceManual',
};

interface SourceBadgeProps {
  source: EncounterSource;
}

export function SourceBadge({ source }: SourceBadgeProps) {
  return <Badge variant={sourceVariant[source]} />;
}
