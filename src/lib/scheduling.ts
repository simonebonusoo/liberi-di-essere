/** Fetch dei dati necessari al calcolo disponibilità (orari + chiusure). */
import { supabase } from '@/lib/supabase';
import type { SalonClosure, StaffAvailability } from '@/types/database';

export async function fetchStaffAvailability(staffIds?: string[]) {
  let query = supabase.from('staff_availability').select('*');
  if (staffIds && staffIds.length > 0) query = query.in('staff_id', staffIds);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as StaffAvailability[];
}

export async function fetchClosuresForDate(date: Date, _locationId?: string) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const day = `${y}-${m}-${d}`;
  const query = supabase
    .from('salon_closures')
    .select('*')
    .lte('start_date', day)
    .gte('end_date', day);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as SalonClosure[];
}

export async function fetchAllClosures() {
  const { data, error } = await supabase
    .from('salon_closures')
    .select('*')
    .order('start_date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SalonClosure[];
}
