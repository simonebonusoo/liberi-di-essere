import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import type { AppointmentStatus } from '@/types/database';

const tones = {
  confirmed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-brand-200 text-brand-800',
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
  confirmed: { label: 'Confermato', tone: 'confirmed' },
  cancelled: { label: 'Cancellato', tone: 'cancelled' },
  completed: { label: 'Completato', tone: 'completed' },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { label, tone } = statusLabels[status];
  return <Badge tone={tone}>{label}</Badge>;
}
