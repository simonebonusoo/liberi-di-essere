/**
 * =============================================================================
 * LOGICA DI DISPONIBILITÀ
 * -----------------------------------------------------------------------------
 * Calcola gli slot realmente prenotabili per una data + servizio + (staff|any).
 * Regole applicate:
 *  - orari di lavoro dello staff per quel giorno della settimana
 *  - chiusure salone / ferie dello staff
 *  - niente slot nel passato
 *  - niente overlap con appuntamenti confermati dello stesso staff
 *  - durata dello slot = durata servizio (+ buffer configurabile)
 *  - passo di generazione = slotIntervalMinutes
 * Tutto lato client per una UX reattiva; il DB resta l'ultima barriera
 * (exclusion constraint anti-overlap + RLS).
 * =============================================================================
 */
import { salonConfig } from '@/config/salonConfig';
import type {
  Appointment,
  SalonClosure,
  StaffAvailability,
  StaffMember,
} from '@/types/database';

export interface TimeSlot {
  /** ISO string dell'inizio slot. */
  start: string;
  /** ISO string della fine slot (start + durata servizio). */
  end: string;
  /** "HH:MM" per la UI. */
  label: string;
  /** Staff assegnabile a questo slot (il primo libero in caso di "any"). */
  staffId: string;
}

interface ComputeParams {
  date: Date; // giorno selezionato (ora ignorata)
  serviceDuration: number; // minuti
  locationId?: string;
  serviceId?: string;
  staff: StaffMember[]; // candidati (uno solo, oppure tutti per "any")
  availability: StaffAvailability[]; // orari di TUTTI i candidati
  appointments: Appointment[]; // appuntamenti confermati del giorno (tutti gli staff candidati)
  closures: SalonClosure[]; // chiusure che intersecano il giorno
}

/** "HH:MM[:SS]" -> minuti dalla mezzanotte. */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

/** Un giorno è coperto da una chiusura? (staffId null = chiusura salone). */
function isClosed(date: Date, staffId: string, closures: SalonClosure[], locationId?: string): boolean {
  const day = ymd(date);
  return closures.some(
    (c) =>
      (c.staff_id === null || c.staff_id === staffId) &&
      (!locationId || c.location_id === null || c.location_id === locationId) &&
      day >= c.start_date &&
      day <= c.end_date
  );
}

/** Intervalli [startMin,endMin] già occupati (buffer incluso) per uno staff. */
function busyRanges(
  staffId: string,
  date: Date,
  appointments: Appointment[]
): Array<[number, number]> {
  const buffer = salonConfig.booking.bufferMinutes;
  return appointments
    .filter((a) => a.staff_id === staffId && ['pending', 'confirmed'].includes(a.status))
    .map((a) => {
      const s = new Date(a.starts_at);
      const e = new Date(a.ends_at);
      if (ymd(s) !== ymd(date)) return null;
      const startMin = s.getHours() * 60 + s.getMinutes() - buffer;
      const endMin = e.getHours() * 60 + e.getMinutes() + buffer;
      return [startMin, endMin] as [number, number];
    })
    .filter((r): r is [number, number] => r !== null);
}

function overlaps(startMin: number, endMin: number, ranges: Array<[number, number]>): boolean {
  return ranges.some(([bs, be]) => startMin < be && endMin > bs);
}

/**
 * Calcola gli slot disponibili. In caso di più staff candidati ("qualsiasi"),
 * ogni istante viene offerto una sola volta e assegnato al primo staff libero.
 */
export function computeAvailableSlots(params: ComputeParams): TimeSlot[] {
  const { date, serviceDuration, staff, availability, appointments, closures } = params;
  const { locationId, serviceId } = params;
  const step = salonConfig.booking.slotIntervalMinutes;
  const weekday = date.getDay();
  const now = new Date();
  const isToday = ymd(date) === ymd(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slotMap = new Map<string, TimeSlot>();

  for (const member of staff) {
    if (!member.active) continue;
    if (locationId && member.location_ids?.length && !member.location_ids.includes(locationId)) continue;
    if (serviceId && member.service_ids?.length && !member.service_ids.includes(serviceId)) continue;
    if (isClosed(date, member.id, closures, locationId)) continue;

    const windows = availability.filter(
      (a) =>
        a.staff_id === member.id &&
        a.weekday === weekday &&
        (!locationId || a.location_id === null || a.location_id === locationId)
    );
    if (windows.length === 0) continue;

    const busy = busyRanges(member.id, date, appointments);

    for (const w of windows) {
      const winStart = timeToMinutes(w.start_time);
      const winEnd = timeToMinutes(w.end_time);

      for (let m = winStart; m + serviceDuration <= winEnd; m += step) {
        // niente passato (con un minimo di 5' di margine)
        if (isToday && m < nowMinutes + 5) continue;
        // niente overlap
        if (overlaps(m, m + serviceDuration, busy)) continue;

        const startDate = new Date(date);
        startDate.setHours(Math.floor(m / 60), m % 60, 0, 0);
        const endDate = new Date(startDate.getTime() + serviceDuration * 60000);
        const label = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(
          m % 60
        ).padStart(2, '0')}`;

        // Primo staff libero vince lo slot (evita doppioni con "qualsiasi").
        if (!slotMap.has(label)) {
          slotMap.set(label, {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            label,
            staffId: member.id,
          });
        }
      }
    }
  }

  return Array.from(slotMap.values()).sort((a, b) => a.label.localeCompare(b.label));
}

/** Un appuntamento può essere cancellato dal cliente? (soglia configurabile). */
export function canCancelAppointment(startsAtIso: string): boolean {
  const thresholdMs = salonConfig.booking.cancellationThresholdHours * 3600 * 1000;
  return new Date(startsAtIso).getTime() - Date.now() > thresholdMs;
}

/** Data minima e massima prenotabile (per limitare il calendario). */
export function bookingDateBounds(): { min: Date; max: Date } {
  const min = new Date();
  min.setHours(0, 0, 0, 0);
  const max = new Date(min);
  max.setDate(max.getDate() + salonConfig.booking.maxAdvanceDays);
  return { min, max };
}
