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

All four were already workspace dependencies, at the same versions, which were the latest stable on npm on
2026-11-19. Beyond them the packages use the workspace's shared dev tooling (`@xangarro/config`, TypeScript,
Vitest, `@types/node`).

## External tools the harness drives

These are run as programs, not bundled:

| Tool                      | Used by | What for                                     |
| ------------------------- | ------- | -------------------------------------------- |
| Claude Code (`claude -p`) | runner  | the actor, the judge and triage (ADR-153 §6) |
| Playwright MCP            | runner  | the web actor's browser tools                |
| Maestro MCP               | runner  | the phone actor's emulator tools             |
