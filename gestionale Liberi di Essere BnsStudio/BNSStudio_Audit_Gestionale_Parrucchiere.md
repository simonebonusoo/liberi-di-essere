# BNS Studio — Audit tecnico finale
### Gestionale prenotazioni parrucchiere

**Data:** 10 luglio 2026 · **Versione progetto:** 1.0.0 (MVP)
**Stato complessivo sintetico:** MVP funzionante in **modalità DEMO locale**; **produzione Supabase predisposta ma NON ancora attiva online**.

> Legenda badge di stato:
> **COMPLETO** = implementato e verificato · **PARZIALE** = implementato ma incompleto/fragile · **DEMO** = funziona solo con localStorage · **PREDISPOSTO** = codice pronto ma non attivo online · **MANCANTE** = non esiste · **CRITICO** = blocco per la produzione

---

## 1. Executive Summary

È stata costruita una web app gestionale per saloni di parrucchieri (React + Vite + TypeScript + Tailwind + Supabase), con sito vetrina, autenticazione, prenotazione con calcolo disponibilità reale, area cliente e pannello admin completo di CRUD (servizi, staff, disponibilità, clienti, calendario) e notifiche interne.

Il punto chiave da capire: **l'app ha due modalità con switch automatico**.

- **Modalità DEMO (attuale, di default):** senza credenziali Supabase l'app parte comunque e usa un “finto” client che salva tutto nel `localStorage` del browser. Login demo, prenotazioni, CRUD admin e notifiche **funzionano davvero**, ma i dati vivono **solo nel browser** e non sono condivisi né sicuri.
- **Modalità PRODUZIONE (Supabase):** se si crea un file `.env` con URL e chiave validi, la stessa app usa Supabase reale (Auth, database, RLS, realtime). Il codice e lo schema SQL ci sono, **ma nessun progetto Supabase è collegato o testato online**.

**Cosa funziona al 100% (demo):** vetrina, login/ruoli, wizard di prenotazione con slot reali, anti-overlap, cancellazione con soglia, notifiche interne, tutti i CRUD admin, statistiche.
**Cosa è demo:** persistenza dati (localStorage), auth demo (password in chiaro nel browser).
**Cosa è predisposto ma non online:** l'intero backend Supabase (schema, RLS, trigger, seed).
**Cosa manca del tutto:** email/SMS/WhatsApp, Edge Functions, reminder automatici, multi-salone, deploy, pagine legali (GDPR), monitoring.

**Giudizio finale:** ottimo **prototipo/MVP dimostrabile** e buona base di prodotto. **Non è ancora un gestionale di produzione**: per venderlo a un salone reale serve collegare Supabase, aggiungere email transazionali e fare il deploy. Completamento stimato verso un prodotto vendibile reale: **~65%**.

---

## 2. Stato complessivo progetto

| Area | Stato | Note | Priorità |
|---|---|---|---|
| Frontend | **COMPLETO** | Tutte le 15 pagine presenti e navigabili, responsive | — |
| Backend | **PREDISPOSTO** | Solo Supabase (BaaS); nessuna Edge Function/email | Critico |
| Database | **PREDISPOSTO** | `schema.sql` completo ma non eseguito online | Critico |
| Auth | **PARZIALE** | Supabase Auth pronta; demo = localStorage in chiaro | Critico |
| Prenotazioni | **COMPLETO** | Logica robusta lato client + vincolo DB anti-overlap | Importante |
| Admin | **COMPLETO** | CRUD servizi/staff/disponibilità/clienti/calendario | — |
| Notifiche | **PARZIALE** | Solo interne (in-app). Nessuna email/SMS | Importante |
| Demo mode | **COMPLETO** | Funziona end-to-end su localStorage | — |
| Produzione Supabase | **PREDISPOSTO** | Mai collegata/testata online | Critico |
| Sicurezza | **PARZIALE** | RLS ottima in Supabase; demo manipolabile lato client | Critico |
| Performance | **PARZIALE** | Bundle unico 626 KB (176 KB gzip), no code-splitting | Migliorabile |
| UX/UI | **COMPLETO** | Design premium, coerente, responsive | — |
| Deploy | **MANCANTE** | Nessun hosting/dominio configurato | Critico |

---

## 3. Architettura attuale

**Struttura cartelle (55 file):**

```
src/
├─ components/ (+ui/)   Button, Card, Modal, Input, Select, Badge, Calendar,
│                       ServiceCard, StaffCard, AppointmentCard, Navbar, Footer,
│                       NotificationBell, LoadingState, EmptyState
├─ config/              salonConfig.ts  (personalizzazione salone + palette)
├─ context/             AuthContext.tsx (sessione, ruolo, login/logout)
├─ hooks/               useServices, useStaff, useNotifications, useClientAppointments
├─ layouts/             PublicLayout, DashboardLayout, AdminLayout
├─ lib/                 env, supabase (switch), localClient (mock), demoData,
│                       appointments (data layer), scheduling
├─ pages/               Home, Services, Booking, Login, Register, NotFound
│  ├─ client/           Dashboard, Appointments, Notifications
│  └─ admin/            Dashboard, Calendar, Services, Staff, Clients, Settings
├─ routes/              ProtectedRoute, AdminRoute, AppRoutes
├─ types/               database.ts
└─ utils/               availability (slot), format
supabase/schema.sql     schema + RLS + trigger + seed
```

**Flusso dati (switch automatico):**

```
React UI (pages)
      │
      ▼
Hooks (useServices/useStaff/useNotifications/…) + lib/appointments + lib/scheduling
      │
      ▼
lib/supabase.ts  ──►  isSupabaseConfigured ?
      │                        │
      │  NO (demo)             │  SÌ (produzione)
      ▼                        ▼
localClient (mock)        @supabase/supabase-js
      │                        │
      ▼                        ▼
localStorage             Supabase (Postgres + Auth + Realtime + RLS)
```

- **Flusso login:** `AuthContext` → `supabase.auth` → in demo verifica credenziali su `localStorage`, in produzione su Supabase Auth. Il profilo (con `role`) è letto da `profiles`.
- **Flusso prenotazione:** wizard `Booking.tsx` → `scheduling` (orari + chiusure) + `fetchDayConfirmedAppointments` → `utils/availability.computeAvailableSlots` → `appointments.createAppointment` (insert + notifica + controllo overlap).
- **Flusso admin:** pagine admin → in parte tramite `lib/*`, **in parte con chiamate `supabase.*` dirette** (vedi §13).

**Nota architetturale onesta:** l'astrazione dati **non è** un `dataProvider` separato bensì un **client Supabase intercambiabile**. Funziona in entrambe le modalità, ma diverse pagine admin e la Login **chiamano `supabase` direttamente** invece di passare da hook/lib comuni.

---

## 4. Analisi Database

Fonte: `supabase/schema.sql`. È **completo e ben scritto**, ma **fornito, non eseguito online**. In demo le tabelle sono replicate come array in `localStorage` (`demoData.ts`).

| Tabella | Presente | Completa | Demo/Produzione | Note |
|---|---|---|---|---|
| profiles | Sì | Sì | Predisposto / Demo | FK a `auth.users`, ruolo `client/admin`, trigger creazione |
| services | Sì | Sì | Predisposto / Demo | durata, prezzo, categoria, active, sort_order |
| staff_members | Sì | Sì | Predisposto / Demo | ruolo, bio, avatar, active |
| staff_availability | Sì | Sì | Predisposto / Demo | orari settimanali per weekday |
| salon_closures | Sì | Sì | Predisposto / Demo | chiusure salone o ferie singolo staff |
| appointments | Sì | Sì | Predisposto / Demo | status, prezzo, **exclusion constraint anti-overlap** |
| notifications | Sì | Sì | Predisposto / Demo | generate da trigger su insert/cancel |

**Pronto davvero (nel file):** enum, foreign key, indici, `updated_at` automatico, **RLS su tutte le tabelle**, trigger `handle_new_user` (crea profilo), trigger `notify_appointment` (notifiche), **exclusion constraint** GiST anti doppia-prenotazione, seed (6 servizi, 3 staff, orari).
**Solo predisposto:** l'esecuzione su un progetto Supabase reale.
**Manca:** progetto Supabase creato, schema eseguito online, admin reale promosso, dati demo online (i dati demo sono **solo localStorage**).

---

## 5. Analisi Backend

Il backend è interamente **Supabase (BaaS)**: non esiste un server applicativo custom.

| Componente | Stato | Note |
|---|---|---|
| Supabase Auth | **PREDISPOSTO** | Email/password, sessione persistente, reset password (solo in modalità Supabase) |
| Supabase Database | **PREDISPOSTO** | Schema completo, non eseguito online |
| RLS (policy) | **PREDISPOSTO** | Complete: cliente vede i propri, admin tutto, scrittura servizi/staff solo admin |
| Funzioni SQL | **PREDISPOSTO** | `is_admin()`, `handle_new_user()`, `notify_appointment()`, `set_updated_at()` |
| Realtime | **PARZIALE** | Usato solo per le notifiche in-app; in demo simulato con event bus |
| Anti-overlap | **COMPLETO** | Doppio livello: controllo client + exclusion constraint DB |
| Edge Functions | **MANCANTE** | Nessuna funzione serverless |
| Email transazionali | **MANCANTE** | Nessun invio email (conferme, reset reali dipendono da config Supabase) |
| Webhook | **MANCANTE** | — |
| Validazioni server-side | **PARZIALE** | Garantite da vincoli DB + RLS; nessuna logica applicativa server |
| Gestione ruoli | **COMPLETO** (Supabase) | `role` su `profiles` + `is_admin()` in RLS |

**Limiti backend attuali:** nessuna automazione (reminder, email), nessuna logica server oltre a trigger SQL, niente rate limiting o protezione anti-abuso a livello applicativo.

---

## 6. Analisi Frontend

Tutte le pagine sono implementate, navigabili, responsive e senza pulsanti morti.

| Pagina | Stato | Funzionalità | Problemi | Priorità |
|---|---|---|---|---|
| Home | **COMPLETO** | Hero, servizi, why-us, gallery, team, recensioni, orari, mappa, CTA | Immagini da Unsplash (URL esterni) | — |
| Servizi | **COMPLETO** | Lista + filtro categoria (dati DB/demo) | — | — |
| Prenota | **COMPLETO** | Wizard 4 step con slot reali | Timezone browser (vedi §7) | Importante |
| Login | **COMPLETO** | Form validato (Zod), reset password | Reset reale solo in Supabase | — |
| Registrazione | **COMPLETO** | Validazione, conferma email gestita | — | — |
| Dashboard Cliente | **COMPLETO** | Recap profilo, prossimo appuntamento, contatori | — | — |
| Appuntamenti Cliente | **COMPLETO** | Prossimi/storico, disdici con soglia | — | — |
| Notifiche | **COMPLETO** | Lista + segna letta/e | — | — |
| Admin Dashboard | **COMPLETO** | Statistiche (oggi/settimana/ricavi/top/cancellazioni) | Ricavi su 7gg fissi | — |
| Admin Calendario | **COMPLETO** | Vista giorno, filtri staff/stato, dettaglio, crea manuale, completa/cancella | Solo vista giornaliera (no settimana/mese grafici) | Migliorabile |
| Admin Servizi | **COMPLETO** | CRUD + attiva/disattiva | — | — |
| Admin Staff | **COMPLETO** | CRUD + attiva/disattiva | — | — |
| Admin Clienti | **COMPLETO** | Lista, ricerca, conteggio appuntamenti | — | — |
| Admin Disponibilità | **COMPLETO** | Fasce orarie per staff + chiusure/ferie | — | — |
| Not Found | **COMPLETO** | 404 con ritorno home | — | — |

**Qualità:** componenti riutilizzabili coerenti, loading/empty state presenti ovunque, form validati con React Hook Form + Zod, palette pilotata da config. **Accessibilità base** presente (label, aria-label) ma non auditata WCAG.

---

## 7. Analisi Prenotazioni

`utils/availability.ts` + `Booking.tsx` + `lib/appointments.ts`.

**Cosa funziona / è robusto:**
- Scelta servizio (durata + prezzo mostrati), scelta staff **o “qualsiasi disponibile”** (assegna il primo stylist libero).
- Slot calcolati sulla **durata reale** del servizio con **passo** e **buffer** configurabili (`salonConfig.booking`).
- Rispetto di: orari di lavoro dello staff per giorno, **giorni chiusi/ferie**, **niente prenotazioni nel passato**, **niente sovrapposizioni** con appuntamenti confermati.
- **Cancellazione** consentita solo entro la soglia configurabile (default 3h).
- **Doppia barriera anti-overlap:** controllo client + exclusion constraint DB (in demo: check equivalente che ritorna errore `23P01`). Verificato: la seconda prenotazione dello stesso slot viene rifiutata.
- Conferma con toast + notifica generata automaticamente.

**Fragile / casi limite:**
- **Timezone/DST:** i calcoli usano l'ora locale del browser. Con clienti/salone in fuso diverso o al cambio ora legale possono esserci disallineamenti. **Da normalizzare a un timezone del salone.**
- **Race condition** tra due clienti sullo stesso slot: gestita solo dal vincolo DB (in demo dal check locale). In produzione è corretta; l'utente perdente riceve un errore e deve riscegliere.
- La disponibilità è ricalcolata lato client: nessuna prenotazione “tenuta” (hold) durante la compilazione.

**Per produzione reale servono:** timezone esplicito, eventuale slot-hold temporaneo, test di concorrenza su Supabase reale.

---

## 8. Analisi Admin Dashboard

- **Statistiche:** appuntamenti oggi, settimana, ricavi stimati (somma prezzi 7gg), servizio più richiesto, cancellazioni. **Funzionanti** ma su finestra fissa 7 giorni, senza selettore periodo.
- **Calendario:** vista **giornaliera** con navigazione, **filtri per staff e stato**, dettaglio in modale, **creazione manuale** (scelta cliente/servizio/staff/data/ora), azioni **completa/cancella**. Manca una vista settimana/mese grafica (richiesta “giornaliero/settimanale/mensile” soddisfatta solo a livello giornaliero).
- **CRUD Servizi/Staff:** creazione, modifica, disattivazione; eliminazione con **fallback a disattivazione** se ci sono appuntamenti collegati (FK restrict simulata anche in demo).
- **Clienti:** lista con ricerca e conteggio appuntamenti (sola lettura).
- **Disponibilità:** gestione fasce orarie settimanali per stylist + chiusure/ferie.

**Limiti / feature mancanti:** nessun export (CSV/PDF), nessun log attività/audit trail, nessuna modifica orario di un appuntamento esistente (solo cancella/ricrea), permessi staff non granulari (un solo ruolo admin).

---

## 9. Analisi Demo Mode

**Cos'è:** quando mancano credenziali Supabase valide, `lib/supabase.ts` restituisce `localClient`, un mock che imita l'interfaccia di `@supabase/supabase-js` e persiste su `localStorage`.

**Cosa salva in localStorage:**
- `bns_demo_db_v1` — tutte le “tabelle” (profiles, services, staff, availability, closures, appointments, notifications).
- `bns_demo_users_v1` — utenti demo con **password in chiaro**.
- `bns_demo_session_v1` — sessione corrente.

**Credenziali demo:**
- Admin: `admin@demo.it` / `admin1234`
- Cliente: `cliente@demo.it` / `demo1234`

**Cosa può provare un cliente:** login, navigazione completa, prenotazione con slot reali, cancellazione, notifiche in-app, **tutti i CRUD admin**, statistiche. Le prenotazioni e le modifiche **persistono nel browser** tra i refresh.

**Cosa NON è reale:**
- I dati **non sono su un server**: vivono solo in quel browser/dispositivo, non condivisi tra utenti.
- L'auth è **finta** (nessuna crittografia, password in chiaro, sessione non firmata).
- Nessuna sicurezza: chiunque può manipolare `localStorage`.
- Il realtime è simulato con un event bus in-memory.

**Utilità commerciale:** eccellente per **demo di vendita, prototipazione, test UX**. **Rischio:** se confusa con la produzione dà falsa impressione di app “già online”. Il badge **“Demo”** in navbar mitiga, ma va comunicato chiaramente al cliente.

---

## 10. Analisi Supabase Production Mode

**Se `.env` è configurato con credenziali valide** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`), l'app usa Supabase reale: Auth, database, RLS, realtime.

**Cosa serve fare su Supabase (non ancora fatto):**
1. Creare un progetto Supabase.
2. Eseguire **tutto** `supabase/schema.sql` nell'SQL Editor.
3. Compilare `.env` con URL e anon key.
4. Registrarsi dall'app e promuovere il primo admin via SQL (`update profiles set role='admin' …`).
5. Configurare (o disattivare per test) la conferma email in Auth.

**`schema.sql` basta?** Sì per struttura, sicurezza e seed. **Non** configura email SMTP, storage immagini, né domini.

**Da testare (mai fatto online):** registrazione reale + trigger profilo, RLS (cliente non vede altrui), insert prenotazione + exclusion constraint sotto concorrenza, realtime notifiche.

**Possibili errori RLS/produzione:** se il trigger `handle_new_user` non è attivo, il profilo non viene creato e l'app non trova il ruolo; conferma email attiva blocca il primo login finché non confermata; policy che dipendono da `is_admin()` richiedono che l'utente abbia `role='admin'` già impostato.

**Checklist collegamento:** progetto creato ▢ · schema eseguito ▢ · `.env` compilato ▢ · admin promosso ▢ · email confermata/disattivata ▢ · test cliente/admin ▢.

---

## 11. Sicurezza

| Aspetto | Modalità Supabase | Modalità Demo |
|---|---|---|
| Ruoli | **Solido** (`role` + `is_admin()` in RLS) | Solo lato client |
| Protezione rotte | `ProtectedRoute`/`AdminRoute` (UX) | idem, aggirabile |
| RLS dati | **Completa** | Assente (localStorage) |
| Dati cliente | Isolati per utente da RLS | Tutti leggibili nel browser |
| Manipolazione client | Irrilevante (server valida) | **Totale** (localStorage editabile) |
| Validazioni server | Vincoli DB + RLS | Nessuna reale |

**Sintesi:** in produzione Supabase la sicurezza è **buona** (le protezioni vere sono in RLS, non nel frontend). La **modalità demo non è sicura per definizione** e non va mai usata come produzione. Password demo in chiaro. Nessun rate limiting/captcha su login/registrazione.

---

## 12. Performance ed efficienza

- **Bundle:** singolo chunk JS **626 KB (~176 KB gzip)** + CSS ~30 KB. Warning Vite “chunk > 500 KB”. Nessun **code-splitting** per rotta.
- **Rendering:** React 18, componenti leggeri; nessun problema evidente.
- **Chiamate dati:** in produzione query mirate con indici; la disponibilità fa 3 fetch parallele per giorno (accettabile). Nessuna cache client (es. React Query): ogni pagina rifà le query.
- **localStorage (demo):** lettura/scrittura sincrona dell'intero DB a ogni operazione — ok per dati piccoli, non scala.
- **Scalabilità:** dipende da Supabase; l'app non ha colli di bottiglia propri per volumi tipici di un salone.
- **Ottimizzazioni consigliate:** lazy-loading rotte (React.lazy), `manualChunks`, introdurre React Query per cache/dedup, immagini locali/ottimizzate al posto di Unsplash.

---

## 13. Bug, rischi e criticità

| Criticità | Gravità | Impatto | Soluzione |
|---|---|---|---|
| Nessun progetto Supabase collegato/testato | **CRITICO** | L'app “vera” non è online | Creare progetto, eseguire schema, testare |
| Modalità demo scambiabile per produzione | **CRITICO** | Falsa percezione di prodotto pronto | Comunicazione chiara + badge (già presente) |
| Password demo in chiaro in localStorage | Alta | Solo demo, ma cattiva pratica se estesa | Non usare demo come auth reale |
| Timezone/DST nei calcoli slot | Alta | Slot errati in fusi/cambio ora | Normalizzare a timezone salone |
| `npm run typecheck` non esiste come script | Media | Comando citato ma assente | Aggiungere `"typecheck":"tsc -b"` |
| Chiamate `supabase` dirette in 6 pagine (Login, Admin*) | Media | Astrazione dati non piena | Spostare in hook/lib comuni |
| Bundle unico > 500 KB | Media | Primo caricamento più lento | Code-splitting per rotta |
| Nessuna email (conferme/reset/reminder) | Alta | Funzioni chiave assenti in produzione | SMTP/Resend + Edge Functions |
| Realtime solo notifiche; niente sync calendario admin live | Bassa | Refresh manuale | Sottoscrizioni realtime su `appointments` |
| Nessun test automatico | Media | Regressioni non rilevate | Aggiungere unit/e2e |

**Verifica build reale:** `tsc -b` → **PASSATO** (0 errori). `vite build` → **PASSATO** (solo warning dimensione chunk). Nessun `TODO/FIXME` nel codice.

---

## 14. Cosa manca totalmente

**Mancante totalmente (non esiste):** Edge Functions · email transazionali · SMS/WhatsApp · reminder automatici · cancellazione via link email · Google Calendar sync · export appuntamenti · audit trail/log · test automatici · monitoring errori (Sentry) · analytics.

**Mancante per produzione:** progetto Supabase attivo · schema eseguito online · deploy/hosting · dominio · conferme email · gestione timezone.

**Mancante per vendibilità a cliente reale:** pagine legali (privacy/cookie/GDPR) · consenso dati · backup · onboarding salone.

**Mancante per SaaS multi-salone:** **multi-tenant** (oggi single-salon config-driven) · isolamento dati per salone · billing/abbonamenti · pannello super-admin · provisioning nuovo salone.

**Mancante per automazione:** reminder, notifiche esterne, code/scheduler, webhook.

---

## 15. Roadmap consigliata

| Fase | Attività | Priorità | Difficoltà | Tempo stimato | Impatto |
|---|---|---|---|---|---|
| **1 — Produzione reale** | Progetto Supabase, esecuzione schema, `.env`, promozione admin, test RLS/prenotazioni end-to-end, aggiungere script `typecheck` | Critico | Bassa | 1–2 giorni | Alto |
| **2 — Hardening sicurezza** | Verifica policy, timezone salone, rate limiting/captcha login, revisione chiamate dirette → lib, validazioni | Critico | Media | 3–5 giorni | Alto |
| **3 — Notifiche email/SMS/WhatsApp** | Edge Function su eventi appuntamento, SMTP/Resend per conferme+reminder, cancellazione via link, opz. Twilio/WhatsApp | Importante | Media | 4–7 giorni | Alto |
| **4 — Deploy & dominio** | Deploy Vercel, variabili env, dominio, immagini locali, pagine legali GDPR, analytics + Sentry | Importante | Bassa | 1–2 giorni | Alto |
| **5 — Multi-salone / SaaS** | Multi-tenant (tenant_id + RLS), pannello super-admin, billing/abbonamenti, onboarding | Migliorabile | Alta | 3–6 settimane | Strategico |
| **6 — Prodotto BNS Studio** | Vista calendario settimana/mese, export, audit log, permessi staff, Google Calendar, PWA/app | Migliorabile | Alta | 3–6 settimane | Alto |

---

## 16. Checklist finale test (pratica)

**Demo**
- ▢ `npm install` → `npm run dev` avvia senza `.env`
- ▢ Badge “Demo” visibile in navbar
- ▢ Login `admin@demo.it` / `admin1234` → pannello admin
- ▢ Login `cliente@demo.it` / `demo1234` → dashboard cliente
- ▢ Prenotazione → compare in “I miei appuntamenti” + notifica
- ▢ Doppio slot stesso orario → rifiutato
- ▢ Cancellazione entro soglia → stato “cancellato” + notifica
- ▢ CRUD servizi/staff/disponibilità/chiusure
- ▢ Refresh pagina → dati persistono (localStorage)

**Supabase (produzione)**
- ▢ Schema eseguito senza errori
- ▢ `.env` valido → badge Demo sparisce
- ▢ Registrazione → profilo creato (trigger)
- ▢ Promozione admin via SQL → accesso `/admin`
- ▢ Cliente NON vede appuntamenti altrui (RLS)
- ▢ Insert prenotazione concorrente → constraint anti-overlap
- ▢ Notifiche realtime in-app

**Trasversali**
- ▢ Mobile/tablet/desktop responsive
- ▢ `npm run build` pulito
- ▢ Deploy raggiungibile via dominio

---

## 17. Giudizio finale

**Stato reale:** MVP **completo e verificato in modalità DEMO**; produzione Supabase **predisposta ma non attivata online**. Frontend e logica di prenotazione sono di buona qualità; il backend esiste come schema/policy pronti ma non collegato.

**Completamento stimato:** ~**90%** come demo/prototipo · ~**65%** verso un gestionale di produzione reale · ~**25%** verso un SaaS multi-salone.

**Livello di vendibilità:**
- Come **demo/prototipo di vendita:** **SÌ, subito.**
- Come **template/MVP custom per UN salone:** **SÌ**, dopo Fase 1 + Fase 3/4 (Supabase + email + deploy), ~1–2 settimane.
- Come **gestionale di produzione affidabile:** **non ancora** (mancano email, timezone, deploy, legale).
- Come **SaaS multi-salone:** **NO** (serve rifattorizzazione multi-tenant, Fase 5).

**Cosa dire al cliente:** “È un MVP funzionante e personalizzabile; la demo mostra tutte le funzioni. Per andare online servono il collegamento al database, le email di conferma e il deploy.”
**Cosa NON promettere:** che è “già online e sicuro”, email/reminder automatici, gestione di più saloni, conformità GDPR pronta.

**Raccomandazione BNS Studio:** procedere con **Fase 1 e Fase 3–4** per trasformare la demo in un prodotto vendibile a un singolo salone; valutare la Fase 5 (multi-salone) solo se l'obiettivo è un SaaS.

**Prossima azione consigliata:** creare il progetto Supabase, eseguire `schema.sql`, collegare `.env` e ripetere la checklist di produzione end-to-end.

---

### Appendice — Esiti comandi reali (10/07/2026)

- `npm install` — **OK** (156 pacchetti, 0 vulnerabilità).
- `npm run typecheck` — **NON DISPONIBILE** (script assente; il typecheck gira dentro `npm run build`).
- `tsc -b` (typecheck) — **PASSATO**, 0 errori, 0 warning TypeScript.
- `npm run build` — **PASSATO**; unico warning: chunk JS > 500 KB (626 KB / 176 KB gzip).
- Ricerca `TODO/FIXME` — **nessuno**.
- Chiamate `supabase` dirette nelle pagine — **6 file** (`Login`, `AdminServices`, `AdminStaff`, `AdminSettings`, `AdminClients`, `AdminCalendar`).
