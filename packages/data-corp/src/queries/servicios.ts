import type { ServiceRepository } from '@xangarro/application/corp';
import { CATEGORIAS_GASTO, type Servicio } from '@xangarro/domain/corp';
import { asc, eq } from 'drizzle-orm';

import type { CorpDb } from '../client.js';
import { services } from '../schema/servicios.js';

/**
 * Servicios' rows (E-24) → the domain's `Servicio`, parsed and never asserted
 * (CLAUDE.md §2.8). A save writes the whole row; nothing is deleted.
 */
type Row = typeof services.$inferSelect;

const bigintODe = (value: unknown, que: string): bigint | null => {
  if (value === null) return null;
  if (typeof value !== 'bigint') throw new Error(`corp.services: ${que} is not bigint`);
  return value;
};

function categoriaDe(r: Row): Servicio['categoria'] {
  const c = CATEGORIAS_GASTO.find((k) => k === r.categoria);
  if (c === undefined) throw new Error(`corp.services ${r.id}: unknown categoría «${r.categoria}»`);
  return c;
}

function toServicio(r: Row): Servicio {
  return {
    id: r.id,
    nombre: r.nombre,
    para: r.para,
    categoria: categoriaDe(r),
    cobro: r.cobro,
    estado: r.estado,
    moneda: r.moneda,
    monto: bigintODe(r.monto, `monto of ${r.id}`),
    diaCargo: r.diaCargo,
    renueva: r.renueva,
    tarifa: r.tarifa,
    aviso: bigintODe(r.aviso, `aviso of ${r.id}`),
    limite: r.limite,
    usoPlan: r.usoPlan,
    unidad: r.unidad,
    gastoMes: bigintODe(r.gastoMes, `gasto_mes of ${r.id}`),
    gastoAl: r.gastoAl,
    pagaCon: r.pagaCon,
    plantillaId: r.plantillaId,
  };
}

export function createServiceRepository(db: CorpDb): ServiceRepository {
  return {
    async findById(id) {
      const rows = await db.select().from(services).where(eq(services.id, id)).limit(1);
      return rows[0] === undefined ? null : toServicio(rows[0]);
    },
    async list() {
      return (await db.select().from(services).orderBy(asc(services.nombre))).map(toServicio);
    },
    async save(s, founderId) {
      const { id, ...campos } = s;
      const set = { ...campos, updatedBy: founderId, updatedAt: new Date().toISOString() };
      await db
        .insert(services)
        .values({ id, ...set })
        .onConflictDoUpdate({ target: services.id, set });
    },
  };
}
