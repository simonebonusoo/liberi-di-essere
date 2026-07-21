import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, CalendarOff, RotateCcw, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';
import { resetLocalDemoData } from '@/lib/localClient';
import { useStaff } from '@/hooks/useStaff';
import { useLocations } from '@/hooks/useLocations';
import { fetchStaffAvailability, fetchAllClosures } from '@/lib/scheduling';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateShort } from '@/utils/format';
import type { Location, SalonClosure, StaffAvailability } from '@/types/database';

const WEEKDAYS = [
  { value: 1, label: 'Lunedì' },
  { value: 2, label: 'Martedì' },
  { value: 3, label: 'Mercoledì' },
  { value: 4, label: 'Giovedì' },
  { value: 5, label: 'Venerdì' },
  { value: 6, label: 'Sabato' },
  { value: 0, label: 'Domenica' },
];

export function AdminSettings() {
  const { staff } = useStaff(false);
  const { locations, refetch: refetchLocations } = useLocations(false);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [availability, setAvailability] = useState<StaffAvailability[]>([]);
  const [closures, setClosures] = useState<SalonClosure[]>([]);
  const [loading, setLoading] = useState(true);

  // Form nuova finestra oraria
  const [newDay, setNewDay] = useState('2');
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('18:00');

  // Form nuova chiusura
  const [closureStaff, setClosureStaff] = useState('');
  const [closureStart, setClosureStart] = useState('');
  const [closureEnd, setClosureEnd] = useState('');
  const [closureReason, setClosureReason] = useState('Chiusura');

  useEffect(() => {
    if (staff.length && !selectedStaff) setSelectedStaff(staff[0].id);
  }, [staff, selectedStaff]);

  useEffect(() => {
    if (locations.length && !selectedLocation) setSelectedLocation(locations[0].id);
  }, [locations, selectedLocation]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [av, cl] = await Promise.all([fetchStaffAvailability(), fetchAllClosures()]);
    setAvailability(av);
    setClosures(cl);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const staffAvailability = availability
    .filter((a) => a.staff_id === selectedStaff)
    .sort((a, b) => {
      const order = [1, 2, 3, 4, 5, 6, 0];
      return order.indexOf(a.weekday) - order.indexOf(b.weekday) ||
        a.start_time.localeCompare(b.start_time);
    });

  const addWindow = async () => {
    if (!selectedStaff) return toast.error('Seleziona uno stylist');
    if (newEnd <= newStart) return toast.error('L\'orario di fine deve essere dopo l\'inizio');
    const { error } = await supabase.from('staff_availability').insert({
      staff_id: selectedStaff,
      location_id: selectedLocation || null,
      weekday: Number(newDay),
      start_time: newStart,
      end_time: newEnd,
    });
    if (error) return toast.error(error.message);
    toast.success('Fascia oraria aggiunta');
    await loadData();
  };

  const removeWindow = async (id: string) => {
    const { error } = await supabase.from('staff_availability').delete().eq('id', id);
    if (error) return toast.error(error.message);
    setAvailability((prev) => prev.filter((a) => a.id !== id));
  };

  const addClosure = async () => {
    if (!closureStart || !closureEnd) return toast.error('Inserisci le date');
    if (closureEnd < closureStart) return toast.error('Data fine non valida');
    const { error } = await supabase.from('salon_closures').insert({
      staff_id: closureStaff || null,
      location_id: selectedLocation || null,
      start_date: closureStart,
      end_date: closureEnd,
      reason: closureReason || 'Chiusura',
    });
    if (error) return toast.error(error.message);
    toast.success('Chiusura aggiunta');
    setClosureStart('');
    setClosureEnd('');
    await loadData();
  };

  const removeClosure = async (id: string) => {
    const { error } = await supabase.from('salon_closures').delete().eq('id', id);
    if (error) return toast.error(error.message);
    setClosures((prev) => prev.filter((c) => c.id !== id));
  };

  const updateLocation = async (location: Location, patch: Partial<Location>) => {
    const { error } = await supabase.from('locations').update(patch).eq('id', location.id);
    if (error) return toast.error(error.message);
    toast.success('Sede aggiornata');
    await refetchLocations();
  };

  const resetDemo = () => {
    if (!window.confirm('Ripristinare tutti i dati demo locali? Verrai disconnesso.')) return;
    resetLocalDemoData();
    toast.success('Demo ripristinata. Ricarico la pagina...');
    window.setTimeout(() => window.location.assign('/login'), 700);
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading-serif text-3xl text-brand-900">Impostazioni operative</h1>
        <p className="mt-1 text-brand-500">Gestisci sedi, orari, chiusure e strumenti demo.</p>
      </div>

      <Card>
        <h2 className="heading-serif text-xl text-brand-900">Sedi</h2>
        <p className="mt-1 text-sm text-brand-500">
          Copertino usa il CAP 73043. Sant'Isidoro resta con indirizzo provvisorio finché il cliente non fornisce quello esatto.
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {locations.map((l) => (
            <div key={l.id} className="rounded-xl border border-brand-100 bg-brand-50 p-4">
              <div className="mb-3 flex items-start gap-3">
                <MapPin className="mt-1 h-4 w-4 text-brand-500" />
                <div>
                  <h3 className="font-semibold text-brand-900">{l.name}</h3>
                  <p className="text-xs text-brand-500">{l.seasonal ? 'Sede stagionale' : 'Sede principale'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <Input
                  label="Nome"
                  value={l.name}
                  onChange={(e) => updateLocation(l, { name: e.target.value })}
                />
                <Input
                  label="Indirizzo"
                  value={l.address}
                  onChange={(e) => updateLocation(l, { address: e.target.value })}
                />
                <Input
                  label="Messaggio informativo"
                  value={l.info_message}
                  onChange={(e) => updateLocation(l, { info_message: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Apertura stagionale"
                    type="date"
                    value={l.season_start ?? ''}
                    onChange={(e) => updateLocation(l, { season_start: e.target.value || null })}
                  />
                  <Input
                    label="Chiusura stagionale"
                    type="date"
                    value={l.season_end ?? ''}
                    onChange={(e) => updateLocation(l, { season_end: e.target.value || null })}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-brand-700">
                  <input
                    type="checkbox"
                    checked={l.active}
                    onChange={(e) => updateLocation(l, { active: e.target.checked })}
                    className="h-4 w-4 rounded border-brand-300"
                  />
                  Prenotabile
                </label>
                {l.seasonal && (
                  <label className="flex items-center gap-2 text-sm text-brand-700">
                    <input
                      type="checkbox"
                      checked={l.show_when_inactive}
                      onChange={(e) => updateLocation(l, { show_when_inactive: e.target.checked })}
                      className="h-4 w-4 rounded border-brand-300"
                    />
                    Mostra come prossimamente disponibile
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ORARI DI LAVORO */}
      <Card>
        <h2 className="heading-serif text-xl text-brand-900">Orari di lavoro per stylist</h2>
        <div className="mt-4 max-w-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Stylist"
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              options={staff.map((s) => ({ value: s.id, label: s.full_name }))}
            />
            <Select
              label="Sede"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              options={locations.map((l) => ({ value: l.id, label: l.name }))}
            />
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {staffAvailability.length === 0 ? (
            <p className="text-sm text-brand-400">Nessuna fascia oraria impostata per questo stylist.</p>
          ) : (
            staffAvailability.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-2.5"
              >
                <span className="text-sm font-medium text-brand-800">
                  {WEEKDAYS.find((w) => w.value === a.weekday)?.label}
                </span>
                <span className="text-sm text-brand-600">
                  {locations.find((l) => l.id === a.location_id)?.name ?? 'Tutte le sedi'} · {a.start_time.slice(0, 5)} - {a.end_time.slice(0, 5)}
                </span>
                <button
                  onClick={() => removeWindow(a.id)}
                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                  aria-label="Rimuovi fascia"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 grid gap-3 border-t border-brand-100 pt-5 sm:grid-cols-4">
          <Select
            label="Giorno"
            value={newDay}
            onChange={(e) => setNewDay(e.target.value)}
            options={WEEKDAYS.map((w) => ({ value: String(w.value), label: w.label }))}
          />
          <Input label="Dalle" type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
          <Input label="Alle" type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
          <div className="flex items-end">
            <Button fullWidth onClick={addWindow}>
              <Plus className="h-4 w-4" /> Aggiungi
            </Button>
          </div>
        </div>
      </Card>

      {!isSupabaseConfigured && (
        <Card>
          <h2 className="heading-serif text-xl text-brand-900">Reset ambiente demo</h2>
          <p className="mt-1 text-sm text-brand-500">
            Ripristina operatori, servizi, sedi, orari, clienti, appuntamenti e notifiche demo.
          </p>
          <Button className="mt-4" variant="danger" onClick={resetDemo}>
            <RotateCcw className="h-4 w-4" /> Ripristina dati demo
          </Button>
        </Card>
      )}

      {/* CHIUSURE / FERIE */}
      <Card>
        <h2 className="heading-serif text-xl text-brand-900">Chiusure e ferie</h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-5">
          <Select
            label="Ambito"
            value={closureStaff}
            onChange={(e) => setClosureStaff(e.target.value)}
            placeholder="Intero salone"
            options={staff.map((s) => ({ value: s.id, label: s.full_name }))}
          />
          <Input
            label="Dal"
            type="date"
            value={closureStart}
            onChange={(e) => setClosureStart(e.target.value)}
          />
          <Input
            label="Al"
            type="date"
            value={closureEnd}
            onChange={(e) => setClosureEnd(e.target.value)}
          />
          <Input
            label="Motivo"
            value={closureReason}
            onChange={(e) => setClosureReason(e.target.value)}
          />
          <div className="flex items-end">
            <Button fullWidth onClick={addClosure}>
              <Plus className="h-4 w-4" /> Aggiungi
            </Button>
          </div>
        </div>

        <div className="mt-6">
          {closures.length === 0 ? (
            <EmptyState
              title="Nessuna chiusura programmata"
              icon={<CalendarOff className="h-7 w-7" />}
            />
          ) : (
            <div className="space-y-2">
              {closures.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-brand-800">{c.reason}</p>
                    <p className="text-xs text-brand-500">
                      {formatDateShort(c.start_date)} → {formatDateShort(c.end_date)} ·{' '}
                      {c.staff_id
                        ? staff.find((s) => s.id === c.staff_id)?.full_name ?? 'Stylist'
                        : 'Intero salone'}
                    </p>
                  </div>
                  <button
                    onClick={() => removeClosure(c.id)}
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                    aria-label="Rimuovi chiusura"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
