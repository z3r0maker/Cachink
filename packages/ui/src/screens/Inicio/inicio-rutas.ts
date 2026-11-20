/**
 * Where Inicio's links go on the phone. The caja package writes the web's
 * hrefs (`/operador/gastos?recurrente=…`); the phone opens the screen that
 * does that job, or nothing when it has none yet (Avisos); the caja's own
 * destinations take their path from `NAV`, the one map the frame uses. Pure.
 */
import { OPERADOR_BASE } from '@xangarro/caja';
import { NAV } from '../AppShell/tab-definitions';

const RUTAS: Readonly<Record<string, string>> = {
  caja: NAV.cobrar.path,
  ventas: NAV.ventas.path,
  gastos: NAV.gastos.path,
  inventario: NAV.inventario.path,
  turno: NAV.turno.path,
  cierre: NAV.turno.path,
  pendientes: '/no-enviados',
  cobranza: '/fiado',
  fiado: '/fiado',
};

/**
 * The phone route for a web href. Its query rides along (R8): the item a task
 * points at («?recurrente=», «?reponer=») is what opens the sheet on arrival.
 */
export function rutaMovil(href: string): string | null {
  const sin = href.startsWith(OPERADOR_BASE) ? href.slice(OPERADOR_BASE.length) : href;
  const [seccion = '', sub = ''] = sin.replace(/^\/+/, '').split(/[?#]/)[0]?.split('/') ?? [];
  // «Cobrar a …» names the client: their page, with «Recibir abono» up (RvFiado).
  if (seccion === 'cobranza' && sub !== '') return `/cobranza/${sub}?abono=1`;
  const ruta = RUTAS[seccion];
  if (ruta === undefined) return null;
  const query = /\?[^#]*/.exec(sin)?.[0] ?? '';
  return query.length > 1 ? `${ruta}${query}` : ruta;
}

/** The tiles under the KPIs (MvInicio «Atajos»); Fiado y abonos joined with M-08. */
export const ATAJOS = [
  { key: 'gastos', path: NAV.gastos.path },
  { key: 'fiado', path: '/fiado' },
  { key: 'inventario', path: NAV.inventario.path },
] as const;
