import { describe, expect, it } from 'vitest';
import { resolveNotificationRoute } from '@/lib/notifications';
import type { Notification } from '@/types/database';

const baseNotification: Notification = {
  id: 'n-1',
  user_id: 'u-1',
  title: 'Test',
  message: 'Message',
  type: 'booking_created',
  entity_type: 'appointment',
  entity_id: 'ap-1',
  route: null,
  action_url: null,
  metadata: {},
  delivery_status: 'demo_simulated',
  read: false,
  read_at: null,
  appointment_id: 'ap-1',
  created_at: '2030-01-01T09:00:00.000Z',
};

describe('resolveNotificationRoute', () => {
  it('uses explicit routes first', () => {
    expect(resolveNotificationRoute({ ...baseNotification, route: '/admin/impostazioni' }, true)).toBe('/admin/impostazioni');
  });

  it('routes appointment notifications to the correct area', () => {
    expect(resolveNotificationRoute(baseNotification, false)).toBe('/dashboard/appuntamenti?appointment=ap-1');
    expect(resolveNotificationRoute(baseNotification, true)).toBe('/admin/calendario?appointment=ap-1');
  });

  it('routes entity notifications without relying on display text', () => {
    expect(resolveNotificationRoute({ ...baseNotification, appointment_id: null, entity_type: 'location', entity_id: 'loc-1' }, true)).toBe('/admin/impostazioni?location=loc-1');
  });
});
