import { Link } from 'react-router-dom';
import { Facebook, Instagram, MapPin, Phone, Mail } from 'lucide-react';
import { salonConfig } from '@/config/salonConfig';

export function Footer() {
  const { name, tagline, contact, hours } = salonConfig;
  return (
    <footer className="border-t border-brand-100 bg-brand-900 text-brand-100">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="heading-serif text-xl text-white">{name}</h3>
          <p className="mt-1 text-sm text-brand-300">{tagline}</p>
          <div className="mt-4 flex items-center gap-3">
            <a
              href={contact.facebook}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-brand-200 hover:bg-white/10 hover:text-white"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href={contact.instagram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-brand-200 hover:bg-white/10 hover:text-white"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent-400">
            Contatti
          </h4>
          <ul className="space-y-2 text-sm text-brand-200">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {contact.address}, {contact.postalCode} {contact.city}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <a href={`tel:${contact.phone}`} className="hover:text-white">
                {contact.phone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${contact.email}`} className="hover:text-white">
                {contact.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent-400">
            Orari
          </h4>
          <ul className="space-y-1 text-sm text-brand-200">
            {hours.map((h) => (
              <li key={h.day} className="flex justify-between gap-4">
                <span>{h.label}</span>
                <span className="text-brand-300">
                  {h.open && h.close ? `${h.open} / ${h.close}` : 'Chiuso'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent-400">
            Link
          </h4>
          <ul className="space-y-2 text-sm text-brand-200">
            <li><Link to="/servizi" className="hover:text-white">Servizi</Link></li>
            <li><Link to="/prenota" className="hover:text-white">Prenota online</Link></li>
            <li><Link to="/login" className="hover:text-white">Login</Link></li>
            <li><Link to="/registrati" className="hover:text-white">Registrati</Link></li>
            <li><Link to="/privacy" className="hover:text-white">Privacy policy</Link></li>
            <li><Link to="/cookie" className="hover:text-white">Cookie policy</Link></li>
            <li><Link to="/termini" className="hover:text-white">Termini demo</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-brand-800 py-5 text-center text-xs text-brand-400">
        <div className="container-page flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4">
          <span>© {new Date().getFullYear()} {name}. Tutti i diritti riservati.</span>
          <span>
            Powered by{' '}
            <a
              href="https://bnsstudio.it"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-brand-200 hover:text-white"
            >
              BnsStudio
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
