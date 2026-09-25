/**
 * The console's destinations. Each launch module (ADR-063 row 3) is a stub
 * until the task named in `task` fills it.
 */
export type NavHref =
  | '/'
  | '/tenants'
  | '/uso'
  | '/inbox'
  | '/flags'
  | '/mapa'
  | '/campanas'
  | '/capacidad';

export interface NavItem {
  readonly label: string;
  readonly href: NavHref;
  readonly task: string | null;
  readonly summary: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Inicio', href: '/', task: null, summary: 'Resumen de la consola.' },
  {
    label: 'Tenants',
    href: '/tenants',
    task: 'N-06',
    summary: 'Negocios, licencias y Stripe, con ajustes auditados y con vencimiento.',
  },
  {
    label: 'Uso',
    href: '/uso',
    task: 'N-07',
    summary: 'Uso contra límites por negocio y la tarjeta de capacidad de la base de datos.',
  },
  {
    label: 'Inbox',
    href: '/inbox',
    task: 'N-08',
    summary: 'Soporte y escalaciones: errores, facturas, migraciones, alertas de límite.',
  },
  {
    label: 'Flags',
    href: '/flags',
    task: 'N-09',
    summary: 'Disponibilidad de funciones por plataforma, lista beta y kill switches.',
  },
  {
    label: 'Mapa',
    href: '/mapa',
    task: 'N-56',
    summary: 'Accesos, visitas y conversión por estado, para orientar la inversión en anuncios.',
  },
  {
    label: 'Campañas',
    href: '/campanas',
    task: 'N-57',
    summary: 'Qué campaña trajo cada negocio, por primer contacto, y desde qué estado.',
  },
  {
    label: 'Capacidad',
    href: '/capacidad',
    task: null,
    summary: 'La base de datos contra los umbrales S2 y S3 de ADR-068.',
  },
] as const;
