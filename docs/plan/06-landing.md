# Track L — Landing (`apps/landing`; was `~/Projects/CachinkLanding`)

> **Now in the monorepo (ADR-084, 2026-09-18).** The site was imported with its history into
> `apps/landing` (`@xangarro/landing`, pnpm workspace member, Vercel project `xangarro-landing`).
> Paths in the tasks below (`src/`, `public/`, `index.html`, …) are relative to `apps/landing/`;
> "the app repo" and "the landing repo" are now the same repo. The old GitHub repo is to be archived.

> Marketing only (Q18). Vite site, existing SEO/GEO work preserved. Its only contract with the
> product is the signup URL: `https://app.xangarro.mx/signup?plan=<xangarrito|xangarro|xangarrote>`
> (ADR-059 plan ids; the Q14 slugs below are historical). Repo: `z3r0maker/CachinkLanding`
> (rename tracked in X-08). Small track — any session.

---

### L-01 Rename copy and assets to Xangarro!

- [x] Status · **Blocked by:** F-01 (so the store badge targets exist as decisions)
  - Done: 2026-09-18 · with N-31 (`track-n/n31-landing`) · every copy/asset renamed (TONE_COPY decks,
    FAQ, sections, articles, Recursos, index.html head, structured-data, prerender titles, llms.txt,
    llms-full.txt, robots, sitemap). Brand renders as the text wordmark `XANGARRO!` (same approach as
    the portal sidebar; no image assets exist — real artwork stays X-07). favicon-32 / apple-touch-icon
    / og-image are sharp-generated placeholders via `scripts/generate-og.mjs`; minimal
    `site.webmanifest` added; the unreferenced 2 MB Cachink `logo.png` removed; stale
    `docs/landing/index.html` deleted. `grep -rni cachink` → 0 (articles included). Lighthouse not
    re-run: the SEO head structure (title/description/canonical/OG) is preserved 1:1.
- **Steps:** all copy `Cachink!` → `Xangarro!`; tagline "Finanzas para tu negocio — la app que le da flujo a las PyMEs de México."; `<title>`, OG tags, `manifest`, favicon placeholder (real artwork X-07); remove/replace `docs/landing/index.html` in the **app repo** (stale duplicate landing — delete it there, note in Done). Keep yellow `#FFD60A` / black.
- **Acceptance:** `grep -rni cachink src public index.html` → 0 (except historical blog/changelog if any); Lighthouse SEO score unchanged or better.

### L-02 Pricing section

- [x] Status · **Blocked by:** L-01
  - Done: 2026-09-18 · with N-31 · card rebuilt to the ADR-059/N-31 tiers: Xangarrito $0 · Xangarro
    $199 ("Recomendado") · Xangarrote $399 MXN·mes, monthly/annual toggle (annual $1,990/$3,990 =
    "2 meses gratis"), every paid price badged **"+ IVA"** with the IVA-inclusive totals
    ($230.84/$462.84 monthly, $2,308.40/$4,628.40 annual) in the footnote; limits 300/50 · 10k/1k ·
    30k/5k + operadores 1/2/5; exportación on every tier; NIF/informe PDF on paid tiers;
    "Multi-sucursal (próximamente)" on Xangarrote. Single source of truth `landing/planes.js`
    (pricing table, FAQ, JSON-LD offers). The pre-ADR-059 "approved image" three-tier layout no
    longer applies. Responsive verified at 360 px and 1440 px (screenshots); annual toggle
    functional (prices/cadence/aria-pressed/CTA params checked in-DOM).
- **Context:** the three-tier card (Freelancer $0 / Emprendedor $199 / MiPyME Pro $399 MXN·mes, "El más popular" on Emprendedor, "Probar 14 días gratis" on Pro) with the Q14 adjustments.
- **Steps:** build the card; copy rules: "Exportación de tus datos (Excel)" listed under **every** tier; Pro lists "Reportes avanzados y PDF para tu contador" instead of plain "Exportación"; the "Roles Director/Equipo" line becomes "1 operador / 2 operadores (dueño + empleado) / 5 operadores"; "Hasta 50 registros al mes" stays on Freelancer; "Multi-sucursal (próximamente)" stays on Pro. Prices come from one constants file so they're changed in one place; mark "IVA incluido" or "+ IVA" explicitly (decide with the user before shipping — default "+ IVA").
- **Acceptance:** matches the approved image structurally; responsive at 360 px; each CTA carries the right `plan` param (L-03).

### L-03 CTAs → portal signup

- [x] Status · **Blocked by:** L-02, P-03 (URL must exist) · **Blocks:** X-02
  - Done: 2026-09-18 · with N-31 · every CTA now carries the **ADR-059 plan ids**
    (`/signup?plan=xangarrito|xangarro|xangarrote`) — hero (cta1), nav, the three tier cards and the
    five article/Recursos cards (the Q14 slugs in this task's steps were stale). The waitlist
    email-capture form, `VITE_WAITLIST_ENDPOINT` and the "Lista de espera" CTAs are removed;
    utm_source/medium/campaign/term/content pass through to every signup link (App.jsx effect,
    prerendered hrefs stay static for crawlers).
- **Steps:** "Crear cuenta gratis" → `/signup?plan=freelancer`; "Empezar ahora" → `/signup?plan=emprendedor`; "Probar 14 días gratis" → `/signup?plan=mipyme_pro`; hero CTA → emprendedor. UTM params passed through. No checkout on the landing.
- **Acceptance:** clicking each lands on the portal with the plan preselected (manual + a link-check script).

### L-04 Domain + DNS + email domain

- [ ] Status · **Blocked by:** — (do early; ADR-054 follow-up)
      **Remaining (2026-09-23, verified against the code):** owner-side only — registrar, DNS zone and Resend console (O-4 … O-6, O-13 in `11-pre-launch-and-deferred.md`); nothing in the repo can prove it.

- **Steps:** register `xangarro.mx`; DNS: apex → landing host, `app` → Vercel (P-01), `hola@xangarro.mx` sending domain verified for Resend (B-14) with SPF/DKIM/DMARC. Keep `cachink.mx` (if owned) redirecting 301 to `xangarro.mx` for a year.
- **Acceptance:** `dig app.xangarro.mx` resolves to Vercel; a test email from Resend passes DMARC.

### L-05 Store badges + legal pages

- [ ] Status · **Blocked by:** X-05 (real store URLs)
      **Remaining (2026-09-23, verified against the code):** no privacidad/términos route on the landing and the legal texts are not linked from it; store badges wait for X-05's real URLs; `docs/legal/terms.md` mentions neither the 7-day grace nor the downgrade.

- **Steps:** replace placeholder store links when listings exist; privacy policy + terms updated for cloud storage of business data and the subscription terms (grace period, downgrade to Freelancer, data export) — source from `docs/legal/` in the app repo and keep one copy (link, don't duplicate).
- **Acceptance:** badges resolve; legal pages mention data export on every plan and the 7-day grace.

### L-06 SEO/GEO: crawler files are generated, not written

- [x] Status · **Blocked by:** —
  - Done: 2026-09-24 · `sitemap.xml`, `llms.txt` and `llms-full.txt` are no longer files in `public/`:
    `scripts/prerender.mjs` writes them into `dist/` from the route manifest (`src/routes.js`, now
    the single list behind the prerendered HTML, the smoke tests and the sitemap), `landing/planes.js`
    and `FAQ_ITEMS` (`src/llms/`), so the plans and all 15 FAQ answers models read are the ones the
    page renders. `<lastmod>` is each route's last commit date over its `sources` (build date when
    git is unavailable). The build fails when the sitemap misses a route or an llms file misses a
    plan or a question. Per-route `twitter:title`/`twitter:description` and `og:type` (`article` on
    the four guides) are substituted like the OG tags; articles carry Article + BreadcrumbList and
    `/recursos/` a CollectionPage + ItemList. The portal gained `app/robots.ts` (allow `/login` and
    `/signup`, disallow the rest; `tests/robots.test.ts`) and `metadataBase` from `PORTAL_URL`.
- Done: 2026-09-24 · the public profiles (Instagram @xangarro.mx, Facebook /xangarro) live once in
  `landing/social.js`: the Organization schema lists them as `sameAs` (plus `email`), `llms-full.txt`
  names them with their URLs, and the build fails when one is missing from it. The old line that
  claimed TikTok, X and YouTube is gone.
- Done: 2026-09-24 · every title is ≤ 60 characters and every description ≤ 155 (the home
  description leads with Don Cuentas; the NIF, errores-caja and vs-excel titles shortened), and the
  prerender fails past those limits (`checkHeadLengths`).

### L-07 SEO/GEO/AEO audit — round 1 (code-level findings)

- [x] Status · **Blocked by:** —
  - Done: 2026-09-24 · from the full audit (`scratchpad` report, scores SEO 7 · GEO 6 · AEO 7), every
    finding that lives in code: the legal pages' document title is the H1; each guide shows
    «Publicado / Actualizado» with the route's last commit date (`virtual:lastmod`, a Vite plugin
    over the same `lastmodFor` the sitemap uses) and carries it as `dateModified`; the four guides
    share one header, «Sigue leyendo» links and one CTA (`pages/articles/shared.jsx`, fed by
    `src/articles.js`, which the Recursos index and the 404 also read) — the leftover «Unirme a la
    lista» waitlist buttons and the stale «$149 MXN/mes» in the comparativa went with it; the
    sin-excel week plan is a HowTo (steps anchored `#paso-n`); the five errores are an `<ol>`; the
    NIF guide links CINIF and SAT; Offers carry their signup URL and `operatingSystem` says «Web»;
    a branded `404.html` (noindex, no canonical, kept out of the sitemap); the two FAQ answers over
    60 words are trimmed and the build now fails past 60 (`checkFaqLengths`).
- Done (round 2, code): 2026-09-24 · every guide has its own social card — `scripts/generate-og.mjs`
  (now a driver over `scripts/og-card.mjs`) renders `public/og/<slug>.{png,webp}` from `src/articles.js`,
  committed because the build server lacks the font; the prerender puts it in `og:image` /
  `twitter:image` with the guide's title as alt and fails when a card is missing; the Article
  schema carries it as `image` (Google's article rich result needs one). A `WebSite` node joins the
  home graph. The portal's two indexable pages, `/login` and `/signup`, have their own title and
  description. Each guide links into the home section it argues for (`/#portal`, `/#por-que`,
  `/#como`, `/#precios`). `home/useInView.js` → `use-in-view.js`, so the landing lints clean.
- Done: 2026-09-24 · the guides are signed by both founders — `landing/authors.js` (Eduardo
  Torres, producto y tecnología; Antonio Alejo, estrategia, finanzas y legal; no profile links, no
  bios, by choice) feeds the byline, two Person nodes (on the home graph and beside every Article,
  as its `author`), the Organization's `founder`, and a «Quiénes están detrás» section in
  llms-full.txt that the build checks.
- **Round 2 (needs the owner):** content for an «Acerca de» page (the founders' names and roles are
  in `landing/authors.js`; missing: city, year, the reason it exists, and the legal name the aviso
  also needs); customer quotes once the beta yields them (Review
  schema only with real reviews); DNS for both domains (L-04). **Content, not code:** growing the
  NIF guide into a 1,200-word pillar with an example estado de resultados.
