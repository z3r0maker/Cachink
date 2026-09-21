# Receipt fonts (N-20)

Plus Jakarta Sans 400–800 and JetBrains Mono 400–700, static TTFs from
Google Fonts (SIL OFL 1.1 — license files beside the TTFs). The receipt
renderers reference them by family name.

- **Linux (CI, deploys):** resolved through fontconfig — the server writes
  a conf pointing at this directory into a temp dir at render time
  (`server/comprobante/render.ts`).
- **macOS (local dev):** resolved through CoreText — run
  `apps/web/scripts/fuentes-comprobantes.sh` once per machine to install
  them in `~/Library/Fonts`.
