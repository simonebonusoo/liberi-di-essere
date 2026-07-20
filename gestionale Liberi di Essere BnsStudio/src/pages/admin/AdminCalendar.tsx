import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { addDays, format } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react';
import { clsx } from 'clsx';

import { supabase } from '@/lib/supabase';
import { useServices } from '@/hooks/useServices';
import { useStaff } from '@/hooks/useStaff';
import { useAuth } from '@/context/AuthContext';
import {
  fetchAppointmentsInRange,
  createAppointment,
  cancelAppointment,
  updateAppointmentStatus,
} from '@/lib/appointments';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice, formatTime } from '@/utils/format';
import type { AppointmentStatus, AppointmentWithRelations, Profile } from '@/types/database';

export function AdminCalendar() {
  const { profile } = useAuth();
  const { services } = useServices(false);
  const { staff } = useStaff(false);

  const [day, setDay] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffFilter, setStaffFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detail, setDetail] = useState<AppointmentWithRelations | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);
    try {
      const data = await fetchAppointmentsInRange(start.toISOString(), end.toISOString());
      setAppointments(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore caricamento');
    } finally {
      setLoading(false);
    }
  }, [day]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () =>
      appointments.filter(
        (a) =>
          (staffFilter === 'all' || a.staff_id === staffFilter) &&
          (statusFilter === 'all' || a.status === statusFilter)
      ),
    [appointments, staffFilter, statusFilter]
  );

  const handleCancel = async (a: AppointmentWithRelations) => {
    try {
      await cancelAppointment(a.id);
      toast.success('Appuntamento cancellato');
      setDetail(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore');
    }
  };

  const handleStatus = async (a: AppointmentWithRelations, status: AppointmentStatus) => {
    try {
      await updateAppointmentStatus(a.id, status);
      toast.success('Stato aggiornato');
      setDetail(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="heading-serif text-3xl text-brand-900">Calendario</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Nuovo appuntamento
        </Button>
      </div>

      {/* Barra data + filtri */}
      <Card className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDay((d) => addDays(d, -1))}
            className="rounded-lg p-2 text-brand-600 hover:bg-brand-100"
            aria-label="Giorno precedente"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 rounded-xl bg-brand-100 px-3 py-2">
            <CalendarDays className="h-4 w-4 text-brand-500" />
            <span className="text-sm font-medium capitalize text-brand-900">
              {format(day, 'EEEE d MMMM yyyy', { locale: it })}
            </span>
          </div>
          <button
            onClick={() => setDay((d) => addDays(d, 1))}
            className="rounded-lg p-2 text-brand-600 hover:bg-brand-100"
            aria-label="Giorno successivo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <Button variant="ghost" size="sm" onClick={() => setDay(new Date())}>
            Oggi
          </Button>
        </div>

        <div className="ml-auto flex flex-wrap gap-3">
          <Select
            aria-label="Filtra per staff"
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Tutti gli stylist' },
              ...staff.map((s) => ({ value: s.id, label: s.full_name })),
            ]}
          />
          <Select
            aria-label="Filtra per stato"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Tutti gli stati' },
              { value: 'confirmed', label: 'Confermati' },
              { value: 'completed', label: 'Completati' },
              { value: 'cancelled', label: 'Cancellati' },
            ]}
          />
        </div>
      </Card>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState title="Nessun appuntamento" description="Per questo giorno e filtri." />
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => setDetail(a)}
              className={clsx(
                'flex w-full items-center gap-4 rounded-2xl border bg-white p-4 text-left shadow-card transition hover:border-brand-300',
                a.status === 'cancelled' ? 'border-red-100 opacity-70' : 'border-brand-100'
              )}
            >
              <div className="w-16 shrink-0 text-center">
                <p className="heading-serif text-lg text-brand-900">{formatTime(a.starts_at)}</p>
                <p className="text-xs text-brand-400">→ {formatTime(a.ends_at)}</p>
              </div>
              <div className="flex-1 border-l border-brand-100 pl-4">
                <p className="font-semibold text-brand-900">{a.service?.name}</p>
                <p className="text-sm text-brand-500">
                  {a.client?.full_name || a.client?.email} · {a.staff?.full_name}
                </p>
              </div>
              <span className="font-semibold text-brand-800">{formatPrice(a.price)}</span>
              <StatusBadge status={a.status} />
            </button>
          ))}
        </div>
      )}

      {/* Dettaglio appuntamento */}
      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Dettaglio appuntamento">
        {detail && (
          <div className="space-y-4">
            <DetailRow label="Servizio" value={detail.service?.name ?? '—'} />
            <DetailRow label="Cliente" value={detail.client?.full_name || detail.client?.email || '—'} />
            <DetailRow label="Telefono" value={detail.client?.phone || '—'} />
            <DetailRow label="Stylist" value={detail.staff?.full_name ?? '—'} />
            <DetailRow
              label="Orario"
              value={`${formatTime(detail.starts_at)} – ${formatTime(detail.ends_at)}`}
            />
            <DetailRow label="Prezzo" value={formatPrice(detail.price)} />
            <DetailRow label="Stato" value={<StatusBadge status={detail.status} />} />
            {detail.notes && <DetailRow label="Note" value={detail.notes} />}

            {detail.status === 'confirmed' && (
              <div className="flex flex-wrap justify-end gap-2 border-t border-brand-100 pt-4">
                <Button variant="outline" size="sm" onClick={() => handleStatus(detail, 'completed')}>
                  Segna completato
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleCancel(detail)}>
                  Cancella
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Creazione manuale */}
      <CreateAppointmentModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultDate={day}
        services={services.filter((s) => s.active)}
        staff={staff.filter((s) => s.active)}
        adminId={profile?.id ?? ''}
        onCreated={async () => {
          setCreateOpen(false);
          await load();
        }}
      />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-brand-500">{label}</span>
      <span className="text-sm font-medium text-brand-900">{value}</span>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Modal creazione manuale appuntamento (admin)
// -----------------------------------------------------------------------------
function CreateAppointmentModal({
  open,
  onClose,
  defaultDate,
  services,
  staff,
  adminId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  defaultDate: Date;
  services: { id: string; name: string; duration_minutes: number; price: number }[];
  staff: { id: string; full_name: string }[];
  adminId: string;
  onCreated: () => void;
}) {
  const [clients, setClients] = useState<Profile[]>([]);
  const [clientId, setClientId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [date, setDate] = useState(format(defaultDate, 'yyyy-MM-dd'));
  const [time, setTime] = useState('09:00');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(format(defaultDate, 'yyyy-MM-dd'));
    supabase
      .from('profiles')
      .select('*')
      .order('full_name')
      .then(({ data }) => setClients((data ?? []) as Profile[]));
  }, [open, defaultDate]);

  const submit = async () => {
    if (!clientId || !serviceId || !staffId) {
      toast.error('Compila tutti i campi');
      return;
    }
    const service = services.find((s) => s.id === serviceId)!;
    const starts = new Date(`${date}T${time}:00`);
    const ends = new Date(starts.getTime() + service.duration_minutes * 60000);
    setSubmitting(true);
    try {
      await createAppointment({
        clientId,
        staffId,
        serviceId,
        startsAt: starts.toISOString(),
        endsAt: ends.toISOString(),
        price: service.price,
        createdBy: adminId,
        notes: 'Creato dall\'admin',
      });
      toast.success('Appuntamento creato');
      onCreated();
      setClientId('');
      setServiceId('');
      setStaffId('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nuovo appuntamento" size="md">
      <div className="space-y-4">
        <Select
          label="Cliente"
          placeholder="Seleziona cliente"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          options={clients.map((c) => ({ value: c.id, label: c.full_name || c.email }))}
        />
        <Select
          label="Servizio"
          placeholder="Seleziona servizio"
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          options={services.map((s) => ({ value: s.id, label: s.name }))}
        />
        <Select
          label="Stylist"
          placeholder="Seleziona stylist"
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          options={staff.map((s) => ({ value: s.id, label: s.full_name }))}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Ora" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Annulla
          </Button>
          <Button loading={submitting} onClick={submit}>
            Crea appuntamento
          </Button>
        </div>
      </div>
    </Modal>
  );
}
