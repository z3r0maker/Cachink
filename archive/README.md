# archive/

Code kept for recoverability but **not built, not in the pnpm workspace, not renamed**.
See ARCHITECTURE.md ADR-053 (§6, Consequences) and docs/plan/01-foundation.md (F-02, F-03).

| Path           | What                        | Tagged at                 | Recover with                                                                                                                                                  |
| -------------- | --------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/desktop` | Tauri desktop app (Cachink) | `archive/desktop-2026-09` | `git mv archive/apps/desktop apps/desktop`, then remove the `!archive/**` exclusion's effect by re-adding to `pnpm-workspace.yaml` and `scripts/build-all.sh` |
| `ui-screens/{Estados,DirectorHome,Telemetria,Otros,UserManagement,FuncionesNegocio,CajaReportes,MermaReportes,Notificaciones,RolePicker}` | App screens that moved to the web portal (ADR-053 §3) | commit of A-01 | reference for Track P; not importable |
| `ui-tests/` | Unit tests of the archived screens | commit of A-01 | move back alongside a restored screen |
| `mobile-routes/` | Expo Router files for the archived screens | commit of A-01 | `git mv` back into `apps/mobile/src/app/` |
| `maestro-flows/` | E2E flows dedicated to the archived screens | commit of A-01 | `git mv` back into `apps/mobile/maestro/flows/` |
