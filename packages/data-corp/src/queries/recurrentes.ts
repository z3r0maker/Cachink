import type { NuevaPlantilla, RecurringTemplateRepository } from '@xangarro/application/corp';
import {
  CATEGORIAS_GASTO,
  leerRefRecurrente,
  type CategoriaGasto,
  type PlantillaRecurrente,
} from '@xangarro/domain/corp';
import { and, asc, eq, isNull, like } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import type { CorpDb } from '../client.js';
import { entries, recurringTemplates } from '../schema/ledger.js';

/**
 * E-02's recurring templates over the corp schema. A charge is linked to its
 * template by `source_ref` only (`<template>:<YYYY-MM>:<nonce>`), so reading
 * which months are registered is a scan of the recurring entries, not a join.
 */
type Row = typeof recurringTemplates.$inferSelect;

function categoriaDe(value: string): CategoriaGasto {
  const c = CATEGORIAS_GASTO.find((k) => k === value);
  if (c === undefined) throw new Error(`corp.recurring_templates: unknown categoría «${value}»`);
  return c;
}

function toPlantilla(r: Row): PlantillaRecurrente {
  return {
    id: r.id,
    nombre: r.nombre,
    contraparte: r.contraparte,
    categoria: categoriaDe(r.categoria),
    moneda: r.moneda,
    montoEstimado: r.montoEstimado,
    diaCargo: r.diaCargo,
    projectId: r.projectId,
    deducible: r.deducible,
    activo: r.activo,
    desde: r.desde,
  };
}

async function findById(db: CorpDb, id: string): Promise<PlantillaRecurrente | null> {
  const rows = await db
    .select()
    .from(recurringTemplates)
    .where(eq(recurringTemplates.id, id))
    .limit(1);
  return rows[0] === undefined ? null : toPlantilla(rows[0]);
}

async function ensure(db: CorpDb, p: NuevaPlantilla): Promise<PlantillaRecurrente> {
  await db
    .insert(recurringTemplates)
    .values({ ...p, activo: true, createdAt: new Date().toISOString() })
    .onConflictDoNothing({ target: recurringTemplates.id });
  const saved = await findById(db, p.id);
  if (saved === null) throw new Error(`corp.recurring_templates: ${p.id} vanished`);
  return saved;
}

/** Template → entry of each standing recurring charge for `mes`; a reversed one is left out. */
async function registradasEn(db: CorpDb, mes: string): Promise<ReadonlyMap<string, string>> {
  // Checked before it reaches LIKE, where % and _ would be wildcards.
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw new Error(`not a month: ${mes}`);
  const reversal = alias(entries, 'reversal');
  const rows = await db
    .select({ id: entries.id, ref: entries.sourceRef })
    .from(entries)
    .leftJoin(reversal, eq(reversal.reversesEntryId, entries.id))
    .where(
      and(
        eq(entries.source, 'recurring'),
        like(entries.sourceRef, `%:${mes}:%`),
        isNull(reversal.id),
      ),
    )
    .orderBy(asc(entries.createdAt));
  const out = new Map<string, string>();
  for (const r of rows) {
    const ref = r.ref === null ? null : leerRefRecurrente(r.ref);
    if (ref !== null && ref.mes === mes) out.set(ref.plantillaId, r.id);
  }
  return out;
}

export function createRecurringTemplateRepository(db: CorpDb): RecurringTemplateRepository {
  return {
    ensure: (p) => ensure(db, p),
    findById: (id) => findById(db, id),
    list: async () =>
      (await db.select().from(recurringTemplates).orderBy(asc(recurringTemplates.nombre))).map(
        toPlantilla,
      ),
    setActivo: async (id, activo) => {
      await db.update(recurringTemplates).set({ activo }).where(eq(recurringTemplates.id, id));
    },
    registradasEn: (mes) => registradasEn(db, mes),
  };
}
