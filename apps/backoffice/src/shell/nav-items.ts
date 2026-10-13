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
  | '/capacidad'
  | '/empresa/movimientos'
  | '/empresa/socios'
  | '/empresa/agenda'
  | '/empresa/expediente'
  | '/empresa/corporativo';

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

/**
 * «Empresa», MEXIA's command center (ADR-124): drawn only for founders
 * (`founderForLayout`). A screen joins this list when its task ships, never
 * before (CLAUDE.md §7: no «Pronto»).
 */
export const EMPRESA_NAV_ITEMS: readonly NavItem[] = [
  {
    label: 'Movimientos',
    href: '/empresa/movimientos',
    task: 'E-02',
    summary: 'El libro del mes: gastos, comisiones y reversas.',
  },
  {
    label: 'Socios',
    href: '/empresa/socios',
    task: 'E-03',
    summary: 'Capital, fondeo por mitades, aportaciones y préstamos de cada socio.',
  },
  {
    label: 'Agenda',
    href: '/empresa/agenda',
    task: 'E-04',
    summary: 'Lo que vence ante el SAT, Economía e IMPI, con sus acuses y comprobantes.',
  },
  {
    label: 'Expediente',
    href: '/empresa/expediente',
    task: 'E-05',
    summary: 'Los papeles de MEXIA por carpeta, con sus versiones; nada se borra.',
  },
  {
    label: 'Corporativo',
    href: '/empresa/corporativo',
    task: 'E-06',
    summary: 'Socios, proyectos y los registros de la sociedad.',
  },
] as const;
