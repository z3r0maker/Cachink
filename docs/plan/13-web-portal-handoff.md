# Handoff — Web Portal (P-track) pending and partial work

> For the session (GLM) taking over the **owner web portal** (`apps/web`, P-tasks) on 2026-09-18.
> Read this first, then `CLAUDE.md`, `docs/plan/00-README.md` §3–§6 and `docs/plan/04-portal.md`
> (task specs; each task's Progress lines say what is done). Owner actions and trigger-gated items
> are in `11-pre-launch-and-deferred.md` (§1, §2 and the portal additions in §3). The billing /
> backoffice track has its own handoff in `12-glm-handoff.md` — its §0 working rules apply here too.

---

## 0. Working rules specific to this area

1. **Shared checkout, push from a clean worktree.** Same rules as `12-glm-handoff.md` §0.1–0.2.
   Stage only your own paths at commit time; `ARCHITECTURE.md` and `docs/plan/*.md` very often
   hold another session's uncommitted hunks — check `git diff <file>` before staging them.
2. **Numbers** (refreshed 2026-09-22 from the tree). data-pg next free migration **0033** (0032 is
   `signup_attribution`); SQLite next free **0012**; backoffice admin migrations next free **0015**;
   ADR next free **ADR-092**; backoffice
   migrations **0011** (not this track's). Never GRANT on `auth.*` — use a pinned SECURITY
   DEFINER function (this track's examples: `0015_auth_links`, `0016_business_archive`,
   `0018_account_create`).
3. **Layering (CLAUDE.md §2.5).** Rules go in `@xangarro/domain` (TDD), orchestration in
   `@xangarro/application` use cases (1 happy + 3 unhappy tests), Postgres in
   `@xangarro/data-pg` (integration test on a throwaway tenant), and `apps/web` only composes:
   `'use server'` actions call a use case over a `pg*Repository` inside `withTenant`. Files
   ≤ 200 lines, functions ≤ 40 lines — ESLint enforces it; split into small components/hooks.
4. **The business clock.** Never write a date literal in a screen. "Today" is
   `hoy()` from `apps/web/src/server/clock.ts` (America/Mexico_City; `PORTAL_TODAY` pins it, and
   `playwright.config.ts` pins it to the seed's `2026-05-12`). Period helpers live in
   `@xangarro/domain` (`rangoDelMes`, `rangoDeSemana`, `rangoDelTrimestre`, `rangoDelAnio`,
   `ultimosDias`, `sumarDias`, `enRango`, `formatFechaHora`).
5. **Owner-only / admin / viewer.** Hide what a role cannot do (hidden, not disabled — except where
   the limit is the message, e.g. «Nuevo operador» when the plan is full), and **always re-check on
   the server** with `requireMember('owner' | 'admin')`.

## 1. Running and verifying

```bash
pnpm --filter @xangarro/data-pg db:reset          # fresh seeded Postgres (xangarro-pg container)
cd apps/web
E2E_PORT=3300 DATABASE_URL=$(../../packages/data-pg/scripts/db-local.sh url) npx playwright test
```

- **Reset before every full run.** `e2e/global-setup.ts` aborts if the seed was mutated
  («The database has 10 products… expected 6»). Specs mutate the seeded tenant.
- `--no-deps` skips the `setup` project; after a `db:reset` the stored login is gone, so run
  `npx playwright test --project=setup` first.
- The `sync` project (`*.sync.spec.ts`) runs serially after the others and may revoke the
  seeded tenant's devices — run full suites, not a mix of partial runs, when judging failures.
- **Throwaway tenants** are the pattern for anything that would disturb the seed: create
  `auth.users` + `businesses` + `business_members` with `asTenant(newUlid(), …)`, subscriptions
  through `db-local.sh billing-url`, emails via `randomUUID()` (not `Date.now()` — parallel
  workers collided). See `e2e/archivar.sync.spec.ts`, `e2e/permisos.sync.spec.ts`,
  `e2e/facturas.spec.ts`.
- Emails in dev land in `apps/web/.email-outbox/` (`e2e/outbox.ts` reads them).
- Last green state: **445 e2e passed** on a fresh DB, data-pg `test:db` green, web unit 181.

## 2. Done in this session (so you don't redo it)

**2026-09-19 (the pending-items session):** F-1 fixed (`periodBalanceInputs`); migration
**0020** (display name + `celebraciones`, ADR-087) and **ADR-088** landed — next free
migration **0024** (Track O took 0021, Track N 0022/0023), next free ADR **ADR-089**; P-13 finished (checklist card, real greeting,
banner deep link); P-34 finished (shared informe-mensual PDF + route); P-14's waterfall and
donuts (provisional until O-23); P-26 finished (deterministic insights, materialise-on-read,
capacidades, asesor dismiss/resolve, tier gating); P-27 + P-33 finished (goal persistence,
lazy close, both month-end dialogs, celebrate-once, viewer hiding); P-06 finished
(`activation-code` template — cross-area, coordinated); P-25 finished (`planes`/`negocio` copy
in `src/data/`); P-17 finished (`e2e/smoke.sync.spec.ts`); P-23's inventory extended with
visual baselines (in-app `/inventario`, not Storybook — documented deviation; the
`design:compare` clause waits on O-23). The `activation-code` email template is now in
`packages/email` — Track N's B-14 list should not re-add it. Hosted was brought current
through data-pg **0026 / admin 0014** on 2026-09-19; 0020's ledger checksum was corrected to
the committed file after an intermediate edit between apply and commit (0024 recreates every
function 0020 defines, so the end state is the committed one).

P-08 edit mode + tipos de pago + atributos + archive row · régimen by SAT code (ADR-082) ·
emailed reset / magic links (ADR-080, data-pg 0015) · business switcher · P-05 masked NIP +
permissions editor + operator drawer · P-06 slots / full state / device drawer · P-09 range chips +
pagination · P-10 wired to billing + Facturas list · P-11 historial + persisted «Marcar como
resuelto» · P-12 employee sheet + dar de baja · P-13 30-day chart · P-14 period switcher +
disclosure rows + owner's ISR rate · P-24 rail toggle · P-31 bell panel + aviso states · P-32
persisted delivery matrix (0017) · P-34 print stylesheet · signup through `account_create` (0018)
· `createDb` `prepare:false` · one business clock. Details are in each task's Progress lines in
`04-portal.md`.

---

## 3. Pending and partial work

> **Authoritative status lives in this section's tables (§3.1/§3.2), kept current as of
> 2026-09-21.** `04-portal.md`'s per-task checkboxes trail reality in places — earlier
> sessions recorded completion in Progress lines without flipping the boxes. When the two
> disagree, this table wins.

### 3.1 Workable now

| Task                  | Status | What's left                                                                                                                                                                                                                        | Where                                                                                                                                                                                                                                                                                                                                                      |
| --------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **P-14** Estados      | `[x]`  | 2026-09-19: F-1 fixed and the waterfall/donuts landed (provisional shapes until O-23 mirrors the design — reconcile with `design:compare` then).                                                                                   | `apps/web/src/app/(portal)/estados`, `server/estados.ts`                                                                                                                                                                                                                                                                                                   |
| **P-34** PDF          | `[x]`  | Done 2026-09-19: shared layout in `@xangarro/application` + `GET /api/export/informe-mensual`, server-gated.                                                                                                                       | `apps/web`                                                                                                                                                                                                                                                                                                                                                 |
| **P-32** WhatsApp     | `[~]`  | The «Compartir por WhatsApp» dialog in three variants (diagnóstico, cobranza, logro): deep link + image only (no Cloud API — `11-…` §2), closes on Escape. Copy is in the design file, not mirrored (P-18).                        | `apps/web/src/app/(portal)/avisos` / asesor                                                                                                                                                                                                                                                                                                                |
| **P-13** Inicio       | `[x]`  | Done 2026-09-19 (checklist card, greeting via ADR-087, `/productos?filtro=bajo`). Leftover: none.                                                                                                                                  | «¿Cómo empiezo?» checklist card (P-04's checklist data exists in `business_onboarding.checklist`); «Hola, {nombre}» still says **Pedro** (accounts carry no display name — decide: signup's `nombre` into `auth.users` metadata or `business_members`); `LowStockBanner`'s «Ver productos» button has no action (should link to `/productos?filtro=bajo`). | `apps/web/src/app/(portal)/_inicio`        |
| **P-06** Dispositivos | `[x]`  | Done 2026-09-19: the template exists and the panel sends the live code.                                                                                                                                                            | `equipo/pairing-panel.tsx`                                                                                                                                                                                                                                                                                                                                 |
| **P-26** Asesor       | `[x]`  | Done 2026-09-19 (ADR-088).                                                                                                                                                                                                         | Insights still from fixtures; dismiss/resolve actions (reuse `cambiarEstadoAviso` / `transicionAviso` — notices with `source='asesor'` are excluded there on purpose; add an Asesor variant).                                                                                                                                                              | `apps/web/src/app/(portal)/asesor`         |
| **P-27** Metas        | `[x]`  | Done 2026-09-19.                                                                                                                                                                                                                   | Month-end dialog (both variants), out-of-range callout, "negocio nuevo" state, persisting a goal in the existing `metas` table.                                                                                                                                                                                                                            | asesor                                     |
| **P-33** Takeover     | `[x]`  | Done 2026-09-19 (celebraciones markers). Milestone toast for rachas 3/6/12: the racha is computed and carried; the toast UI itself is still to draw.                                                                               | Show once per achievement (persist), hide from `viewer` at the call site, milestone toast.                                                                                                                                                                                                                                                                 | asesor                                     |
| **P-23** Primitives   | `[~]`  | Inventory extended + Playwright baselines committed (in-app, documented deviation; local review, skipped in CI). Left: the `design:compare` clause (O-23) and the unharnessed pieces (Toast, gauge, shell-only nav/switcher/menu). | `apps/web/src/components`                                                                                                                                                                                                                                                                                                                                  |
| **P-25**              | `[x]`  | Done 2026-09-19: screens no longer read fixtures; `src/fixtures` is test input only.                                                                                                                                               | Remaining screens still reading `src/fixtures/*`: Asesor (`fixtures/asesor*`), plan cards/Asesor tiers on Suscripción (`fixtures/planes.ts` — these are the **verbatim design pricing**, keep them as data, just not as "fixtures").                                                                                                                       | `apps/web/src/fixtures`                    |
| **P-16 / P-17**       | `[x]`  | P-17's named flow is `e2e/smoke.sync.spec.ts`; P-16's CI item was already satisfied (`portal-e2e` seeds a fresh container — equivalent to `db:reset`).                                                                             | P-17's named flow (signup → onboarding → activate → pushed sale) as one Playwright test; P-16's CI wiring exists (`ci.yml` runs `test:e2e`) — confirm it runs `db:reset` first.                                                                                                                                                                            | `apps/web/e2e`, `.github/workflows/ci.yml` |

### 3.2 Blocked

| Task / item                                                  | Blocked on                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P-02** four-scene login animation                          | **Done 2026-09-21**: built from the mirrored `Acceso y onboarding.dc.html` (see 04-portal P-02's Progress line).                                                                                                                                                                                                           |
| **P-18 / P-21** design mirror + compare harness              | **Mirror done 2026-09-20** (O-23: the owner's export landed by hand copy — `design-reference/portal/` + `comprobantes/`); **P-21 done 2026-09-21** (`pnpm design:compare`). P-18's remaining half is the `design:pull` script (refreshes as reviewable diffs) and the ADR-058 amendments inside the design project itself. |
| **P-12** employee drawer with recent payments                | **Done 2026-09-20** (O-26 approved): `empleado_id` on `expenses` (pg 0027 + SQLite 0010), «Ver pagos» drawer reads the link. Phone writer follow-up is Track A's.                                                                                                                                                          |
| **P-12** contrato field · **P-08** «Contacto y comprobantes» | Need columns. Contacto/comprobantes overlaps Track N's **C-15** (branding columns on `businesses`) — do them together.                                                                                                                                                                                                     |
| **P-28 / P-29 / P-30** Asesor LLM                            | ADR-059 production gate («Próximamente»); P-30 runtime needs the credential. Locally fully live.                                                                                                                                                                                                                           |
| **P-11** real rejection rows                                 | B-08 (phones producing them against hosted).                                                                                                                                                                                                                                                                               |

### 3.3 Small leftovers (consolidated 2026-09-21 — the track's tail)

Everything the P-track can still do without an owner action, in one table. Items above
(§3.1/§3.2) cover the task-level state; this is the fine-grained tail that survived.

| Item                         | What's actually missing                                                                                                                                                                                                   | Size                                         | State / blocker                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **P-23 leftovers**           | Toast and gauge primitives unbuilt; shell-only components (sidebar nav item, business switcher, user menu, «Asesor» strip) unharnessed in `/inventario`                                                                   | ~Half a session                              | **Workable now** — P-21's `design:compare` exists, so the acceptance clause is exercisable                         |
| **P-33 milestone toast**     | The toast UI for racha milestones (3/6/12 consecutive goals); the racha itself is computed and carried in `MetasPageData`                                                                                                 | Small                                        | **Workable now** — should build on P-23's Toast primitive; `celebraciones` markers make once-per-milestone trivial |
| **P-12 contrato field**      | A `contrato` column on `employees` + the option in the create/edit sheet                                                                                                                                                  | Small (pg 0029 + SQLite 0011 + both schemas) | **Workable now**                                                                                                   |
| **P-09 folio/turno fields**  | The Movimientos drawer's Folio/Turno rows render only with real data: `caja_turno_id` exists on `sales` but the seed/spec data rarely sets it, and a folio display needs the phone's V-NNNN convention surfaced           | Small investigation + wiring                 | **Workable now** — no column needed for turno; check what the ledger query already returns                         |
| **P-18 design-side half**    | (a) the ADR-058 amendments **inside the Claude Design project** (owner/design tool); (b) `scripts/design-pull.ts` so mirror refreshes are a reviewable diff — the 2026-09-20 mirror was a hand copy of the owner's export | (b) is workable; (a) needs the design tool   | **(b) workable now** from a local export directory; (a) is owner-side                                              |
| **P-11 real rejection rows** | Phones producing rejections against **hosted**                                                                                                                                                                            | —                                            | **Cross-track (B-08)** — not workable from this track                                                              |
| **comprobantes.sync flake**  | Order-dependent render-stale failure at full-suite position ~580; passes in isolation                                                                                                                                     | —                                            | **Track N's spec** — full evidence in §4 for their owner                                                           |

Owner actions that gate the rest live in `11-pre-launch-and-deferred.md` (§1, §3); the
LLM path (P-28/29/30's open half) is documented on P-30's Progress line in `04-portal.md`
— the boundary is wired and live through the owner's local proxy; production waits on the
Azure AI Foundry credentials in the same two env vars.

### 3.4 Cross-track pending — consolidated 2026-09-21 (evening session)

> Everything below is outside this file's P-track tables, recorded here once
> so the next session of any track sees the whole board. Status after that
> session: ADR-090's plan matrix (informe on Xangarro, advisory limits) and
> N-23's offline page are landed and e2e-green; both seeded e2e suites run
> (web 490-pass class, backoffice 7/7); **the Stripe sandbox is fully wired**
> — catalog seeded (`stripe:seed`: `plan_*` prices + 16 % IVA), webhook
> destination at `app.xangarro.mx/api/stripe/webhook` with the 7 handled
> events, `STRIPE_SECRET_KEY`/`STRIPE_PUBLISHABLE_KEY`/`STRIPE_WEBHOOK_SECRET`
> set in Vercel (2026-09-21), and a test Checkout Session proven against the
> seeded price.

**Owner-dependent (decisions/credentials, nothing for a session to build):**

1. **Vercel redeploy + webhook smoke test** — env vars set 2026-09-21 reach
   nothing until a redeploy. Then Stripe → destination → _Send test event_ →
   expect 200; that unblocks F-7's test-mode walkthrough (signup → 14-day
   trial → 4242 card → active Suscripción). Also set `METERING_DATABASE_URL`
   in Vercel while there (F-6).
2. **LLM production credential** (ADR-059: direct Anthropic key vs Foundry;
   if Foundry, verify Batches + prompt caching first) — P-30's module is on
   main and live locally through the proxy; production stays «Próximamente».
3. **Facturapi test keys** (O-15) — N-33's CFDI path is wired and idle.
4. ~~**The app-branch merge** (`rename/xangarro-stored-ids`)~~ — **done and
   verified 2026-09-19 (O-20; `apps/mobile` is on main and typechecks).** Its
   unblock list moved to "Engineering, workable now" below (Track N's
   2026-09-21 addendum); F-3/F-9 remain Track A's to schedule.
5. **N-28 venue** — where the perf audit runs (k6 not installed locally; the
   4G-LCP and low-end-Android targets need hosted + devices).
6. **Legal counsel's texts** (N-34 aviso/ARCO) — nothing legal ships before.
7. **Parked growth decisions:** N-40 cobros go/no-go; premium add-ons
   (one-shot Diagnóstico, «Cobranza por WhatsApp», tenant-facing CFDI reusing
   the Facturapi wiring — ADR-090 §3 records the multi-emisor constraint).
8. **Housekeeping:** optionally rotate the `sk_test_` key shared in chat
   (Dashboard roll → update `.env.local` + Vercel; `stripe:seed` is
   idempotent); Stripe **live** mode is its own reviewed task (B-10), never
   a quiet flip. ~~Decide what `apps/portal/` is~~ — resolved by O-21's
   cleanup (301dd6ec).

**Engineering, workable now on main:**

1. Home-screen empty-`main` flake (pre-existing upstream — baseline-verified
   at `9ae75031` 2026-09-21; same family as the `comprobantes.sync` flake in
   §4). Cheapest to root-cause where it reproduces on hosted.
2. N-28 k6 scripts, once the venue is picked.
3. F-8 `design-lint` failures and F-4's hard-coded dates (their tracks' owners).
4. F-2 régimen-aware ISR — needs O-14 contador input first.

**Blocked (merge or hosted):** P-11 (B-08), launch gates N-26/N-27 hosted
re-runs, N-30 closed beta, O-14 sign-off. _(Phone halves and N-29 left this
list — see the addendum below.)_

**Track N addendum — 2026-09-21 (c12-n04-uso session), the phone-half board:**

With the app branch merged, everything below is engineering-workable on
`main` right now, in dependency order:

1. ~~**The keystone — C-15 branding columns' SQLite half.**~~ **Done 2026-09-22** — SQLite
   migration 0012 mirrors the seven `businesses` columns, the repository maps them, a pull lands
   them (`packages/sync/tests/reference-applier.test.ts`) and the drift test's `businesses`
   exception is gone. Items 3 and 4 are unblocked. Still cloud-ahead: `clients.rfc` and
   `caja_turnos`'s two `aclarado_*`.
2. **N-17's half** — `opening_balances` + `opening_balance_clients` in
   SQLite (`packages/data` migration + the device table map; the server wire
   already lists both tables) and the phone's Estados calculators consuming
   them. Independent of the keystone.
3. **N-19's half** — the logo cache: on pull, when the logo's version
   changes, download `/api/logos/<id>` (ETag = bytes' hash) and store the
   bytes on-device for offline rendering.
4. **N-21's half** — the phone share: `shareComprobanteAsImage` exists in
   `packages/ui/src/share/` **unused and wired to the old Phase-1C HTML
   path** — point it at the N-20 renderer (domain SVG → react-native-svg +
   ViewShot; bundle Plus Jakarta Sans / JetBrains Mono via expo-font,
   vendored in `apps/web/assets/comprobante-fonts`), template chosen from
   the now-syncable branding. Android + known number → `ACTION_SEND` with
   the WhatsApp `jid` extra (undocumented — auto-fallback to the sheet);
   iOS or no number → the sheet with the PNG; secondary `wa.me` text path.
5. **The app-queue** (`11-pre-launch-and-deferred.md` §6): N-32's 20
   app-branch copy fixes → N-22 sync banners → N-25 QR pairing (C-14) →
   N-24 phone screens on the Track O design → N-29 the full-stack e2e gate
   (last — it proves the others).
6. **Small, newly possible:** the wizard's parked answers (N-12–15) — the
   `tipo_negocio`, WhatsApp and logo destinations all exist now.

**Ledger debt and next-free numbers (2026-09-21 evening):** hosted is
behind again — data-pg **0027–0029** (empleado_id, direccion, movimiento
origen) apply locally only, SQLite **0011** likewise. Next free:
data-pg **0030**, SQLite **0012**, admin **0015**, ADR **ADR-091**.

**Cross-session e2e isolation now exists — use it.** Two agents' suites
corrupted each other through the shared container/port on 2026-09-21
(449-failure cascades, seeded-count drift). `db-local.sh` takes
`XG_PG_NAME`/`XG_PG_PORT` and the web suite takes `E2E_PORT`
(landed in 0b64fff7). Any session running e2e while another lives must
spin its own stack (e.g. `XG_PG_NAME=xangarro-pg-mine XG_PG_PORT=55441
E2E_PORT=3140`).

**One upstream e2e hazard for whoever owns the run-date-anchored seed
(c1efcea8):** under the suite's 9 parallel workers, ~21 specs fail in full
runs and pass solo — a11y's seeded-text checks (`/` expects «Taco al
pastor ×3»), chaos, the auth doors, operators — on a fully isolated
stack, on pristine merged main (baseline-verified). Same family as §4's
flakes; likely needs serialized workers or re-anchored expectations, and
it will bite CI just as it bit this session.

### 3.5 Track O (operador register) pending — consolidated 2026-09-21 (night session)

> Where the register stands: its whole day runs on its own data end to end
> (fase 14, O-32…O-37 — capture, ventas/cancel, cobranza/abonos, gastos,
> cierre, and both owner screens writing for real). What remains is the tail
> of O-38 plus the findings below. Working state lives in
> `docs/plan/10-operador.md` (all tasks ticked through O-37).

**Engineering, workable now on main:**

1. ~~**O-38's tail: 13 operator spec files still behind the demo flag.**~~ **Done 2026-09-22
   (`d0bca546`)** — all fourteen `operador-*` specs walk the real door in the serial `operador`
   project (32 passed), chaos-1's caja section moved to `operador-chaos.spec.ts`, and
   `xangarro.caja.demo` is gone from the app and the suite. Original text:
   The
   `operador` Playwright project (serial, real Acceso door via
   `e2e/puerta-operador.ts`) exists and shell+inicio are converted
   (`cbea6388`). Remaining: `operador-avisos`, `operador-caja`,
   `operador-cierre`, `operador-cobranza`, `operador-detalle-venta`,
   `operador-cliente`, `operador-gastos`, `operador-inventario`,
   `operador-pendientes`, `operador-turno`, `operador-ventas`, plus the
   `chaos-1` caja section. Convert file by file (move to the `operador`
   project's testMatch + add to the viewport projects' testIgnore + one
   `puertaOperador(page)` per test); each converted file may also need its
   assertions re-based onto real data, since the register's screens read the
   runtime when linked. **Last step, only when all 13 are through the real
   door:** delete `xangarro.caja.demo` from `acceso/gate.tsx`, `auth.setup.ts`,
   and the removal line in `puerta-operador.ts` — then the acceptance
   ("matrix green, no demo flag anywhere") runs.
2. ~~**F-8's Track O entry**: `(portal)/cortes/screen.tsx`'s 34 px literal~~ **Done 2026-09-22
   (`d0bca546`)** — the empty-state glyph reads `portalFontSizes.xl6`. Note for whoever owns
   design-lint: it is **not wired into CI**, and the repo now carries 60 findings against a
   zero baseline recorded 2026-09-08 (34 font-size literals in login animations, the WhatsApp
   dialogs, comprobantes and saldos screens). Ratchet or re-baseline it deliberately.
3. **F-4's half**: the «Mayo 2026» chip in
   `src/app/inventario/sections-interactive.tsx` (cobranza's frozen `HOY` is
   fixture-only since O-33; the inventario chip is not).

**Owner actions (dashboard/credentials, nothing for a session to build):**

1. **Vercel: the admin project's Root Directory still says `apps/admin`** —
   the app was renamed `apps/backoffice` (N-35); every build fails with
   "The specified Root Directory does not exist" (diagnosed from the build
   log, 2026-09-21). Fix: Settings → General → Root Directory →
   `apps/backoffice`, redeploy. Then check the project's env vars per the
   runbook (`ADMIN_TOTP_KEY` must be exactly 32 bytes base64 — a 29-byte
   default broke every sign-in in CI; `DATABASE_URL` via the transaction
   pooler, port 6543).
2. **CI green-run confirmation** — the four-job CI repair (`910c5707`) is
   verified locally in CI mode (portal 535, backoffice 7/7, deno clean,
   format/scripts green), but the gh token died before the GitHub verdict.
   One look at the Actions tab; if anything is still red it is new
   information, not the repaired set.

**Attributed failures (other tracks' base, evidence recorded):** the
auth login-door specs, chaos-1's smash tests, the a11y/data `/` sentinels
and informe-mensual's duplicate emails fail on the incoming base
(`f75ce235`/`c1efcea8`) without any Track O change — control run performed
2026-09-21 during O-37. They race each other through the shared login
throttle / duplicate user emails. Their owners' names are on §4's entries.

---

## 4. Findings (known issues, not yet fixed)

**For Track N — order-dependent flake in `comprobantes.sync.spec.ts` (2026-09-21, evidence
from the portal session).** The owner-brands test fails at full-suite position ~580 with the
dirección input rendering empty after save+reload, roughly every other fresh-DB run; it
**passes in isolation** on the same tree. The write is committed (the DB row has
`direccion`/`receipt_leyenda` after the failing run) and an identical diagnostic flow
(upload → extract → fill → save → read) passed in the same full-suite slot. Tried and kept as
principled hardening: `revalidatePath('/negocio/comprobantes')` alongside `/negocio` in both
comprobantes actions, and `force-dynamic` on the page. Tried and reverted: replacing the
spec's `page.reload()` with a fresh `goto` (same failure). Suspects: Next client-router cache
serving the pre-save RSC payload, or a hydration race on the controlled inputs under
end-of-suite load. The portal session's P-02/P-32/P-21 tests are green in every run.

| #    | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                             | Suggested action                                                                                                                                      |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-1  | **Fixed 2026-09-19** (`periodBalanceInputs`; `pasivosManuales` stays 0 until N-17). The original: **Balance and Flujo are incomplete.** `server/estados.ts` calls `calculateBalanceGeneral` with `cortesDelDia: []`, `inventarioStock: []`, `ventasConCredito: []`, `pagosClientes: []`, and `calculateFlujoDeEfectivo` with `pagosClientes: []`; indicators get `inventarioPromedio: 0n`; `mermaMovements` are never passed, so merma is always 0. | Feed the real rows (day_closes, stock at cost, credit sales + client_payments, merma movements) for the period — data-pg queries + integration tests. |
| F-2  | **ISR model vs RESICO.** The domain computes ISR as `utilidadOperativa × isrTasa`. RESICO (626) is levied on **gross income**, not profit. The notice says «orientativa», but the number is structurally wrong for the most common régimen.                                                                                                                                                                                                         | Add to the contador questions (O-14); then a régimen-aware ISR in `@xangarro/domain/financials` with its own ADR.                                     |
| F-3  | Phone still edits DOWN data: `packages/ui/src/screens/Settings/tipos-de-pago-screen.tsx` writes `enabledPaymentMethods` (the portal now owns it, P-08), and the phone's business form should write the régimen via `regimenPatch` (SAT code, ADR-082).                                                                                                                                                                                              | Track A: make tipos de pago read-only on the phone (as ADR-080 did for flags); switch the form to codes.                                              |
| F-4  | Hard-coded May 2026 dates remain in **Track O** code: `src/operador/cobranza/cuentas.ts` (`HOY = '2026-05-14'`) and `src/app/inventario/sections-interactive.tsx` («Mayo 2026» chip).                                                                                                                                                                                                                                                               | Operador owner: use `server/clock.ts` `hoy()` and the domain period helpers.                                                                          |
| F-5  | Sync «Historial» is derived from `sync_receipts`, which keeps only each row's **latest** push — re-sent rows move to their newest minute.                                                                                                                                                                                                                                                                                                           | Fine for recent activity; if an audit trail is wanted, persist per-push events (also serves Track N's N-07 p95).                                      |
| F-6  | «Registros del mes» on Suscripción needs `METERING_DATABASE_URL`; without it (local e2e) it shows «—».                                                                                                                                                                                                                                                                                                                                              | Set it in Vercel (O-8) — the only billing-related var not in the 2026-09-21 env batch (S3.3 item 1); nothing to fix in code.                          |
| F-7  | Stripe buttons (Checkout / Customer Portal) are verified for presence and role only — no e2e hits Stripe.                                                                                                                                                                                                                                                                                                                                           | Owner test-mode run (O-12) — unblocked 2026-09-21: sandbox wired end to end (S3.3); after the redeploy, walk signup -> trial -> 4242 card.            |
| F-8  | `design-lint` fails on main from other sessions' code: `(portal)/cortes/screen.tsx:137` (34px literal, Track O), `components/states.css.ts:25` (radius 0), `apps/backoffice/src/styles/dialog.css.ts:13` (rgba).                                                                                                                                                                                                                                    | Owners fix or re-baseline with a justification.                                                                                                       |
| F-9  | SQLite `DrizzleUsersRepository.update({ active })` throws by design until A-17 adds the column; `permissions` is now written on both sides.                                                                                                                                                                                                                                                                                                         | Track A (A-17).                                                                                                                                       |
| F-10 | E2E helpers still insert into `auth.users` as the app role (local compat grants). Fine locally; they would fail against hosted.                                                                                                                                                                                                                                                                                                                     | If e2e ever runs against the hosted test project, create users through `xangarro.account_create`.                                                     |

---

## 5. Suggested order

> Refreshed 2026-09-21 (evening): the 2026-09-19 order below is historical —
> §3.1 marks F-1, P-13, P-34, P-14 and P-26/27/33 done. The live order is
> §3.4's: owner does §3.4 items 1–3 (redeploy+smoke test, LLM credential,
> Facturapi keys) **plus §3.5's owner items (Vercel admin root-dir, CI
> verdict)**; sessions take §3.4 "Engineering, workable now" in that order,
> with the app-branch merge (§3.4 item 4) as the big unlock. The operador
> track's own tail is §3.5's (O-38's last 13 spec files, then the demo flag
> dies).

1. ~~F-1 (statements' Balance/Flujo inputs) — correctness of the core financial screen.~~ (done 2026-09-19)
2. ~~P-13 leftovers (checklist, «Ver productos», greeting decision) and P-34 informe mensual PDF.~~ (done 2026-09-19; greeting decision open — see §3.1's P-13 row)
3. ~~P-14 waterfall/donuts.~~ (done 2026-09-19, provisional until O-23's `design:compare`)
4. ~~P-26 → P-27 → P-33 Asesor persistence and actions (no LLM needed).~~ (done 2026-09-19)
5. P-17 named smoke flow; P-23 remaining harness pieces (`design:compare` waits on O-23).
6. ~~When the owner mirrors the design (O-23): P-02 animation, P-32 WhatsApp dialog, P-21.~~ (mirror done 2026-09-20; P-02 and P-21 done 2026-09-21; P-32's copy mirror remains)
7. With Track A: `empleado_id` done (pg 0027, 2026-09-20); F-3, and C-15 columns (P-08 Contacto + N-19) remain.
