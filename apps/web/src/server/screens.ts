import 'server-only';

import {
  getBusiness,
  listDispositivos,
  liveActivationCode,
  listEmpleados,
  listMovimientos,
  listMovimientosInventario,
  listNotices,
  listOperadores,
  listProductos,
  historialSync,
  listRejections,
} from '@xangarro/data-pg';

import { withTenant } from './db';

/**
 * One loader per screen.
 *
 * Each opens a single transaction, sets the tenant claim once, and returns the
 * screen's whole read model. The screens remain pure components over these
 * shapes, so Fase 5's state-and-role sweep still works from props alone
 * (ADR-058 §9).
 *
 * A thrown error is the container's signal to render the screen's `error`
 * state — never a blank page, and never a partial render that looks like data.
 */
export const loadMovimientos = (biz: string, kind: 'venta' | 'gasto') =>
  withTenant(biz, (tx) => listMovimientos(tx, kind));

export const loadProductos = (biz: string) =>
  withTenant(biz, async (tx) => ({
    catalogo: await listProductos(tx),
    movimientos: await listMovimientosInventario(tx),
  }));

export const loadEquipo = (biz: string, hoy: string) =>
  withTenant(biz, async (tx) => ({
    // «Capturó hoy» and «Cobrado hoy» are the business's today, not the
    // server's: the clock belongs to the tenant (server/clock).
    operadores: await listOperadores(tx, hoy),
    dispositivos: await listDispositivos(tx),
    codigo: await liveActivationCode(tx),
  }));

export const loadEmpleados = (biz: string) => withTenant(biz, (tx) => listEmpleados(tx));

export const loadNegocio = (biz: string) => withTenant(biz, (tx) => getBusiness(tx));

export const loadSincronizacion = (biz: string) =>
  withTenant(biz, async (tx) => ({
    rechazos: await listRejections(tx),
    dispositivos: await listDispositivos(tx),
    historial: await historialSync(tx),
  }));

export const loadAvisos = (biz: string) => withTenant(biz, (tx) => listNotices(tx));

export const loadAsesor = (biz: string) => withTenant(biz, (tx) => listNotices(tx, 'asesor'));

export type MovimientosData = Awaited<ReturnType<typeof loadMovimientos>>;
export type ProductosData = Awaited<ReturnType<typeof loadProductos>>;
export type EquipoData = Awaited<ReturnType<typeof loadEquipo>>;
export type EmpleadosData = Awaited<ReturnType<typeof loadEmpleados>>;
export type NegocioData = Awaited<ReturnType<typeof loadNegocio>>;
export type SincronizacionData = Awaited<ReturnType<typeof loadSincronizacion>>;
export type AvisosData = Awaited<ReturnType<typeof loadAvisos>>;
