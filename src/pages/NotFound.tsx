import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="heading-serif text-7xl text-brand-300">404</p>
      <h1 className="heading-serif mt-4 text-2xl text-brand-900">Pagina non trovata</h1>
      <p className="mt-2 max-w-sm text-brand-500">
        La pagina che cerchi non esiste o è stata spostata.
      </p>
      <Link to="/" className="mt-6">
        <Button>Torna alla home</Button>
      </Link>
    </div>
  );
}
