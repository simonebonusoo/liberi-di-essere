import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarPlus } from 'lucide-react';
import { clsx } from 'clsx';
import { useClientAppointments } from '@/hooks/useClientAppointments';
import { AppointmentCard } from '@/components/AppointmentCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { cancelAppointment } from '@/lib/appointments';
import type { AppointmentWithRelations } from '@/types/database';

type Tab = 'upcoming' | 'past';

export function ClientAppointments() {
  const { upcoming, past, loading, refetch } = useClientAppointments();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [toCancel, setToCancel] = useState<AppointmentWithRelations | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const list = tab === 'upcoming' ? upcoming : past;
  const highlightedId = searchParams.get('appointment');

  useEffect(() => {
    if (!highlightedId || loading) return;
    if (past.some((a) => a.id === highlightedId)) setTab('past');
    else if (upcoming.some((a) => a.id === highlightedId)) setTab('upcoming');
  }, [highlightedId, loading, past, upcoming]);

  const confirmCancel = async () => {
    if (!toCancel) return;
    setCancelling(true);
    try {
      await cancelAppointment(toCancel.id);
      toast.success('Appuntamento cancellato');
      setToCancel(null);
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore durante la cancellazione');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="heading-serif text-3xl text-brand-900">I miei appuntamenti</h1>
        <Link to="/prenota">
          <Button variant="secondary">
            <CalendarPlus className="h-4 w-4" /> Prenota
          </Button>
        </Link>
      </div>

      <div className="inline-flex rounded-xl bg-brand-100 p-1">
        {(['upcoming', 'past'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'rounded-lg px-4 py-2 text-sm font-medium transition',
              tab === t ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-500'
            )}
          >
            {t === 'upcoming' ? `Prossimi (${upcoming.length})` : `Storico (${past.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : list.length === 0 ? (
        <EmptyState
          title={tab === 'upcoming' ? 'Nessun appuntamento in programma' : 'Nessuno storico'}
          description={tab === 'upcoming' ? 'Prenota il tuo prossimo trattamento.' : undefined}
          action={
            tab === 'upcoming' ? (
              <Link to="/prenota">
                <Button>Prenota ora</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((a) => (
            <div key={a.id} id={`appointment-${a.id}`}>
              <AppointmentCard appointment={a} onCancel={setToCancel} highlighted={highlightedId === a.id} />
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(toCancel)}
        onClose={() => setToCancel(null)}
        title="Confermi la cancellazione?"
      >
        <p className="text-sm text-brand-600">
          Stai per cancellare <strong>{toCancel?.service?.name}</strong>. L'operazione non è
          reversibile.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setToCancel(null)}>
            Annulla
          </Button>
          <Button variant="danger" loading={cancelling} onClick={confirmCancel}>
            Sì, cancella
          </Button>
        </div>
      </Modal>
    </div>
  );
}
