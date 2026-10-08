/**
 * cola-lectura — the queue as the operator captured it, on the phone (M-09;
 * the web worker's `cola-filas.ts` + `cola-lectores.ts` over the app's own
 * repositories instead of raw SQL): a ticket, its lines and its cancelación
 * are one «Venta»; the inventory ledger folds into one line; everything
 * else is one record per row. Money stays a bigint until `formatMoney`.
 */
import { comoRegistro, type RegistroEnCola } from '@xangarro/caja/pendientes';
import type { ClaseMovimiento, PendienteCrudo } from '@xangarro/caja/lectura';
import type { UnsentRow } from '@xangarro/sync';
import type {
  CajaMovimientosRepository,
  CajaTurnosRepository,
  CancelacionLogsRepository,
  ClientPaymentsRepository,
  ClientsRepository,
  ExpensesRepository,
  ProductsRepository,
  RespuestasOperadorRepository,
  SalesRepository,
  TicketsRepository,
} from '@xangarro/data';

export interface ReposCola {
  readonly tickets: TicketsRepository;
  readonly sales: SalesRepository;
  readonly expenses: ExpensesRepository;
  readonly clientPayments: ClientPaymentsRepository;
  readonly clients: ClientsRepository;
  readonly cajaMovimientos: CajaMovimientosRepository;
  readonly cajaTurnos: CajaTurnosRepository;
  readonly cancelacionLogs: CancelacionLogsRepository;
  readonly products: ProductsRepository;
  readonly respuestas: RespuestasOperadorRepository;
}

/** The tables that need no read: their kind says everything (UP_TABLES). */
const SIN_LECTURA: Readonly<Record<string, ClaseMovimiento>> = {
  day_closes: 'corte',
  entregas_credito: 'entrega',
  conversions: 'conversion',
  auditorias_inventario: 'conteo',
};

const esInventario = (p: PendienteCrudo): boolean =>
  p.tipo === 'movimiento' && p.clase === 'inventario';

async function ventaDeTicket(
  repos: ReposCola,
  ticketId: string,
  reintento: boolean,
): Promise<PendienteCrudo | null> {
  const t = await repos.tickets.findById(ticketId as never);
  if (t === null) return null;
  const lineas = (await repos.sales.findByTicket(t.id)).filter((s) => s.deletedAt === null);
  return {
    tipo: 'venta',
    id: t.id,
    en: t.createdAt,
    folio: t.folio,
    hora: t.hora,
    metodo: t.metodo,
    lineas: lineas.map((s) => ({ concepto: s.concepto, cantidad: s.cantidad })),
    totalCentavos: lineas.reduce((a, s) => a + s.monto, 0n).toString(),
    cancelada: t.cancelledAt !== null,
    ...(reintento ? { reintento: true } : {}),
  };
}

type Lector = (repos: ReposCola, id: string, e: UnsentRow) => Promise<PendienteCrudo | null>;

/** One reader per table: the few columns the queue shows, nothing else. */
const LECTORES: Readonly<Record<string, Lector>> = {
  tickets: (r, id, e) => ventaDeTicket(r, id, e.retrying),
  sales: async (r, id, e) => {
    const s = await r.sales.findById(id as never);
    return s === null ? null : ventaDeTicket(r, s.ticketId, e.retrying);
  },
  cancelacion_logs: async (r, id, e) => {
    const c = await r.cancelacionLogs.findById(id as never);
    return c === null ? null : ventaDeTicket(r, c.ticketId, e.retrying);
  },
  expenses: async (r, id) => {
    const x = await r.expenses.findById(id as never);
    return x === null
      ? null
      : {
          tipo: 'gasto',
          id,
          en: x.createdAt,
          concepto: x.concepto,
          montoCentavos: x.monto.toString(),
          proveedor: x.proveedor,
        };
  },
  client_payments: async (r, id) => {
    const x = await r.clientPayments.findById(id as never);
    if (x === null) return null;
    const c = await r.clients.findById(x.clienteId);
    return {
      tipo: 'abono',
      id,
      en: x.createdAt,
      cliente: c?.nombre ?? null,
      montoCentavos: x.montoCentavos.toString(),
      metodo: x.metodo,
    };
  },
  caja_movimientos: async (r, id) => {
    const x = await r.cajaMovimientos.findById(id as never);
    return x === null
      ? null
      : {
          tipo: 'movimiento',
          id,
          en: x.createdAt,
          clase: x.tipo === 'retiro' ? 'retiro' : 'deposito',
          texto: x.motivo,
          montoCentavos: x.montoCentavos.toString(),
        };
  },
  caja_turnos: async (r, id) => {
    const x = await r.cajaTurnos.findById(id as never);
    if (x === null) return null;
    const cierre = x.cierreAt !== null;
    return {
      tipo: 'movimiento',
      id,
      en: (cierre ? x.cierreAt : x.aperturaAt) ?? '',
      clase: cierre ? 'cierre' : 'apertura',
      texto: null,
      montoCentavos: (cierre ? x.montoCierreCentavos : x.montoAperturaCentavos)?.toString() ?? null,
    };
  },
  respuestas_operador: async (r, id) => {
    const x = await r.respuestas.findById(id as never);
    return {
      tipo: 'movimiento',
      id,
      en: '',
      clase: 'respuesta',
      texto: x?.texto ?? null,
      montoCentavos: null,
    };
  },
  inventory_movements: async (_r, _id) => ({
    tipo: 'movimiento',
    id: 'inventario',
    en: '',
    clase: 'inventario',
    texto: null,
    montoCentavos: null,
  }),
  products: async (r, id) => {
    const x = await r.products.findById(id as never);
    return {
      tipo: 'movimiento',
      id,
      en: '',
      clase: 'producto',
      texto: x?.nombre ?? null,
      montoCentavos: null,
    };
  },
  clients: async (r, id) => {
    const x = await r.clients.findById(id as never);
    return {
      tipo: 'movimiento',
      id,
      en: '',
      clase: 'cliente',
      texto: x?.nombre ?? null,
      montoCentavos: null,
    };
  },
};

/** One row per record, in the order the pusher meets them, tickets folded. */
export async function leerCola(
  repos: ReposCola,
  entradas: readonly UnsentRow[],
): Promise<readonly RegistroEnCola[]> {
  const vistos = new Set<string>();
  const filas: PendienteCrudo[] = [];
  let inventario: PendienteCrudo | null = null;
  for (const e of entradas) {
    const lector = LECTORES[e.tableName] ?? sinLectura(e.tableName);
    const p = lector === null ? null : await lector(repos, e.rowId, e);
    if (p === null) continue;
    if (esInventario(p)) {
      inventario ??= p;
      continue;
    }
    const clave = `${p.tipo}:${p.id}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    filas.push(p);
  }
  if (inventario !== null) filas.push(inventario);
  return filas.map(comoRegistro);
}

/** A table whose kind says everything needs no reader; null when unknown. */
function sinLectura(tabla: string): Lector | null {
  const clase = SIN_LECTURA[tabla];
  if (clase === undefined) return null;
  return async (_r, id) => ({
    tipo: 'movimiento',
    id,
    en: '',
    clase,
    texto: null,
    montoCentavos: null,
  });
}
