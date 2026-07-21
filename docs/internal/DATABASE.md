# Database

## Tabelle principali

- `profiles`
- `locations`
- `services`
- `staff_members`
- `staff_services`
- `staff_availability`
- `appointments`
- `notifications`
- `settings`
- `content_sections`
- `media`

## Trigger e vincoli

- Notifiche automatiche per nuove prenotazioni e cancellazioni.
- Prevenzione overlap disponibilita staff per stesso operatore, sede e giorno.
- Exclusion constraint appuntamenti per evitare doppie prenotazioni su `pending` e `confirmed`.

## Migrazione

La migrazione finale e in `supabase/migrations/20260721_finalize_liberi_di_essere.sql`.
