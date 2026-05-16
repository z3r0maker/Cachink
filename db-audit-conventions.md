# Cachink! Database Conventions

> Source: CLAUDE.md §2, §6, §7. This file codifies the project-specific
> SQLite conventions so the antipattern audit can elevate violations to
> higher severity.

## Money Storage

- **All monetary values are stored as INTEGER centavos (minor units).**
  Never use REAL/FLOAT/DOUBLE for money. NUMERIC affinity is NOT acceptable
  because SQLite's NUMERIC type coerces values to REAL when they arrive as
  floating-point strings. Only INTEGER affinity guarantees integer storage.
- Display formatting (e.g., `$1,234.56`) is a presentation concern only.
- Tax rates (`isr_tasa`) should be INTEGER basis points (30% → 3000)
  to avoid floating-point arithmetic against centavo amounts.

## Primary Keys

- **ULID primary keys stored as TEXT**, not GUID/UUID.
- ULIDs enable distributed ID generation across devices without coordination.
- This is an accepted tradeoff: larger than INTEGER rowids but correct for
  multi-device sync scenarios.

## Dates and Timestamps

- **ISO-8601 strings** for all dates (`YYYY-MM-DD`) and timestamps
  (`YYYY-MM-DDTHH:MM:SS.sssZ`).
- Stored as TEXT columns, not INTEGER (Unix epoch) or REAL (Julian day).
- No CHECK constraint required for format validation — Zod schemas
  validate at the application layer.

## Soft Deletes

- Every entity table uses `deleted_at TIMESTAMP NULL` for soft deletes.
- `NULL` = active row; non-NULL ISO timestamp = deleted.
- Queries must filter `WHERE deleted_at IS NULL` for active records.
- A partial index `WHERE deleted_at IS NULL` should exist on high-traffic
  tables to avoid scanning deleted rows.

## Standard Audit Columns

Every entity table MUST have these columns:

| Column       | Type | Nullable | Purpose                            |
|-------------|------|----------|------------------------------------|
| `business_id` | TEXT | NOT NULL | Tenant isolation                  |
| `device_id`   | TEXT | NOT NULL | Origin device for sync            |
| `created_at`  | TEXT | NOT NULL | ISO-8601 creation timestamp       |
| `updated_at`  | TEXT | NOT NULL | ISO-8601 last-update timestamp    |
| `deleted_at`  | TEXT | NULL     | ISO-8601 soft-delete timestamp    |

## Foreign Keys

- Foreign key constraints should be declared in migrations.
- `PRAGMA foreign_keys = ON` must be set at connection time for both
  Expo (mobile) and Tauri (desktop) database connections.
- The sync pull-loop may temporarily disable FK checks during batch
  upserts, but must re-enable them after the batch.

## Sync Change-Log

- Every entity table that participates in sync must have corresponding
  `AFTER INSERT` and `AFTER UPDATE` triggers writing to
  `__cachink_change_log`.
- Tables without sync triggers are invisible to LAN sync.

## Enum Columns

- Drizzle `text(..., { enum: [...] })` provides TypeScript-level enum
  enforcement only.
- Runtime validation lives in Zod schemas at the application layer.
- SQL-level CHECK constraints should be added before LAN sync goes live
  (incoming sync data bypasses the app's Zod layer).

## JSON-in-TEXT Columns

- Configuration/metadata columns may store JSON as TEXT.
- These columns should be documented as JSON in the schema JSDoc.
- They cannot be indexed, constrained, or queried without full
  deserialization — acceptable for low-traffic config data, not for
  queryable attributes.
