/**
 * Where Inicio's links go on the phone. The caja package writes the web's
 * hrefs (`/operador/gastos?recurrente=…`); the phone opens the screen that
 * does that job, or nothing when it has none yet (Avisos). Pure.
 */
import { OPERADOR_BASE } from '@xangarro/caja';

const RUTAS: Readonly<Record<string, string>> = {
  caja: '/cobrar',
  ventas: '/ventas',
  gastos: '/gastos',
  inventario: '/productos',
  turno: '/turno',
  cierre: '/turno',
  pendientes: '/no-enviados',
  cobranza: '/fiado',
  fiado: '/fiado',
};

export function rutaMovil(href: string): string | null {
  const sin = href.startsWith(OPERADOR_BASE) ? href.slice(OPERADOR_BASE.length) : href;
  const seccion = sin.replace(/^\/+/, '').split(/[/?#]/)[0] ?? '';
  return RUTAS[seccion] ?? null;
}

/** The tiles under the KPIs (MvInicio «Atajos»); Fiado y abonos joined with M-08. */
export const ATAJOS = [
  { key: 'gastos', path: '/gastos' },
  { key: 'fiado', path: '/fiado' },
  { key: 'inventario', path: '/productos' },
] as const;
