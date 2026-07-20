import { Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { Card } from '@/components/ui/Card';
import { formatDuration, formatPrice } from '@/utils/format';
import type { Service } from '@/types/database';

interface ServiceCardProps {
  service: Service;
  selected?: boolean;
  onSelect?: (service: Service) => void;
}

export function ServiceCard({ service, selected, onSelect }: ServiceCardProps) {
  const interactive = Boolean(onSelect);
  return (
    <Card
      hover={interactive}
      onClick={() => onSelect?.(service)}
      className={clsx(
        interactive && 'cursor-pointer',
        selected && 'ring-2 ring-brand-500 border-brand-300'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-accent-600">
            {service.category}
          </span>
          <h3 className="heading-serif mt-0.5 text-lg text-brand-900">{service.name}</h3>
        </div>
        <span className="whitespace-nowrap text-lg font-bold text-brand-800">
          {formatPrice(service.price)}
        </span>
      </div>
      {service.description && (
        <p className="mt-2 text-sm text-brand-500">{service.description}</p>
      )}
      <div className="mt-4 flex items-center gap-1.5 text-sm text-brand-400">
        <Clock className="h-4 w-4" />
        {formatDuration(service.duration_minutes)}
      </div>
    </Card>
  );
}
