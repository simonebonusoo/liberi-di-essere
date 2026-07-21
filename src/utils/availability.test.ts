import { describe, expect, it } from 'vitest';
import { computeAvailableSlots } from '@/utils/availability';
import type { Appointment, SalonClosure, StaffAvailability, StaffMember } from '@/types/database';

const staff: StaffMember[] = [
  {
    id: 'staff-1',
    full_name: 'Stefania',
    role_title: 'Operatrice',
    bio: '',
    avatar_url: null,
    skills: ['Taglio'],
    location_ids: ['loc-1'],
    service_ids: ['svc-1'],
    active: true,
    sort_order: 1,
    created_at: '',
    updated_at: '',
  },
];

const availability: StaffAvailability[] = [
  {
    id: 'av-1',
    staff_id: 'staff-1',
    location_id: 'loc-1',
    weekday: 2,
    start_time: '08:30:00',
    end_time: '10:00:00',
    created_at: '',
  },
];

const localIso = (hour: number, minutes: number) => {
  const d = new Date(2030, 0, 1, hour, minutes, 0, 0);
  return d.toISOString();
};

const baseAppointment: Appointment = {
  id: 'appt-1',
  client_id: 'client-1',
  staff_id: 'staff-1',
  service_id: 'svc-1',
  location_id: 'loc-1',
  starts_at: localIso(8, 45),
  ends_at: localIso(9, 15),
  status: 'confirmed',
  price: 30,
  notes: '',
  created_by: 'client-1',
  created_at: '',
  updated_at: '',
};

describe('computeAvailableSlots', () => {
  it('does not propose slots that end after the working window', () => {
    const slots = computeAvailableSlots({
      date: new Date('2030-01-01T00:00:00'),
      serviceDuration: 90,
      locationId: 'loc-1',
      serviceId: 'svc-1',
      staff,
      availability,
      appointments: [],
      closures: [],
    });

    expect(slots.map((s) => s.label)).toEqual(['08:30']);
  });

  it('removes overlapping slots for confirmed appointments', () => {
    const slots = computeAvailableSlots({
      date: new Date('2030-01-01T00:00:00'),
      serviceDuration: 30,
      locationId: 'loc-1',
      serviceId: 'svc-1',
      staff,
      availability,
      appointments: [baseAppointment],
      closures: [],
    });

    expect(slots.some((s) => s.label === '08:45')).toBe(false);
  });

  it('filters by location and closures', () => {
    const closures: SalonClosure[] = [
      {
        id: 'cl-1',
        staff_id: null,
        location_id: 'loc-1',
        start_date: '2030-01-01',
        end_date: '2030-01-01',
        reason: 'Chiusura',
        created_at: '',
      },
    ];
    const slots = computeAvailableSlots({
      date: new Date('2030-01-01T00:00:00'),
      serviceDuration: 30,
      locationId: 'loc-1',
      serviceId: 'svc-1',
      staff,
      availability,
      appointments: [],
      closures,
    });

    expect(slots).toHaveLength(0);
  });
});
