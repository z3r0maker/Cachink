import { formatMoney } from '@xangarro/domain';

import type { ChecklistItem } from '@/onboarding/checklist';

/** The month's figures in centavos, as `totalsForRange` returns them. */
export interface MesTotals {
  readonly ventas: bigint;
  readonly gastos: bigint;
  readonly utilidad: bigint;
  readonly ventasCount: number;
  readonly gastosCount: number;
}

export interface Briefing {
  /** Don Cuentas's line about the month, from the numbers only. */
  readonly line: string;
  readonly cta: { readonly label: string; readonly href: string };
}

/**
 * What Don Cuentas says on Hoy (ADR-107). Every figure is the month's own;
 * nothing is inferred beyond ventas, gastos and what is left.
 */
export function briefing(mes: MesTotals): Briefing {
  if (mes.ventasCount === 0 && mes.gastosCount === 0) {
    return {
      line: 'Este mes todavía no llegan movimientos. En cuanto tus cajas cobren la primera venta, aquí te cuento cómo vas.',
      cta: { label: 'Ver mis primeros pasos', href: '/como-empiezo' },
    };
  }
  const v = formatMoney(mes.ventas);
  const g = formatMoney(mes.gastos);
  if (mes.utilidad < 0n) {
    return {
      line: `Este mes llevas ${v} en ventas, pero los gastos ya van en ${g}. Nada de pánico: abajo te dejé lo que conviene revisar.`,
      cta: { label: '¿En qué se me fue el dinero?', href: '/estados' },
    };
  }
  return {
    line: `Este mes llevas ${v} en ventas y ${g} en gastos: te quedan ${formatMoney(mes.utilidad)}. ¡Vas bien!`,
    cta: { label: 'Ver cómo va el mes', href: '/estados' },
  };
}

export type PendienteTone = 'alerta' | 'sync' | 'gente' | 'paso';

export interface Pendiente {
  readonly key: string;
  readonly tone: PendienteTone;
  readonly title: string;
  readonly sub: string;
  readonly cta: string;
  readonly href: string;
}

export interface PendientesInput {
  readonly lowStock: readonly { readonly producto: string }[];
  readonly pendingRows: number;
  readonly revision: number;
  readonly checklist: readonly ChecklistItem[];
}

/** «Gringa, Quesadilla y Refresco» — at most four names, then «y N más». */
export function listaNombres(names: readonly string[]): string {
  const shown = names.slice(0, 4);
  const rest = names.length - shown.length;
  if (rest > 0) return `${shown.join(', ')} y ${rest} más`;
  if (shown.length <= 1) return shown.join('');
  return `${shown.slice(0, -1).join(', ')} y ${shown.at(-1)}`;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

function stock(names: readonly string[]): Pendiente {
  const n = names.length;
  return {
    key: 'stock',
    tone: 'alerta',
    title: `${n} ${plural(n, 'producto se está acabando', 'productos se están acabando')}`,
    sub: listaNombres(names),
    cta: 'Ver productos',
    href: '/productos?filtro=bajo',
  };
}

/** Today's to-do list, most urgent first; unfinished setup steps last, two at most. */
export function pendientes(input: PendientesInput): readonly Pendiente[] {
  const out: Pendiente[] = [];
  if (input.lowStock.length > 0) out.push(stock(input.lowStock.map((r) => r.producto)));
  if (input.pendingRows > 0) {
    const n = input.pendingRows;
    out.push({
      key: 'sync',
      tone: 'sync',
      title: `${n} ${plural(n, 'registro no se envió', 'registros no se enviaron')}`,
      sub: 'Siguen guardados en la caja. Nada se pierde.',
      cta: 'Revisar',
      href: '/sincronizacion',
    });
  }
  if (input.revision > 0) {
    out.push({
      key: 'revision',
      tone: 'gente',
      title: `${input.revision} por revisar de lo que crearon en caja`,
      sub: 'Ponles costo o límite para que tus números cuadren.',
      cta: 'Revisar',
      href: '/revision-caja',
    });
  }
  for (const item of input.checklist.filter((i) => !i.done).slice(0, 2)) {
    out.push({
      key: item.key,
      tone: 'paso',
      title: item.title,
      sub: item.hint,
      cta: 'Hacerlo',
      href: item.href ?? '/como-empiezo',
    });
  }
  return out;
}
