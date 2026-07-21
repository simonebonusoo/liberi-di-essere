import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Scissors,
  Users,
  UserCog,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
} from 'lucide-react';
import { clsx } from 'clsx';
import { salonConfig } from '@/config/salonConfig';
import { useAuth } from '@/context/AuthContext';
import { NotificationBell } from '@/components/NotificationBell';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/calendario', label: 'Calendario', icon: CalendarDays, end: false },
  { to: '/admin/notifiche', label: 'Notifiche', icon: Bell, end: false },
  { to: '/admin/servizi', label: 'Servizi', icon: Scissors, end: false },
  { to: '/admin/staff', label: 'Staff', icon: UserCog, end: false },
  { to: '/admin/clienti', label: 'Clienti', icon: Users, end: false },
  { to: '/admin/impostazioni', label: 'Disponibilità', icon: Settings, end: false },
];

export function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const SidebarContent = () => (
    <>
      <Link to="/admin" className="flex shrink-0 items-center gap-2 px-6 py-5">
        <span className="heading-serif text-lg text-white">{salonConfig.logoText}</span>
        <span className="rounded bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold text-brand-900">
          ADMIN
        </span>
      </Link>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              clsx(
                'nav-link-luxury flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition',
                isActive ? 'bg-white/15 text-white' : 'text-brand-200 hover:bg-white/10'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto shrink-0 border-t border-white/10 p-4">
        <p className="truncate px-2 text-[11px] font-semibold uppercase tracking-widest text-accent-400">
          admin.chadeo.it
        </p>
        <p className="mt-1 truncate px-2 text-xs text-brand-300">{profile?.email}</p>
        <button
          onClick={handleSignOut}
          className="nav-link-luxury mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-brand-200 transition hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" /> Esci
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-dvh bg-brand-50">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 flex-col bg-brand-900 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:max-h-dvh">
        <SidebarContent />
      </aside>

      {/* Sidebar mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="mobile-sidebar-enter relative flex h-dvh w-64 flex-col bg-brand-900">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-brand-100 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            className="rounded-lg p-2 text-brand-700 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Apri menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link to="/" className="nav-link-luxury rounded-lg px-2 py-1 text-sm font-medium text-brand-500 hover:text-brand-800">
              Vai al sito
            </Link>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div key={location.pathname} className="admin-page-enter">
            <Outlet />
          </div>
        </main>
      </div>
      {/* Chiusura menu mobile via X flottante */}
      {open && (
        <button
          className="fixed right-4 top-4 z-50 rounded-lg bg-white p-2 text-brand-800 shadow lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Chiudi menu"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
