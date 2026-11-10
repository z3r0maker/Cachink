# `supabase/`

What is left here is `studio/`: saved queries for the Supabase dashboard's SQL editor (B-16).
Studio runs them as an owner role, so each one spans every tenant on purpose.

| File                               | What it answers                                              |
| ---------------------------------- | ------------------------------------------------------------ |
| `studio/codes-expiring-today.sql`  | Activation codes nobody has used that expire within 24 hours |
| `studio/stale-devices.sql`         | Active phones not heard from in 7 days                       |
| `studio/unresolved-rejections.sql` | Businesses with rows their phones could not send             |
| `studio/unlock-sign-in.sql`        | Unlocks an owner locked out by too many wrong passwords      |

Everything else that once lived here is gone:

- **The schema** is `packages/data-pg` (Drizzle, `drizzle/*.sql`), applied to the hosted project by
  `pnpm --filter @xangarro/data-pg db:migrate:hosted`. See `docs/ops/provisioning.md`. Never run
  `supabase db push` against the hosted project.
- **The `bug-report` edge function** was retired by N-81 (ADR-140). The phone's «Reportar un
  problema» goes to the portal's `POST /api/v1/support/bug-report` with the device token, and the
  portal files it in the staff inbox. No function is deployed, nothing outside `apps/backoffice`
  holds the service-role key, and the app carries no Supabase URL or key at all.
