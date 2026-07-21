import { clsx } from 'clsx';
import { Card } from '@/components/ui/Card';
import { initials } from '@/utils/format';
import type { StaffMember } from '@/types/database';

interface StaffCardProps {
  staff: StaffMember;
  selected?: boolean;
  onSelect?: (staff: StaffMember) => void;
  compact?: boolean;
}

export function StaffCard({ staff, selected, onSelect, compact }: StaffCardProps) {
  const interactive = Boolean(onSelect);
  return (
    <Card
      as={interactive ? 'button' : 'div'}
      hover={interactive}
      padded={!compact}
      onClick={() => onSelect?.(staff)}
      className={clsx(
        interactive && 'cursor-pointer',
        compact && 'p-4',
        selected && 'ring-2 ring-brand-500 border-brand-300'
      )}
    >
      <div className="flex items-center gap-4">
        {staff.avatar_url ? (
          <img
            src={staff.avatar_url}
            alt={staff.full_name}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-lg font-semibold text-white">
            {initials(staff.full_name)}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-brand-900">{staff.full_name}</h3>
          <p className="text-sm text-accent-600">{staff.role_title}</p>
        </div>
      </div>
      {!compact && staff.bio && <p className="mt-3 text-sm text-brand-500">{staff.bio}</p>}
    </Card>
  );
}
