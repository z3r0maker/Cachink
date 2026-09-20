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
2. **Numbers.** data-pg next free migration **0027** (0024–0026 are other tracks'); backoffice admin migrations next free **0015**; ADR next free **ADR-089**; backoffice
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

| Task / item                                                  | Blocked on                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P-02** four-scene login animation                          | The «Acceso y onboarding» design file is not mirrored (`design-reference/` has only `operador/`) — **P-18 / owner action O-23**. The project rule: the design file is the spec; don't invent the scenes. Timings/behaviour are in 04-portal.md P-02 Steps. |
| **P-18 / P-21** design mirror + compare harness              | Needs the Claude Design MCP authorisation (owner). Blocks P-21 and pixel checks for every screen.                                                                                                                                                          |
| **P-12** employee drawer with recent payments                | No data link: the phone writes a payroll payment as `expenses` with only `concepto = "Nómina {nombre}"`. Needs `empleado_id` on `expenses` (synced UP table → phone + cloud migration, Track A with B). Don't match by name.                               |
| **P-12** contrato field · **P-08** «Contacto y comprobantes» | Need columns. Contacto/comprobantes overlaps Track N's **C-15** (branding columns on `businesses`) — do them together.                                                                                                                                     |
| **P-28 / P-29 / P-30** Asesor LLM                            | ADR-059 production gate («Próximamente»); P-30 runtime needs the credential. Locally fully live.                                                                                                                                                           |
| **P-11** real rejection rows                                 | B-08 (phones producing them against hosted).                                                                                                                                                                                                               |

---

## 4. Findings (known issues, not yet fixed)

| #    | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                             | Suggested action                                                                                                                                      |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-1  | **Fixed 2026-09-19** (`periodBalanceInputs`; `pasivosManuales` stays 0 until N-17). The original: **Balance and Flujo are incomplete.** `server/estados.ts` calls `calculateBalanceGeneral` with `cortesDelDia: []`, `inventarioStock: []`, `ventasConCredito: []`, `pagosClientes: []`, and `calculateFlujoDeEfectivo` with `pagosClientes: []`; indicators get `inventarioPromedio: 0n`; `mermaMovements` are never passed, so merma is always 0. | Feed the real rows (day_closes, stock at cost, credit sales + client_payments, merma movements) for the period — data-pg queries + integration tests. |
| F-2  | **ISR model vs RESICO.** The domain computes ISR as `utilidadOperativa × isrTasa`. RESICO (626) is levied on **gross income**, not profit. The notice says «orientativa», but the number is structurally wrong for the most common régimen.                                                                                                                                                                                                         | Add to the contador questions (O-14); then a régimen-aware ISR in `@xangarro/domain/financials` with its own ADR.                                     |
| F-3  | Phone still edits DOWN data: `packages/ui/src/screens/Settings/tipos-de-pago-screen.tsx` writes `enabledPaymentMethods` (the portal now owns it, P-08), and the phone's business form should write the régimen via `regimenPatch` (SAT code, ADR-082).                                                                                                                                                                                              | Track A: make tipos de pago read-only on the phone (as ADR-080 did for flags); switch the form to codes.                                              |
| F-4  | Hard-coded May 2026 dates remain in **Track O** code: `src/operador/cobranza/cuentas.ts` (`HOY = '2026-05-14'`) and `src/app/inventario/sections-interactive.tsx` («Mayo 2026» chip).                                                                                                                                                                                                                                                               | Operador owner: use `server/clock.ts` `hoy()` and the domain period helpers.                                                                          |
| F-5  | Sync «Historial» is derived from `sync_receipts`, which keeps only each row's **latest** push — re-sent rows move to their newest minute.                                                                                                                                                                                                                                                                                                           | Fine for recent activity; if an audit trail is wanted, persist per-push events (also serves Track N's N-07 p95).                                      |
| F-6  | «Registros del mes» on Suscripción needs `METERING_DATABASE_URL`; without it (local e2e) it shows «—».                                                                                                                                                                                                                                                                                                                                              | Set it in Vercel (O-8); nothing to fix in code.                                                                                                       |
| F-7  | Stripe buttons (Checkout / Customer Portal) are verified for presence and role only — no e2e hits Stripe.                                                                                                                                                                                                                                                                                                                                           | Owner test-mode run (O-12).                                                                                                                           |
| F-8  | `design-lint` fails on main from other sessions' code: `(portal)/cortes/screen.tsx:137` (34px literal, Track O), `components/states.css.ts:25` (radius 0), `apps/backoffice/src/styles/dialog.css.ts:13` (rgba).                                                                                                                                                                                                                                    | Owners fix or re-baseline with a justification.                                                                                                       |
| F-9  | SQLite `DrizzleUsersRepository.update({ active })` throws by design until A-17 adds the column; `permissions` is now written on both sides.                                                                                                                                                                                                                                                                                                         | Track A (A-17).                                                                                                                                       |
| F-10 | E2E helpers still insert into `auth.users` as the app role (local compat grants). Fine locally; they would fail against hosted.                                                                                                                                                                                                                                                                                                                     | If e2e ever runs against the hosted test project, create users through `xangarro.account_create`.                                                     |

---

## 5. Suggested order

1. F-1 (statements' Balance/Flujo inputs) — correctness of the core financial screen.
2. P-13 leftovers (checklist, «Ver productos», greeting decision) and P-34 informe mensual PDF.
3. P-14 waterfall/donuts.
4. P-26 → P-27 → P-33 Asesor persistence and actions (no LLM needed).
5. P-17 named smoke flow; P-23 Storybook + baselines.
6. When the owner mirrors the design (O-23): P-02 animation, P-32 WhatsApp dialog, P-21.
7. With Track A: `empleado_id` (P-12 drawer), F-3, C-15 columns (P-08 Contacto + N-19).
