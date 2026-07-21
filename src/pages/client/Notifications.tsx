import { Bell, BellOff, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/context/AuthContext';
import { resolveNotificationRoute } from '@/lib/notifications';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateTime } from '@/utils/format';
import { clsx } from 'clsx';

export function ClientNotifications() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const openNotification = async (id: string) => {
    const notification = notifications.find((n) => n.id === id);
    if (!notification) return;
    try {
      await markAsRead(notification.id);
    } catch {
      /* Hook refetches on write failure; route still gives useful context. */
    }
    navigate(resolveNotificationRoute(notification, isAdmin));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="heading-serif text-3xl text-brand-900">Notifiche</h1>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
            <Check className="h-4 w-4" /> Segna tutte come lette
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingState />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="Nessuna notifica"
          description="Qui vedrai conferme e aggiornamenti delle tue prenotazioni."
          icon={<BellOff className="h-7 w-7" />}
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => openNotification(n.id)}
              className="w-full text-left"
            >
              <Card className={clsx('flex items-start gap-4 transition hover:border-brand-300 hover:shadow-soft', !n.read && 'border-l-4 border-l-accent-500')}>
                <div className="mt-0.5 rounded-full bg-brand-100 p-2 text-brand-600">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-brand-900">{n.title}</h3>
                    <span className="whitespace-nowrap text-xs text-brand-400">
                      {formatDateTime(n.created_at)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-brand-500">{n.message}</p>
                  <p className="mt-2 text-xs font-medium text-brand-400">
                    Apri dettaglio collegato
                  </p>
                </div>
                {!n.read && (
                  <span className="text-xs font-medium text-brand-500">
                    Da leggere
                  </span>
                )}
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
