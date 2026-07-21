import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import type { AppointmentStatus } from '@/types/database';

const tones = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-brand-200 text-brand-800',
  no_show: 'bg-orange-100 text-orange-700',
  rescheduled: 'bg-blue-100 text-blue-700',
  neutral: 'bg-brand-100 text-brand-700',
  accent: 'bg-accent-500/20 text-brand-800',
};

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

const statusLabels: Record<AppointmentStatus, { label: string; tone: keyof typeof tones }> = {
  pending: { label: 'In attesa', tone: 'pending' },
  confirmed: { label: 'Confermato', tone: 'confirmed' },
  cancelled: { label: 'Cancellato', tone: 'cancelled' },
  completed: { label: 'Completato', tone: 'completed' },
  no_show: { label: 'Assente', tone: 'no_show' },
  rescheduled: { label: 'Riprogrammato', tone: 'rescheduled' },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { label, tone } = statusLabels[status];
  return <Badge tone={tone}>{label}</Badge>;
}
