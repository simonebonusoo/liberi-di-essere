# Security

## Autenticazione

Supabase Auth gestisce accesso cliente, admin salone e super admin BNS. In locale i pulsanti demo sono disponibili solo quando Supabase non e configurato.

## Autorizzazioni

RLS protegge dati utente e operativita admin. I ruoli principali sono `client`, `salon_admin`, `admin` e `super_admin`.

## Dati sensibili

La demo non deve contenere dati reali non autorizzati. I provider esterni per notifiche richiedono chiavi dedicate e consenso cliente.
