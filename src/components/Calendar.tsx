import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface CalendarProps {
  value: Date | null;
  onChange: (date: Date) => void;
  /** Ritorna true se il giorno NON è selezionabile. */
  isDateDisabled?: (date: Date) => boolean;
  minDate?: Date;
  maxDate?: Date;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export function Calendar({ value, onChange, isDateDisabled, minDate, maxDate }: CalendarProps) {
  const [cursor, setCursor] = useState<Date>(value ?? new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const disabled = (d: Date): boolean => {
    if (minDate && isBefore(d, minDate)) return true;
    if (maxDate && isBefore(maxDate, d)) return true;
    if (isDateDisabled?.(d)) return true;
    return false;
  };

  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor((c) => addMonths(c, -1))}
          className="rounded-lg p-1.5 text-brand-600 transition hover:bg-brand-100"
          aria-label="Mese precedente"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="heading-serif text-base capitalize text-brand-900">
          {format(cursor, 'MMMM yyyy', { locale: it })}
        </span>
        <button
          type="button"
          onClick={() => setCursor((c) => addMonths(c, 1))}
          className="rounded-lg p-1.5 text-brand-600 transition hover:bg-brand-100"
          aria-label="Mese successivo"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center text-xs font-semibold text-brand-400">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const isDisabled = disabled(d);
          const selected = value && isSameDay(d, value);
          const outside = !isSameMonth(d, cursor);
          const isToday = isSameDay(d, today);
          return (
            <button
              key={d.toISOString()}
              type="button"
              disabled={isDisabled}
              onClick={() => onChange(d)}
              className={clsx(
                'flex h-10 items-center justify-center rounded-lg text-sm transition',
                selected && 'bg-brand-700 font-semibold text-white',
                !selected && !isDisabled && 'text-brand-800 hover:bg-brand-100',
                !selected && isToday && 'ring-1 ring-brand-300',
                outside && !selected && 'text-brand-300',
                isDisabled && 'cursor-not-allowed text-brand-200 line-through'
              )}
            >
              {format(d, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
