import type { SupportItem } from '@xangarro/domain';

import { METRIC_LABELS } from '@/server/capacity/labels';
import type { CapacityMetric } from '@/server/capacity/status';
import type { TenantRow } from '@/server/tenants/list';

/**
 * «Turno de hoy» — what the console's home page says, computed from what the
 * other pages already read. Pure: the page loads, this decides.
 *
 * Every item points at the screen where it gets fixed; Don Cuentas's line and
 * mood only summarise the list and never say anything the list does not.
 */

export type Severity = 'alta' | 'media' | 'baja' | 'sistema';
export type Mood = 'tranquilo' | 'guardia' | 'alarma';

export interface AttentionItem {
  readonly severity: Severity;
  readonly title: string;
  readonly detail: string;
  readonly action: string;
  readonly href: string;
}

export interface Briefing {
  readonly mood: Mood;
  readonly line: string;
  readonly items: readonly AttentionItem[];
}

export interface BriefingInput {
  readonly tenants: readonly TenantRow[];
  /** Open inbox items (nuevo and en curso). */
  readonly openItems: readonly SupportItem[];
  /** Null when the database could not be measured. */
  readonly capacity: readonly CapacityMetric[] | null;
  readonly now: Date;
}

const DAY = 86_400_000;
export const STALE_SYNC_DAYS = 7;
export const NEW_TENANT_DAYS = 7;
const MAX_ITEMS = 6;
const ORDER: Readonly<Record<Severity, number>> = { alta: 0, media: 1, baja: 2, sistema: 3 };

const days = (from: string, now: Date) => Math.floor((now.getTime() - Date.parse(from)) / DAY);
const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Mexico_City',
  });
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

type Rule = (row: TenantRow, now: Date) => Omit<AttentionItem, 'action' | 'href'> | null;

const pastDue: Rule = ({ summary: s, billing }) =>
  billing.status === 'past_due' || billing.status === 'grace'
    ? {
        severity: 'alta',
        title: `${s.nombre} · pago atrasado`,
        detail: 'Stripe no pudo cobrar la suscripción; corre el periodo de gracia.',
      }
    : null;

const staleSync: Rule = ({ summary: s }, now) => {
  if (s.devicesActive === 0) return null;
  if (s.lastSyncAt !== null && days(s.lastSyncAt, now) <= STALE_SYNC_DAYS) return null;
  const devices = plural(s.devicesActive, 'dispositivo activo', 'dispositivos activos');
  return s.lastSyncAt === null
    ? { severity: 'alta', title: `${s.nombre} · nunca ha sincronizado`, detail: `${devices}.` }
    : {
        severity: 'alta',
        title: `${s.nombre} · sin sincronizar ${days(s.lastSyncAt, now)} días`,
        detail: `${devices} · último envío el ${fecha(s.lastSyncAt)}.`,
      };
};

const newWithoutDevices: Rule = ({ summary: s }, now) => {
  if (s.devicesTotal > 0 || days(s.createdAt, now) > NEW_TENANT_DAYS) return null;
  const d = days(s.createdAt, now);
  const when = d === 0 ? 'se dio de alta hoy' : `se dio de alta hace ${plural(d, 'día', 'días')}`;
  return {
    severity: 'media',
    title: `${s.nombre} · ${when}`,
    detail: 'Todavía sin dispositivos vinculados. ¿Se atoró en el código de vinculación?',
  };
};

const noOwner: Rule = ({ summary: s }) =>
  s.ownerEmail === null
    ? {
        severity: 'baja',
        title: `${s.nombre} · sin dueño en el portal`,
        detail: 'Nadie tiene acceso de dueño a este negocio.',
      }
    : null;

const RULES: readonly Rule[] = [pastDue, staleSync, newWithoutDevices, noOwner];

function tenantItems(row: TenantRow, now: Date): AttentionItem[] {
  const href = `/tenants/${row.summary.id}`;
  return RULES.flatMap((rule) => {
    const hit = rule(row, now);
    return hit === null ? [] : [{ ...hit, action: 'Abrir ficha', href }];
  });
}

function inboxItems(open: readonly SupportItem[]): AttentionItem[] {
  return open
    .filter((i) => i.urgent)
    .map((i) => ({
      severity: 'alta' as const,
      title: i.title,
      detail: 'Urgente en el Inbox.',
      action: 'Abrir',
      href: `/inbox/${i.id}`,
    }));
}

function capacityItems(metrics: readonly CapacityMetric[] | null): AttentionItem[] {
  if (metrics === null) {
    return [
      {
        severity: 'sistema',
        title: 'Capacidad · no se pudo medir',
        detail: 'La base de datos no respondió a la medición.',
        action: 'Ver capacidad',
        href: '/capacidad',
      },
    ];
  }
  return metrics
    .filter((m) => m.status === 'red' || m.status === 'amber')
    .map((m) => ({
      severity: m.status === 'red' ? ('alta' as const) : ('media' as const),
      title: `${METRIC_LABELS[m.key]} · ${m.status === 'red' ? 'cruzó' : 'se acerca a'} su umbral ${m.stage}`,
      detail: 'Revisa la página de capacidad.',
      action: 'Ver capacidad',
      href: '/capacidad',
    }));
}

function moodOf(items: readonly AttentionItem[], input: BriefingInput): Mood {
  const capacityRed = input.capacity?.some((m) => m.status === 'red') ?? false;
  if (capacityRed || input.openItems.some((i) => i.urgent)) return 'alarma';
  return items.some((i) => i.severity !== 'sistema') ? 'guardia' : 'tranquilo';
}

function lineOf(mood: Mood, items: readonly AttentionItem[]): string {
  const first = items[0];
  if (mood === 'tranquilo' || first === undefined) {
    return 'Cero pendientes. Me voy por un cafecito; si algo truena, aquí lo verás primero.';
  }
  if (mood === 'alarma') return `¡Ay, ay, ay! ${first.title}. Atiende eso primero.`;
  const rest = items.length - 1;
  return `${first.title}.${rest > 0 ? ` Y ${plural(rest, 'cosa más', 'cosas más')} en la lista.` : ''}`;
}

export function briefing(input: BriefingInput): Briefing {
  const all = [
    ...inboxItems(input.openItems),
    ...capacityItems(input.capacity),
    ...input.tenants.flatMap((t) => tenantItems(t, input.now)),
  ];
  const items = [...all].sort((a, b) => ORDER[a.severity] - ORDER[b.severity]).slice(0, MAX_ITEMS);
  const mood = moodOf(items, input);
  return { mood, line: lineOf(mood, items), items };
}

export type Health = 'ok' | 'warn' | 'bad' | 'off';

const HEALTH: Readonly<Record<Severity, Health>> = {
  alta: 'bad',
  media: 'warn',
  baja: 'off',
  sistema: 'off',
};

/** One status light per tenant: its worst attention item, or «ok». */
export function tenantHealth(row: TenantRow, now: Date): Health {
  const worst = tenantItems(row, now).sort((a, b) => ORDER[a.severity] - ORDER[b.severity])[0];
  return worst === undefined ? 'ok' : HEALTH[worst.severity];
}

/** True when the tenant's devices have gone quiet (what «Sin sincronizar» filters on). */
export function syncIsStale(row: TenantRow, now: Date): boolean {
  return staleSync(row, now) !== null;
}

/** What Don Cuentas says on a tenant's side panel: its own attention items, in words. */
export function tenantNote(
  row: TenantRow,
  now: Date,
): { readonly mood: Mood; readonly text: string } {
  const items = tenantItems(row, now);
  if (items.length === 0) {
    return {
      mood: 'tranquilo',
      text: 'Todo en orden con este negocio: tiene dueño, sus cajas sincronizan y no debe nada.',
    };
  }
  const [first, ...rest] = items.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
  const more =
    rest.length > 0 ? ` Además: ${rest.map((i) => i.title.split(' · ')[1]).join('; ')}.` : '';
  return {
    mood: 'guardia',
    text: `Ojo aquí: ${first!.title.split(' · ')[1]}. ${first!.detail}${more}`,
  };
}
