import { Link } from 'react-router-dom';
import {
  Sparkles,
  Scissors,
  Calendar as CalendarIcon,
  Heart,
  MapPin,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { salonConfig } from '@/config/salonConfig';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatPrice, formatDuration } from '@/utils/format';

const iconMap: Record<string, typeof Sparkles> = {
  sparkles: Sparkles,
  scissors: Scissors,
  calendar: CalendarIcon,
  heart: Heart,
};

export function Home() {
  const c = salonConfig;

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${c.heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/85 via-brand-900/60 to-brand-900/30" />
        <div className="container-page relative flex min-h-[78vh] flex-col justify-center py-20">
          <div className="max-w-2xl animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-accent-400 backdrop-blur">
              <Sparkles className="h-4 w-4" /> {c.tagline}
            </span>
            <h1 className="heading-serif mt-5 text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
              {c.heroTitle}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-brand-100">{c.heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/prenota">
                <Button size="lg" variant="secondary">
                  Prenota ora <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/servizi">
                <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                  Scopri i servizi
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SERVIZI PRINCIPALI */}
      <section className="section container-page">
        <SectionHeading eyebrow="I nostri servizi" title="Trattamenti su misura per te" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {c.showcaseServices.map((s) => (
            <Card key={s.name} hover>
              <h3 className="heading-serif text-lg text-brand-900">{s.name}</h3>
              <p className="mt-2 text-sm text-brand-500">{s.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="flex items-center gap-1 text-sm text-brand-400">
                  <Clock className="h-4 w-4" /> {formatDuration(s.duration)}
                </span>
                <span className="font-bold text-brand-800">{formatPrice(s.price)}</span>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link to="/servizi">
            <Button variant="outline">Vedi tutti i servizi</Button>
          </Link>
        </div>
      </section>

      {/* PERCHÉ SCEGLIERE */}
      <section className="bg-white">
        <div className="section container-page">
          <SectionHeading eyebrow="Perché noi" title={c.aboutTitle} subtitle={c.aboutText} />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {c.whyChooseUs.map((item) => {
              const Icon = iconMap[item.icon] ?? Sparkles;
              return (
                <div key={item.title} className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 font-semibold text-brand-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-brand-500">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="section container-page">
        <SectionHeading eyebrow="Portfolio" title="I nostri lavori" />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
          {c.gallery.map((src, i) => (
            <div
              key={i}
              className="group aspect-square overflow-hidden rounded-2xl bg-brand-100"
            >
              <img
                src={src}
                alt={`Lavoro ${i + 1}`}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      </section>

      {/* TEAM */}
      <section className="bg-white">
        <div className="section container-page">
          <SectionHeading eyebrow="Il team" title="I nostri professionisti" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {c.team.map((m) => (
              <Card key={m.name} padded={false} hover className="overflow-hidden">
                <div className="aspect-[4/5] overflow-hidden bg-brand-100">
                  <img src={m.photo} alt={m.name} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="p-5">
                  <h3 className="heading-serif text-lg text-brand-900">{m.name}</h3>
                  <p className="text-sm text-accent-600">{m.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SEDI */}
      <section className="section container-page">
        <SectionHeading eyebrow="Le sedi" title="Copertino e Sant'Isidoro" />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {c.locations.map((l) => (
            <Card key={l.id}>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="heading-serif text-lg text-brand-900">{l.name}</h3>
                  <p className="mt-1 text-sm font-medium text-brand-700">{l.address}</p>
                  <p className="mt-2 text-sm text-brand-500">{l.info}</p>
                  {l.seasonal && (
                    <span className="mt-3 inline-flex rounded-full bg-accent-500/15 px-3 py-1 text-xs font-semibold text-brand-700">
                      Sede stagionale demo
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ORARI + CONTATTI */}
      <section className="bg-white">
        <div className="section container-page grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Vieni a trovarci" title="Orari & Contatti" align="left" />
            <div className="mt-6 space-y-2">
              {c.hours.map((h) => (
                <div
                  key={h.day}
                  className="flex items-center justify-between border-b border-brand-100 py-2 text-sm"
                >
                  <span className="font-medium text-brand-800">{h.label}</span>
                  <span className="text-brand-500">
                    {h.open && h.close ? `${h.open} / ${h.close}` : 'Chiuso'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm text-brand-600">
              <MapPin className="h-4 w-4 text-accent-600" />
              {c.contact.address}, {c.contact.postalCode} {c.contact.city}
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-brand-100 shadow-card">
            <iframe
              title="Mappa salone"
              src={c.contact.mapEmbedUrl}
              className="h-full min-h-[320px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* CTA FINALE */}
      <section className="bg-brand-900">
        <div className="container-page py-16 text-center">
          <h2 className="heading-serif text-3xl text-white sm:text-4xl">
            Pronto per il tuo prossimo look?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-200">
            Prenota online in meno di un minuto. Scegli servizio, stylist e orario.
          </p>
          <Link to="/prenota" className="mt-8 inline-block">
            <Button size="lg" variant="secondary">
              Prenota il tuo appuntamento <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <span className="text-sm font-semibold uppercase tracking-widest text-accent-600">
        {eyebrow}
      </span>
      <h2 className="heading-serif mt-2 text-3xl text-brand-900 sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-brand-500">{subtitle}</p>}
    </div>
  );
}
