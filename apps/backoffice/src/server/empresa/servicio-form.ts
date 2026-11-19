import { pesosToCentavos } from '@xangarro/domain';
import {
  CATEGORIAS_GASTO,
  COBROS_SERVICIO,
  type CobroServicio,
  type Servicio,
} from '@xangarro/domain/corp';

/**
 * The «Nuevo servicio» and «Editar» drawer's fields (E-24, board CD-18d) →
 * a `Servicio`. Only the fields of its way of charging are read; the rest are
 * left empty. A month's reading keeps its date unless its amount changed.
 * Pure: the domain validates what this cannot (`assertServicio`).
 */
export interface ServicioCapturado {
  readonly servicio: Servicio;
  readonly recurrente: boolean;
  readonly plantillaNuevaId: string;
}

export type Captura =
  | { readonly ok: true; readonly v: ServicioCapturado }
  | { readonly ok: false; readonly message: string };

const texto = (f: FormData, k: string): string => {
  const v = f.get(k);
  return typeof v === 'string' ? v.trim() : '';
};

const opcional = (f: FormData, k: string): string | null => texto(f, k) || null;

class Campo extends Error {}

function pesos(f: FormData, k: string, que: string): bigint | null {
  const v = texto(f, k);
  if (v === '') return null;
  const c = pesosToCentavos(v);
  if (c === null) throw new Campo(`Escribe ${que} en pesos, como 1250.50.`);
  return c;
}

function entero(f: FormData, k: string, que: string): number | null {
  const v = texto(f, k).replace(/[,\s]/g, '');
  if (v === '') return null;
  if (!/^\d+$/.test(v)) throw new Campo(`Escribe ${que} como un número entero.`);
  return Number(v);
}

function uno<T extends string>(valores: readonly T[], v: string, que: string): T {
  const x = valores.find((c) => c === v);
  if (x === undefined) throw new Campo(`Elige ${que}.`);
  return x;
}

const VACIO = {
  monto: null,
  diaCargo: null,
  renueva: null,
  tarifa: null,
  aviso: null,
  limite: null,
  usoPlan: null,
  unidad: null,
  gastoMes: null,
  gastoAl: null,
} as const;

/** «Lo que va del mes»: a new amount is today's reading; the same one keeps its day. */
function lectura(f: FormData, hoy: string) {
  const gastoMes = pesos(f, 'gastoMes', 'lo que va del mes');
  if (gastoMes === null) return { gastoMes: null, gastoAl: null };
  const previo = texto(f, 'gastoMesPrevio');
  const mismo = previo !== '' && pesosToCentavos(previo) === gastoMes;
  return { gastoMes, gastoAl: mismo ? (opcional(f, 'gastoAlPrevio') ?? hoy) : hoy };
}

function propios(f: FormData, cobro: CobroServicio, hoy: string): Partial<Servicio> {
  switch (cobro) {
    case 'fijo':
      return { monto: pesos(f, 'monto', 'cuánto'), diaCargo: entero(f, 'dia', 'el día del cargo') };
    case 'anual':
      return { monto: pesos(f, 'monto', 'cuánto al año'), renueva: opcional(f, 'renueva') };
    case 'uso':
      return {
        aviso: pesos(f, 'aviso', 'el aviso'),
        diaCargo: entero(f, 'dia', 'el día del cargo'),
        ...lectura(f, hoy),
      };
    case 'gratis':
      return {
        limite: entero(f, 'limite', 'el límite'),
        usoPlan: entero(f, 'usoPlan', 'el uso'),
        unidad: opcional(f, 'unidad'),
      };
    case 'comision':
      return { tarifa: opcional(f, 'tarifa') };
  }
}

export function servicioDelForm(f: FormData, hoy: string): Captura {
  try {
    const cobro = uno(COBROS_SERVICIO, texto(f, 'cobro'), 'cómo cobra');
    const porContratar = texto(f, 'porContratar') === 'si';
    const servicio: Servicio = {
      ...VACIO,
      id: texto(f, 'id'),
      nombre: texto(f, 'nombre'),
      para: opcional(f, 'para'),
      categoria: uno(CATEGORIAS_GASTO, texto(f, 'categoria'), 'la categoría del gasto'),
      cobro,
      estado: porContratar ? 'por_contratar' : 'activo',
      moneda:
        texto(f, 'moneda') === 'USD' && (cobro === 'fijo' || cobro === 'anual') ? 'USD' : 'MXN',
      pagaCon: cobro === 'gratis' || cobro === 'comision' ? null : opcional(f, 'pagaCon'),
      plantillaId: null,
      ...propios(f, cobro, hoy),
    };
    if (servicio.id === '') return { ok: false, message: 'Recarga la página e intenta de nuevo.' };
    const recurrente = texto(f, 'recurrente') === 'si';
    return {
      ok: true,
      v: { servicio, recurrente, plantillaNuevaId: texto(f, 'plantillaNuevaId') },
    };
  } catch (e) {
    if (e instanceof Campo) return { ok: false, message: e.message };
    throw e;
  }
}
