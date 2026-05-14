/**
 * Migrations bundle for `@cachink/data` (P1C-M2-T02 infra).
 *
 * Exposed as the `./migrations` subpath export in package.json so both
 * Metro (mobile) and Vite (desktop) can import the journal + SQL strings
 * without depending on filesystem access or a Drizzle-Kit runtime.
 *
 * All 13 migrations (0000 through 0012) are included. Migrations 0002 and
 * 0003 add smart catalog columns and make productoId NOT NULL respectively.
 */

import journal from './meta/_journal.json';
import { migration0000Sql } from './migration-0000.js';
import { migration0001Sql } from './migration-0001.js';
import { migration0002Sql } from './migration-0002.js';
import { migration0003Sql } from './migration-0003.js';
import { migration0004Sql } from './migration-0004.js';
import { migration0005Sql } from './migration-0005.js';
import { migration0006Sql } from './migration-0006.js';
import { migration0007Sql } from './migration-0007.js';
import { migration0008Sql } from './migration-0008.js';
import { migration0009Sql } from './migration-0009.js';
import { migration0010Sql } from './migration-0010.js';
import { migration0011Sql } from './migration-0011.js';
import { migration0012Sql } from './migration-0012.js';
import { migration0013Sql } from './migration-0013.js';

/**
 * Map of migration tag → raw SQL. Keys match `_journal.json` entry tags.
 * Used by `runMigrations()` to execute missing migrations in order.
 */
export const migrationSqlByTag: Readonly<Record<string, string>> = Object.freeze({
  '0000_lying_johnny_blaze': migration0000Sql,
  '0001_change_log_and_sync_state': migration0001Sql,
  '0002_smart_catalog': migration0002Sql,
  '0003_productoId_required': migration0003Sql,
  '0004_sale_hora': migration0004Sql,
  '0005_product_color_fondo': migration0005Sql,
  '0006_users': migration0006Sql,
  '0007_audit_trail': migration0007Sql,
  '0008_feature_flags': migration0008Sql,
  '0009_caja_turnos': migration0009Sql,
  '0010_conversion': migration0010Sql,
  '0011_auditoria_inventario': migration0011Sql,
  '0012_credito_alerts': migration0012Sql,
  '0013_rename_auth_columns': migration0013Sql,
});

/**
 * Drizzle-style migrations bundle.
 */
export const migrationsBundle = Object.freeze({
  journal,
  migrations: Object.freeze({
    m0000: migration0000Sql,
    m0001: migration0001Sql,
    m0002: migration0002Sql,
    m0003: migration0003Sql,
    m0004: migration0004Sql,
    m0005: migration0005Sql,
    m0006: migration0006Sql,
    m0007: migration0007Sql,
    m0008: migration0008Sql,
    m0009: migration0009Sql,
    m0010: migration0010Sql,
    m0011: migration0011Sql,
    m0012: migration0012Sql,
    m0013: migration0013Sql,
  }),
});

export {
  journal,
  migration0000Sql,
  migration0001Sql,
  migration0002Sql,
  migration0003Sql,
  migration0004Sql,
  migration0005Sql,
  migration0006Sql,
  migration0007Sql,
  migration0008Sql,
  migration0009Sql,
  migration0010Sql,
  migration0011Sql,
  migration0012Sql,
  migration0013Sql,
};
export default migrationsBundle;
