/**
 * `notices` — **one table, two surfaces** (ADR-060).
 *
 * Avisos and the Asesor's "Para ti" feed have the same shape and the same
 * lifecycle, so they share a row type discriminated by `source`. The Avisos
 * page renders `sistema` and `operacion`; the Asesor tab filters `asesor`.
 * The header bell counts unread **excluding** `asesor`.
 *
 * Portal-only: it never crosses the wire, so `scope.ts` is untouched.
 */
export type NoticeSource = 'sistema' | 'operacion' | 'asesor';
export type NoticeSeverity = 'critical' | 'warning' | 'info' | 'success';
export type NoticeState = 'nuevo' | 'leido' | 'listo' | 'descartado';

export interface Notice {
  readonly id: string;
  readonly source: NoticeSource;
  readonly severity: NoticeSeverity;
  readonly title: string;
  readonly body: string;
  readonly cta: string;
  readonly href: string;
  readonly when: string;
  readonly state: NoticeState;
  /** Per-insight payload — price tables, product refs (the `data` JSONB). */
  readonly data?: Readonly<Record<string, string>>;
}

export const NOTICES: readonly Notice[] = [
  {
    id: 'n1',
    source: 'operacion',
    severity: 'critical',
    title: 'Discrepancia en el corte de caja',
    body: 'El Android de la barra cerró con $60.00 menos de lo esperado.',
    cta: 'Ver corte',
    href: '/sincronizacion',
    when: 'hace 2 h',
    state: 'nuevo',
  },
  {
    id: 'n2',
    source: 'operacion',
    severity: 'warning',
    title: '3 productos por debajo de su umbral',
    body: 'Refresco, Tortilla (kg) y Agua de horchata necesitan reposición.',
    cta: 'Ver productos',
    href: '/productos',
    when: 'hace 5 h',
    state: 'nuevo',
  },
  {
    id: 'n3',
    source: 'operacion',
    severity: 'warning',
    title: '3 registros esperan conexión',
    body: 'Están guardados en el Android de la barra. Nada se pierde.',
    cta: 'Ver sincronización',
    href: '/sincronizacion',
    when: 'hace 6 h',
    state: 'nuevo',
  },
  {
    id: 'n4',
    source: 'sistema',
    severity: 'info',
    title: 'Se activó el lector de código de barras',
    body: 'Ahora tus operadores pueden escanear productos con la cámara.',
    cta: 'Ver funciones',
    href: '/negocio',
    when: 'ayer',
    state: 'nuevo',
  },
  {
    id: 'n5',
    source: 'sistema',
    severity: 'info',
    title: 'Marisol Vega quedó inactiva',
    body: 'Ya no puede iniciar sesión en el teléfono.',
    cta: 'Ver operadores',
    href: '/equipo',
    when: 'hace 3 días',
    state: 'leido',
  },
  {
    id: 'n6',
    source: 'asesor',
    severity: 'warning',
    title: 'El queso te cuesta 18% más que en junio',
    body: 'Sigues vendiendo la quesadilla a $40.00. Tu margen bajó de 35% a 22%.',
    cta: 'Ver precio sugerido',
    href: '/productos',
    when: 'hoy',
    state: 'nuevo',
    data: { producto: 'Quesadilla', sugerido: '$46.00' },
  },
];

/**
 * The bell counts unread **excluding** the Asesor: the design shows the badge
 * and the Asesor nav item carrying separate unread notions (ADR-060).
 */
export function bellUnreadCount(notices: readonly Notice[]): number {
  return notices.filter((n) => n.source !== 'asesor' && n.state === 'nuevo').length;
}

/** Which channels a notice type can be delivered through (Fase 7 «Configurar»). */
export interface ChannelRow {
  readonly label: string;
  readonly enPortal: boolean;
  readonly porCorreo: boolean;
  /** WhatsApp is designed but not delivered — it sits in «Próximamente». */
  readonly porWhatsapp: 'proximamente';
  /** A critical aviso cannot be switched off. */
  readonly critical: boolean;
}

export const CHANNELS: readonly ChannelRow[] = [
  {
    label: 'Discrepancia en caja',
    enPortal: true,
    porCorreo: true,
    porWhatsapp: 'proximamente',
    critical: true,
  },
  {
    label: 'Registros no enviados',
    enPortal: true,
    porCorreo: true,
    porWhatsapp: 'proximamente',
    critical: true,
  },
  {
    label: 'Stock bajo',
    enPortal: true,
    porCorreo: false,
    porWhatsapp: 'proximamente',
    critical: false,
  },
  {
    label: 'Gasto recurrente confirmado',
    enPortal: true,
    porCorreo: false,
    porWhatsapp: 'proximamente',
    critical: false,
  },
  {
    label: 'Cambio de operadores',
    enPortal: true,
    porCorreo: false,
    porWhatsapp: 'proximamente',
    critical: false,
  },
  {
    label: 'Función activada o desactivada',
    enPortal: true,
    porCorreo: false,
    porWhatsapp: 'proximamente',
    critical: false,
  },
];
