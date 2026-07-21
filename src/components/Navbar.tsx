import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import { clsx } from 'clsx';
import { salonConfig } from '@/config/salonConfig';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { NotificationBell } from '@/components/NotificationBell';

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/servizi', label: 'Servizi' },
  { to: '/prenota', label: 'Prenota' },
];

export function Navbar() {
  const { session, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-brand-50/85 backdrop-blur-md">
      <nav className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="heading-serif text-xl text-brand-900">{salonConfig.logoText}</span>
          {!isSupabaseConfigured && (
            <span
              title="Dati salvati in locale (nessun Supabase configurato)"
              className="ml-1 rounded-full border border-accent-500/30 bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700 shadow-sm"
            >
              Demo
            </span>
          )}
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {publicLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                clsx(
                  'rounded-lg px-3 py-2 text-sm font-medium transition',
                  'nav-link-luxury',
                  isActive ? 'text-brand-900' : 'text-brand-500 hover:text-brand-800'
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {session ? (
            <>
              <NotificationBell />
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm">
                    <Shield className="h-4 w-4" /> Admin
                  </Button>
                </Link>
              )}
              <Link to="/dashboard">
                <Button variant="outline" size="sm">
                  <LayoutDashboard className="h-4 w-4" />
                  {profile?.full_name?.split(' ')[0] || 'Area riservata'}
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut} aria-label="Esci">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Accedi
                </Button>
              </Link>
              <Link to="/prenota">
                <Button variant="secondary" size="sm">
                  Prenota ora
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="rounded-lg p-2 text-brand-700 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-brand-100 bg-brand-50 md:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {publicLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="nav-link-luxury rounded-lg px-3 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
              >
                {l.label}
              </NavLink>
            ))}
            <div className="my-2 h-px bg-brand-100" />
            {session ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)}>
                  <Button variant="outline" size="sm" fullWidth>
                    Area riservata
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)}>
                    <Button variant="ghost" size="sm" fullWidth>
                      Pannello Admin
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" fullWidth onClick={handleSignOut}>
                  Esci
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)}>
                  <Button variant="outline" size="sm" fullWidth>
                    Accedi
                  </Button>
                </Link>
                <Link to="/prenota" onClick={() => setOpen(false)}>
                  <Button variant="secondary" size="sm" fullWidth>
                    Prenota ora
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
