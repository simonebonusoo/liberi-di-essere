/**
 * Data layer per gli appuntamenti: query e mutazioni riutilizzabili
 * da pannello cliente e admin. Le regole di sicurezza sono garantite da RLS.
 */
import { supabase } from '@/lib/supabase';
import type { AppointmentStatus, AppointmentWithRelations } from '@/types/database';

const SELECT_WITH_RELATIONS = `
  *,
  service:services(*),
  staff:staff_members(*),
  location:locations(*),
  client:profiles!appointments_client_id_fkey(*)
`;

export interface CreateAppointmentInput {
  clientId: string;
  staffId: string;
  serviceId: string;
  locationId: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
  price: number;
  notes?: string;
  createdBy: string;
}

export async function createAppointment(input: CreateAppointmentInput) {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      client_id: input.clientId,
      staff_id: input.staffId,
      service_id: input.serviceId,
      location_id: input.locationId,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      price: input.price,
      notes: input.notes ?? '',
      created_by: input.createdBy,
      status: 'confirmed',
    })
    .select()
    .single();

  if (error) {
    // 23P01 = violazione exclusion constraint (slot già occupato)
    if (error.code === '23P01') {
      throw new Error('Questo orario è appena stato prenotato. Scegli un altro slot.');
    }
    throw new Error(error.message);
  }
  return data;
}

export async function cancelAppointment(id: string) {
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
}

/** Appuntamenti di un cliente (con relazioni). */
export async function fetchClientAppointments(clientId: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select(SELECT_WITH_RELATIONS)
    .eq('client_id', clientId)
    .order('starts_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AppointmentWithRelations[];
}

/** Appuntamenti in un intervallo di date (uso admin/calendario). */
export async function fetchAppointmentsInRange(fromIso: string, toIso: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select(SELECT_WITH_RELATIONS)
    .gte('starts_at', fromIso)
    .lte('starts_at', toIso)
    .order('starts_at');
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AppointmentWithRelations[];
}

/** Appuntamenti confermati di un giorno per il calcolo disponibilità. */
export async function fetchDayConfirmedAppointments(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .in('status', ['pending', 'confirmed'])
    .gte('starts_at', start.toISOString())
    .lte('starts_at', end.toISOString());
  if (error) throw new Error(error.message);
  return data ?? [];
}
