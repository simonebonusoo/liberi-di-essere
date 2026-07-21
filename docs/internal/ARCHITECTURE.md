# Architecture

## Frontend

React con routing pubblico, cliente e admin. Layout separati per sito, dashboard cliente e pannello admin.

## Data layer

Le operazioni dati sono incapsulate in `src/lib/*` e hook dedicati. `src/lib/supabase.ts` seleziona Supabase reale o client locale demo.

## Scheduling

La disponibilita combina servizio, sede, staff, finestre operative, chiusure e appuntamenti esistenti.

## Styling

Tailwind CSS con componenti UI riutilizzabili (`Button`, `Card`, `Modal`, `Select`, `Input`) e animazioni leggere rispettose di `prefers-reduced-motion`.
