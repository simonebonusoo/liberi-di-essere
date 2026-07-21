# Demo Guide - Liberi di Essere

## Avvio

```bash
npm install
npm run dev
```

Apri `http://127.0.0.1:5173/`.

## Accessi demo

- Super admin: `superadmin@demo.it` / `super1234`
- Admin salone: `admin@demo.it` / `admin1234`
- Cliente: `cliente@demo.it` / `demo1234`

In login sono presenti pulsanti rapidi finché Supabase non è configurato.

## Percorso cliente

1. Apri la homepage.
2. Vai su `Prenota`.
3. Scegli la sede di Copertino.
4. Scegli categoria e servizio.
5. Scegli un operatore o “Qualsiasi operatore disponibile”.
6. Scegli data e orario.
7. Verifica riepilogo, sede, indirizzo, prezzo indicativo e policy.
8. Conferma.
9. Mostra `Area cliente -> I miei appuntamenti`.

Ricorda al cliente che le prenotazioni demo non sono reali.

## Percorso amministratore

1. Accedi come `admin@demo.it`.
2. Apri `Admin`.
3. Mostra dashboard, calendario, servizi, staff e clienti.
4. In `Impostazioni operative` mostra:
   - sedi configurabili
   - Sant'Isidoro come sede stagionale
   - attivazione/disattivazione prenotabilità
   - orari per operatore e sede
   - chiusure e ferie
   - reset ambiente demo

## Attivare Sant'Isidoro

1. Vai in `Admin -> Impostazioni operative`.
2. Nella card Sant'Isidoro attiva `Prenotabile`.
3. Torna su `Prenota`: la sede appare tra le opzioni.

## Modificare servizi e operatori

- `Admin -> Servizi`: crea, modifica, disattiva o elimina servizi demo.
- `Admin -> Staff`: crea, modifica, disattiva o elimina operatori demo.
- Se un servizio/operatore ha appuntamenti collegati, la cancellazione diventa disattivazione.

## Reset demo

1. Vai in `Admin -> Impostazioni operative`.
2. Premi `Ripristina dati demo`.
3. Conferma.
4. L'app ripristina dati e torna al login.

## Punti da chiarire durante la presentazione

- Il logo “LE” è un segnaposto, non il logo ufficiale.
- Telefono, email e social sono provvisori.
- Prezzi e durate sono dimostrativi.
- L'indirizzo di Sant'Isidoro è provvisorio e non va trasformato in via/civico inventati.
- Le notifiche non inviano email, SMS o WhatsApp reali.
- I testi legali sono placeholder e devono essere redatti prima della produzione.
