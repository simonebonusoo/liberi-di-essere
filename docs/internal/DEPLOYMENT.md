# Deployment

## Prerequisiti

- Progetto Supabase configurato.
- Variabili `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- Schema SQL applicato da `supabase/schema.sql` o migrazione finale.
- Dominio demo configurato.

## Build

```bash
npm run build
```

Pubblicare `dist`.

## Checklist

- Callback auth su dominio produzione.
- DNS del sottodominio verso hosting.
- `robots.txt` e meta noindex attivi per demo privata.
- Provider notifiche configurati solo dopo accordo cliente.
