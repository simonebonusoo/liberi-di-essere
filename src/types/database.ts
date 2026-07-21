/**
 * Tipi del database allineati allo schema Supabase (supabase/schema.sql).
 * Se rigeneri i tipi con la CLI Supabase puoi sostituire questo file.
 */

export type UserRole = 'client' | 'salon_admin' | 'super_admin' | 'admin';
export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show'
  | 'rescheduled';
export type NotificationType =
  | 'booking_created'
  | 'booking_cancelled'
  | 'booking_updated'
  | 'booking_reminder'
  | 'system';
export type NotificationDeliveryStatus = 'pending' | 'sent' | 'failed' | 'demo_simulated';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  duration_minutes: number;
  buffer_minutes: number;
  price: number;
  price_from: boolean;
  image_url: string | null;
  location_ids: string[];
  staff_ids: string[];
  preliminary_questions: string[];
  public_visible: boolean;
  notes: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface StaffMember {
  id: string;
  full_name: string;
  role_title: string;
  bio: string;
  avatar_url: string | null;
  skills: string[];
  location_ids: string[];
  service_ids: string[];
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  directions: string;
  phone: string | null;
  email: string | null;
  map_url: string | null;
  image_url: string | null;
  active: boolean;
  seasonal: boolean;
  show_when_inactive: boolean;
  season_start: string | null;
  season_end: string | null;
  max_simultaneous_appointments: number;
  info_message: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface StaffAvailability {
  id: string;
  staff_id: string;
  location_id: string | null;
  weekday: number; // 0..6
  start_time: string; // "HH:MM:SS"
  end_time: string;
  created_at: string;
}

export interface SalonClosure {
  id: string;
  staff_id: string | null;
  location_id: string | null;
  start_date: string; // "YYYY-MM-DD"
  end_date: string;
  reason: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  client_id: string;
  staff_id: string;
  service_id: string;
  location_id: string;
  starts_at: string; // ISO
  ends_at: string;
  status: AppointmentStatus;
  price: number;
  notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Appuntamento con relazioni caricate (join). */
export interface AppointmentWithRelations extends Appointment {
  service: Service | null;
  staff: StaffMember | null;
  client: Profile | null;
  location: Location | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  entity_type: string | null;
  entity_id: string | null;
  route: string | null;
  action_url: string | null;
  metadata: Record<string, unknown>;
  delivery_status: NotificationDeliveryStatus;
  read: boolean;
  read_at: string | null;
  appointment_id: string | null;
  created_at: string;
}

export interface AppSetting {
  key: string;
  value: unknown;
  updated_at: string;
}
