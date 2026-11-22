# Track S — Xangarro Synth

An internal QA harness (ADR-153):

- LLM personas use the real portal and the phone's capture app.
- A separate judge classifies what they hit.
- Deterministic scripts own the environment, the evidence, the interruptions and the seeded bugs.
- Synth Studio launches, watches and reviews the runs.

It is never shipped, never a CI gate, and never pointed at production. The design brief is the owner's spec v2,
`25-synth-spec.md`. This file wins where the two differ. Supersedes N-49.

## 1. Owner decisions (2026-11-19)

1. **N-49:** superseded by this track, with no wait on staging (X-01).
2. **Location:** `tools/synth/{core,server,studio}`, workspace packages `@xangarro/synth-*`. `tools/*` joins
   `pnpm-workspace.yaml`. An ESLint boundary stops `apps/*` and `packages/*` from importing them, and `release.sh`
   never deploys them.
3. **Isolation:**
   - One stack per corrida: its own Postgres container and its own `next start`, removed afterwards.
   - One tenant per run (`mintTenant()`), plus a fresh browser profile and a fresh throttle IP.
   - Journeys add one server per simulated day.
4. **Fixtures:** lift the SQL half of the e2e tenant helpers to `@xangarro/testing/tenant`. The e2e files
   re-export it, so the 50 specs don't change.
5. **Models:** actor Claude Sonnet 5.5; judge and triage Claude Opus 5.5. Each is a `config.yaml` setting.
6. **Billing:** the developer's Claude Code login. Caps are `max_steps`, `max_turns`, a time limit, and a cost
   _estimate_ per corrida and per day taken from the reported usage.
7. **Onboarding paths:**
   - `onboarding-camino-a` answers all 8 steps of «Platícanos de ti».
   - `onboarding-camino-b` skips («Omitir») every step to «Tu plan ideal».
   - Both start at signup, with email confirmation through the `.email-outbox/` sink.
   - Reconfigure (`?modo=reconfigurar`) is a later scenario.
8. **Studio:** for the owner only, bound to `127.0.0.1`, no login.
9. **Narrative lab (spec §19):** built, as Phase 12.
10. **Phone:** built alongside the web from Phase 1. Android emulator, capture app in E2E mode, the actor driving
    it through the Maestro MCP.
11. **Evidence:** start with public reviews of Mexican POS and finance apps, names stripped. Add real sessions as
    they happen.
12. **`market_weight`:** a first estimate, each value marked `source: estimate`:
    - lupita-abarrotes 0.30, taquero 0.25, emprendedora-cafe 0.15;
    - dueno-con-equipo 0.10, formal-con-contador 0.10, operador 0.10.
13. **Studio's design (ADR-154):**
    - A dark «Sala de control» look on `consoleTheme.dark`, where yellow means «en vivo».
    - Studio has a motion list of its own, and each motion has a static state.
    - Reactions come from runner signals only.
    - Personas are geometric faces with a pictogram of the business type.
    - The boards are on the Synth Studio canvas, https://claude.ai/artifact/HrVjKALmE6H7zTFaCDAFvp.
14. **Signup confirmation (2026-11-20, S-10):** the actor has only a browser, so when the confirmation email
    lands in the corrida's outbox the runner opens its link in the actor's tab, as tapping it on the phone
    would. The run folder gets `confirmation.json`, so the judge knows the runner moved the tab.
15. **Non-human weight (2026-11-20, S-10):** `chaos` and `device` declare `market_weight` 0. When findings are
    ranked they count at the human personas' summed weight: what they break, they break for every segment.

## 2. What Phase 0 found (corrections to the spec)

The full findings are in `tools/synth/ENV.md`.

- **No staging.** Everything runs locally (decision 3).
- **Roles.**
  - Members are `owner`, `admin` and `viewer`. There is no «director».
  - Operators are PIN users on `/operador` after a device link with an activation code.
  - `auth_as` is `owner | admin | viewer | operador`.
- **Don Cuentas is deterministic.** `asesor/model.ts` returns null without `ASESOR_LLM_*`, and `pedirProsa` has no
  caller. Nothing needs mocking, and `revision-don-cuentas` tests `/asesor`.
- **Plans** (`packages/domain/src/entities/plan.ts`):
  - operators: xangarrito 2, xangarro 3, xangarrote 6;
  - devices: 1, 2, 5;
  - free means no subscription row, which falls back to xangarrito;
  - no trial (ADR-105).
  - Stripe refuses live keys, and without test keys the paid buttons answer «no disponible». `subir-de-plan`
    therefore ends before checkout unless a corrida sets Stripe test keys.
- **Clock.**
  - `PORTAL_TODAY` is read per server process (`src/server/clock.ts`), with no per-tenant override.
  - The web register dates sales with the browser's `new Date()`. The runner sets the browser's clock over CDP.
- **Browser state** is all per profile in Chromium, and a fresh profile clears it:
  - the OPFS file `xangarro-register.sqlite3`;
  - localStorage `xangarro.device` and others, and sessionStorage `xangarro.sesion`;
  - the cookie `xg_session`.
  - The e2e suite blocks service workers. Synth does too.
- **Already covered deterministically.** `chaos-1…4` and `operador-chaos`. The `chaos` persona aims at what those
  don't cover.
- **Bulk activity.** No N-day generator exists. `between.generate` builds on the sync push helpers (`sync-phone.ts`,
  `phone-rows.ts`) as a script.

## 3. Constraints for every task

- The actor gets **only** its runner's MCP tools (Playwright or Maestro) and an empty working directory. It never
  sees the repo, a URL bar shortcut or the DOM beyond what the MCP shows.
- **Actor and judge are separate processes.** A finding without a trace reference is dropped.
- **Seed, reset, capture, interruptions, seeded bugs, success checks and aggregation are scripts with tests**
  (TDD, CLAUDE.md §2.4). No LLM decides any of them.
- **Hosts.** `run.ts` and `seed` refuse any host outside `allowed_hosts` (`127.0.0.1`, `localhost`, `10.0.2.2`).
- **Data.**
  - No real customer data in fixtures, evidence or screenshots.
  - `tools/synth/reports/` and `tools/synth/memory/` are gitignored.
- **Docker VM.** Check `df` before a corrida (58 GB VM, shared). The corrida's container is removed with `-v`
  when it ends, failure included.
- **Reports.** No satisfaction scores, NPS, «les gustó», or success rates presented as predictions. Rates appear
  only as deltas between versions.
- **Triage** writes a failing test in `apps/web/e2e/` or `apps/mobile/maestro/flows/` and stops. It never fixes,
  commits or pushes.
- **Licences.** No copied third-party code. No AGPL or GPL dependency without the owner's approval. Each new
  dependency is listed in `tools/synth/THIRD_PARTY.md`.

## 4. Tasks

**Phase 0 — Discovery**

### S-00 Descubrimiento del repo y ENV.md [alta]

- [x] Status
      Done: 2026-11-19 · this branch · `tools/synth/ENV.md`, ADR-153, the decisions in §1, N-49 superseded.

**Phase 1 — One run end to end, web and phone**

### S-01 Paquetes `tools/synth/*` y su frontera [alta]

- [x] Status · **Blocks:** S-03…S-07
      Done: 2026-11-19 · `feat/synth-s01` · the workspace glob is `tools/synth/*`, so the three packages sit one
      level down. The boundary is a shared `no-restricted-imports` pattern, also carried by the ui-components
      block, which replaces the shared rule for its files. `scripts/lint-boundaries.test.ts` proves it fires from
      `apps/web`, from an unclassified package and from a ui component. The packages' `test` runs with
      `--passWithNoTests` until S-03 brings the first tests.
- **What:**
  - Add `tools/*` to `pnpm-workspace.yaml`, with `@xangarro/synth-core`, `-server` and `-studio` (empty
    entrypoints, configs from `@xangarro/config`).
  - An ESLint `no-restricted-imports` rule for `apps/**` and `packages/**` against `@xangarro/synth-*`.
  - A test that `scripts/release.sh` names no `tools/*` package.
  - `.gitignore` for `tools/synth/reports/` and `memory/`.
  - `THIRD_PARTY.md`.
  - `scripts/lint-coverage.test.ts` stays green.
- **Acceptance:** `pnpm lint && pnpm typecheck && pnpm test` green. A deliberate import of `@xangarro/synth-core`
  from `apps/web` fails lint.

### S-02 `@xangarro/testing/tenant`: las fixtures de inquilino en un solo lugar [alta]

- [x] Status · **Blocks:** S-04
      Done: 2026-11-19 · `feat/synth-s02` · `packages/testing/src/tenant/`: `connection`, `mint`, `rows`, `codes`,
      `wire`, `phone-rows`, `door` and `urls` (`db-url.ts` moved with them). The e2e files re-export by name, and
      no spec's import changed. Kept in e2e, because they are typed on Playwright: `signIn`/`submitSignIn`, the
      HTTP calls (`redeemCode`, `activatePhone`, `push`, `pull`, `activateOn`) and the door's browser walk. Synth
      activates its phones through the app with a code from `mintCodeFor` (S-06), so it needs no HTTP push.
      Fixed on the way: `mintTenant` and `addSale` are now transactional, so a refused value leaves no orphan owner
      or ticket. `asTenant` without `DATABASE_URL` throws `FixtureDatabaseError`. Tests: 14 unit tests and 31
      integration tests (`test:db`, in CI's `db` job). The fixture-identity rule now also scans
      `packages/testing/src/tenant`, where only `mint.ts` may insert a business.
- **What:**
  - Move the Playwright-free parts of `apps/web/e2e/tenant.ts`, `tenant-rows.ts`, `sync-phone.ts`,
    `tenant-phone.ts`, `phone-rows.ts` and `puerta-operador.ts` (mintTenant, stamp, addMember, row builders,
    activation codes, push) into `packages/testing/src/tenant/`, exported as `./tenant`.
  - The e2e files keep `signIn()` and anything typed on `Page`, and re-export the rest.
- **Acceptance:**
  - No spec's import changes.
  - `tests/e2e-fixture-identity.test.ts` passes, pointed at the new home.
  - The portal e2e is green.
  - The moved code keeps its tests, plus 3 unhappy paths per function.

### S-03 Esquemas, `config.yaml` y `validate.ts` [alta]

- [x] Status · **Blocked by:** S-01
      Done: 2026-11-19 · `feat/synth-s03` · zod schemas in `@xangarro/synth-core` are the one source. From them:
      the YAML types, and `tools/synth/schemas/*.schema.json`, generated by the package's `schemas` script,
      with a test that fails on a stale file. `config.yaml` is real; `validate` checks it. Corrections:
      `market_weight` is `{value, source}` (decision 12). A phone scenario must sign in as `operador` (ADR-053).
      A run's `outcome` adds `error`, for the harness failing. Each step carries the `fingerprint` ADR-154 reads.
      `validate.ts` also checks ids against file names, evidence files on disk, and matrix references and
      `applies_to`. 49 tests.
- **What:**
  - JSON Schemas for persona, scenario, matrix, finding and run.
  - The scenario gains a `runner: web | phone` field.
  - `auth_as` is `owner | admin | viewer | operador`.
  - Success checks are named SQL assertions run under `withTenant`.
  - `config.yaml` holds `allowed_hosts`, models per role, `max_steps`, `max_turns`, time limits, concurrency
    (web 3, phone 1), the estimated-cost caps per corrida and per day, and the `reactions:` thresholds
    (ADR-154 §4).
  - `validate.ts` checks every YAML file, including §6.1's rule that a `behaviors[].source` is a file under
    `personas/evidence/` or `hypothesis`.
- **Acceptance:** an invalid YAML fails with a path and a reason. Tests: 1 happy and 3 unhappy paths per schema.

### S-04 La pila de una corrida [alta]

- [x] Status · **Blocked by:** S-02, S-03
      Done: 2026-11-19 · `feat/synth-s04` · `core/src/stack/` and `core/src/seed/`, with the `stack up|reap` CLI.
      The portal's server env is one recipe, `portalServerEnv()` in `@xangarro/testing/tenant`, which
      `playwright.config.ts` now uses too. Mail goes to the corrida's own folder through a new local-only
      `EMAIL_OUTBOX_DIR` in `@xangarro/email`. A SIGKILL cannot be caught, so a lock file per stack lets the next
      start, or `stack reap`, remove what a dead corrida left. Tests: 33 unit tests against fakes, and
      `test:stack` against real Docker (two corridas side by side, SIGTERM, SIGKILL and reap).
- **What:**
  - `stack.ts` brings up `xangarro-pg-synth-<id>` on a free port through `db-local.sh` (`XG_PG_NAME`/`XG_PG_PORT`)
    and applies migrations and seed.
  - It builds once and starts `next start` on a free port, with the env recipe of `serverEnv()` in
    `apps/web/playwright.config.ts`. Mail goes to the outbox sink.
  - It tears down on exit, signal or failure (`docker rm -f -v`).
  - It refuses to start when the Docker VM has under 10 GB free.
  - `seed.ts` mints one tenant per run: owner, operators, and a device or activation code as the scenario asks.
  - Fixtures: `vacio`, `negocio-con-catalogo-minimo`, `negocio-con-historial-30-dias`, `plan-al-limite`.
- **Acceptance:** two corridas side by side never share a database or a port. A killed corrida leaves no container
  behind.

### S-05 Runner web: Chromium por CDP, captura y actor [alta]

- [x] Status · **Blocked by:** S-04
      Done: 2026-11-20 · `feat/synth-s05` · `core/src/runner/`, `core/src/success/`, and the `run-one` command.
      Taquero on primera-venta: completed, with success true from SQL, in 9 steps and 31 s, for about $0.08.
      Verified on Claude Code 2.1.283: the actor runs with `--restricted --strict-mcp-config --tools ""`, every
      built-in and 13 Playwright tools on `--disallowedTools`, the 12 persona tools on `--allowedTools`, and
      `--permission-mode dontAsk`. A probe showed it sees exactly those 12 tools, no CLAUDE.md and no memory.
      `--safe-mode` drops `--mcp-config`. `--bare` never reads the Claude Code login. There is no
      `--max-turns`, so the runner enforces steps, turns and time itself. Playwright MCP 0.0.85 attaches with
      `--cdp-endpoint`. It lives in `tools/synth/vendor/` because its alpha `playwright-core` hoisted over
      the repo's. The runner walks the door up to the NIP; the fondo and the sale are the actor's. The door walk
      is shared with the e2e (`walkOwnerDoor`, `walkOperatorDoor` in `@xangarro/testing/tenant`).
- **What:**
  - `run.ts` launches Chromium with a temporary profile, the persona's viewport and network profile, and a CDP
    port.
  - `capture.ts` writes `console.jsonl`, `network.jsonl` (failures and slow requests), a screenshot per step and a
    Playwright trace, all on one timeline. Each step also records a screen fingerprint (URL plus DOM hash) for
    Studio's reactions (ADR-154 §4).
  - The actor is `claude -p` with `actor-task.md`, run in an empty temporary directory. Its strict MCP config holds
    only Playwright MCP attached to that CDP endpoint, with an allow-list of that server's tools.
  - **Verify** the current `claude -p` flags and the Playwright MCP CDP option in their docs before writing this.
  - `success` is evaluated by script, and `run.json` records outcome, steps, tokens, estimated cost and duration.
  - Persona `taquero`, scenario `primera-venta` on `/operador/caja`.
- **Acceptance:** one command produces the whole run folder, and `success` comes from SQL.

### S-06 Runner de teléfono: emulador Android y Maestro MCP [alta]

- [x] Status · **Blocked by:** S-04
      Done: 2026-11-20 · `feat/synth-s06` · `core/src/phone/`, `tools/synth/flows/phone-door.yaml`. Taquero on
      `primera-venta-telefono`: completed, with success true from SQL after the outbox pushed, in 16 steps and
      195 s, for about $0.25. Maestro MCP does take a `device_id` on every call. But its `run` accepts any Maestro
      YAML, so the actor's only MCP server is a Synth proxy in front of it, which allows one person-level command
      per call on the pinned device and restarts `maestro mcp` when another session's `pkill -9 -f maestro` kills
      it. The run holds the harness's machine-wide Maestro lock. `login-operator.yaml` gains `OPERATOR_ID` and
      `NIP`, defaulting to Toni and 1234; the phone door exercised the parameters, and no harness run has used
      the defaults since. It took five runs to pass, each failure on the harness's side: the dev-client sheet
      after `pm clear`, a Google Fonts blip in the build (retried once now), a report with three hard moments
      (the first two are kept), YAML and pixel-tap slips (refused with a hint, not counted as steps), and
      Maestro killed mid-run.
- **What:**
  - Use one Android emulator, with an AVD named in `config.yaml`.
  - The capture app runs a dev-client build with `EXPO_PUBLIC_E2E=1` and `EXPO_PUBLIC_API_BASE=http://10.0.2.2:<port>`
    against the corrida's stack.
  - Each run starts with `pm clear` and links the device with an activation code minted by SQL.
  - Capture: logcat (errors only) to `console.jsonl`, the stack server's request log to `network.jsonl`, and a
    screenshot plus `hierarchy.json` per step, with the hash of `hierarchy.json` as the step's screen fingerprint
    (ADR-154 §4).
  - The actor's strict MCP config holds only the Maestro MCP, with an allow-list of that server's tools.
  - Network profiles come from the emulator console.
  - **Verify** the Maestro MCP tool names and whether it can attach to a given device without the user's
    `list_devices` choice.
  - Persona `taquero`, scenario `primera-venta` on the phone's Cobrar.
- **Acceptance:** one command produces the run folder, and `success` comes from SQL after the outbox has pushed.

### S-07 Prueba de aislamiento del actor [alta]

- [x] Status · **Blocked by:** S-05, S-06
      Done: 2026-11-20 · `feat/synth-s07` · `pnpm --filter @xangarro/synth-core isolation` writes
      `tools/synth/isolation.md`; both actors are isolated. Each actor, started with a run's exact flags and MCP
      server, is told to read a canary file, `cat` it, fetch a canary page from a local server that counts hits,
      and leave through its runner's door (URL bar, phone link). A script decides the verdict: Claude Code's
      `init` event shows the server connected and exactly the allow-list visible, every call is on the list,
      neither token reaches the transcript, and the server counts no hit. The first phone probe passed while its
      proxy had failed to start (an actor with no tools), so the verdict now requires the tools to be there, and
      the override's arguments are passed as `--maestro-arg=<value>`. The README shows the flags rendered from
      `actorArgs`, and `tests/readme.test.ts` holds it to them and to an «isolated» record.
- **What:**
  - A test run where the actor is told to read a file, run a shell command and fetch a URL. Each attempt is refused.
  - The README shows the exact flags and the allow-list.
- **Acceptance:** the transcript shows the refusals, and the README cites it.

**Phase 2 — Judge, aggregation, report**

### S-08 Juez (`synth-judge`) [alta]

- [x] Status · **Blocked by:** S-05
      Done: 2026-11-20 · `feat/synth-s08` · `pnpm --filter @xangarro/synth-core judge <run folder>…` starts
      Opus with `claude -p` in the run folder, with Read, Glob and Grep confined there by `--restricted` and
      no MCP server. Its transcript is checked: the `init` tools must be exactly those three, and every path
      it read must be inside the run. The bug candidates are picked by script (`judge/candidates.ts`): every
      console error, with a stack trace and a burst of the same line folded into one, plus every failed or
      4xx/5xx request. `judge/review.ts` then checks the judge's JSON against the trace: - a reference the run lacks is removed, and a finding left with none is dropped; - a finding answered «no» to the cut question becomes `agent_failure`; - an `agent_failure` answered «yes» is dropped as self-contradicting; - a candidate neither cited nor dismissed is added as «Sin revisar».

      Findings go to the corrida's `findings.json`. The judge's record goes to `<corrida>/judge/<run-id>/`:
      the cut answers, the drops, the candidates and the cost. Two judgements of the S-06 phone run agree,
      at about $0.55 each. «$500 → $8» and «Cobrar $43.00» are `agent_failure`, because Maestro resolved the
      text to a hidden twin of the visible button. Abrir turno before the first sale is `friction`. The web
      run costs about $0.14: the double «Cobrar» is `friction`, and the RSC prefetch aborts are dismissed.

- **What:**
  - Write `prompts/judge.md` and `tools/synth/.claude/agents/synth-judge.md` with the spec §8.3 rubric.
  - The judge has read-only tools on one run folder.
  - Every console error and every unexpected 4xx/5xx becomes a `bug` candidate.
  - It emits `findings.json` against the schema.
- **Acceptance:**
  - Every finding cites steps or captured files.
  - An `exit_interview` alone is never enough evidence.
  - `agent_failure` is decided with §8.3's cut question.

### S-09 `aggregate.ts` y `report.md` [alta]

- [x] Status · **Blocked by:** S-08
      Done: 2026-11-20 · `feat/synth-s09` · `pnpm --filter @xangarro/synth-core aggregate <corrida folder>`
      writes `metrics.json` and `report.md` beside the runs. - Findings without evidence are dropped and counted. The rest merge by `dedupe_key` and category, so
      an `agent_failure` never joins a real finding. Priority is severity (critical 3, major 2, minor 1) ×
      distinct personas × their summed `market_weight`. With repetitions, each finding says how many of
      its cells' runs it appeared in. - Per run: the outcome, steps against `optimal_steps`, the abandon step, console errors (one per error,
      as the judge's candidates count them) and agent failures. - Deltas compare against the latest earlier corrida that ran a same persona × scenario × style. The
      success rate appears only there, in points, beside mean steps and the keys that appeared or went. - The report keeps §11's order, and `agent_failure` findings appear only in its appendix. - `run-one` now writes `corrida.json` (the app's commit and whether the tree was dirty, the mode, the
      repetitions) for the report's header. Older corridas show the commit as unknown.

      Aggregated for real: 235e against 3b08 (both judged), and the phone 1a14 against a7b8.

- **What:** do spec §9's aggregation and write §11's report in its fixed order. That covers dedup, priority,
  per-persona metrics, deltas against a comparable corrida, and counts across repetitions.
- **Acceptance:**
  - Evidence-less findings are dropped (tested).
  - `agent_failure` appears only in the appendix.
  - Rates appear only as deltas.

**Phase 3 — Matrix v1**

### S-10 Personas y escenarios v1 [alta]

- [x] Status · **Blocked by:** S-09
      Done: 2026-11-20 · `feat/synth-s10` · Personas `lupita-abarrotes`, `operador` and `chaos` join `taquero`.
      Scenarios `onboarding-camino-a`, `corte-de-caja`, `permisos-operador` (xangarro, Luis never allowed) and
      `permisos-operador-xangarrote` (Luis's permission off, Ana's on) join both `primera-venta`s. New seeds:
      `operador-sin-permiso`, `xangarrote-permiso-apagado` and `sin-cuenta`, for which the runner mints
      nothing. The actor signs up with an address it is given, and success finds the business by that
      address (decision 14). New checks: `onboarding-terminado` counts answered steps through the domain's
      `WIZARD_STEP_KEYS`, which the wizard now reads too, and `corte-cuadrado`. Permission success is the sale
      still standing. The outbox reader moved to `@xangarro/testing/tenant`. `optimal_steps` were walked by
      hand on a corrida stack: 25, 11, 12, 12 and 7. The phone's 6 was not re-measured. `test:db` runs every
      scenario's checks against a seeded run (20 tests). The walks found two app bugs. The wizard's yes/no
      cards keep the previous question's selection, and a card shown selected that way saves nothing. The
      register's sidebar showed «Ana Robledo» and «Taquería Don Pedro» while Luis was signed in on another
      business.
- **What:**
  - Personas: `lupita-abarrotes`, `taquero`, `operador`, `chaos`, all `hypothesis`, with the weights in §1.
  - Scenarios: `onboarding-camino-a`, `primera-venta` (web and phone), `corte-de-caja`, `permisos-operador`.
  - `permisos-operador` covers cancelling a venta without permission on xangarro, and a per-operator permission
    off on xangarrote.
  - `optimal_steps` is measured by hand once per scenario.
- **Acceptance:** `validate.ts` is green, and each scenario's `success` is tested against a seeded run.

### S-11 Matriz `smoke`, concurrencia y skill `synth-run` [alta]

- [x] Status · **Blocked by:** —
      Done: 2026-11-21 · `feat/synth-s11` · `pnpm --filter @xangarro/synth-core corrida --matrix smoke`
      runs a whole corrida on one stack: the matrix's jobs through a two-lane pool (web 3, phone 1, side by
      side), each run judged as it ends, then `aggregate`. `pool.json` records each job and an interference
      check over the finished runs. Two runs may not share a tenant, and overlapping runs may not share a
      CDP port, client address or browser profile. Each web run now sends its own TEST-NET
      `x-forwarded-for`, since the portal's throttles key on it and every run had been «unknown». No run
      starts once the corrida's or the day's cost cap is reached. The day's spend is read back from every
      corrida on disk, and each actor's budget is what is left. `limits.max_runs_per_corrida` (40) is spec
      §14's cap. `matrix/smoke.yaml` is the spec's cells, all tasks (the walkthrough cell waits for S-14),
      plus primera-venta on the phone. The first smoke run took 5 runs in 319 s, 4 at once, with 0
      interference issues. Every run met its success check, and the corrida cost about US$2.20.
      Re-proven on Maestro 2.12.1: `isolation` (both actors isolated) and the corrida's phone run. The
      skill is `tools/synth/.claude/skills/synth-run`. `run-one`, `judge` and `aggregate` now share one
      catalogue loader and the corrida's run, judge and aggregate steps.
- **What:** `matrix/smoke.yaml`, a concurrency pool (web 3, phone 1), and `tools/synth/.claude/skills/synth-run`.
- **Acceptance:** smoke runs in parallel with no cross-run interference and finishes in under 15 minutes.

**Phase 4 — Seeded bugs and sensitivity**

### S-12 Ocho bugs sembrados [alta]

- [ ] Status · **Blocked by:** S-11
- **What:**
  - The 8 mutations of spec §9. On the web they are CDP init scripts or route interception.
  - On the phone, the network ones (500 on save, 8 s save) go through a proxy in front of the stack's API. The
    rest stay web-only and are marked so.
  - Each declares `expected_category` and `expected_dedupe_prefix`.
- **Acceptance:** each mutation is applied and verified by a deterministic test without the LLM.

### S-13 `sensitivity.ts` y recall [alta]

- [ ] Status · **Blocked by:** S-12
- **What:**
  - Run smoke once per seeded bug and compute recall per category and per runner.
  - Append a row to `calibration/sensitivity-history.csv`.
- **Acceptance:** a recall number exists. Below 60%, the prompts are iterated and each change is logged before
  Phase 5.

**Phase 5 — Cognitive walkthrough and interruptions**

### S-14 Estilo `walkthrough` [media]

- [ ] Status · **Blocked by:** S-13
- **What:** `actor-walkthrough.md` with spec §8.2's four questions per screen, and the judge reads them as
  candidates.
- **Acceptance:** a walkthrough run yields failure points per screen with screenshot references.

### S-15 Cinco interrupciones [media]

- [ ] Status · **Blocked by:** S-13
- **What:**
  - `offline-mid-sale`: CDP offline on the web, and the emulator console network off on the phone.
  - `session-expired`, `tab-away-10min` (CDP clock plus visibility events), `reload-mid-form`.
  - `second-device-edit`: a second session pushes through the sync API.
  - All are triggered by URL pattern or step number.
- **Acceptance:** `offline-mid-sale` fires without the LLM on both runners, and the sync outcome is recorded in
  `run.json`.

**Phase 6 — Triage**

### S-16 `synth-triage` [media]

- [ ] Status · **Blocked by:** —
- **What:**
  - The only agent with repo access.
  - For each `critical` or `major` bug: reproduce it with a deterministic Playwright spec using `mintTenant()`, or
    a Maestro flow using the shared subflows.
  - Locate the probable cause.
  - Three failed attempts mark it `flaky`.
- **Acceptance:** at least one real or seeded bug ends as a failing regression test in the app's suite. Nothing is
  committed.

**Phase 7 — Anchoring and calibration**

### S-17 `synth-persona` y evidencia pública [media]

- [ ] Status · **Blocked by:** —
- **What:**
  - Collect public store reviews of Mexican POS and finance apps into `personas/evidence/`, with reviewer names
    stripped, short quotes only, and the source URL and date kept.
  - The skill turns evidence into persona YAML and refuses any trait without a source.
- **Acceptance:** at least 2 core personas reach `grounded` (60% of their behaviors sourced).

### S-18 `synth-research-prep` y línea base humana [media]

- [ ] Status · **Blocked by:** —
- **What:** a script for 3 to 5 real sessions on the same 3 scenarios, a `human-baseline.yaml` format, and
  `aggregate.ts` matches against it.
- **Acceptance:** spec Phase 7's acceptance.

### S-19 Resto de personas: núcleo, pool y anti-persona [baja]

- [ ] Status · **Blocked by:** S-17
- **What:**
  - Core: `emprendedora-cafe`, `dueno-con-equipo`, `formal-con-contador`, plus `device`.
  - Pool: the spec §7 list.
  - The anti-persona `restaurante-con-mesas`.
  - Scenarios: `onboarding-camino-b`, `alta-producto`, `vincular-empleado`, `subir-de-plan`,
    `revision-don-cuentas`.

**Phase 8 — Studio, read mode**

### S-20 Studio de lectura [media]

- [ ] Status · **Blocked by:** —
- **What:**
  - **Server:** a SQLite indexer over `reports/` (`reindex`) and the read half of spec §16.4's API, bound to
    `127.0.0.1` only.
  - **Studio:** Next.js with Radix and vanilla-extract, like the portal. Screens:
    Inicio, Corridas, Reproductor (steps, thought, action and screenshot synced with console and network), and
    Bandeja with human review (spec §16.3).
  - **Look and motion:** the Synth Studio canvas is the spec, and ADR-154 is the rule. It sets a dark «Sala de
    control» look and a closed list of twelve motions, values in `studio/src/motion.ts`.
  - **Reactions:** `core/reaction.ts` maps a run's signals to the six faces. It is a pure function, built
    test-first, and never reads the model's tone.
  - **Fonts:** the console's `monoStack` moves from `apps/backoffice` into `@xangarro/tokens`, so Studio reads
    the same stack.
- **Acceptance:** spec Phase 8's acceptance, including the test that no product build contains `tools/synth`. A
  Playwright spec under `reducedMotion: 'reduce'` shows each screen's static states.

**Phase 9 — Studio launches and watches**

### S-21 Lanzar, En vivo, Comparar, Calibración [media]

- [ ] Status · **Blocked by:** S-20, S-13
- **What:**
  - A job queue in the server that calls `run.ts`.
  - `POST /estimate`, and Launch blocks when an estimated cap would be exceeded.
  - Live view over SSE with CDP screencast frames. The phone is shown with screenshots per step.
  - Compare and Calibration screens.
- **Acceptance:** spec Phase 9's acceptance. Cancelling kills the actor, the browser or emulator session, and the
  corrida's stack. The live view's motions follow ADR-154, and a Playwright spec under
  `reducedMotion: 'reduce'` shows their static states.

**Phase 10 — Longitudinal sessions**

### S-22 Recorridos y memoria con olvido [baja]

- [ ] Status · **Blocked by:** S-11
- **What:**
  - `journeys/*.yaml`.
  - `between.generate` pushes N days of ventas through the sync API by script.
  - One server per simulated day (`PORTAL_TODAY`), plus the browser clock over CDP and the emulator's date.
  - A memory writer whose every entry cites steps.
  - Deterministic decay as spec §17.2 describes, a Recorridos screen, and the `return_friction` category.
- **Acceptance:** spec Phase 10's acceptance on `primer-mes-dueno`.

**Phase 11 — Evidence graph**

### S-23 Grafo de evidencia [baja]

- [ ] Status · **Blocked by:** S-17, S-20
- **What:** ingestion, extraction, a script that checks every quote is a literal substring, human approval in the
  Evidencia screen, and the persona builder from the graph.
- **Acceptance:** spec Phase 11's acceptance.

**Phase 12 — Narrative lab**

### S-24 Laboratorio de narrativa [baja]

- [ ] Status · **Blocked by:** S-23
- **What:**
  - Spec §19, built in-house.
  - 8 to 12 grounded personas discuss a message in rounds, and an agent groups the objections.
  - Each objection links to the evidence of the persona that raised it. Objections without support are labelled
    speculative.
  - Every output is labelled «hipótesis para validar con personas reales».
- **Acceptance:** spec Phase 12's acceptance. It needs at least 8 grounded personas.

### S-25 Hallazgos al buzón `kind=explorador` [baja]

- [ ] Status · **Trigger:** the owner asks for Synth findings in the support inbox (N-05's source list).
- **What:** a confirmed finding (Studio review `confirmed`) can be sent to the inbox as an `explorador` item with
  its screenshots and repro steps.
