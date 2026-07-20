# BNS Studio — Gestionale Parrucchiere

Web app completa e **modulare** per saloni di parrucchieri: sito vetrina premium,
prenotazioni online con calcolo disponibilità reale, area cliente, pannello admin
e notifiche interne. Riadattabile a qualsiasi salone modificando **un solo file di
config** + i dati nel database.

**Stack:** React + Vite + TypeScript · Supabase (DB, Auth, RLS, Realtime) ·
Tailwind CSS · React Router · React Hook Form + Zod · react-hot-toast · date-fns.

---

## 0. Avvio DEMO immediato (senza Supabase) ⚡

Il progetto ha uno **switch automatico**: se non trova credenziali Supabase valide
parte in **modalità demo locale**, con dati persistiti in `localStorage`. Tutto
funziona (login, prenotazioni, admin, notifiche) senza configurare nulla.

```bash
npm install
npm run dev
```

Poi accedi con gli **account demo**:

| Ruolo   | Email             | Password    |
| ------- | ----------------- | ----------- |
| Admin   | `admin@demo.it`   | `admin1234` |
| Cliente | `cliente@demo.it` | `demo1234`  |

In modalità demo compare un badge **“Demo”** nella navbar. I dati demo (6 servizi,
3 stylist, orari, appuntamenti, notifiche, clienti) sono precaricati.

**Resettare i dati demo:** apri la console del browser ed esegui
`localStorage.removeItem('bns_demo_db_v1'); localStorage.removeItem('bns_demo_users_v1'); localStorage.removeItem('bns_demo_session_v1'); location.reload()`
(oppure `localStorage.clear()`), poi ricarica.

Per passare alla **modalità produzione Supabase** basta creare il file `.env`
con credenziali valide (vedi sotto): l'app userà automaticamente Supabase.

---

## 1. Requisiti

- Node.js ≥ 18 (testato su Node 24)
- Un account gratuito su [supabase.com](https://supabase.com)

---

## 2. Avvio passo passo

```bash
# 1. Installa le dipendenze
npm install

# 2. Crea il file .env dai valori del tuo progetto Supabase
cp .env.example .env
#    poi apri .env e incolla URL e ANON KEY (vedi punto 4)

# 3. Crea lo schema del database (vedi punto 3)

# 4. Avvia in sviluppo
npm run dev        # http://localhost:5173

# Build di produzione
npm run build
npm run preview
```

> Se avvii senza `.env`, l'app mostra una **schermata di setup** con le istruzioni
> invece di andare in errore.

---

## 3. Database Supabase

1. Crea un nuovo progetto su Supabase.
2. Apri **SQL Editor → New query**.
3. Copia **tutto** il contenuto di [`supabase/schema.sql`](supabase/schema.sql) e premi **Run**.

Lo script crea (in modo idempotente, puoi rilanciarlo):

- Tabelle: `profiles`, `services`, `staff_members`, `staff_availability`,
  `salon_closures`, `appointments`, `notifications`
- Enum, foreign key, indici, `updated_at` automatico
- **Row Level Security** completa su tutte le tabelle
- Trigger:
  - creazione automatica del profilo alla registrazione
  - generazione notifiche su creazione/cancellazione appuntamento
- **Exclusion constraint** anti doppia-prenotazione (nessun overlap per stylist)
- **Seed** con 6 servizi, 3 stylist e i relativi orari di lavoro (Mar–Sab)

### Conferma email (opzionale)

Di default Supabase richiede la conferma via email. Per un test rapido puoi
disattivarla: **Authentication → Providers → Email → “Confirm email” = off**.
L'app gestisce entrambi i casi.

---

## 4. Variabili d'ambiente (`.env`)

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Le trovi in **Supabase → Project Settings → API** (`Project URL` e `anon public`).
Il file `.env` è già in `.gitignore`.

---

## 5. Creare il primo ADMIN

1. Avvia l'app e **registrati** normalmente da `/registrati`.
2. In **Supabase → SQL Editor** esegui (con la tua email):

```sql
update public.profiles set role = 'admin' where email = 'tua@email.com';
```

3. Rientra nell'app: comparirà il pulsante **Admin** e potrai accedere a `/admin`.

---

## 6. Riadattare il sito a un altro parrucchiere

Modifica **solo** [`src/config/salonConfig.ts`](src/config/salonConfig.ts):

| Cosa cambi                     | Dove                                   |
| ------------------------------ | -------------------------------------- |
| Nome, logo, payoff, testi      | `name`, `logoText`, `tagline`, `hero*` |
| **Colori** (brand + accent)    | `colors` → la palette si rigenera sola |
| Indirizzo, telefono, email, IG | `contact`                              |
| Orari di apertura vetrina      | `hours`                                |
| Regole prenotazione/buffer     | `booking`                              |
| Vetrina servizi/team/gallery   | `showcaseServices`, `team`, `gallery`  |

I **servizi, staff, orari e chiusure “reali”** (quelli usati per prenotare) si
gestiscono dal **pannello admin** o via seed SQL — nessuna modifica al codice.

> La palette è pilotata da CSS variables: cambiando `colors.brand` e `colors.accent`
> cambia automaticamente l'intero tema (bottoni, badge, calendario, ecc.).

---

## 7. Struttura del progetto

```
src/
├─ components/        # Button, Card, Modal, Input, Select, Badge, Calendar,
│  └─ ui/             # ServiceCard, StaffCard, AppointmentCard, Navbar, Footer…
├─ config/            # salonConfig.ts  ← personalizzazione salone
├─ context/           # AuthContext (sessione, ruolo, login/logout)
├─ hooks/             # useServices, useStaff, useNotifications, useClientAppointments
├─ layouts/           # PublicLayout, DashboardLayout, AdminLayout
├─ lib/               # supabase, appointments (data layer), scheduling
├─ pages/             # Home, Services, Booking, Login, Register, NotFound
│  ├─ client/         # Dashboard, Appointments, Notifications
│  └─ admin/          # Dashboard, Calendar, Services, Staff, Clients, Settings
├─ routes/            # ProtectedRoute, AdminRoute, AppRoutes
├─ types/             # database.ts (tipi allineati allo schema)
└─ utils/             # availability (logica slot), format, ecc.
supabase/schema.sql   # schema + RLS + trigger + seed
```

---

## 8. Logica di disponibilità

Gli slot prenotabili (`src/utils/availability.ts`) rispettano:

- orari di lavoro dello stylist per quel giorno della settimana
- chiusure salone / ferie del singolo stylist
- nessuno slot nel passato
- nessun overlap con appuntamenti confermati (+ buffer configurabile)
- durata dello slot = durata del servizio, passo = `slotIntervalMinutes`
- “Qualsiasi stylist disponibile”: assegna il primo libero
- cancellazione permessa solo entro la soglia (`cancellationThresholdHours`, default 3h)

Il database è l'ultima barriera: un **exclusion constraint** impedisce comunque
il doppio-booking anche in caso di richieste concorrenti.

---

## 9. Checklist finale di test

**Setup**
- [ ] `npm install` senza errori
- [ ] Schema SQL eseguito su Supabase senza errori
- [ ] `.env` compilato, `npm run dev` avvia l'app (niente schermata di setup)

**Auth**
- [ ] Registrazione nuovo cliente → profilo creato in `profiles`
- [ ] Login / logout / refresh pagina mantiene la sessione
- [ ] Rotta `/dashboard` reindirizza a `/login` se non autenticato
- [ ] Promozione ad admin via SQL → accesso a `/admin`; un cliente NON accede

**Prenotazioni (cliente)**
- [ ] Wizard: servizio → stylist (o “qualsiasi”) → data → **solo slot liberi**
- [ ] Non compaiono orari nel passato o fuori orario di lavoro
- [ ] Conferma → toast + comparsa in “I miei appuntamenti” + notifica campanella
- [ ] Prenotare lo stesso slot due volte → bloccato (slot sparisce / errore)
- [ ] Disdici appuntamento futuro → stato “Cancellato” + notifica

**Admin**
- [ ] Dashboard: contatori oggi/settimana, ricavi, servizio top, cancellazioni
- [ ] Calendario: filtri per stylist/stato, dettaglio, completa/cancella
- [ ] Creazione appuntamento manuale per un cliente
- [ ] Servizi: crea / modifica / disattiva-elimina
- [ ] Staff: crea / modifica / disattiva-elimina
- [ ] Disponibilità: aggiungi/rimuovi fasce orarie per stylist
- [ ] Chiusure/ferie: aggiungi una chiusura → quel giorno niente slot
- [ ] Clienti: lista, ricerca, conteggio appuntamenti

**Notifiche**
- [ ] Cliente riceve notifica su prenotazione/cancellazione
- [ ] Admin riceve notifica su nuova prenotazione
- [ ] Badge contatore + “segna come lette”

**Responsive**
- [ ] Mobile / tablet / desktop: navbar, wizard, calendario, tabelle admin

---

## 10. Note

- Le **email** non sono inviate da SMTP: le notifiche sono interne (tabella
  `notifications` + realtime). La struttura è pronta per aggiungere una Edge
  Function che invii email sugli stessi eventi, senza bloccare il resto.
- Per rigenerare i tipi dal DB puoi usare la Supabase CLI
  (`supabase gen types typescript`) e sostituire `src/types/database.ts`.

Buon lavoro con **BNS Studio** ✂️
