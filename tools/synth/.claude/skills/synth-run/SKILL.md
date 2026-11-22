---
name: synth-run
description: >
  Runs a Xangarro Synth corrida and hands back its report. Use when asked to "corre synth smoke",
  "corre synth full", "prueba este flujo con las personas", or to run a Synth matrix. It validates the
  YAML, runs the matrix on a fresh local stack (web and phone in parallel), judges each run, aggregates,
  and summarises report.md. Never against production; local only.
---

# synth-run

Xangarro Synth (ADR-153, track S in `docs/plan/24-synth.md`) is an internal QA harness. LLM personas use
the real portal and the capture app on a local stack, a separate judge proposes findings from the
evidence, and scripts decide everything else. This skill runs one corrida end to end with the
`corrida` command (S-11) and reports what came of it.

## Before you start

Check these, and stop and say what is missing if any fails:

1. **The tree is valid:** `pnpm --filter @xangarro/synth-core validate`.
2. **Playwright MCP is installed:** `tools/synth/vendor/playwright-mcp/node_modules` exists. If not, run
   `pnpm --filter @xangarro/synth-core setup` once.
3. **Docker has room:** the stack refuses under 10 GB free on the VM. Check with
   `docker system df` before a full corrida.
4. **For a matrix with a phone cell** (`smoke` has one): the Android emulator's AVD named in
   `config.yaml` exists and the capture app's dev client is installed on it. The corrida takes the
   machine-wide Maestro lock and holds it to the end, so no other Maestro run can use the phone meanwhile.
5. **Cost:** every run and every judge spends the developer's Claude Code usage. The corrida stops
   starting runs at `estimated_cost_caps` (per corrida and per day). Say roughly what the matrix will
   cost before starting it: the first smoke corrida (2026-11-21) cost about US$2.20, runs and judges
   together, and took about 5 minutes.

## Run it

```bash
pnpm --filter @xangarro/synth-core corrida --matrix smoke
```

The matrix name is a file in `tools/synth/matrix/` (`smoke`, later `full`). The command:

1. validates the tree and expands the matrix into jobs (cells × repetitions, at most
   `limits.max_runs_per_corrida`);
2. brings up the corrida's own Postgres and portal build (a few minutes);
3. runs the jobs through the pool, `concurrency.web` browser runs and one phone run at a time, each run on
   its own tenant, browser profile, CDP port and client address;
4. judges each run as it ends;
5. writes `metrics.json`, `report.md` and `pool.json` in `tools/synth/reports/<corrida>/` and tears the
   stack down.

Run it in the background and wait for it to finish. Do not poll it; it prints one line per run and
judge, and a last line with the corrida folder.

## Report back

Read `tools/synth/reports/<corrida>/pool.json` and `report.md`, then tell the person:

- how long it took, how many runs ran at once (`interference.peak`), and any `interference.issues`. Any
  issue means runs shared something they own: say so first;
- every job that `failed` or was `skipped`, with its reason;
- the prioritised findings from `report.md`, in its order, each marked as a hypothesis or grounded as the
  report marks it.

Rules for the summary, from the track's constraints:

- Findings are hypotheses from synthetic agents until a person verifies them. Say so.
- No satisfaction scores, «les gustó» or NPS. A success rate appears only as a delta against an earlier
  corrida, which `report.md` already computes. Never present it as a prediction of real users.
- `agent_failure` findings are the agent's own stumbles. They stay in the report's appendix and out of
  the summary unless asked.
- Never point a corrida at production or staging, and never paste a run's passwords or NIPs. They are test
  values, but they stay in the run folder.

## When something goes wrong

- **The stack does not come up:** read `tools/synth/reports/<corrida>/server.log`. A killed corrida
  leaves `tools/synth/reports/.stacks/<id>.json`; `pnpm --filter @xangarro/synth-core stack reap`
  removes what it names.
- **A run `failed`:** that is the harness, not the app. Its error is in `pool.json`, and its folder may
  hold `actor.stderr.log`.
- **The phone run waits a long time to start:** another Maestro run holds the lock.
