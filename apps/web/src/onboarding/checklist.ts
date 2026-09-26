/**
 * "¿Cómo empiezo?" (P-04's checklist as updated by N-14).
 *
 * The wizard configures; this tracks the doing. Every item here is
 * **detected from data** — nothing to tick by hand, so it cannot drift from
 * what really happened. "Conecta Mercado Pago / Clip" joins only when
 * `cobrosIntegrados` is released on the platform (N-44); it is not yet.
 */

export interface ChecklistSignals {
  readonly operadores: number;
  readonly productos: number;
  /** Opening caja, bancos or CxC were captured (N-17). */
  readonly saldosIniciales: boolean;
  /** A live (unredeemed, unexpired) or already-redeemed activation code exists. */
  readonly codigoGenerado: boolean;
  readonly dispositivosActivos: number;
  readonly ventasSincronizadas: number;
  readonly tieneLogo: boolean;
  /** An RFC is on file — the owner wants Xangarro's invoice for the subscription. */
  readonly tieneRfc: boolean;
  /** The payment types differ from the full offered set: someone looked at them. */
  readonly pagosRevisados: boolean;
}

export type ChecklistKey =
  | 'operador'
  | 'productos'
  | 'saldos'
  | 'codigo'
  | 'dispositivo'
  | 'venta'
  | 'pagos'
  | 'fiscales'
  | 'logo';

/** «Para vender» gates the portal until done (P-36 D-2); «Cuando quieras» never does. */
export type ChecklistGroup = 'requerido' | 'opcional';

export interface ChecklistItem {
  readonly key: ChecklistKey;
  readonly group: ChecklistGroup;
  readonly title: string;
  readonly hint: string;
  readonly href: string | null;
  readonly done: boolean;
}

export interface Checklist {
  /** Every item, required first. */
  readonly items: readonly ChecklistItem[];
  readonly required: readonly ChecklistItem[];
  readonly optional: readonly ChecklistItem[];
  /** Progress and completion count the required items only. */
  readonly done: number;
  readonly total: number;
  readonly complete: boolean;
}

type ItemDef = Omit<ChecklistItem, 'done'> & { readonly isDone: (s: ChecklistSignals) => boolean };

const ITEMS: readonly ItemDef[] = [
  {
    key: 'operador',
    group: 'requerido',
    title: 'Crea tu primer operador',
    hint: 'La persona que cobra, con su PIN.',
    href: '/equipo?tab=operadores',
    isDone: (s) => s.operadores > 0,
  },
  {
    key: 'productos',
    group: 'requerido',
    title: 'Agrega tus productos',
    hint: 'Uno por uno o importa tu catálogo.',
    href: '/productos',
    isDone: (s) => s.productos > 0,
  },
  {
    key: 'saldos',
    group: 'requerido',
    title: 'Captura tus saldos iniciales',
    hint: 'Caja, bancos y lo que te deben el día que empiezas.',
    href: '/saldos-iniciales',
    isDone: (s) => s.saldosIniciales,
  },
  {
    key: 'codigo',
    group: 'requerido',
    title: 'Genera el código de tu teléfono',
    hint: 'Ocho letras para vincular el teléfono a tu negocio.',
    href: '/equipo?tab=dispositivos',
    isDone: (s) => s.codigoGenerado || s.dispositivosActivos > 0,
  },
  {
    key: 'dispositivo',
    group: 'requerido',
    title: 'Vincula tu teléfono',
    hint: 'Se marca solo cuando el teléfono usa el código.',
    href: null,
    isDone: (s) => s.dispositivosActivos > 0,
  },
  {
    key: 'venta',
    group: 'requerido',
    title: 'Tu primera venta sincronizada',
    hint: 'Se marca sola cuando llega la primera venta.',
    href: null,
    isDone: (s) => s.ventasSincronizadas > 0,
  },
  {
    key: 'pagos',
    group: 'opcional',
    title: 'Revisa tus tipos de pago',
    hint: 'Efectivo, transferencia y tarjeta. Si los tres te sirven, déjalo así.',
    href: '/negocio',
    isDone: (s) => s.pagosRevisados,
  },
  {
    key: 'fiscales',
    group: 'opcional',
    title: 'Captura tus datos fiscales',
    hint: 'Solo si quieres factura de tu suscripción a Xangarro.',
    href: '/negocio',
    isDone: (s) => s.tieneRfc,
  },
  {
    key: 'logo',
    group: 'opcional',
    title: 'Sube tu logo',
    hint: 'Aparece en tus comprobantes.',
    href: '/negocio',
    isDone: (s) => s.tieneLogo,
  },
];

export function buildChecklist(signals: ChecklistSignals): Checklist {
  const items = ITEMS.map(({ isDone, ...item }) => ({ ...item, done: isDone(signals) }));
  const required = items.filter((i) => i.group === 'requerido');
  const optional = items.filter((i) => i.group === 'opcional');
  const done = required.filter((i) => i.done).length;
  return {
    items,
    required,
    optional,
    done,
    total: required.length,
    complete: done === required.length,
  };
}
