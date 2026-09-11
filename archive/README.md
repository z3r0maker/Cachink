# archive/

Code kept for recoverability but **not built, not in the pnpm workspace, not renamed**.
See ARCHITECTURE.md ADR-053 (§6, Consequences) and docs/plan/01-foundation.md (F-02, F-03).

| Path           | What                        | Tagged at                 | Recover with                                                                                                                                                  |
| -------------- | --------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/desktop` | Tauri desktop app (Cachink) | `archive/desktop-2026-09` | `git mv archive/apps/desktop apps/desktop`, then remove the `!archive/**` exclusion's effect by re-adding to `pnpm-workspace.yaml` and `scripts/build-all.sh` |
