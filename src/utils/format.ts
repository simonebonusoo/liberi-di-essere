import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function formatDate(iso: string): string {
  return format(parseISO(iso), 'EEEE d MMMM yyyy', { locale: it });
}

export function formatDateShort(iso: string): string {
  return format(parseISO(iso), 'dd/MM/yyyy', { locale: it });
}

export function formatTime(iso: string): string {
  return format(parseISO(iso), 'HH:mm', { locale: it });
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), "d MMM yyyy 'alle' HH:mm", { locale: it });
}

/** Iniziali per avatar placeholder. */
export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}
