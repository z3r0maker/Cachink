import 'server-only';

import {
  CerrarMetasVencidasUseCase,
  FijarMetaUseCase,
  nivelesPosibles,
  type MetaError,
} from '@xangarro/application';
import {
  figuraDelMes,
  ritmoDeMeta,
  rachaDe,
  type Meta,
  type MotivoMeta,
  type NivelMeta,
  type ObjetivoMeta,
  type RitmoMeta,
} from '@xangarro/domain';
import {
  cerrarMeta,
  getBusiness,
  clavesCelebradas,
  insertarMeta,
  metaActiva,
  metasCerradas,
  totalsForRange,
} from '@xangarro/data-pg';

import { withTenant } from './db';
import { hoy } from './clock';

/**
 * The Metas tab's read model (P-27/P-33): goals close lazily on load, the
 * month-end dialog reads the row that just closed, and the celebration is
 * shown once — gated by a `celebraciones` marker, never by a browser.
 */
export type EstadoMetas = 'negocio-nuevo' | 'sin-meta' | 'activa' | 'cerrada';

export interface NivelPosible {
  readonly id: NivelMeta;
  readonly pct: number;
  readonly mensual: bigint;
  readonly diario: bigint;
}

export interface MetasPageData {
  readonly estado: EstadoMetas;
  /** The running goal, when there is one. */
  readonly meta: Meta | null;
  /** Its pace on the business clock. */
  readonly ritmo: RitmoMeta | null;
  /** The month-to-date figure for the goal's kind. */
  readonly actual: bigint | null;
  /** The goal that just closed on this load, dialog and all. */
  readonly recienCerrada: Meta | null;
  /** The wizard's levels, computed from the real base. */
  readonly niveles: readonly NivelPosible[];
  readonly trophies: readonly Meta[];
  readonly racha: number;
  /** The takeover to render once (never for a viewer — the call site decides). */
  readonly celebrar: {
    readonly clave: string;
    readonly racha: number;
    /** P-32's share: the closed goal's month and what it earned. */
    readonly mes: string;
    readonly vendido: bigint;
    readonly negocio: string;
  } | null;
}

const mesDe = (ym: string): { readonly desde: string; readonly hasta: string } => {
  const [y, m] = ym.split('-').map(Number) as [number, number];
  const ultimo = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { desde: `${ym}-01`, hasta: `${ym}-${String(ultimo).padStart(2, '0')}` };
};

const mesPrevioA = (ym: string): string => {
  const [y, m] = ym.split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

/** The pg store both use cases orchestrate over. */
function storeDe(businessId: string) {
  return {
    activa: () => withTenant(businessId, (tx) => metaActiva(tx)),
    cerradas: () => withTenant(businessId, (tx) => metasCerradas(tx)),
    insertar: (m: Meta) => withTenant(businessId, (tx) => insertarMeta(tx, businessId, m)),
    cerrar: (id: string, c: { lograda: boolean; resultado: bigint; at: string }) =>
      withTenant(businessId, (tx) => cerrarMeta(tx, id, c)),
  };
}

/** The takeover to render once: an achieved goal whose marker is missing. */
function celebracionPendiente(
  recienCerrada: Meta | null,
  claves: readonly string[],
  racha: number,
  negocio: string,
): MetasPageData['celebrar'] {
  if (recienCerrada?.lograda !== true) return null;
  const clave = `meta:${recienCerrada.id}`;
  if (claves.includes(clave)) return null;
  return {
    clave,
    racha,
    mes: recienCerrada.periodo,
    vendido: recienCerrada.resultadoCentavos ?? 0n,
    negocio,
  };
}

export async function loadMetasPage(businessId: string): Promise<MetasPageData> {
  const today = hoy();
  const ym = today.slice(0, 7);
  const store = storeDe(businessId);
  const totales = totalesDe(businessId);

  const recienCerrada =
    (await new CerrarMetasVencidasUseCase(store, totales).execute(businessId as never, today))[0] ??
    null;

  const [activa, cerradas, previo, mesActual, claves, nombre] = await Promise.all([
    store.activa(),
    store.cerradas(),
    totales(businessId, mesPrevioA(ym)),
    totales(businessId, ym),
    withTenant(businessId, (tx) => clavesCelebradas(tx)),
    withTenant(businessId, (tx) => getBusiness(tx)),
  ]);
  const negocio = nombre?.nombre ?? 'tu negocio';

  const racha = rachaDe(cerradas);
  const objetivoDelWizard: ObjetivoMeta = 'vender';
  const base = figuraDelMes(objetivoDelWizard, previo);
  const estado = estadoDe(recienCerrada, activa, base, previo);

  const celebrar = celebracionPendiente(recienCerrada, claves, racha, negocio);

  return {
    estado,
    meta: activa,
    ritmo:
      activa === null ? null : ritmoDeMeta(activa, figuraDelMes(activa.objetivo, mesActual), today),
    actual: activa === null ? null : figuraDelMes(activa.objetivo, mesActual),
    recienCerrada,
    niveles: nivelesPosibles(base, objetivoDelWizard),
    trophies: cerradas.slice(0, 6),
    racha,
    celebrar,
  };
}

/** Which screen state the data adds up to. */
function estadoDe(
  recienCerrada: Meta | null,
  activa: Meta | null,
  base: bigint,
  previo: { readonly ventas: bigint; readonly gastos: bigint },
): EstadoMetas {
  if (recienCerrada !== null) return 'cerrada';
  if (activa !== null) return 'activa';
  return base <= 0n && figuraDelMes('gastar', previo) <= 0n ? 'negocio-nuevo' : 'sin-meta';
}

/** A month's totals as the use cases' port reads them. */
const totalesDe =
  (businessId: string) =>
  async (_biz: string, yearMonth: string): Promise<{ ventas: bigint; gastos: bigint }> => {
    const { desde, hasta } = mesDe(yearMonth);
    return withTenant(businessId, (tx) => totalsForRange(tx, desde, hasta));
  };
/** FijarMetaUseCase over the pg store — the action's server half. */
export async function fijarMeta(
  businessId: string,
  input: {
    readonly objetivo: ObjetivoMeta;
    readonly motivo: MotivoMeta;
    readonly nivel: NivelMeta;
  },
): Promise<{ ok: true } | { ok: false; code: MetaError['code']; message: string }> {
  try {
    await new FijarMetaUseCase(storeDe(businessId), totalesDe(businessId)).execute({
      businessId: businessId as never,
      ...input,
      hoy: hoy(),
    });
    return { ok: true };
  } catch (error) {
    const code = (error as MetaError).code;
    if (code !== undefined) return { ok: false, code, message: (error as Error).message };
    throw error;
  }
}
