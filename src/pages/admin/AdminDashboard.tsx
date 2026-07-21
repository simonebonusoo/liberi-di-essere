import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CalendarRange,
  TrendingUp,
  XCircle,
  Scissors,
  ArrowRight,
} from 'lucide-react';
import { startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';
import { fetchAppointmentsInRange } from '@/lib/appointments';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice, formatTime } from '@/utils/format';
import type { AppointmentWithRelations } from '@/types/database';

interface Stats {
  today: number;
  week: number;
  revenue: number;
  cancellations: number;
  topService: string;
}

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [todayList, setTodayList] = useState<AppointmentWithRelations[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const appts = await fetchAppointmentsInRange(
        weekStart.toISOString(),
        weekEnd.toISOString()
      );

      const todayStart = startOfDay(now).getTime();
      const todayEnd = endOfDay(now).getTime();
      const confirmed = appts.filter((a) => a.status !== 'cancelled');

      const today = confirmed.filter((a) => {
        const t = new Date(a.starts_at).getTime();
        return t >= todayStart && t <= todayEnd;
      });

      // servizio più richiesto della settimana
      const counts = new Map<string, number>();
      confirmed.forEach((a) => {
        const name = a.service?.name ?? '—';
        counts.set(name, (counts.get(name) ?? 0) + 1);
      });
      const topService =
        [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

      setStats({
        today: today.length,
        week: confirmed.length,
        revenue: confirmed.reduce((sum, a) => sum + Number(a.price), 0),
        cancellations: appts.filter((a) => a.status === 'cancelled').length,
        topService,
      });
      setTodayList(
        today.sort((a, b) => a.starts_at.localeCompare(b.starts_at))
      );
      setLoading(false);
    };
    void load();
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading-serif text-3xl text-brand-900">Dashboard</h1>
        <p className="mt-1 text-brand-500">Panoramica settimanale del salone.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat icon={CalendarDays} label="Oggi" value={stats?.today ?? 0} />
        <Stat icon={CalendarRange} label="Questa settimana" value={stats?.week ?? 0} />
        <Stat icon={TrendingUp} label="Ricavi stimati (7gg)" value={formatPrice(stats?.revenue ?? 0)} />
        <Stat icon={XCircle} label="Cancellazioni (7gg)" value={stats?.cancellations ?? 0} />
        <Stat icon={Scissors} label="Servizio top" value={stats?.topService ?? '—'} small />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="heading-serif text-xl text-brand-900">Appuntamenti di oggi</h2>
          <Link to="/admin/calendario">
            <Button variant="ghost" size="sm">
              Vedi calendario <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        {todayList.length === 0 ? (
          <EmptyState title="Nessun appuntamento oggi" />
        ) : (
          <Card padded={false} className="divide-y divide-brand-100">
            {todayList.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 text-center">
                    <p className="heading-serif text-lg text-brand-900">{formatTime(a.starts_at)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-brand-900">{a.service?.name}</p>
                    <p className="text-sm text-brand-500">
                      {a.client?.full_name || a.client?.email} · {a.staff?.full_name}
                    </p>
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  small,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string | number;
  small?: boolean;
}) {
  return (
    <Card className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-brand-500">{label}</p>
        <p className={small ? 'truncate text-base font-semibold text-brand-900' : 'text-xl font-bold text-brand-900'}>
          {value}
        </p>
      </div>
    </Card>
  );
}
