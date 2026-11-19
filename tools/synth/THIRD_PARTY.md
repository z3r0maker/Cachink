# Synth — third-party code and dependencies

ADR-153 §10 sets three rules for everything under `tools/synth/`:

1. **No copied code.** Nothing is copied from MiroFish, OASIS, UXAgent or any other project. An idea may be
   reused; its code may not.
2. **No AGPL or GPL dependency** without the owner's approval, recorded here with the date.
3. **Every dependency is listed below** when it is added, with its licence and what it is for. The usual rule
   still applies: the latest stable version, checked on npm, and at least seven days old (`pnpm-workspace.yaml`).

## Dependencies

None yet. The three packages only use the workspace's shared dev tooling (`@xangarro/config`, TypeScript,
Vitest). The first one added starts a table here: package, licence, which Synth package uses it, and what for.

## External tools the harness drives

These are run as programs, not bundled:

| Tool                      | Used by | What for                                     |
| ------------------------- | ------- | -------------------------------------------- |
| Claude Code (`claude -p`) | runner  | the actor, the judge and triage (ADR-153 §6) |
| Playwright MCP            | runner  | the web actor's browser tools                |
| Maestro MCP               | runner  | the phone actor's emulator tools             |
