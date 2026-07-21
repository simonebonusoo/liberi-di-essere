import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDateTime } from '@/utils/format';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2 text-brand-700 transition hover:bg-brand-100"
        aria-label="Notifiche"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-brand-100 px-4 py-3">
            <span className="font-semibold text-brand-900">Notifiche</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-700"
              >
                <Check className="h-3.5 w-3.5" /> Segna tutte lette
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-brand-400">
                Nessuna notifica
              </p>
            ) : (
              notifications.slice(0, 12).map((n) => (
                <button
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`flex w-full flex-col gap-0.5 border-b border-brand-50 px-4 py-3 text-left transition hover:bg-brand-50 ${
                    !n.read ? 'bg-brand-50/60' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {!n.read && <span className="h-2 w-2 rounded-full bg-accent-500" />}
                    <span className="text-sm font-semibold text-brand-900">{n.title}</span>
                  </div>
                  <span className="text-xs text-brand-500">{n.message}</span>
                  <span className="text-[10px] text-brand-300">
                    {formatDateTime(n.created_at)}
                  </span>
                </button>
              ))
            )}
          </div>
          <Link
            to="/dashboard/notifiche"
            onClick={() => setOpen(false)}
            className="block border-t border-brand-100 px-4 py-3 text-center text-sm font-medium text-brand-700 hover:bg-brand-50"
          >
            Vedi tutte
          </Link>
        </div>
      )}
    </div>
  );
}
