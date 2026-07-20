import { Loader2 } from 'lucide-react';

export function LoadingState({ label = 'Caricamento…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-brand-500">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

/** Loader a schermo intero, usato durante il recupero sessione. */
export function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50">
      <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
    </div>
  );
}
