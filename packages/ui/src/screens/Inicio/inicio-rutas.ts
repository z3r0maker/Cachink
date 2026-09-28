/**
 * Where Inicio's links go on the phone. The caja package writes the web's
 * hrefs (`/operador/gastos?recurrente=…`); the phone opens the screen that
 * does that job, or nothing when it has none yet (Avisos). «Cobrar a …»
 * (`/operador/cobranza/<id>`) opens that client with «Recibir abono» up, the
 * task's action. Pure.
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
  cobranza: '/cobranza',
};

export function rutaMovil(href: string): string | null {
  const sin = href.startsWith(OPERADOR_BASE) ? href.slice(OPERADOR_BASE.length) : href;
  const [seccion = '', id] = sin.replace(/^\/+/, '').split(/[?#]/)[0]?.split('/') ?? [];
  if (seccion === 'cobranza' && id) return `/cobranza/${id}?abonar=1`;
  return RUTAS[seccion] ?? null;
}

/** The three tiles under the KPIs (MvInicio «Atajos»). */
export const ATAJOS = [
  { key: 'gastos', path: '/egresos' },
  { key: 'cobranza', path: '/cobranza' },
  { key: 'inventario', path: '/productos' },
] as const;
