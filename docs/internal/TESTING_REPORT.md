# Testing Report

## Suite automatizzate

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

## QA browser

Verificati:

- Responsive senza overflow orizzontale su 320, 375, 390, 430, 768, 1024, 1280, 1440 e 1920 px.
- Scroll-to-top dopo navigazione SPA.
- Login cliente demo.
- Prenotazione completa su Copertino, Taglio donna, 22 luglio 2026, 08:30.
- Notifica cliente verso `/dashboard/appuntamenti?appointment=...`.
- Login admin demo.
- Notifica admin verso `/admin/calendario?appointment=...`, con giorno corretto, highlight e modal dettaglio.

## Note

Il build segnala solo il warning Vite sul chunk sopra 500 kB.
