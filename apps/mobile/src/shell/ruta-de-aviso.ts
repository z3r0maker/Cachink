/**
 * Where a tapped notification lands (Track M, M-12). Alerts and scheduled
 * notifications carry an `actionRoute`; builds before the redesign wrote
 * routes that no longer exist (`/caja-reportes`, `/merma-reportes`,
 * `/productos`, …), and those payloads can outlive an update in the OS
 * tray or the alerts table. Each maps to the screen that does that job now;
 * a missing route opens Avisos. Pure.
 */

const RUTAS_ANTERIORES: Readonly<Record<string, string>> = {
  '/caja': '/turno',
  '/caja-reportes': '/turno',
  '/cancelaciones': '/ventas',
  '/merma-reportes': '/inventario',
  '/no-enviados': '/pendientes',
  '/notificaciones': '/avisos',
  '/productos': '/inventario',
};

export const RUTA_POR_DEFECTO = '/avisos';

export function rutaDeAviso(actionRoute: string | undefined): string {
  if (!actionRoute) return RUTA_POR_DEFECTO;
  const ruta = actionRoute.split(/[?#]/)[0] ?? '';
  const seccion = `/${ruta.replace(/^\/+/, '').split('/')[0] ?? ''}`;
  return RUTAS_ANTERIORES[ruta] ?? RUTAS_ANTERIORES[seccion] ?? actionRoute;
}

/** Every route this module can return besides the payload's own, for the route check. */
export const RUTAS_DE_AVISO: readonly string[] = [
  RUTA_POR_DEFECTO,
  ...Object.values(RUTAS_ANTERIORES),
];
