/**
 * Where Inicio's links go on the phone. The caja package writes the web's
 * hrefs (`/operador/gastos?recurrente=…`); the phone opens the screen that
 * does that job, or nothing when it has none yet (Fiado y abonos, Avisos).
 * Pure.
 */
import { OPERADOR_BASE } from '@xangarro/caja';

const RUTAS: Readonly<Record<string, string>> = {
  caja: '/cobrar',
  ventas: '/ventas',
  gastos: '/egresos',
  inventario: '/productos',
  turno: '/turno',
  cierre: '/turno',
  pendientes: '/no-enviados',
};

export function rutaMovil(href: string): string | null {
  const sin = href.startsWith(OPERADOR_BASE) ? href.slice(OPERADOR_BASE.length) : href;
  const seccion = sin.replace(/^\/+/, '').split(/[/?#]/)[0] ?? '';
  return RUTAS[seccion] ?? null;
}

/** The two tiles under the KPIs (MvInicio «Atajos»); Fiado y abonos joins with M-08. */
export const ATAJOS = [
  { key: 'gastos', path: '/egresos' },
  { key: 'inventario', path: '/productos' },
] as const;
