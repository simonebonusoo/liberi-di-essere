import { Link } from 'react-router-dom';
import { CalendarPlus, CalendarCheck, Clock, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useClientAppointments } from '@/hooks/useClientAppointments';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatTime } from '@/utils/format';

export function ClientDashboard() {
  const { profile } = useAuth();
  const { upcoming, past, loading } = useClientAppointments();
  const next = upcoming[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="heading-serif text-3xl text-brand-900">
            Ciao, {profile?.full_name?.split(' ')[0] || 'cliente'} 👋
          </h1>
          <p className="mt-1 text-brand-500">Ecco un riepilogo del tuo account.</p>
        </div>
        <Link to="/prenota">
          <Button variant="secondary">
            <CalendarPlus className="h-4 w-4" /> Nuova prenotazione
          </Button>
        </Link>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={CalendarCheck} label="Prossimi appuntamenti" value={upcoming.length} />
            <StatCard icon={Clock} label="Appuntamenti passati" value={past.length} />
            <StatCard
              icon={User}
              label="Profilo"
              value={profile?.phone ? 'Completo' : 'Da completare'}
              small
            />
          </div>

          {/* Prossimo appuntamento */}
          <div>
            <h2 className="heading-serif mb-4 text-xl text-brand-900">Il tuo prossimo appuntamento</h2>
            {next ? (
              <Card className="bg-brand-900 text-white">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-brand-300">{next.service?.name}</p>
                    <p className="heading-serif mt-1 text-2xl text-white">
                      {formatDate(next.starts_at)}
                    </p>
                    <p className="mt-1 text-accent-400">
                      Ore {formatTime(next.starts_at)} · {next.staff?.full_name}
                    </p>
                  </div>
                  <Link to="/dashboard/appuntamenti">
                    <Button variant="secondary" size="sm">
                      Gestisci
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <EmptyState
                title="Nessun appuntamento in programma"
                description="Prenota ora il tuo prossimo trattamento."
                action={
                  <Link to="/prenota">
                    <Button>Prenota ora</Button>
                  </Link>
                }
              />
            )}
          </div>

          {/* Recap profilo */}
          <div>
            <h2 className="heading-serif mb-4 text-xl text-brand-900">I tuoi dati</h2>
            <Card>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome" value={profile?.full_name || '—'} />
                <Field label="Email" value={profile?.email || '—'} />
                <Field label="Telefono" value={profile?.phone || 'Non impostato'} />
                <Field label="Cliente dal" value={profile ? formatDate(profile.created_at) : '—'} />
              </dl>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  small,
}: {
  icon: typeof Clock;
  label: string;
  value: string | number;
  small?: boolean;
}) {
  return (
    <Card className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-brand-500">{label}</p>
        <p className={small ? 'text-lg font-semibold text-brand-900' : 'text-2xl font-bold text-brand-900'}>
          {value}
        </p>
      </div>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-brand-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-brand-900">{value}</dd>
    </div>
  );
}
