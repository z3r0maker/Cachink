# Production readiness — legal, privacy and consent

> **Living document.** Started 2026-09-22 from `docs/audits/privacidad-2026-09-22.md` and the N-34 drafts.
> The owner adds findings here as they appear; nothing ships to production while a **BLOCKER** is open.
> Legend: **BLOCKER** = cannot go live · **BEFORE-STORES** = needed for App Store / Play submission ·
> **SOON** = first weeks after launch · `[x]` done · `[ ]` open · `[~]` drafted, pending review.

## 0. Lo único que todo lo demás espera

- [~] [critica] [bloq] **BLOQUEANTE — Razón social constituida.** Done 2026-10-28: **MEXIA, S.A.S.** (contrato social, folio SAS20261038080). Done 2026-11-11, from the constancia de situación fiscal (inicio de operaciones 2026-10-15): RFC **MEX261015US8**, domicilio fiscal **Paseo Puesta del Sol 4150, Colonia Lomas Altas, C.P. 45128, Zapopan, Jalisco**, a teléfono that is not one to publish (since 2026-11-12 every surface prints the placeholder **99 9999 9999** until the company has its own line), and the art. 29 area named «Área de Protección de Datos Personales». They live in `PROVEEDOR` (`packages/domain/src/privacidad/proveedor.ts`), the landing's `empresa.js`, the aviso drafts and the términos; the signup and device-linking avisos are `0.4-borrador`, with the old versions kept. Still open: `[CORREO SOPORTE]`, `[CORREO PRIVACIDAD]` (the soporte@/privacidad@ aliases), and moving the domicilio and phone to the company's own once it has them (the aviso may use a domicilio convencional, never a particular one; a change is a new aviso version). Required by LFPDPPP
  art. 15 I and LFPC 76 Bis III; it is also who signs every DPA.
  When the emails land: replace the brackets in `apps/web/src/legal/aviso-simplificado.ts` as a new
  `AVISO_VERSION`, and delete the placeholder assertion in `apps/web/tests/legal-aviso.test.ts`.

## 1. Textos legales

- [~] [alta] Aviso de privacidad integral — `docs/legal/aviso/aviso-integral.md` (generic, category-based).
- [~] [alta] [bloq] Aviso simplificado (3 variantes) — `docs/legal/aviso/aviso-simplificado.md`.
- [~] [alta] [bloq] Términos y Condiciones — `docs/legal/aviso/terminos-borrador.md` (replaces `docs/legal/terms.md`).
- [~] [alta] Anexo de encargado — `docs/legal/aviso/encargado-clausulas.md`.
- [~] [alta] Procedimiento ARCO — `docs/legal/aviso/arco-procedimiento.md`.
- [ ] [critica] [bloq] **BLOQUEANTE — Revisión del abogado** de los cinco textos + las cinco confirmaciones en
      `docs/legal/aviso/respuestas-oq-borrador.md` §0.
- [ ] [media] Plantilla de aviso para los clientes del propio negocio (OQ-L16).
- [ ] [media] Retirar `docs/legal/privacy.md` y `docs/legal/terms.md` una vez aprobado lo anterior.
- [ ] [alta] [bloq] Llenar las dos celdas que quedan en la tabla de subencargados — `[REGIÓN]` (Sentry) y `[PAÍS]` (Mercado Pago / Clip) — y los `[PLAZO]`s once OQ-L13 is confirmed.
      Corregido 2026-11-19: este renglón decía «las tres celdas `[PAÍS]` en el aviso §6.1 (monitoreo de errores, correo, mensajería)». Son dos, no tres; se llaman distinto; y viven en `encargado-clausulas.md` §7, no en el §6.1 del aviso integral, que no tiene ningún hueco. La nota de progreso de abajo ya lo decía bien desde el 2026-11-11; el encabezado se quedó en septiembre.
      Progress 2026-11-11: correo and mensajería are EE. UU. (Resend in us-east-1, `docs/ops/email.md`;
      the urgent alerts go to a Slack or Discord webhook, both US). The DPA template's subencargados
      table (`encargado-clausulas.md` §7) now names Resend and carries the real regions (Supabase
      us-west-2, Vercel pdx1). Open: Sentry's region, which only its console shows (Settings ›
      Organization › Data Storage Location; the DSN host says `ingest.us.` or `ingest.de.`), the card
      processors' cell, and the `[PLAZO]`s.

### 1.1 Correos de contacto: `soporte@` y `privacidad@` (done 2026-11-18)

The legal texts name `soporte@` (términos) and `privacidad@` (aviso integral and simplificado,
ARCO procedure). Zoho Mail Forever Free (US DC) holds the domain; its users are `eduardotorres@`
(admin) and `antonio.alejo@`.

- **Shape (done 2026-11-18): `soporte@` is a group, `privacidad@` an alias.** The options in Zoho:
  - _Group_ delivers into every member's own inbox and keeps the `To:` intact for a filter;
    `hola@` and `soporte@` are groups (both users, email access Everyone).
  - _Alias on a user_ lands in that one user's inbox, and Zoho offers it as a From address
    without setup. `privacidad@` is an alias on `eduardotorres@`, so ARCO requests reach the admin
    only; move it to a group if a second person must see them.
  - _New mailbox_ spends one of the five free licences and is one more login to watch. Not used.
- **DNS: no change.** MX (`mx/mx2/mx3.zoho.com`), SPF (`include:zohomail.com`), DKIM (`zmail`) and
  DMARC are per domain, and every group or alias on a verified domain uses them. Checked over DoH on 2026-11-11.
- **Replying from the address (send-as).** ARCO answers must go out _from_ `privacidad@`, so a
  reply is tied to the address the aviso publishes. As an alias it is already a From option in
  Zoho Mail. For the `soporte@` group, each member adds it under Settings → Mail Accounts → Send
  Mail As; Zoho verifies by mailing the group, which lands in that member's inbox.
- **Transactional mail (Resend) does not use `privacidad@`.** ARCO correspondence stays human, in
  Zoho. `EMAIL_FROM` stays `Xangarro <hola@xangarro.mx>`. `EMAIL_REPLY_TO` may become
  `soporte@xangarro.mx` on the portal (optional; `hola@` and `soporte@` reach the same people today), and
  `DIGEST_TO` already defaults to `soporte@`. When N-34 gets its own ARCO template, set its
  reply-to per message to `privacidad@`.
- **`PROVEEDOR.correo` → `soporte@`** (done 2026-11-18). LFPC 76 Bis I and III ask for a contact
  for questions and complaints, which is what `soporte@` is, and the términos already name it. Checkout,
  the footer of every email, the 2FA recovery screen and the landing's `EMPRESA` read it. `hola@`
  stays the general address (landing «Acerca», FAQ, schema, error messages) and the From of app mail.
- **Texts:** filled on 2026-11-17 (`57157e03`, aviso simplificado `1.0`).

- [x] [alta] [bloq] Alias `privacidad@xangarro.mx` creado en Zoho; grupo `soporte@` confirmado; un
      correo de prueba a cada uno llegó (2026-11-18). Pending, per member: «Send Mail As» for `soporte@`.
- [x] [alta] [bloq] `[CORREO SOPORTE]` y `[CORREO PRIVACIDAD]` reemplazados en los textos y en el
      aviso simplificado publicado (nueva `AVISO_VERSION`).

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
- [ ] [media] **PRONTO — Trabajo nocturno de sellado:** llamar `xangarro.privacy_consents_day_root(day)` y obtener una
      NOM-151 constancia (PSC) or an RFC 3161 timestamp; archive it with the day. Decide the PSC.
  - **Remaining (2026-11-19, verificado contra el repo):** la mitad de SQL existe y la otra mitad no. La función está en la migración `0034_privacy_consents.sql`, con `EXECUTE` revocado de `PUBLIC` y concedido a `xangarro_admin`, pero ningún cron la llama: `apps/web/vercel.json` declara siete trabajos (correos de prueba, de renovación, borrar cuentas, purgar fotos, asesor, uso y cierre de CFDI) y ninguno es éste. O sea que falta la ruta, su entrada en `vercel.json` y la decisión del PSC, no la consulta.
- [x] [alta] [bloq] Archivar el texto completo de cada `AVISO_VERSION` (un hash sin su texto no prueba nada) —
      simplest: a `consent_versions` table or a versioned file kept forever. **Done 2026-11-06
      (ADR-137):** every published version stays in `apps/web/src/legal/aviso-simplificado.ts`
      (`PUBLICADOS`), unedited; `tests/legal-aviso.test.ts` pins each version's hash.
- [x] [alta] [bloq] Configuración → Privacidad: mostrar la versión aceptada, alternar novedades (escribe una
      `surface='configuracion'` row), link to ARCO. **Done 2026-11-06 (ADR-137):** «Privacidad y mis
      datos» in the account menu, for every member: the accepted version and its exact text, the
      novedades switch, ARCO, Descargar todo and Eliminar mi cuenta (owner), and «Acepto el aviso
      nuevo» with a banner across the portal until accepted. Aviso 0.3 fixes the path.
- [ ] [media] The Asesor switch the aviso (§ on the Asesor) and Términos §5 promise «en Configuración →
      Privacidad» does not exist yet: build it on «Privacidad y mis datos», or change the text.
  - **Remaining (2026-11-19, verificado contra el repo):** sigue exacto, y la promesa está en **tres** lugares, no en dos: además del aviso integral §(Asesor) y de Términos §5, el procedimiento ARCO manda a «Configuración → Privacidad» dos veces, para oposición y para revocación de las finalidades secundarias. La pantalla existe y se llama «Privacidad y mis datos», pero su único `Switch` es el de novedades del ADR-137: no hay apagador del Asesor ni control de finalidades secundarias. Son dos controles, no uno, si se decide construir en vez de reescribir el texto.
- [ ] [media] Bloqueo de re-consentimiento al iniciar sesión cuando una versión agregue una finalidad (art. 11); banner en caso contrario.
      Progress 2026-11-06 (ADR-137): the banner and «Acepto el aviso nuevo» exist; the sign-in block waits for the
      first version that adds a purpose.
  - **Remaining (2026-11-19, verificado contra el repo):** sigue bien descrito por su propia nota de progreso: el banner y «Acepto el aviso nuevo» existen (`privacidad/novedades.tsx`), y el bloqueo al iniciar sesión espera la primera versión que agregue una finalidad. No hay nada que corregir.
- [ ] [media] Decidir casilla vs. botón como consentimiento con el abogado (OQ-N7); hoy: casilla.

## 3. Derechos que el aviso promete (deben existir antes de publicar el aviso)

- [x] [critica] [bloq] **BLOQUEANTE — Eliminación de cuenta por autoservicio en el portal** (exportar → confirmar → cancelar Stripe →
      delete; LFPDPPP arts. 21–24, LFPC 76 Bis IX). Not required in the mobile app (no in-app account
      creation) — see OQ-N4. **Done 2026-11-05 (ADR-136, `feat/eliminar-cuenta`):** Mi negocio ›
      General › «Eliminar mi cuenta» (replaces «Archivar negocio»): «Descargar todo» (.zip, Excel +
      JSON), the password once, then the account and every business it owns close at once and are
      erased 30 days later by `/api/cron/borrar-cuentas`; the folio'd email and a reminder 3 days
      before carry single-use undo links. Billing, CFDI and consents stay blocked 10 years
      (`xangarro.account_deletions`, 0051).
- [ ] [alta] Counsel (O-17) confirms the deletion's figures: 10 years for billing and CFDI (CCom art.
      38 over CFF art. 30's 5; the aviso §7 now says 10), and 30 calendar days for a self-service
      erase alongside the ARCO procedure's own deadlines. The backoffice support inbox (a separate
      database) is not erased by the job: an ARCO file follows its own retention.
- [x] En la app **«Desvincular y borrar los datos de este dispositivo»** (el aviso §7 hoy reconoce que
      unlinking does not wipe). **Done 2026-11-03:** Ajustes → «Desvincular esta caja» offers
      «Desvincular y borrar» (board MvDesvincularBorrar). It refuses while anything is unsent or
      refused, empties every local table with `secure_delete` and `VACUUM`
      (`packages/data/src/wipe-local-data.ts`), clears the token and restarts on the connect screen.
      Aviso §7 and términos §4 updated. A portal revocation still does not wipe the phone.
- [x] ARCO intake without a session (`/privacidad/solicitud`) + console handling with business-day
      clock (LFPA art. 28 calendar) and acuse. **Done 2026-10-05, verified against the code:** the
      public form (`apps/web/src/app/privacidad/solicitud/page.tsx`), `solicitar-arco.ts` (folio,
      `kind='arco'`, `dueAt` on the `dias-habiles.ts` CDMX calendar with `plazosArco`'s 20th business
      day), console handling in the inbox (`apps/backoffice/…/inbox/`), and the
      `privacidad-arco.spec.ts` e2e.
- [ ] [alta] Calendario de retención implementado por tabla (cifras de OQ-L13 una vez confirmadas); regla de 72 meses para
      payment-default data (art. 10).
  - **Remaining (2026-11-19, verificado contra el repo):** nada implementado, y no puede empezar: las cifras salen de OQ-L13, que es del abogado. Lo que sí existe es el mecanismo que va a usar, probado: `geo_prune(400)` colgado de un cron (N-61) y las dos funciones de borrado de cuenta. Cuando lleguen las cifras, esto es una tabla de números sobre plomería que ya camina, no una construcción.
- [ ] [alta] Protocolo de brechas con la lista de campos del Reglamento art. 65, una persona designada y la cláusula de 72 h para
      negocios; `security.txt` + vulnerability-disclosure page.
      Progress 2026-11-09 (ADR-139): `xangarro.mx/.well-known/security.txt` is published, and
      `scripts/security-txt.test.ts` fails a month before its `Expires`. Open: the protocol itself.
- [x] Verify Sentry server-side captures no PII before the aviso says so. **Done 2026-10-05:**
      `apps/web/src/server/observability/sentry.ts` inits with `sendDefaultPii: false` and scrubs the
      request (except method + query-less URL), the user and the breadcrumbs in `beforeSend`; pinned
      by `apps/web/tests/observability.test.ts` («strips cookies, headers, query and the user»); the
      phone scrubs too (`packages/ui/src/telemetry/sentry.ts`).

## 4. Suscripciones (LFPC art. 76 Bis VIII–IX, en vigor 2025-12-13)

- [x] [critica] [bloq] **BLOQUEANTE — Cancelar en un clic** desde Mi negocio › Plan y pagos. **Done 2026-10-31
      (ADR-132, `feat/billing-cancelar-76bis`):** «Cancelar suscripción» is one tap that sets
      `cancel_at_period_end` in Stripe, with a folio'd acuse (`billing_cancellations`) and a
      confirmation email; «Seguir con mi plan» undoes it until the period ends. Replaces «¿Quieres
      pausar tu suscripción?». Decided 2026-09-26 (owner): in-app, not a Customer Portal deep link.
- [x] **BLOQUEANTE — Correo de recordatorio de renovación ≥ 5 días hábiles antes de cada cargo**, con un enlace de
      cancelación en un clic. **Done 2026-10-31 (ADR-132):** `/api/cron/renewal-emails`, daily, from
      the sixth día hábil before each charge, monthly included, with a SPEI variant; the single-use
      link opens `/cancelar`, which cancels on the tap, never on open.
- [x] Consentimiento de cargos recurrentes en el checkout: frecuencia, monto, fecha, aceptación expresa. **Done
      2026-10-31 (ADR-132):** a required «Acepto…» box inside Stripe Checkout with the total with IVA,
      the cadence and how to cancel; the webhook copies it to `billing_consents` with
      `TERMINOS_VERSION`.
- [ ] [critica] [bloq] **Operador — set the Términos URL in Stripe's Dashboard** (Settings › Public details →
      `https://xangarro.mx/terminos`) in test and live mode. Until it is set, Stripe refuses the
      Checkout consent and no paid Checkout opens (ADR-132).
- [ ] [media] Aumentos de precio: aviso de 30 días + flujo de re-aceptación expresa.
  - **Remaining (2026-11-19, verificado contra el repo):** nada construido: no hay ninguna pantalla, acción ni correo de aumento de precio ni de re-aceptación en el portal. Cuando toque, el molde ya existe y es el del ADR-137 (el banner de aviso nuevo con «Acepto»), que es el mismo problema con otro texto.
- [x] [alta] [bloq] Domicilio, teléfono y canal de quejas visibles **antes** de contratar (landing + checkout). Done
      2026-11-11: checkout shows the domicilio, correo and teléfono under the pay button (`PROVEEDOR`,
      ADR-132), and both landing footers (home and /soporte) show the razón social, the domicilio and
      «¿Dudas o quejas?» with the correo and teléfono (`home/ContactoLegal.jsx`, board PvPieLanding).
      `scripts/landing-empresa.test.ts` keeps the landing's `EMPRESA` equal to `PROVEEDOR`.
- [x] [alta] Enlaces legales (aviso, términos) en el pie del landing, el pie del portal y los pies de los correos.
      Progress 2026-10-31: the renewal and cancellation emails carry them (`Layout legal`). **Done
      2026-11-09 (ADR-139):** every email's footer links both; the landing (`home/CtaFooter.jsx`) and the
      portal's sidebar already did.

## 5. Tiendas de apps

- [~] [alta] [bloq] **ANTES DE STORES — Apple Privacy Nutrition Label + manifiesto de privacidad**; formulario de Data Safety de Play —
  both derived from aviso §3 so they cannot disagree. **Answers written 2026-10-30:**
  `app-registration/apple/PRIVACY-LABEL.md` and `app-registration/google-play/DATA-SAFETY.md`, derived
  from the code and cross-referenced row by row. Still to do: type them into App Store Connect and Play
  Console; the manifest is merged by EAS (see PRIVACY-LABEL.md if `ITMS-91053` comes back).
- [x] **ANTES DE STORES — URLs de términos y privacidad activas** (`xangarro.mx/privacidad`, `/terminos`) y
      linked inside the app binary + App Store Connect (Guideline 5.1.1(i); 3.1.2 only binds apps that sell
      subscriptions, which this one does not). Live since 2026-09-24; `/soporte/` links both since
      2026-10-29; both listings carry them. Done 2026-10-31 in the app: Ajustes has «Privacidad y términos»
      (both pages open in the browser), and the linking notice opens the aviso from a «Leer el aviso
      completo» button instead of showing the address as text (boards MvAjustes and MvVincularAviso). The
      notice's text changed, so `aviso-vinculacion.ts` is `0.3-borrador`; the server still hashes 0.2 for
      phones on an older build.
- [x] **ANTES DE STORES — Notas para el revisor** que expliquen el modelo de dispositivo + NIP (sin cuenta en la app, sin
      Sign in with Apple/Google, deletion via the portal). **Done 2026-10-30:** `app-registration/apple/REVIEW-NOTES.md`
      and the App access text in `app-registration/google-play/README.md`.
- [ ] [media] Pantalla de avisos de licencias de código abierto generada desde `pnpm licenses list --prod` (1,203 paquetes al
      2026-11-19; resolve the 2 `Unknown`: `@tamagui/native`, `buffers`).
  - **Remaining (2026-11-19, verificado contra el repo):** la pantalla no existe en ninguna superficie, y **«sin copyleft» era inexacto**. Medido hoy: 1,203 paquetes (no 1,184) en 28 licencias distintas, los mismos dos `Unknown`, y seis paquetes con copyleft o doble licencia con copyleft en el árbol `--prod`: `node-forge` (BSD-3-Clause **OR** GPL-2.0) y `jszip` (MIT **OR** GPL-3.0-or-later), que se toman por su rama permisiva; `@img/sharp-libvips-darwin-arm64` (LGPL-3.0-or-later) y `lightningcss` con su binario (MPL-2.0), que son copyleft débil y no se distribuyen al dispositivo de nadie; y `eslint-plugin-sonarjs` (LGPL-3.0-only), que sale en `--prod` porque `packages/config` lo declara en `dependencies` — correcto para un paquete de configuración compartida, pero conviene saberlo. Ninguno parece un problema; lo que sí es un problema es que la pantalla los va a imprimir y este renglón decía que no existían. Vuelve a medir al generarla.
- [ ] [baja] Nunca agregar Sign in with Apple/Google a la app móvil (activaría 5.1.1(v)).
  - **Remaining (2026-11-19, verificado contra el repo):** la regla se cumple: ni `expo-apple-authentication` ni ningún paquete de Google Sign-In aparecen en el árbol de `apps/mobile`. Pero es una regla sin guardia, como la del módulo del Asesor: nada impide que alguien agregue la dependencia. Una prueba de una línea sobre el `package.json` de la app la haría real, y este renglón se podría cerrar.

## 6. Terceros y contratos

- [ ] [alta] [bloq] DPAs firmados: Supabase, Vercel, Sentry, Stripe, proveedor de correo, PAC, **Microsoft (Foundry)**,
      **Anthropic**. Named list delivered to negocios via the Anexo, and on request.
- [ ] [media] Opción de hosting de Foundry decidida y configurada (recomendada: **Hosted on Azure, US DataZone**);
      written confirmation of the retention figure before the IA section publishes a number.
- [ ] [media] `ASESOR_LLM_*` nunca apuntado a un proxy personal con datos reales de tenants (agregar una salvaguarda).
  - **Remaining (2026-11-19, verificado contra el repo):** la salvaguarda no existe. `clienteModelo` acepta cualquier `ASESOR_LLM_BASE_URL` con cualquier llave, sin mirar el entorno ni el destino; el propio encabezado del módulo documenta el proxy local como el camino de localhost. La buena noticia es el momento: nadie llama al modelo todavía (`pedirProsa` no tiene consumidor, ver P-30), así que la salvaguarda se puede poner **antes** de la primera llamada, que es cuando sale gratis. Lo más barato que cumple el renglón es rechazar en producción un `baseURL` que no sea el host de Foundry (o que apunte a localhost o a una IP privada), en el mismo `clienteModelo` y con prueba.
- [ ] [media] Regla: la frontera de modelos del Asesor sigue siendo el único módulo que sabe que existe un modelo; la IA section's negative list (no client names/phones/RFC, no free text, no credentials) is enforced
      at that boundary.
  - **Remaining (2026-11-19, verificado contra el repo):** este renglón tiene dos mitades y están en estados distintos. La primera se cumple **de hecho**: `@anthropic-ai/sdk` lo importa exactamente un archivo, `apps/web/src/server/asesor/model.ts`, y la dependencia sólo la declara `apps/web`. Pero nada lo hace cumplir: no hay regla de ESLint que restrinja ese import, así que se sostiene por disciplina, y el repo ya tiene el molde para arreglarlo (`no-restricted-imports` con mensaje, en `packages/config/eslint.config.js`). La segunda mitad está **contradicha por el código**: el encabezado de `pedirProsa` dice que toda restricción de inyección es «the caller's» y que la frontera sólo rechaza una credencial ausente. O sea que la lista negativa no se aplica ahí, y hoy no se aplica en ningún lado porque no hay quien llame. Decide cuál gana — el renglón o el módulo — y escríbelo en los dos lugares; si gana el renglón, la lista negativa se aplica dentro de `pedirProsa` y se prueba ahí.

## 7. Higiene de producto con peso legal

- [x] Receipt (`comprobante`) carries **"Este comprobante no es un CFDI"** and the negocio's name as
      issuer (one i18n string + template line). **Done 2026-10-05:** the shipped legend reads «Este
      documento no es un comprobante fiscal (CFDI).» — same legal meaning — with the negocio's name
      as issuer, on the portal's papel and ticket (`negocio/comprobantes/muestra.ts` →
      `papel.tsx`/`ticket.tsx`), the register (`operador/caja/receipt.ts`, `share-recibo.tsx`) and the
      phone (`packages/ui/src/screens/Checkout/comprobante.ts`).
- [ ] [media] Regla de retención de la atribución para `signup_attribution` (geo tiene 400 días; proponer lo mismo).
  - **Remaining (2026-11-19, verificado contra el repo):** la regla no existe. `signup_attribution` sólo se borra cuando se borra la cuenta entera (las dos funciones de borrado, en `0051_account_deletion.sql` y `0057_email_confirm_second_factor.sql`); nada la poda por antigüedad. El molde a copiar sí está hecho y probado: `geo_prune(400)` colgado del cron del backoffice (N-61, cerrada).
- [x] [media] Beacon del landing declarado en el aviso (hecho) y enlace en el pie de página de `xangarro.mx`
      (hecho: `apps/landing/home/CtaFooter.jsx`).
- [ ] [media] Correo de marketing: opt-out respetado dentro de la ventana de 5 días; REPEP si algún día se usa teléfono/SMS.
      Progress 2026-11-09 (ADR-139): the signup box starts unticked, so every account opts in
      expressly; the 5-day window no longer applies to signups.
  - **Remaining (2026-11-19, verificado contra el repo):** su nota de progreso del 2026-11-09 (ADR-139) deja este renglón casi vacío: la casilla del registro empieza desmarcada, así que todo consentimiento es expreso y la ventana de 5 días ya no aplica a registros. Lo que queda vivo es sólo el REPEP, y sólo si algún día se usa teléfono o SMS, que hoy no se usa. Vale la pena reescribir el renglón para que diga eso, en lugar de leerse como trabajo pendiente.
- [ ] [media] Afirmaciones publicitarias en el landing demostrables (LFPC art. 32).

## 8. Propiedad intelectual y gobernanza

- [ ] [critica] [bloq] **BLOQUEANTE — Búsqueda y registro de marca ante el IMPI para «Xangarro»** (clases 9, 35, 36, 42) antes
      public launch; ADR-054 is still "pending clearance".
- [ ] [media] Licencias registradas para imágenes hero/ilustraciones/tipografías (activos aparte de sonidos y datos de mapa).
- [ ] [baja] Seguro de ciberresponsabilidad — decisión de negocio.
- [ ] [baja] Registro de software ante el INDAUTOR — opcional.

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
