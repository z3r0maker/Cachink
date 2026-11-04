import { randomBytes } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

/**
 * A throwaway database for an old → new migration test (CLAUDE.md §2.9). A
 * test that rewinds a migration in the suite's own database takes exclusive
 * locks on the tables the other files read in parallel, and deadlocks them;
 * here it rewinds nothing anyone else uses.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const sqlFiles = (dir: string) =>
  readdirSync(join(ROOT, dir))
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => ({ nombre: f, ruta: join(ROOT, dir, f) }));

export interface BaseDesechable {
  readonly sql: postgres.Sql;
  /** Applies the corp migrations whose file name passes `cuales`, in order. */
  aplicar(cuales: (nombre: string) => boolean): Promise<void>;
  cerrar(): Promise<void>;
}

/** A new database with the local logins applied and no corp migration yet. */
export async function crearBaseDesechable(): Promise<BaseDesechable> {
  const superUrl = process.env.DATABASE_SUPER_URL ?? '';
  const nombre = `xg_scratch_corp_${randomBytes(6).toString('hex')}`;
  const admin = postgres(superUrl, { max: 1, onnotice: () => {} });
  await admin.unsafe(`CREATE DATABASE ${nombre}`);
  const u = new URL(superUrl);
  u.pathname = `/${nombre}`;
  const sql = postgres(u.toString(), { max: 1, onnotice: () => {} });
  const correr = async (rutas: readonly string[]) => {
    for (const r of rutas) await sql.unsafe(readFileSync(r, 'utf8'));
  };
  await correr(sqlFiles('local').map((f) => f.ruta));
  return {
    sql,
    aplicar: (cuales) =>
      correr(
        sqlFiles('drizzle')
          .filter((f) => cuales(f.nombre))
          .map((f) => f.ruta),
      ),
    async cerrar() {
      await sql.end({ timeout: 5 });
      await admin.unsafe(`DROP DATABASE IF EXISTS ${nombre} WITH (FORCE)`);
      await admin.end({ timeout: 5 });
    },
  };
}
