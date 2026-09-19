# Xangarro Landing

Marketing site for **Xangarro!** — la plataforma mexicana para llevar la caja de tu negocio.
Hecho para emprendedores: panaderías, cafés, tiendas de barrio, talleres, consultorios.
Marketing only (Q18/ADR-084); its only product contract is the signup URL
`https://app.xangarro.mx/signup?plan=<xangarrito|xangarro|xangarrote>`.

## Commands

```bash
pnpm --filter @xangarro/landing dev      # Vite dev server
pnpm --filter @xangarro/landing build    # client build + SSR prerender + smoke tests (also the `test` task)
pnpm --filter @xangarro/landing preview  # serve dist/ on :4173
node scripts/generate-og.mjs             # regenerate og-image + favicon + apple-touch-icon + site.webmanifest
```

## Structure

- `index.html` — HTML template; `__SITE_URL__` / `__PLAUSIBLE_SNIPPET__` placeholders are
  substituted at build time (`vite.config.js`).
- `src/` — `App.jsx` (client shell, lazy below-fold sections), `AppSSR.jsx` (eager render for
  prerender), the tiny hand-rolled router, `structured-data.js` (JSON-LD) and the
  `/recursos` content pages.
- `landing/` — the section components: `Sections.jsx` (Nav + Hero), `copy.jsx`
  (TONE_COPY decks + FAQ single source of truth), `planes.js` (**plan data single source** —
  pricing table, FAQs, JSON-LD offers and CTAs all read from here), `AnimatedHero.jsx`,
  `PhoneScreens.jsx`, `sections/` (ParaQuienEs, ComoFunciona, Recorrido, Precios,
  ContactoFooter).
- `scripts/` — `build.mjs` (client build), `prerender.mjs` (SSR prerender of the 6 routes,
  per-route title/description/canonical, domain substitution into robots/sitemap, smoke
  tests), `generate-og.mjs` (social + icon assets, sharp).
- `public/` — static assets copied verbatim; `robots.txt` / `sitemap.xml` are hand-written
  (keep the route list in sync with `ROUTES` in `prerender.mjs`), `llms.txt` / `llms-full.txt`
  are the LLM-facing product summaries.

## Brand

Text wordmark `XANGARRO!` (no image logo exists yet — real artwork lands with X-07); yellow
`#FFD60A` / black kept. Prices are **+ IVA** everywhere (N-01); plan data lives in
`landing/planes.js` — never hard-code a price in a section.

## Placeholders to verify before launch

- `hola@xangarro.mx` and `+52 55 5555 5555` (`landing/sections/ContactoFooter.jsx`)
- Social media URLs (`SOCIALS` array, same file) — `@xangarro` handles assumed, owner to confirm
- Store badges stay "Próximamente en" until X-05
