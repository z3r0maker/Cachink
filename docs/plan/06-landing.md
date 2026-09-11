# Track L — Landing (`~/Projects/CachinkLanding`, separate repo)

> Marketing only (Q18). Vite site, existing SEO/GEO work preserved. Its only contract with the
> product is the signup URL: `https://app.xangarro.mx/signup?plan=<freelancer|emprendedor|mipyme_pro>`.
> Repo: `z3r0maker/CachinkLanding` (rename tracked in X-08). Small track — any session.

---

### L-01 Rename copy and assets to Xangarro!

- [ ] Status · **Blocked by:** F-01 (so the store badge targets exist as decisions)
- **Steps:** all copy `Cachink!` → `Xangarro!`; tagline "Finanzas para tu negocio — la app que le da flujo a las PyMEs de México."; `<title>`, OG tags, `manifest`, favicon placeholder (real artwork X-07); remove/replace `docs/landing/index.html` in the **app repo** (stale duplicate landing — delete it there, note in Done). Keep yellow `#FFD60A` / black.
- **Acceptance:** `grep -rni cachink src public index.html` → 0 (except historical blog/changelog if any); Lighthouse SEO score unchanged or better.

### L-02 Pricing section

- [ ] Status · **Blocked by:** L-01
- **Context:** the three-tier card (Freelancer $0 / Emprendedor $199 / MiPyME Pro $399 MXN·mes, "El más popular" on Emprendedor, "Probar 14 días gratis" on Pro) with the Q14 adjustments.
- **Steps:** build the card; copy rules: "Exportación de tus datos (Excel)" listed under **every** tier; Pro lists "Reportes avanzados y PDF para tu contador" instead of plain "Exportación"; the "Roles Director/Equipo" line becomes "1 operador / 2 operadores (dueño + empleado) / 5 operadores"; "Hasta 50 registros al mes" stays on Freelancer; "Multi-sucursal (próximamente)" stays on Pro. Prices come from one constants file so they're changed in one place; mark "IVA incluido" or "+ IVA" explicitly (decide with the user before shipping — default "+ IVA").
- **Acceptance:** matches the approved image structurally; responsive at 360 px; each CTA carries the right `plan` param (L-03).

### L-03 CTAs → portal signup

- [ ] Status · **Blocked by:** L-02, P-03 (URL must exist) · **Blocks:** X-02
- **Steps:** "Crear cuenta gratis" → `/signup?plan=freelancer`; "Empezar ahora" → `/signup?plan=emprendedor`; "Probar 14 días gratis" → `/signup?plan=mipyme_pro`; hero CTA → emprendedor. UTM params passed through. No checkout on the landing.
- **Acceptance:** clicking each lands on the portal with the plan preselected (manual + a link-check script).

### L-04 Domain + DNS + email domain

- [ ] Status · **Blocked by:** — (do early; ADR-054 follow-up)
- **Steps:** register `xangarro.mx`; DNS: apex → landing host, `app` → Vercel (P-01), `hola@xangarro.mx` sending domain verified for Resend (B-14) with SPF/DKIM/DMARC. Keep `cachink.mx` (if owned) redirecting 301 to `xangarro.mx` for a year.
- **Acceptance:** `dig app.xangarro.mx` resolves to Vercel; a test email from Resend passes DMARC.

### L-05 Store badges + legal pages

- [ ] Status · **Blocked by:** X-05 (real store URLs)
- **Steps:** replace placeholder store links when listings exist; privacy policy + terms updated for cloud storage of business data and the subscription terms (grace period, downgrade to Freelancer, data export) — source from `docs/legal/` in the app repo and keep one copy (link, don't duplicate).
- **Acceptance:** badges resolve; legal pages mention data export on every plan and the 7-day grace.
