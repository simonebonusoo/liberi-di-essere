import { Calendar, Clock, User, Scissors } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, formatPrice, formatTime } from '@/utils/format';
import { canCancelAppointment } from '@/utils/availability';
import type { AppointmentWithRelations } from '@/types/database';

interface AppointmentCardProps {
  appointment: AppointmentWithRelations;
  onCancel?: (appointment: AppointmentWithRelations) => void;
  /** Mostra il nome del cliente (vista admin). */
  showClient?: boolean;
}

export function AppointmentCard({ appointment, onCancel, showClient }: AppointmentCardProps) {
  const { service, staff, client, status, starts_at, price } = appointment;
  const cancellable =
    status === 'confirmed' && Boolean(onCancel) && canCancelAppointment(starts_at);

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="heading-serif text-lg text-brand-900">
            {service?.name ?? 'Servizio'}
          </h3>
          {showClient && client && (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-brand-500">
              <User className="h-3.5 w-3.5" />
              {client.full_name || client.email}
            </p>
          )}
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-y-2 text-sm text-brand-600">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-brand-400" />
          {formatDate(starts_at)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-brand-400" />
          {formatTime(starts_at)}
        </span>
        <span className="flex items-center gap-1.5">
          <Scissors className="h-4 w-4 text-brand-400" />
          {staff?.full_name ?? '—'}
        </span>
        <span className="font-semibold text-brand-800">{formatPrice(price)}</span>
      </div>

      {cancellable && (
        <div className="mt-4 border-t border-brand-100 pt-4">
          <Button variant="outline" size="sm" onClick={() => onCancel?.(appointment)}>
            Disdici appuntamento
          </Button>
        </div>
      )}
      {status === 'confirmed' && onCancel && !cancellable && (
        <p className="mt-3 text-xs text-brand-400">
          Non disdicibile online (troppo vicino all'orario). Contatta il salone.
        </p>
      )}
    </Card>
  );
}
