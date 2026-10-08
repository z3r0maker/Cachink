# Production readiness — legal, privacy and consent

> **Living document.** Started 2026-09-22 from `docs/audits/privacidad-2026-09-22.md` and the N-34 drafts.
> The owner adds findings here as they appear; nothing ships to production while a **BLOCKER** is open.
> Legend: **BLOCKER** = cannot go live · **BEFORE-STORES** = needed for App Store / Play submission ·
> **SOON** = first weeks after launch · `[x]` done · `[ ]` open · `[~]` drafted, pending review.

## 0. Lo único que todo lo demás espera

- [ ] **BLOQUEANTE — Razón social constituida.** `[RAZÓN SOCIAL]`, `[DOMICILIO]`, `[RFC]`, `[TELÉFONO]`,
      `[CORREO SOPORTE]`, `[CORREO PRIVACIDAD]`, `[NOMBRE O ÁREA]` (art. 29). Required by LFPDPPP
      art. 15 I and LFPC 76 Bis III; it is also who signs every DPA. A domicilio convencional is fine.
      When it lands: replace the brackets in `apps/web/src/legal/aviso-simplificado.ts`, bump
      `AVISO_VERSION`, and delete the placeholder assertion in `apps/web/tests/legal-aviso.test.ts`.

## 1. Textos legales

- [~] Aviso de privacidad integral — `docs/legal/aviso/aviso-integral.md` (generic, category-based).
- [~] Aviso simplificado (3 variantes) — `docs/legal/aviso/aviso-simplificado.md`.
- [~] Términos y Condiciones — `docs/legal/aviso/terminos-borrador.md` (replaces `docs/legal/terms.md`).
- [~] Anexo de encargado — `docs/legal/aviso/encargado-clausulas.md`.
- [~] Procedimiento ARCO — `docs/legal/aviso/arco-procedimiento.md`.
- [ ] **BLOQUEANTE — Revisión del abogado** de los cinco textos + las cinco confirmaciones en
      `docs/legal/aviso/respuestas-oq-borrador.md` §0.
- [ ] Plantilla de aviso para los clientes del propio negocio (OQ-L16).
- [ ] Retirar `docs/legal/privacy.md` y `docs/legal/terms.md` una vez aprobado lo anterior.
- [ ] Llenar las tres celdas `[PAÍS]` en el aviso §6.1 (monitoreo de errores, correo, mensajería) y los
      `[PLAZO]`s once OQ-L13 is confirmed.

## 2. Captura de consentimiento (PRIV-REG-01) — implementado 2026-09-22

- [x] Aviso simplificado rendered on `/signup` above the button (`signup/consent.tsx`).
- [x] One affirmative act (unticked checkbox) for aviso + términos + express patrimonial consent;
      novedades pre-ticked (tacit); no analytics box.
- [x] `RegistrarCuentaUseCase` refuses without `acepto: true` (`CONSENT_REQUIRED`); grants built by
      `consentimientosDeRegistro` (domain) and written by the store **in the signup transaction**.
- [x] Ledger `xangarro.privacy_consents` — append-only, hash-chained, definer-only writes
      (`packages/data-pg/drizzle/0034_privacy_consents.sql`).
- [x] Hash of the exact text (`avisoVigente()`), IP stored only as SHA-256, user agent kept.
- [x] **Applied and verified on hosted, 2026-09-26.** `db:migrate:hosted --dry-run` reports 0
      pending, and the table and functions are really there. Both halves of the check:
      `xangarro_app` **can** EXECUTE `privacy_consent_record`; UPDATE and DELETE are granted to
      no role but `postgres`, and `privacy_consents_immutable` fires `BEFORE DELETE OR UPDATE`
      `FOR EACH ROW`, so the owner is blocked too. (`xangarro_app` cannot execute
      `privacy_consents_day_root` — correct: that is the seal job's, not the app's.)
- [x] Run the Playwright onboarding spec against a database (`apps/web/e2e/onboarding.spec.ts` gained
      the acepto step and a refusal test). **Done 2026-10-05:** CI runs it against a live database on
      every push — the `portal-e2e` job in `.github/workflows/ci.yml` starts postgres:17, applies and
      seeds the schema, and `test:e2e:coverage` includes `onboarding.spec.ts` (not excluded by
      `playwright.config.ts`).
- [ ] **PRONTO — Trabajo nocturno de sellado:** llamar `xangarro.privacy_consents_day_root(day)` y obtener una
      NOM-151 constancia (PSC) or an RFC 3161 timestamp; archive it with the day. Decide the PSC.
- [ ] Archivar el texto completo de cada `AVISO_VERSION` (un hash sin su texto no prueba nada) —
      simplest: a `consent_versions` table or a versioned file kept forever.
- [ ] Configuración → Privacidad: mostrar la versión aceptada, alternar novedades (escribe una
      `surface='configuracion'` row), link to ARCO.
- [ ] Bloqueo de re-consentimiento al iniciar sesión cuando una versión agregue una finalidad (art. 11); banner en caso contrario.
- [ ] Decidir casilla vs. botón como consentimiento con el abogado (OQ-N7); hoy: casilla.

## 3. Derechos que el aviso promete (deben existir antes de publicar el aviso)

- [ ] **BLOQUEANTE — Eliminación de cuenta por autoservicio en el portal** (exportar → confirmar → cancelar Stripe →
      delete; LFPDPPP arts. 21–24, LFPC 76 Bis IX). Not required in the mobile app (no in-app account
      creation) — see OQ-N4.
- [ ] En la app **«Desvincular y borrar los datos de este dispositivo»** (el aviso §7 hoy reconoce que
      unlinking does not wipe).
- [x] ARCO intake without a session (`/privacidad/solicitud`) + console handling with business-day
      clock (LFPA art. 28 calendar) and acuse. **Done 2026-10-05, verified against the code:** the
      public form (`apps/web/src/app/privacidad/solicitud/page.tsx`), `solicitar-arco.ts` (folio,
      `kind='arco'`, `dueAt` on the `dias-habiles.ts` CDMX calendar with `plazosArco`'s 20th business
      day), console handling in the inbox (`apps/backoffice/…/inbox/`), and the
      `privacidad-arco.spec.ts` e2e.
- [ ] Calendario de retención implementado por tabla (cifras de OQ-L13 una vez confirmadas); regla de 72 meses para
      payment-default data (art. 10).
- [ ] Protocolo de brechas con la lista de campos del Reglamento art. 65, una persona designada y la cláusula de 72 h para
      negocios; `security.txt` + vulnerability-disclosure page.
- [x] Verify Sentry server-side captures no PII before the aviso says so. **Done 2026-10-05:**
      `apps/web/src/server/observability/sentry.ts` inits with `sendDefaultPii: false` and scrubs the
      request (except method + query-less URL), the user and the breadcrumbs in `beforeSend`; pinned
      by `apps/web/tests/observability.test.ts` («strips cookies, headers, query and the user»); the
      phone scrubs too (`packages/ui/src/telemetry/sentry.ts`).

## 4. Suscripciones (LFPC art. 76 Bis VIII–IX, en vigor 2025-12-13)

- [ ] **BLOQUEANTE — Cancelar en un clic** desde Configuración → Suscripción.
      **Decided 2026-09-26 (owner): an in-app «Cancelar suscripción» button** that calls Stripe
      directly and confirms inline — not a deep link into the Customer Portal, which is a redirect
      plus a confirm and leaves «one click» to a lawyer's reading. Today the screen offers only
      «Administrar pago» → the portal (`administrarSuscripcion`), which is three clicks. We own the
      copy, the confirmation and the edge cases (already cancelled, past due).
- [ ] **BLOQUEANTE — Correo de recordatorio de renovación ≥ 5 días hábiles antes de cada cargo**, con un enlace de cancelación en un clic
      cancel link (tokenised).
- [ ] Pantalla de consentimiento de cargos recurrentes en el checkout: frecuencia, monto, fecha, aceptación expresa.
- [ ] Aumentos de precio: aviso de 30 días + flujo de re-aceptación expresa.
- [ ] Domicilio, teléfono y canal de quejas visibles **antes** de contratar (landing + checkout).
- [ ] Enlaces legales (aviso, términos) en el pie del landing, el pie del portal y los pies de los correos.

## 5. Tiendas de apps

- [ ] **ANTES DE STORES — Apple Privacy Nutrition Label + manifiesto de privacidad**; formulario de Data Safety de Play —
      both derived from aviso §3 so they cannot disagree.
- [ ] **ANTES DE STORES — URLs de términos y privacidad activas** (`xangarro.mx/privacidad`, `/terminos`) y
      linked inside the app binary + App Store Connect (Guideline 3.1.2).
- [ ] **ANTES DE STORES — Notas para el revisor** que expliquen el modelo de dispositivo + NIP (sin cuenta en la app, sin
      Sign in with Apple/Google, deletion via the portal).
- [ ] Pantalla de avisos de licencias de código abierto generada desde `pnpm licenses list --prod` (1,184 paquetes, sin
      copyleft; resolve the 2 `Unknown`: `@tamagui/native`, `buffers`).
- [ ] Nunca agregar Sign in with Apple/Google a la app móvil (activaría 5.1.1(v)).

## 6. Terceros y contratos

- [ ] DPAs firmados: Supabase, Vercel, Sentry, Stripe, proveedor de correo, PAC, **Microsoft (Foundry)**,
      **Anthropic**. Named list delivered to negocios via the Anexo, and on request.
- [ ] Opción de hosting de Foundry decidida y configurada (recomendada: **Hosted on Azure, US DataZone**);
      written confirmation of the retention figure before the IA section publishes a number.
- [ ] `ASESOR_LLM_*` nunca apuntado a un proxy personal con datos reales de tenants (agregar una salvaguarda).
- [ ] Regla: la frontera de modelos del Asesor sigue siendo el único módulo que sabe que existe un modelo; la IA
      section's negative list (no client names/phones/RFC, no free text, no credentials) is enforced
      at that boundary.

## 7. Higiene de producto con peso legal

- [x] Receipt (`comprobante`) carries **"Este comprobante no es un CFDI"** and the negocio's name as
      issuer (one i18n string + template line). **Done 2026-10-05:** the shipped legend reads «Este
      documento no es un comprobante fiscal (CFDI).» — same legal meaning — with the negocio's name
      as issuer, on the portal's papel and ticket (`negocio/comprobantes/muestra.ts` →
      `papel.tsx`/`ticket.tsx`), the register (`operador/caja/receipt.ts`, `share-recibo.tsx`) and the
      phone (`packages/ui/src/screens/Checkout/comprobante.ts`).
- [ ] Regla de retención de la atribución para `signup_attribution` (geo tiene 400 días; proponer lo mismo).
- [ ] Beacon del landing declarado en el aviso (hecho) y enlace en el pie de página de `xangarro.mx` (abierto).
- [ ] Correo de marketing: opt-out respetado dentro de la ventana de 5 días; REPEP si algún día se usa teléfono/SMS.
- [ ] Afirmaciones publicitarias en el landing demostrables (LFPC art. 32).

## 8. Propiedad intelectual y gobernanza

- [ ] **BLOQUEANTE — Búsqueda y registro de marca ante el IMPI para «Xangarro»** (clases 9, 35, 36, 42) antes
      public launch; ADR-054 is still "pending clearance".
- [ ] Licencias registradas para imágenes hero/ilustraciones/tipografías (activos aparte de sonidos y datos de mapa).
- [ ] Seguro de ciberresponsabilidad — decisión de negocio.
- [ ] Registro de software ante el INDAUTOR — opcional.

## 9. Diferido por decisión (no reabrir sin motivo)

- Credit / financing features: **not in v1.** When they come: opt-in addendum in the app, medium-not-
  offeror model, filtering only after the user's "sí" — full brief in `respuestas-oq-borrador.md` OQ-N2.
- In-house SOFOM: would enter as one more entity under the same model; never underwrites from the books.
- Providers named publicly: **no** — category + country in the aviso, names in the Anexo.

## Findings log (append here)

| Date       | Finding                                  | Severity | Owner | Status                   |
| ---------- | ---------------------------------------- | -------- | ----- | ------------------------ |
| 2026-09-22 | Signup captured no consent (PRIV-REG-01) | high     | eng   | fixed, migration pending |
| 2026-09-22 | Receipt lacks "no es CFDI" legend        | medium   | eng   | open                     |
| 2026-09-22 | Landing/portal have no legal links       | medium   | eng   | open                     |
