import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertCircle, CalendarDays, Check, ChevronLeft, Clock, MapPin, Users } from 'lucide-react';
import { clsx } from 'clsx';

import { useAuth } from '@/context/AuthContext';
import { useLocations } from '@/hooks/useLocations';
import { useServices } from '@/hooks/useServices';
import { useStaff } from '@/hooks/useStaff';
import { ServiceCard } from '@/components/ServiceCard';
import { StaffCard } from '@/components/StaffCard';
import { Calendar } from '@/components/Calendar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';

import { computeAvailableSlots, bookingDateBounds, type TimeSlot } from '@/utils/availability';
import { fetchStaffAvailability, fetchClosuresForDate } from '@/lib/scheduling';
import { fetchDayConfirmedAppointments, createAppointment } from '@/lib/appointments';
import { formatDate, formatDuration, formatPrice } from '@/utils/format';
import { salonConfig } from '@/config/salonConfig';
import { isLocationBookableOnDate } from '@/utils/locations';
import type { Location, Service } from '@/types/database';

const ANY_STAFF = 'any';
const steps = ['Sede', 'Categoria', 'Servizio', 'Operatore', 'Data & Ora', 'Conferma'];

export function Booking() {
  const { session } = useAuth();
  const navigate = useNavigate();

  const { locations, loading: loadingLocations } = useLocations(true);
  const { services, loading: loadingServices } = useServices();
  const { staff, loading: loadingStaff } = useStaff();

  const [step, setStep] = useState(0);
  const [location, setLocation] = useState<Location | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [staffChoice, setStaffChoice] = useState<string>(ANY_STAFF);
  const [date, setDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slot, setSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { min, max } = bookingDateBounds();

  const locationServices = useMemo(
    () =>
      location
        ? services.filter((s) => !s.location_ids?.length || s.location_ids.includes(location.id))
        : [],
    [location, services]
  );

  const categories = useMemo(
    () => Array.from(new Set(locationServices.map((s) => s.category))),
    [locationServices]
  );

  const categoryServices = useMemo(
    () => (category ? locationServices.filter((s) => s.category === category) : locationServices),
    [category, locationServices]
  );

  const compatibleStaff = useMemo(
    () =>
      service && location
        ? staff.filter(
            (s) =>
              (!s.location_ids?.length || s.location_ids.includes(location.id)) &&
              (!s.service_ids?.length || s.service_ids.includes(service.id)) &&
              (!service.staff_ids?.length || service.staff_ids.includes(s.id))
          )
        : [],
    [location, service, staff]
  );

  const loadSlots = useCallback(async () => {
    if (!service || !date || !location) return;
    setLoadingSlots(true);
    setSlot(null);
    try {
      if (!isLocationBookableOnDate(location, date)) {
        setSlots([]);
        return;
      }
      const candidates =
        staffChoice === ANY_STAFF
          ? compatibleStaff
          : compatibleStaff.filter((s) => s.id === staffChoice);
      const staffIds = candidates.map((s) => s.id);
      const [availability, closures, appointments] = await Promise.all([
        fetchStaffAvailability(staffIds),
        fetchClosuresForDate(date, location.id),
        fetchDayConfirmedAppointments(date),
      ]);
      const computed = computeAvailableSlots({
        date,
        serviceDuration: service.duration_minutes,
        locationId: location.id,
        serviceId: service.id,
        staff: candidates,
        availability,
        appointments,
        closures,
      });
      setSlots(computed);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore nel calcolo disponibilità');
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [service, date, location, staffChoice, compatibleStaff]);

  useEffect(() => {
    if (step === 4 && date) void loadSlots();
  }, [step, date, loadSlots]);

  const handleConfirm = async () => {
    if (submitting) return;
    if (!service || !slot || !location) return;
    if (!session) {
      toast('Accedi per completare la prenotazione');
      navigate('/login', { state: { from: '/prenota' } });
      return;
    }
    if (!isLocationBookableOnDate(location, new Date(slot.start))) {
      toast.error('La sede selezionata non è prenotabile nella data scelta.');
      setStep(0);
      return;
    }
    setSubmitting(true);
    try {
      const candidates =
        staffChoice === ANY_STAFF
          ? compatibleStaff
          : compatibleStaff.filter((s) => s.id === staffChoice);
      const staffIds = candidates.map((s) => s.id);
      const [availability, closures, appointments] = await Promise.all([
        fetchStaffAvailability(staffIds),
        fetchClosuresForDate(new Date(slot.start), location.id),
        fetchDayConfirmedAppointments(new Date(slot.start)),
      ]);
      const freshSlots = computeAvailableSlots({
        date: new Date(slot.start),
        serviceDuration: service.duration_minutes,
        locationId: location.id,
        serviceId: service.id,
        staff: candidates,
        availability,
        appointments,
        closures,
      });
      const stillAvailable = freshSlots.some(
        (fresh) => fresh.start === slot.start && fresh.staffId === slot.staffId
      );
      if (!stillAvailable) {
        throw new Error('Questo orario non è più disponibile. Scegli un altro slot.');
      }
      await createAppointment({
        clientId: session.user.id,
        staffId: slot.staffId,
        serviceId: service.id,
        locationId: location.id,
        startsAt: slot.start,
        endsAt: slot.end,
        price: service.price,
        notes,
        createdBy: session.user.id,
      });
      toast.success('Prenotazione demo confermata');
      navigate('/dashboard/appuntamenti');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore durante la prenotazione');
      setStep(4);
      void loadSlots();
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStaffName =
    staffChoice === ANY_STAFF
      ? 'Qualsiasi operatore disponibile'
      : staff.find((s) => s.id === staffChoice)?.full_name ?? '';

  const canNext =
    (step === 0 && location) ||
    (step === 1 && category) ||
    (step === 2 && service) ||
    (step === 3 && staffChoice) ||
    (step === 4 && slot) ||
    step === 5;

  return (
    <div className="container-page py-10 sm:section">
      <div className="mx-auto max-w-5xl">
        <h1 className="heading-serif text-center text-3xl text-brand-900 sm:text-4xl">Prenota il tuo appuntamento</h1>
        <p className="mx-auto mt-3 max-w-2xl rounded-xl border border-accent-500/30 bg-accent-500/10 px-4 py-3 text-center text-sm text-brand-700">
          <AlertCircle className="mr-1 inline h-4 w-4" />
          {salonConfig.booking.demoBookingMessage}
        </p>

        <div className="mx-auto mt-8 max-w-4xl">
          <div className="flex items-center justify-between">
            {steps.map((label, i) => (
              <div key={label} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={clsx(
                      'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition sm:h-9 sm:w-9 sm:text-sm',
                      i < step && 'bg-brand-700 text-white',
                      i === step && 'bg-accent-500 text-brand-900 ring-4 ring-accent-500/25',
                      i > step && 'bg-brand-100 text-brand-400'
                    )}
                  >
                    {i < step ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className="mt-1.5 hidden text-xs font-medium text-brand-500 sm:block">
                    {label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={clsx('mx-1 h-0.5 flex-1 sm:mx-2', i < step ? 'bg-brand-700' : 'bg-brand-100')} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          {step === 0 &&
            (loadingLocations ? (
              <LoadingState />
            ) : locations.length === 0 ? (
              <EmptyState title="Nessuna sede prenotabile" description="Attiva almeno una sede dalla dashboard." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {locations.map((l) => (
                  <Card
                    as="button"
                    key={l.id}
                    hover
                    onClick={() => {
                      setLocation(l);
                      setCategory(null);
                      setService(null);
                      setStaffChoice(ANY_STAFF);
                      setSlot(null);
                      setStep(1);
                    }}
                    className={clsx('cursor-pointer', location?.id === l.id && 'ring-2 ring-brand-500')}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-brand-900">{l.name}</h3>
                        <p className="mt-1 text-sm text-brand-500">{l.address}</p>
                        <p className="mt-2 text-xs text-brand-500">{l.info_message}</p>
                        {l.seasonal && (
                          <p className="mt-2 text-xs font-medium text-accent-600">Sede stagionale configurabile</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ))}

          {step === 1 &&
            (loadingServices ? (
              <LoadingState />
            ) : categories.length === 0 ? (
              <EmptyState title="Nessun servizio per questa sede" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategory(cat);
                      setService(null);
                      setStep(2);
                    }}
                    className={clsx(
                      'min-h-24 rounded-xl border bg-white px-5 py-4 text-left font-semibold text-brand-900 shadow-card transition hover:border-brand-300',
                      category === cat && 'border-brand-600 ring-2 ring-brand-500/20'
                    )}
                  >
                    {cat}
                    <span className="mt-1 block text-sm font-normal text-brand-500">
                      {locationServices.filter((s) => s.category === cat).length} servizi
                    </span>
                  </button>
                ))}
              </div>
            ))}

          {step === 2 &&
            (loadingServices ? (
              <LoadingState />
            ) : categoryServices.length === 0 ? (
              <EmptyState title="Nessun servizio disponibile" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {categoryServices.map((s) => (
                  <ServiceCard
                    key={s.id}
                    service={s}
                    selected={service?.id === s.id}
                    onSelect={(sv) => {
                      setService(sv);
                      setStaffChoice(ANY_STAFF);
                      setSlot(null);
                      setStep(3);
                    }}
                  />
                ))}
              </div>
            ))}

          {step === 3 &&
            (loadingStaff ? (
              <LoadingState />
            ) : compatibleStaff.length === 0 ? (
              <EmptyState title="Nessun operatore compatibile" description="Modifica servizio, sede o abilitazioni in dashboard." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Card
                  hover
                  onClick={() => {
                    setStaffChoice(ANY_STAFF);
                    setStep(4);
                  }}
                  className={clsx('cursor-pointer', staffChoice === ANY_STAFF && 'ring-2 ring-brand-500')}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-500 text-brand-900">
                      <Users className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-brand-900">Qualsiasi operatore disponibile</h3>
                      <p className="text-sm text-brand-500">Il sistema assegna il primo operatore libero e compatibile.</p>
                    </div>
                  </div>
                </Card>
                {compatibleStaff.map((m) => (
                  <StaffCard
                    key={m.id}
                    staff={m}
                    selected={staffChoice === m.id}
                    onSelect={(st) => {
                      setStaffChoice(st.id);
                      setStep(4);
                    }}
                  />
                ))}
              </div>
            ))}

          {step === 4 && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
              <Calendar value={date} onChange={setDate} minDate={min} maxDate={max} />
              <div>
                <h3 className="heading-serif text-lg text-brand-900">
                  {date ? `Orari disponibili - ${formatDate(date.toISOString())}` : 'Seleziona una data'}
                </h3>
                {!date ? (
                  <p className="mt-4 text-sm text-brand-400">
                    Scegli un giorno sul calendario per vedere gli orari liberi.
                  </p>
                ) : loadingSlots ? (
                  <LoadingState label="Calcolo disponibilità..." />
                ) : slots.length === 0 ? (
                  <EmptyState
                    title="Nessuno slot libero"
                    description="Prova un altro giorno, un altro operatore o verifica sede e orari."
                  />
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-2 min-[380px]:grid-cols-3 sm:grid-cols-4">
                    {slots.map((s) => (
                      <button
                        key={s.label}
                        onClick={() => setSlot(s)}
                        className={clsx(
                          'rounded-xl border py-2.5 text-sm font-medium transition',
                          slot?.label === s.label
                            ? 'border-brand-700 bg-brand-700 text-white'
                            : 'border-brand-200 bg-white text-brand-700 hover:border-brand-400'
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 5 && service && slot && date && location && (
            <Card className="mx-auto max-w-2xl">
              <h3 className="heading-serif text-xl text-brand-900">Riepilogo prenotazione</h3>
              <dl className="mt-6 space-y-4">
                <Row label="Sede" value={location.name} />
                <Row label="Indirizzo" value={location.address} />
                <Row label="Servizio" value={service.name} />
                <Row
                  label="Durata"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-4 w-4 text-brand-400" />
                      {formatDuration(service.duration_minutes)}
                    </span>
                  }
                />
                <Row label="Operatore" value={selectedStaffName} />
                <Row
                  label="Data e ora"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-4 w-4 text-brand-400" />
                      {formatDate(slot.start)} - {slot.label}
                    </span>
                  }
                />
                <Row label="Regole cancellazione" value={salonConfig.booking.cancellationPolicyText} />
                <div>
                  <label className="label-base" htmlFor="booking-notes">Note per il salone</label>
                  <textarea
                    id="booking-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="input-base"
                    placeholder="Eventuali preferenze o informazioni utili"
                  />
                </div>
                <div className="border-t border-brand-100 pt-4">
                  <Row
                    label="Totale indicativo"
                    value={
                      <span className="text-lg font-bold text-brand-900">
                        {service.price_from ? 'da ' : ''}{formatPrice(service.price)}
                      </span>
                    }
                  />
                </div>
              </dl>

              {!session && (
                <p className="mt-5 rounded-xl bg-accent-500/15 px-4 py-3 text-sm text-brand-700">
                  Per confermare devi{' '}
                  <Link to="/login" state={{ from: '/prenota' }} className="font-semibold underline">
                    fare login
                  </Link>
                  .
                </p>
              )}

              <Button className="mt-6" size="lg" fullWidth loading={submitting} onClick={handleConfirm}>
                Conferma prenotazione demo
              </Button>
            </Card>
          )}
        </div>

        <div className="sticky bottom-0 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-brand-100 bg-brand-50/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-0">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex-1 sm:flex-none"
          >
            <ChevronLeft className="h-4 w-4" /> Indietro
          </Button>
          {step < 5 && (
            <Button onClick={() => canNext && setStep((s) => s + 1)} disabled={!canNext} className="flex-1 sm:flex-none">
              Continua
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <dt className="text-sm text-brand-500">{label}</dt>
      <dd className="text-sm font-medium text-brand-900 sm:max-w-[70%] sm:text-right">{value}</dd>
    </div>
  );
}
