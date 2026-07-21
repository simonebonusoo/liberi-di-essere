import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useServices } from '@/hooks/useServices';
import { ServiceCard } from '@/components/ServiceCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { clsx } from 'clsx';

export function Services() {
  const { services, loading, error } = useServices();
  const [category, setCategory] = useState<string>('Tutti');

  const categories = useMemo(() => {
    const set = new Set(services.map((s) => s.category));
    return ['Tutti', ...Array.from(set)];
  }, [services]);

  const filtered =
    category === 'Tutti' ? services : services.filter((s) => s.category === category);

  return (
    <div className="container-page section">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-semibold uppercase tracking-widest text-accent-600">
          Listino
        </span>
        <h1 className="heading-serif mt-2 text-4xl text-brand-900">I nostri servizi</h1>
        <p className="mt-3 text-brand-500">
          Scegli il trattamento e prenota in pochi clic.
        </p>
      </Reveal>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <EmptyState title="Errore di caricamento" description={error} />
      ) : services.length === 0 ? (
        <EmptyState title="Nessun servizio disponibile" description="Riprova più tardi." />
      ) : (
        <>
          <Reveal className="mt-10 flex flex-wrap justify-center gap-2" delay={80}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={clsx(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition',
                  category === cat
                    ? 'bg-brand-700 text-white'
                    : 'bg-white text-brand-600 hover:bg-brand-100'
                )}
              >
                {cat}
              </button>
            ))}
          </Reveal>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s, index) => (
              <Reveal key={s.id} delay={(index % 6) * 70}>
                <ServiceCard service={s} />
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-12 text-center" delay={120}>
            <Link to="/prenota">
              <Button size="lg" variant="cta">
                Prenota ora
              </Button>
            </Link>
          </Reveal>
        </>
      )}
    </div>
  );
}
