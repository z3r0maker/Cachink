# Lifting «Empresa» out (E-44)

How MEXIA's books leave Xangarro's database (ADR-125 §2). There are two ways
out, and one database half common to both:

- **Case A — new database, same console.** `apps/backoffice` keeps the area;
  only `CORP_DATABASE_URL` points somewhere else.
- **Case B — another system.** Something else serves the founders, and the
  console stops having an «Empresa» area at all.

The database half is a script, `packages/data-corp/scripts/salida.sh`, and it
is rehearsed end to end by `salida-ensayo.sh` (§ Rehearsal). The files' half
(Azure) is written here and rehearsed once E-26's account exists.

| Moves with the dump                                         | Does not move — set by hand on the day                        |
| ----------------------------------------------------------- | ------------------------------------------------------------- |
| every `corp` table, its constraints, triggers and functions | the corp logins' passwords and timeouts                       |
| every file kept in `corp.blobs` (`storage = 'pg'`)          | files in the `corp-docs` container (`storage = 'azure'`), § 5 |
| the two roles' grants (`permisos.sql`)                      | founder ↔ login identity (case B), § 6                        |
| the corp rows of the migration ledger                       | the read of Xangarro's payments (case B), § 6                 |

**Rule for every step:** connection strings and passwords come from the
password manager into the shell with `read -rs`, never typed on a command
line, never into chat, tickets or screenshots. The export directory holds the
cap table, the agreement and every kept file in the clear: it lives on an
encrypted disk, never in the repository.

## 0. Before the day

1. **Pick the case**, and record it as an ADR before starting.
2. **The target** is a Postgres whose major version is the source's or newer,
   reached as its owner (`postgres`) on a **session** connection. On Supabase
   that is the Session pooler, port 5432, never the Transaction pooler.
3. **The client tools** (`pg_dump`, `pg_restore`, `psql`) are at least as new
   as both servers: `pg_dump --version`.
4. **Check out the commit that is deployed.** `verificar` compares the
   migration ledger with this checkout's files.
5. **Rehearse** on this machine (§ Rehearsal) and see it pass.
6. **Two new passwords** (24+ characters) in the password manager, for
   `xangarro_corp` and `xangarro_corp_agent` on the target.
7. **Tell the founders** «Empresa» is gone for the window. Writes stop from § 1
   to § 6. The daily `empresa-cobros` cron (12:00 UTC) needs no care: with the
   area off it answers `corp_disabled`, and every run imports this month and
   the last, so the next one catches up.

```bash
cd packages/data-corp
read -rs SOURCE_URL   # Xangarro's database, as postgres, session connection
read -rs TARGET_URL   # the new database, as its owner, session connection
EXPORT=~/mexia-salida-$(date +%F)   # on the encrypted disk
```

## 1. Freeze

1. In the backoffice's Vercel project, **remove `CORP_DATABASE_URL`** and
   deploy to production. «Empresa» disappears from the console for everyone;
   that is the designed off switch (`server/db/corp.ts`).
2. Close any agent connected to the corp database (ADR-125 §6).
3. Turn the two corp logins off on the source and end their sessions:

```bash
./scripts/salida.sh congelar "$SOURCE_URL"
```

## 2. Export

```bash
./scripts/salida.sh exportar "$SOURCE_URL" "$EXPORT"
```

It refuses to run while a corp login can still connect. It writes:

| File           | What it is                                                          |
| -------------- | ------------------------------------------------------------------- |
| `corp.dump`    | `pg_dump -n corp`, custom format, without owners or privileges      |
| `huellas.txt`  | per table: its row count and a fingerprint of every row             |
| `permisos.sql` | the two corp roles' grants, as GRANT statements                     |
| `esquema.sql`  | the schema's DDL, to compare with the target's                      |
| `ledger.csv`   | the `corp/…` rows of `xangarro_ops.migrations`                      |
| `SHA256SUMS`   | the five files' hashes; `importar` and `verificar` check them first |

## 3. Import and verify

```bash
./scripts/salida.sh importar "$EXPORT" "$TARGET_URL"
./scripts/salida.sh verificar "$EXPORT" "$TARGET_URL"
```

`importar` runs as **one transaction**: it creates the two roles (NOLOGIN),
restores the schema, replays the grants and writes the ledger rows. Either the
target holds all of `corp` or none of it. It refuses a target that already has
a `corp` schema.

`verificar` must end in `verified`. Each line it prints is one check:

| Line                                           | Meaning                                                          |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| `every row of every table`                     | same row counts and fingerprints as the source at export         |
| `tables, constraints, triggers and functions`  | same DDL, including the ledger's balance and closed-month guards |
| `the two roles' grants`                        | the console and the agents can do exactly what they could        |
| `no other role can read corp`                  | no PUBLIC or foreign role holds a privilege                      |
| `every file in corp.blobs matches its SHA-256` | each kept file hashes to the value recorded at upload            |
| `ledger rows` / `… matches this checkout`      | the migration history arrived and is this commit's               |
| `info N file(s) live in Azure`                 | § 5 applies                                                      |

**Any `FAIL` means do not cut over.** On the target, `DROP SCHEMA corp CASCADE`
and `DELETE FROM xangarro_ops.migrations WHERE name LIKE 'corp/%'`, then repeat
from `importar`, or roll back (§ 7).

## 4. Logins on the target

In `psql "$TARGET_URL"`, give each role its login with `\password` (it prompts,
so the password never reaches a command line), then the settings
`LOGIN_ROLES` in `packages/data-pg/scripts/hosted/roles.ts` gives it:

```sql
ALTER ROLE xangarro_corp LOGIN;
\password xangarro_corp
ALTER ROLE xangarro_corp SET statement_timeout = '…';   -- and the others in LOGIN_ROLES
ALTER ROLE xangarro_corp_agent LOGIN;
\password xangarro_corp_agent
```

## 5. Files in Azure

Skip this section when `verificar` printed no `info … live in Azure` line:
every file travelled inside the dump.

Otherwise:

- **Case A with the same storage account:** nothing to copy. The container is
  not tied to the database; the console keeps its Azure settings.
- **A new storage account (case B, or by choice):**
  1. Create `corp-docs` there with the same locked time-based immutability
     policy of five years (CFF art. 30) **before** copying anything.
  2. Copy server to server with `azcopy copy --recursive`, from a read + list
     SAS on the old container to a create + write SAS on the new one.
  3. Check every file against `corp.documents.sha256` on the target. The check
     is E-26's `moverDocumentos`
     (`packages/application/src/corp/expediente/mudanza.ts`), with both ends
     Azure: it reads each copy back and hashes it. **Its runner for two
     accounts is not built yet:** it is written and rehearsed with E-26's
     account, because the immutability policy is part of what the rehearsal
     must prove.
  4. The old container cannot be emptied: its policy keeps each file for five
     years from upload. The old account stays, and is paid, until the last
     file's retention ends.

## 6. Cut over

### Case A — new database, same console

1. In the backoffice's Vercel project, set `CORP_DATABASE_URL` to
   `xangarro_corp` on the target (its transaction pooler is fine at runtime)
   and deploy to production.
2. Point any agent at `xangarro_corp_agent` on the target.
3. The two ports do not change: Xangarro's payments are still read through
   the console's own `DATABASE_URL` (`server/empresa/ingresos-fuente.ts`), and
   founders are still the console's staff.
4. **Migrations:** `db:migrate:hosted` would keep applying the `corp` set to
   Xangarro's database. In the same change as the cutover, the `corp` set
   leaves `MIGRATION_SETS` (`packages/data-pg/scripts/hosted/plan.ts`) and
   gets its own run against the target, whose ledger now holds its rows.

### Case B — another system

1. **Payments (`RevenueSource`).** The new system has no console login. It gets
   one on Xangarro's database that can only
   `EXECUTE xangarro.ingresos_del_periodo(text)`: a data-pg migration for the
   role and the grant, its login in `LOGIN_ROLES`. Its adapter maps the rows
   as `pagoDeXangarro` does (`server/empresa/ingresos-fuente.ts`).
2. **Founders.** `corp.founders.staff_member_id` names a Xangarro staff id.
   Point each founder at the new system's user
   (`UPDATE corp.founders SET staff_member_id = … WHERE numero = …`; the
   console role may), and have the new system check that pairing on every
   request, as `server/founder-gate.ts` does.
3. **The console.** `CORP_DATABASE_URL` stays removed. In one change: a
   redirect from `/empresa` to the new system in `next.config.mjs`, the
   `empresa-cobros` cron out of `vercel.json`, and the `corp` set out of
   `MIGRATION_SETS`.

### Both cases

Sign in as a founder and compare the Resumen with a screenshot taken before
§ 1. Open one kept document with «Ver»: its bytes now come from the target.

## 7. Rollback

**The point of no return is the first write on the target.** Before it:

```bash
./scripts/salida.sh descongelar "$SOURCE_URL"
```

then put the source's `CORP_DATABASE_URL` back, deploy, and drop `corp` from
the target. After it, the source is stale: going back is this runbook again,
from the target to a fresh database.

## 8. After

- The source keeps its `corp`, frozen. This runbook never drops it: the
  founders and the contador decide when, and CFF art. 30 keeps records five
  years. The export directory is one more copy; keep it encrypted.
- Record the move in the ADR from § 0 (date, case, target).

## Rehearsal

```bash
# 1. Fill the local corp the way the console does.
XG_PG_NAME=xangarro-pg-empresa XG_PG_PORT=55440 E2E_PORT=3260 \
  pnpm --filter @xangarro/backoffice test:e2e:db e2e/empresa.spec.ts
# 2. Lift it out to a throwaway container and try to break the copy.
XG_PG_PORT=55440 packages/data-corp/scripts/salida-ensayo.sh
```

Pass both `XG_PG_NAME` and `XG_PG_PORT` to step 1: without the name, the reset
removes the default `xangarro-pg` container instead.

The rehearsal freezes the local source, exports it, imports it into a new
container and verifies it. It then proves:

- a second `importar` is refused;
- `xangarro_corp` reads the same books on the target, and
  `xangarro_corp_agent` reads document metadata but never file bytes;
- `verificar` fails on each of these, and verifies again once each is undone:
  - a changed row;
  - a changed file;
  - a missing grant;
  - an extra reader;
  - a disabled guard trigger;
  - a changed ledger row;
  - a damaged export.

**What it does not prove:**

- the Azure half;
- the Vercel steps;
- a managed target whose `postgres` is not a superuser.
