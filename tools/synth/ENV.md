# Synth — ENV (Phase 0 output, S-00)

How to bring up, seed and authenticate the app for Synth. Checked against `origin/main` on 2026-11-19. The
decisions are in ADR-153 and the plan is `docs/plan/24-synth.md`.

## 1. Bring up the portal

- **Database.** `packages/data-pg/scripts/db-local.sh` runs `postgres:17-alpine`.
  - Defaults are container `xangarro-pg` on port 55432. Override them with `XG_PG_NAME` and `XG_PG_PORT`.
  - Subcommands: `up | down | apply | url | super-url | billing-url | metering-url | admin-url`.
  - There is no Supabase locally. `local/0000_supabase_compat.sql` emulates the `auth` schema and the roles, and
    auth is the app's own.
  - Synth always uses its own name, `xangarro-pg-synth-<id>`, and never touches `xangarro-pg`.
- **Server.**
  - Dev: `pnpm --filter @xangarro/web dev` serves `next dev --webpack -p 3100`.
  - Production: `NODE_ENV=production next build --webpack`, then `next start -p <port>`. Synth uses this.
- **Env.**
  - Every variable is listed in `apps/web/.env.example`. The working recipe is `serverEnv()` in
    `apps/web/playwright.config.ts`.
  - Minimum: `DATABASE_URL`, `BILLING_DATABASE_URL`, `METERING_DATABASE_URL`, `DEVICE_TOKEN_SECRET`,
    `ENTITLEMENT_PRIVATE_KEY` (for `/activate`), `PORTAL_TOTP_KEY`.
  - Optional: `PORTAL_TODAY` (the clock), `DEV_PAGES`, Stripe test keys, `ASESOR_LLM_*` (left unset).
- **Staging:** none. X-01 is open and blocked, and Vercel env vars exist only for Production. Synth is local only.
- **Allowed hosts:** `127.0.0.1`, `localhost`, and `10.0.2.2` (the Android emulator's view of the host).

## 2. Reset and seed

- **`pnpm --filter @xangarro/data-pg db:reset`** runs `down && up && db:seed`, which destroys the volume and
  applies `local/*.sql` and `drizzle/*.sql`. The seed then loads «Taquería Don Pedro»
  (`01HZ8XQN9GZJXV8AKQ5X0C7BJZ`, seed TODAY `2026-05-12`, plan xangarro):
  - logins: owner `pedro@taqueria.mx`, viewer `contador@…`, admin `operador@…`; passwords are in
    `scripts/seed-data.ts`;
  - PIN operators: Ana (can cancel) and Luis;
  - 6 products, 5 employees, 2 devices;
  - 2 months of ledger (`seed-finanzas*.ts`).
- **`db:seed:demo`** loads «Tacos La Esquina»: 20 products and 30 days × 3 tickets.
- **Synth never writes the seeded tenant.** It mints one tenant per run.
- **Building blocks**, in `apps/web/e2e/`, moving to `@xangarro/testing/tenant` (S-02):
  - `mintTenant({ plan, role, status, … })` returns `{ biz, nombre, email, password, ownerId, deviceId }`.
    `plan: 'free'` means no subscription row, which falls back to xangarrito.
  - `stamp()` is the unique suffix. Never `Date.now()`.
  - `addMember()`; `tenant-rows.ts` `addProduct`, `addSale`, `addOperator`, `addDevice`.
  - `tenant-phone.ts` `mintCodeFor` and `activateOn`; `sync-phone.ts` `activatePhone`, `push`, `ticket`, `sale`;
    `phone-rows.ts` `turno` and `gasto`. These are the base for `between.generate`.
- **Throttles** key on the client IP. `scripts/local-throttles.ts` clears them, and each run gets its own address
  (`tenant.ts` `clientIp()`).

## 3. Browser state (cleared by a fresh Chromium profile)

- OPFS: `xangarro-register.sqlite3`.
- localStorage: `xangarro.device`, `operador.hoyNo`, `xg-share-tel*`, `xg-plan-elegido`, `xg-sidebar-rail`.
- sessionStorage: `xangarro.sesion`.
- Cookie: `xg_session`.
- Also: a BroadcastChannel tab lock. There is no IndexedDB.
- `public/sw.js` precaches only `/sin-conexion.html`. Synth blocks service workers, as the e2e suite does.
- Caveat: on macOS, WebKit's OPFS is shared across profiles (`e2e/webkit-profile.ts`). Synth uses Chromium only.

## 4. Authenticate each role

| Role (`auth_as`)           | How                                                                                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `owner`, `admin`, `viewer` | `/login`, the `login-door-owner` door, email and password («Abrir mi changarro»). Alternatives: magic link `/login/enlace`, TOTP `/login/verificar` (off by default).                 |
| new owner (onboarding)     | `/signup` → `/signup/revisa` → confirmation link from `apps/web/.email-outbox/*.eml` (`e2e/outbox.ts`) → `/bienvenida` (8 steps) → `/bienvenida/plan` → `/como-empiezo`.              |
| `operador` (web)           | `/login`, the `login-door-caja` door → `/operador`: link the device (email + activation code minted by SQL, `e2e/puerta-operador.ts`) → pick the operator → NIP → opening cash float. |
| `operador` (phone)         | The capture app with `EXPO_PUBLIC_E2E=1` and `EXPO_PUBLIC_API_BASE=http://10.0.2.2:<port>` (`apps/mobile/maestro/README.md`), activated with a minted code.                           |

## 5. Routes for the scenarios

| Scenario                     | Route(s)                                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| `onboarding-camino-a` / `-b` | `/signup` … `/bienvenida` (answer everything, or «Omitir» every step) → `/bienvenida/plan`                |
| `primera-venta`              | web `/operador/caja`; phone Cobrar                                                                        |
| `corte-de-caja`              | `/operador/cierre`; owner review `/cortes`, `/revision-caja`                                              |
| `alta-producto`              | `/productos/nuevo` (also `/inventario-inicial`, `/importar`)                                              |
| `vincular-empleado`          | `/equipo` («Generar código»), `/empleados`, `/activar`                                                    |
| `permisos-operador`          | `/operador/ventas/[folio]` cancel (reason + NIP); per-operator permissions on `/equipo` (xangarrote only) |
| `subir-de-plan`              | `/suscripcion`, `/bienvenida/plan`. Without Stripe test keys the paid buttons answer «no disponible».     |
| `revision-don-cuentas`       | `/asesor` (deterministic; `/api/cron/asesor` with `CRON_SECRET` materialises insights)                    |

**Plan limits** (`packages/domain/src/entities/plan.ts`):

| Plan       | Operators | Devices | Tx/month | Products |
| ---------- | --------- | ------- | -------- | -------- |
| xangarrito | 2         | 1       | 300      | 50       |
| xangarro   | 3         | 2       | 10k      | 1000     |
| xangarrote | 6         | 5       | 30k      | 5000     |

There is no trial (ADR-105).

## 6. Clock

- **Server:** `PORTAL_TODAY`, read per request by `src/server/clock.ts`, fixed per process. There is no per-tenant
  override, by design. A journey day is a server restart.
- **Web register:** dates sales with the browser's `new Date()`. Synth sets it over CDP (`Emulation`) or with
  Playwright's clock.
- **Phone:** the emulator's date (`adb shell date`, or the emulator console).

## 7. Don Cuentas and other external services

- **Don Cuentas.** `src/server/asesor/model.ts` returns null without `ASESOR_LLM_BASE_URL`, `ASESOR_LLM_API_KEY`
  and `ASESOR_LLM_MODEL`, and recorded fixtures are used. `pedirProsa` has no caller. Nothing to mock; leave them
  unset.
- **Stripe:** test mode is enforced (`src/server/billing/config.ts` throws on a live key). `BILLING_BETA_NO_CHARGE=1`
  opens no Checkout.
- **CFDI:** `CFDI_MODE=off`.
- **Email:** with no `RESEND_API_KEY`, mail is written to `apps/web/.email-outbox/`.

## 8. Existing coverage to build on

- **Playwright**: `apps/web/playwright.config.ts`.
  - Sentinels are in `e2e/routes.ts`.
  - The `@serial` convention is ADR-103.
  - The `operador` project's `testMatch` is a fixed list, so triage adds new `operador-*` specs to it.
- **Chaos specs:** `chaos-1-impaciente`, `chaos-2-datos-corruptos`, `chaos-3-sesion-muerta`,
  `chaos-4-backend-muerto` and `operador-chaos`.
- **Phone:** Maestro flows in `apps/mobile/maestro/flows/` with `flows/shared/` subflows, and reports in
  `e2e-reports/`.

## 9. A corrida's own stack (S-04)

`pnpm --filter @xangarro/synth-core stack up` brings one up and prints a JSON `ready` line. `--no-server` gives
the database alone; `--seed <seed> --auth-as <role>` also mints a run's tenant on it.

- **Database:** container `xangarro-pg-synth-<id>` on a free port, migrated and seeded by `db-local.sh`. It is
  removed with its volume when the corrida ends.
- **Portal:** one production build in `apps/web/.next-synth/<id>`, and `next start` on another free port.
  - It starts with `portalServerEnv()` from `@xangarro/testing/tenant`, the e2e suite's own recipe.
  - It adds `EMAIL_OUTBOX_DIR=tools/synth/reports/<id>/outbox`, so each corrida's mail stays apart.
  - `CFDI_MODE=off`, and no Stripe, Resend or LLM key is set.
- **Refusals:** under 10 GB free on the Docker VM, or a database URL outside `allowed_hosts`.
- **Ending:** SIGINT, SIGTERM and SIGHUP tear down. A SIGKILL leaves `tools/synth/reports/.stacks/<id>.json`, which
  the next `stack up`, or `stack reap`, uses to remove the server, container and build it names.
- **Seeds** (`core/src/seed/fixtures.ts`):

  | Seed                            | What is on the run's tenant                                   |
  | ------------------------------- | ------------------------------------------------------------- |
  | `vacio`                         | the owner, the business and one device                        |
  | `negocio-con-catalogo-minimo`   | plus 3 products and operator Ana (NIP 2580)                   |
  | `negocio-con-historial-30-dias` | plus 3 sales a day for the 30 days before today               |
  | `plan-al-limite`                | xangarrito, with its 2 operators (Ana, Luis) and its 1 device |

  An `operador` scenario also gets an activation code; `admin` and `viewer` get a member account of that role.

## 10. Open items for the owner

None blocks Phase 1. They are asked when their task starts:

1. **S-05 and S-06:** verify the current `claude -p` flags, the Playwright MCP CDP option, and whether the Maestro
   MCP can target a device non-interactively.
2. **S-19:** Stripe test keys for a corrida, if `subir-de-plan` should reach Checkout.
3. **S-20:** whether Studio screens go on the El Mostrador canvas first (ADR-117), or are exempt as an internal
   tool.
