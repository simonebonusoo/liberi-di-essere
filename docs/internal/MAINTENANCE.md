# Maintenance

## Routine

- Aggiornare dipendenze con test completi.
- Rigenerare PDF dopo modifiche documentali.
- Verificare RLS a ogni nuova tabella o policy.
- Controllare warning build e dimensione chunk.

## Comandi

```bash
npm run lint
npm run typecheck
npm test
npm run build
/Users/simonebonuso/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/generate_pdfs.py
```
