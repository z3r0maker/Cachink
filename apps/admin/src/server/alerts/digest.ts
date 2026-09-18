/**
 * `buildDailyDigest` — the 08:00 (Mexico City) staff digest (N-10), as data
 * plus a plain-text and an HTML rendering. Pure: the cron route reads the
 * items and hands the result to the email port.
 *
 * Sections: yesterday's new items by kind; every open urgent item, whenever
 * filed; the «pagos sin CFDI» count (ADR-070); B-18's unresolved sync
 * rejections of the last 24 h by code (`./rejections.ts`); and a placeholder
 * for tenants over their limit until N-07/N-02 exist.
 */
import { SUPPORT_KINDS, type SupportItem, type SupportKind } from '@xangarro/domain';
import type { DigestSection } from '@xangarro/email';

import { KIND_LABELS } from '../inbox/labels';
import { emailSections, renderHtml, renderText } from './digest-render';
import { digestWindow, mxDayLabel } from './mx-day';
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
  };
  readonly rejections: RejectionSummary;
  readonly newByKind: readonly KindGroup[];
  readonly urgentOpen: readonly SupportItem[];
  readonly consoleUrl: string;
}

const open = (i: SupportItem) => i.status !== 'resuelto';
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
  ].filter((b) => b !== null);
  return `Xangarro · Resumen del ${day} — ${bits.length > 0 ? bits.join(' · ') : 'sin novedades'}`;
}

export function buildDailyDigest(
  items: readonly SupportItem[],
  now: Date,
  options: { readonly consoleUrl?: string; readonly rejections?: RejectionSummary } = {},
): DailyDigest {
  const window = digestWindow(now);
  const inWindow = (i: SupportItem) => {
    const t = Date.parse(i.createdAt);
    return t >= window.start.getTime() && t < window.end.getTime();
  };
  const fresh = items.filter(inWindow);
  const urgentOpen = items.filter((i) => i.urgent && open(i)).sort(newestFirst);
  const rejections = options.rejections ?? REJECTIONS_UNAVAILABLE;
  const counts = {
    nuevos: fresh.length,
    urgentesAbiertos: urgentOpen.length,
    pagosSinCfdi: items.filter((i) => i.kind === 'factura' && open(i)).length,
    rechazos: rejections.status === 'ok' ? rejections.total : null,
  };
  const dayLabel = mxDayLabel(window.start);
  const base = {
    subject: subjectFor(dayLabel, counts),
    dayLabel,
    window,
    counts,
    rejections,
    newByKind: groupByKind(fresh),
    urgentOpen,
    consoleUrl: options.consoleUrl ?? DEFAULT_CONSOLE_URL,
  };
  return {
    ...base,
    text: renderText(base),
    html: renderHtml(base),
    emailSections: emailSections(base),
  };
}
