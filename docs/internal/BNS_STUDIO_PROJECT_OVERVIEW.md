# Liberi di Essere - Project Overview

## Obiettivo

Gestionale demo per salone femminile con sito pubblico, prenotazione online, area cliente, pannello admin, multi-sede, servizi, staff, disponibilita, notifiche interne e fallback locale.

## Stato finale

- Branch: `develop`.
- Stack: React 18, Vite, TypeScript, Supabase, Tailwind, Vitest.
- Modalita demo: dati locali in `localStorage` quando Supabase non e configurato.
- Produzione: schema SQL, RLS, seed demo e migrazione versionata in `supabase/migrations/`.

## Funzionalita principali

- Prenotazione guidata: sede, categoria, servizio, disponibilita, riepilogo e conferma.
- Calendario admin con deep link da notifica e modal dettaglio appuntamento.
- Disponibilita operatori per sede, giorno e fasce orarie.
- Blocco slot gia occupati per appuntamenti `pending` e `confirmed`.
- Notifiche cliccabili cliente/admin con `read_at`, `route`, `entity_type` e `entity_id`.
- Scroll-to-top automatico sui cambi pagina.
- UI responsive verificata sui principali breakpoint.

## Limiti dichiarati

La demo non invia email, SMS o WhatsApp reali. Logo, listino, indirizzo Sant'Isidoro, policy e testi legali restano da confermare col cliente.
