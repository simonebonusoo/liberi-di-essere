import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, Shield, Facebook, Instagram } from 'lucide-react';
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

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-brand-100 bg-brand-50/85 backdrop-blur-md">
        <nav className="container-page flex h-16 items-center justify-between">
          <Link
            to="/"
            className="flex min-h-11 min-w-0 items-center gap-2"
            onClick={() => setOpen(false)}
          >
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
                    'relative rounded-lg px-3 py-2 text-sm font-medium transition after:absolute after:left-3 after:right-3 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-accent-500 after:transition-opacity',
                    'nav-link-luxury',
                    isActive
                      ? 'text-brand-900 after:opacity-100'
                      : 'text-brand-500 after:opacity-0 hover:text-brand-800'
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
                    Login
                  </Button>
                </Link>
                <Link to="/registrati">
                  <Button variant="secondary" size="sm">
                    Registrati
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <div className="flex items-center gap-1 md:hidden">
            {session && <NotificationBell />}
            <button
              className="rounded-lg p-2 text-brand-700 transition hover:bg-brand-100"
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? 'Chiudi menu' : 'Apri menu'}
              aria-expanded={open}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu */}
      {open && (
        <div className="fixed inset-0 z-50 bg-brand-50 text-brand-900 md:hidden">
          <div className="grid h-16 grid-cols-[3rem_1fr_3rem] items-center px-4">
            <button
              className="flex h-11 w-11 items-center justify-center rounded-lg text-accent-600 transition hover:bg-brand-100"
              onClick={() => setOpen(false)}
              aria-label="Chiudi menu"
            >
              <X className="h-6 w-6" />
            </button>
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="heading-serif truncate text-center text-xl text-brand-950"
            >
              {salonConfig.logoText}
            </Link>
            <span aria-hidden="true" />
          </div>

          <div className="container-page flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-10 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8">
            <div className="flex flex-col items-center gap-7">
              {publicLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'nav-link-luxury px-3 py-2 text-center text-sm font-bold uppercase tracking-[0.32em]',
                      isActive ? 'text-brand-950' : 'text-brand-800 hover:text-accent-600'
                    )
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </div>

            <div className="flex flex-col items-center gap-4 text-sm tracking-[0.12em] text-brand-700">
              {session ? (
                <>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setOpen(false)}
                      className="px-3 py-2 transition hover:text-accent-600"
                    >
                      Gestionale
                    </Link>
                  )}
                  <Link
                    to="/dashboard"
                    onClick={() => setOpen(false)}
                    className="px-3 py-2 transition hover:text-accent-600"
                  >
                    Area riservata
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="px-3 py-2 transition hover:text-accent-600"
                  >
                    Esci
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="px-3 py-2 text-center transition hover:text-accent-600"
                  >
                    Login
                  </Link>
                  <Link
                    to="/registrati"
                    onClick={() => setOpen(false)}
                    className="px-3 py-2 text-center transition hover:text-accent-600"
                  >
                    Registrati
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center justify-center gap-6">
              <a
                href={salonConfig.contact.facebook}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full text-brand-800 transition hover:bg-brand-100 hover:text-accent-600"
                aria-label="Facebook"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a
                href={salonConfig.contact.instagram}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full text-brand-800 transition hover:bg-brand-100 hover:text-accent-600"
                aria-label="Instagram"
              >
                <Instagram className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
