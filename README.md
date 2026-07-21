# Liberi di Essere - Demo Gestionale e Prenotazioni

Demo BNS Studio per un salone femminile di parrucchiera e hair styling:
sito pubblico, prenotazione online, area cliente, pannello admin, operatori,
servizi, sedi, orari, chiusure e modalità demo locale.

Dominio previsto per la demo: `demo.liberidiessere.bnsstudio.it`.

## Stack

- React 18 + Vite + TypeScript
- Supabase Auth, Postgres, RLS e Realtime
- Tailwind CSS
- React Router, React Hook Form, Zod
- Vitest per test mirati
- Fallback demo locale su `localStorage` quando Supabase non è configurato

## Avvio locale

```bash
npm install
npm run dev
```

Senza credenziali Supabase valide l'app parte in modalità demo locale.

## Account demo locali

| Ruolo | Email | Password |
| --- | --- | --- |
| Super admin BNS | `superadmin@demo.it` | `super1234` |
| Admin salone | `admin@demo.it` | `admin1234` |
| Cliente | `cliente@demo.it` | `demo1234` |

La pagina login mostra pulsanti di accesso rapido solo in ambiente demo locale.
Le password demo non sono usate in produzione Supabase.

## Configurazione Supabase

1. Crea un progetto Supabase.
2. Copia `.env.example` in `.env`.
3. Inserisci `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Esegui tutto `supabase/schema.sql` da SQL Editor.
5. Crea gli utenti demo da Supabase Auth, poi assegna i ruoli:

```sql
update public.profiles set role = 'super_admin' where email = 'superadmin@demo.it';
update public.profiles set role = 'salon_admin' where email = 'admin@demo.it';
```

## Dati demo inclusi

- Sede principale: Liberi di Essere - Copertino, Via Madonna delle Grazie 102, `73043` Copertino LE.
- Sede stagionale: Liberi di Essere - Sant'Isidoro, indirizzo provvisorio “vicino al Bar Orange”.
- Operatori: Stefania, Davide, Giulia.
- Servizi demo per taglio, piega, colore, schiariture, trattamenti e acconciature.
- Orari demo: martedì-sabato, 08:30-13:00 e 15:30-19:30.
- Appuntamenti, clienti, chiusure e notifiche demo.

## Reset demo

In modalità locale accedi come super admin o admin, vai in:

`Admin -> Impostazioni operative -> Reset ambiente demo`

Il reset ripristina dati demo e disconnette l'utente.

## Build, lint e test

```bash
npm run lint
npm test
npm run build
```

## Deploy

Per pubblicare la demo:

1. Configura Supabase e variabili ambiente nella piattaforma hosting.
2. Imposta callback/auth redirect su `https://demo.liberidiessere.bnsstudio.it`.
3. Esegui `npm run build`.
4. Pubblica la cartella `dist`.
5. Configura DNS del sottodominio verso il provider scelto.

La demo include `robots.txt` e meta `noindex,nofollow`.

## Sostituzione logo e contenuti

Il logo provvisorio è una favicon/monogramma “LE” e non va presentato come
ufficiale. Da `Admin -> Impostazioni operative` sono modificabili sedi, orari e
stato della sede stagionale. I dati visivi statici iniziali sono in
`src/config/salonConfig.ts`; lo schema include `settings`, `content_sections` e
`media` per collegare una gestione contenuti più estesa.

## Provider notifiche

In demo le notifiche interne sono simulate con stato `demo_simulated`. Per email,
SMS o WhatsApp reali servono variabili dedicate, ad esempio:

```env
EMAIL_PROVIDER_API_KEY=
SMS_PROVIDER_API_KEY=
WHATSAPP_PROVIDER_TOKEN=
NOTIFICATION_FROM_EMAIL=
```

## Dati da confermare col cliente

Logo ufficiale, brand identity, indirizzo esatto di Sant'Isidoro, telefono,
email, social, orari ufficiali, eventuale chiusura alle 20:00, servizi reali,
prezzi, durate, periodo sede estiva, policy cancellazione, testi legali e
provider notifiche.
