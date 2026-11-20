# Synth — third-party code and dependencies

ADR-153 §10 sets three rules for everything under `tools/synth/`:

1. **No copied code.** Nothing is copied from MiroFish, OASIS, UXAgent or any other project. An idea may be
   reused; its code may not.
2. **No AGPL or GPL dependency** without the owner's approval, recorded here with the date.
3. **Every dependency is listed below** when it is added, with its licence and what it is for. The usual rule
   still applies: the latest stable version, checked on npm, and at least seven days old (`pnpm-workspace.yaml`).

## Dependencies

| Package     | Version  | Licence      | Used by      | What for                                                        |
| ----------- | -------- | ------------ | ------------ | --------------------------------------------------------------- |
| `zod`       | ^4.6.7   | MIT          | `synth-core` | the schemas of every file, and their JSON Schema (S-03)         |
| `yaml`      | 2.9.1    | ISC          | `synth-core` | parsing the harness's YAML with line numbers for errors (S-03)  |
| `tsx` (dev) | ^4.23.13 | MIT          | `synth-core` | running the `validate`, `schemas` and `stack` scripts           |
| `bcryptjs`  | 3.0.3    | BSD-3-Clause | `synth-core` | hashing the seeded operators' test NIPs, as the seeds do (S-04) |

| `playwright-core` | 1.63.0 | Apache-2.0 | `synth-core` | the runner's own Chromium: launch, capture, trace (S-05) |

All five were already workspace dependencies. The first four are at the latest stable version on npm on
2026-11-19. `playwright-core` stays at the repo's 1.63.0 (1.65.1 is out), so the runner uses the Chromium
build the e2e suite already installed; moving it is the repo-wide Playwright upgrade, not Synth's.

### Outside the workspace: `vendor/playwright-mcp/`

| Package           | Version | Licence    | What for                                                     |
| ----------------- | ------- | ---------- | ------------------------------------------------------------ |
| `@playwright/mcp` | 0.0.85  | Apache-2.0 | the actor's browser tools, attached to the runner's Chromium |

It is Microsoft's (`microsoft/playwright-mcp`). 0.0.86 came out on 2026-11-18, inside the workspace's 7-day
minimum release age, so 0.0.85 (2026-11-09) is pinned. It lives in its own folder with its own lockfile
because it depends on an alpha `playwright-core` (1.66), which pnpm's hoisted linker put over the repo's
1.63 for every package when it was a workspace dependency, breaking the portal's e2e types. Install it with
`pnpm --filter @xangarro/synth-core setup`. Beyond them the packages use the workspace's shared dev tooling (`@xangarro/config`, TypeScript,
Vitest, `@types/node`).

## External tools the harness drives

These are run as programs, not bundled:

| Tool                      | Used by | What for                                     |
| ------------------------- | ------- | -------------------------------------------- |
| Claude Code (`claude -p`) | runner  | the actor, the judge and triage (ADR-153 §6) |
| Playwright MCP            | runner  | the web actor's browser tools                |
| Maestro MCP               | runner  | the phone actor's emulator tools             |
