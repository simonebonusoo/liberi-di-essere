import type { Notification } from '@/types/database';

export function resolveNotificationRoute(notification: Notification, isAdmin: boolean): string {
  if (notification.route) return notification.route;
  if (notification.action_url) return notification.action_url;

  if (notification.appointment_id) {
    const param = `appointment=${encodeURIComponent(notification.appointment_id)}`;
    return isAdmin ? `/admin/calendario?${param}` : `/dashboard/appuntamenti?${param}`;
  }

  if (notification.entity_type === 'location' && notification.entity_id) {
    return `/admin/impostazioni?location=${encodeURIComponent(notification.entity_id)}`;
  }
  if (notification.entity_type === 'staff' && notification.entity_id) {
    return `/admin/staff?staff=${encodeURIComponent(notification.entity_id)}`;
  }
  if (notification.entity_type === 'service' && notification.entity_id) {
    return `/admin/servizi?service=${encodeURIComponent(notification.entity_id)}`;
  }

  if (notification.type === 'system') {
    return isAdmin ? '/admin/impostazioni' : '/dashboard/notifiche';
  }

  return isAdmin ? '/admin/calendario' : '/dashboard/appuntamenti';
}
