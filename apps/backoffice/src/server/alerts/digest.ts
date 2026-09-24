/**
 * `buildDailyDigest` — the 08:00 (Mexico City) staff digest (N-10), as data
 * plus a plain-text and an HTML rendering. Pure: the cron route reads the
 * items and hands the result to the email port.
 *
 * Sections: yesterday's new items by kind; every open urgent item, whenever
 * filed; the «pagos sin CFDI» count (ADR-070); B-18's unresolved sync
 * rejections of the last 24 h by code (`./rejections.ts`); and tenants over a
 * plan limit this month (`./over-limit.ts`). Dormancy candidates are N-48's
 * (post-launch): no tenant can be dormant before launch + 90 days.
 */
import { SUPPORT_KINDS, type SupportItem, type SupportKind } from '@xangarro/domain';
import type { DigestSection } from '@xangarro/email';

import { KIND_LABELS } from '../inbox/labels';
import { emailSections, renderHtml, renderText } from './digest-render';
import { digestWindow, mxDayLabel } from './mx-day';
import { OVER_LIMIT_UNAVAILABLE, type OverLimitSummary } from './over-limit';
import { REJECTIONS_UNAVAILABLE, type RejectionSummary } from './rejections';
import { DEFAULT_CONSOLE_URL } from './webhook-notifier';

export interface KindGroup {
  readonly kind: SupportKind;
  readonly label: string;
  readonly items: readonly SupportItem[];
}

export interface DailyDigest {
  readonly subject: string;
  readonly text: string;
  readonly html: string;
  /** The sections as data, for the React Email template (B-14). */
  readonly emailSections: readonly DigestSection[];
  readonly dayLabel: string;
  readonly window: { readonly start: Date; readonly end: Date };
  readonly counts: {
    readonly nuevos: number;
    readonly urgentesAbiertos: number;
    readonly pagosSinCfdi: number;
    /** Null when the rejections could not be read. */
    readonly rechazos: number | null;
    /** Null when usage could not be read. */
    readonly sobreLimite: number | null;
  };
  readonly rejections: RejectionSummary;
  readonly overLimit: OverLimitSummary;
  readonly newByKind: readonly KindGroup[];
  readonly urgentOpen: readonly SupportItem[];
  /** Open ARCO requests, the nearest legal deadline first (N-34). */
  readonly arcoOpen: readonly SupportItem[];
  readonly consoleUrl: string;
}

const open = (i: SupportItem) => i.status !== 'resuelto';
const soonestDue = (a: SupportItem, b: SupportItem) =>
  Date.parse(a.dueAt ?? '') - Date.parse(b.dueAt ?? '');
const newestFirst = (a: SupportItem, b: SupportItem) =>
  Date.parse(b.createdAt) - Date.parse(a.createdAt) || (a.id < b.id ? 1 : -1);

function groupByKind(items: readonly SupportItem[]): KindGroup[] {
  return SUPPORT_KINDS.map((kind) => ({
    kind,
    label: KIND_LABELS[kind],
    items: items.filter((i) => i.kind === kind).sort(newestFirst),
  })).filter((g) => g.items.length > 0);
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function subjectFor(day: string, c: DailyDigest['counts']): string {
  const bits = [
    c.nuevos > 0 ? plural(c.nuevos, 'nuevo', 'nuevos') : null,
    c.urgentesAbiertos > 0 ? plural(c.urgentesAbiertos, 'urgente', 'urgentes') : null,
    c.pagosSinCfdi > 0 ? plural(c.pagosSinCfdi, 'pago sin CFDI', 'pagos sin CFDI') : null,
    (c.rechazos ?? 0) > 0 ? plural(c.rechazos ?? 0, 'rechazo', 'rechazos') : null,
    (c.sobreLimite ?? 0) > 0
      ? plural(c.sobreLimite ?? 0, 'sobre su límite', 'sobre su límite')
      : null,
  ].filter((b) => b !== null);
  return `Xangarro · Resumen del ${day} — ${bits.length > 0 ? bits.join(' · ') : 'sin novedades'}`;
}

function countsOf(
  items: readonly SupportItem[],
  fresh: readonly SupportItem[],
  urgentOpen: readonly SupportItem[],
  rejections: RejectionSummary,
  overLimit: OverLimitSummary,
): DailyDigest['counts'] {
  return {
    nuevos: fresh.length,
    urgentesAbiertos: urgentOpen.length,
    pagosSinCfdi: items.filter((i) => i.kind === 'factura' && open(i)).length,
    rechazos: rejections.status === 'ok' ? rejections.total : null,
    sobreLimite: overLimit.status === 'ok' ? overLimit.rows.length : null,
  };
}

export function buildDailyDigest(
  items: readonly SupportItem[],
  now: Date,
  options: {
    readonly consoleUrl?: string;
    readonly rejections?: RejectionSummary;
    readonly overLimit?: OverLimitSummary;
  } = {},
): DailyDigest {
  const window = digestWindow(now);
  const inWindow = (i: SupportItem) => {
    const t = Date.parse(i.createdAt);
    return t >= window.start.getTime() && t < window.end.getTime();
  };
  const fresh = items.filter(inWindow);
  const urgentOpen = items.filter((i) => i.urgent && open(i)).sort(newestFirst);
  const arcoOpen = items.filter((i) => i.kind === 'arco' && open(i)).sort(soonestDue);
  const rejections = options.rejections ?? REJECTIONS_UNAVAILABLE;
  const overLimit = options.overLimit ?? OVER_LIMIT_UNAVAILABLE;
  const counts = countsOf(items, fresh, urgentOpen, rejections, overLimit);
  const dayLabel = mxDayLabel(window.start);
  const base = {
    subject: subjectFor(dayLabel, counts),
    dayLabel,
    window,
    counts,
    rejections,
    overLimit,
    newByKind: groupByKind(fresh),
    urgentOpen,
    arcoOpen,
    consoleUrl: options.consoleUrl ?? DEFAULT_CONSOLE_URL,
  };
  return {
    ...base,
    text: renderText(base),
    html: renderHtml(base),
    emailSections: emailSections(base),
  };
}
