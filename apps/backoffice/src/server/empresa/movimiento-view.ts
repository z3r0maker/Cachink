import type { Movimiento } from '@xangarro/data-corp';
import { formatDate, formatMoney, parseIsoDate } from '@xangarro/domain';
import { ACCOUNTS, type AccountGroup, type MovementKind } from '@xangarro/domain/corp';

/**
 * A ledger entry as the Movimientos table shows it (E-02, board CD-02): the
 * type, the category, the bank effect and the state, in the board's words.
 */
export type Estado = 'Registrado' | 'Revertido' | 'Reversa';
export type Filtro = 'todos' | 'ingresos' | 'gastos' | 'socios' | 'impuestos';

export interface FilaMovimiento {
  readonly id: string;
  readonly fecha: string;
  readonly tipo: string;
  readonly concepto: string;
  readonly detalle: string;
  readonly categoria: string;
  /** Signed: «+$1,160.00» in, «−$368.40» out. */
  readonly monto: string;
  readonly entra: boolean;
  readonly estado: Estado;
  readonly filtro: Exclude<Filtro, 'todos'> | null;
}

const TIPO: Record<MovementKind, string> = {
  cobro: 'Cobro',
  payout: 'Depósito',
  gasto: 'Gasto',
  pago_impuestos: 'Impuestos',
  aportacion_capital: 'Socios',
  fondeo_mitades: 'Socios',
  excedente_a_prestamo: 'Socios',
  aportacion_adicional: 'Socios',
  prestamo_socio: 'Socios',
  reembolso_socio: 'Socios',
  comision_bancaria: 'Comisión',
  ajuste: 'Ajuste',
};

const FILTRO: Partial<Record<MovementKind, Exclude<Filtro, 'todos'>>> = {
  cobro: 'ingresos',
  payout: 'ingresos',
  gasto: 'gastos',
  comision_bancaria: 'gastos',
  pago_impuestos: 'impuestos',
  aportacion_capital: 'socios',
  fondeo_mitades: 'socios',
  excedente_a_prestamo: 'socios',
  aportacion_adicional: 'socios',
  prestamo_socio: 'socios',
  reembolso_socio: 'socios',
};

const CATEGORY_GROUPS: readonly AccountGroup[] = ['ingreso', 'costo', 'gasto', 'otro', 'capital'];

/** The account that says what the entry was about: the P&L line, else the partner account. */
function categoria(m: Movimiento): string {
  if (m.kind === 'pago_impuestos') return 'Impuestos';
  for (const group of CATEGORY_GROUPS) {
    const line = m.lines.find((l) => ACCOUNTS[l.cuenta].grupo === group);
    if (line !== undefined) return ACCOUNTS[line.cuenta].nombre;
  }
  const other = m.lines.find((l) => l.cuenta !== 'bancos') ?? m.lines[0];
  return other === undefined ? '' : ACCOUNTS[other.cuenta].nombre;
}

/** The bank effect in centavos; an entry that never touched the bank shows its size. */
export function efectoEnBancos(m: Pick<Movimiento, 'lines'>): bigint {
  const bank = m.lines.filter((l) => l.cuenta === 'bancos');
  if (bank.length > 0) return bank.reduce((acc, l) => acc + l.debe - l.haber, 0n);
  return m.lines.reduce((acc, l) => acc + l.debe, 0n);
}

function detalle(m: Movimiento): string {
  if (m.reversesEntryId !== null) return 'Revierte un movimiento anterior';
  const parts: string[] = [];
  if (m.moneda === 'USD' && m.montoOriginal !== null) {
    parts.push(`USD ${formatMoney(m.montoOriginal).replace('$', '')} · TC ${m.tipoCambio ?? ''}`);
  }
  if (m.contraparte !== null && m.contraparte !== '') parts.push(m.contraparte);
  if (m.deducible === false) parts.push('no deducible');
  return parts.join(' · ');
}

function estado(m: Movimiento): Estado {
  if (m.reversesEntryId !== null) return 'Reversa';
  return m.reversedBy === null ? 'Registrado' : 'Revertido';
}

export function filaDe(m: Movimiento): FilaMovimiento {
  const efecto = efectoEnBancos(m);
  const entra = efecto > 0n;
  const abs = efecto < 0n ? -efecto : efecto;
  return {
    id: m.id,
    fecha: formatDate(parseIsoDate(m.fecha)),
    tipo: m.reversesEntryId === null ? TIPO[m.kind] : 'Reversa',
    concepto: m.concepto,
    detalle: detalle(m),
    categoria: categoria(m),
    monto: `${entra ? '+' : '−'}${formatMoney(abs)}`,
    entra,
    estado: estado(m),
    filtro: m.reversesEntryId === null ? (FILTRO[m.kind] ?? null) : null,
  };
}

export const FILTROS: readonly { readonly id: Filtro; readonly label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'ingresos', label: 'Ingresos' },
  { id: 'gastos', label: 'Gastos' },
  { id: 'socios', label: 'Socios' },
  { id: 'impuestos', label: 'Impuestos' },
];

export function parseFiltro(value: string | undefined): Filtro {
  return FILTROS.find((f) => f.id === value)?.id ?? 'todos';
}

const MES = /^\d{4}-(0[1-9]|1[0-2])$/;

/** `?mes=YYYY-MM`, else the month of `today` (an ISO date). */
export function parseMes(value: string | undefined, today: string): string {
  return value !== undefined && MES.test(value) ? value : today.slice(0, 7);
}

/** The months either side of `mes`, for the Anterior / Siguiente buttons. */
export function mesesVecinos(mes: string): {
  readonly anterior: string;
  readonly siguiente: string;
} {
  const year = Number(mes.slice(0, 4));
  const month = Number(mes.slice(5, 7));
  const fmt = (y: number, m: number) => `${y}-${String(m).padStart(2, '0')}`;
  return {
    anterior: month === 1 ? fmt(year - 1, 12) : fmt(year, month - 1),
    siguiente: month === 12 ? fmt(year + 1, 1) : fmt(year, month + 1),
  };
}
