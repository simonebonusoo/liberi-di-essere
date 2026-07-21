import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { CalendarDays, LayoutDashboard, Bell, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const links = [
  { to: '/dashboard', label: 'Panoramica', icon: LayoutDashboard, end: true },
  { to: '/dashboard/appuntamenti', label: 'I miei appuntamenti', icon: CalendarDays, end: false },
  { to: '/dashboard/notifiche', label: 'Notifiche', icon: Bell, end: false },
  { to: '/prenota', label: 'Nuova prenotazione', icon: Plus, end: false },
];

export function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-brand-50">
      <Navbar />
      <div className="container-page flex flex-1 gap-8 py-8">
        <aside className="hidden w-60 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition',
                    isActive
                      ? 'bg-brand-700 text-white shadow-sm'
                      : 'text-brand-600 hover:bg-brand-100'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div key={location.pathname} className="route-page-enter min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
      <Footer />
    </div>
  );
}
