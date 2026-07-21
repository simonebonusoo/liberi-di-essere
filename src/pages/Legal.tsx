import { salonConfig } from '@/config/salonConfig';

const copy = {
  privacy: {
    title: 'Privacy policy demo',
    body: 'Questa pagina contiene un testo provvisorio per la demo. Prima della pubblicazione in produzione devono essere inseriti titolare del trattamento, finalità, basi giuridiche, tempi di conservazione, responsabili e diritti dell’interessato.',
  },
  cookie: {
    title: 'Cookie policy demo',
    body: 'La demo non configura strumenti di tracciamento marketing. La policy definitiva dovrà descrivere cookie tecnici, eventuali analytics, consenso e strumenti di gestione preferenze.',
  },
  terms: {
    title: 'Termini di utilizzo demo',
    body: 'Le prenotazioni effettuate in questo ambiente sono dimostrative e non costituiscono appuntamenti reali presso il salone. Prezzi, durate, orari e politiche di cancellazione devono essere confermati dal cliente.',
  },
};

export function LegalPage({ type }: { type: keyof typeof copy }) {
  const item = copy[type];
  return (
    <div className="container-page section">
      <div className="mx-auto max-w-3xl">
        <span className="text-sm font-semibold uppercase tracking-widest text-accent-600">
          {salonConfig.name}
        </span>
        <h1 className="heading-serif mt-2 text-4xl text-brand-900">{item.title}</h1>
        <div className="mt-6 space-y-4 rounded-2xl border border-brand-100 bg-white p-6 text-brand-600 shadow-card">
          <p>{item.body}</p>
          <p>
            Dominio demo previsto: <strong>demo.liberidiessere.bnsstudio.it</strong>.
          </p>
          <p>
            Dati da confermare: logo ufficiale, contatti, social, testi legali, provider email/SMS/WhatsApp e policy operative.
          </p>
        </div>
      </div>
    </div>
  );
}
