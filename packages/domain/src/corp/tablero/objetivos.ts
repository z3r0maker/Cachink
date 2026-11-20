import type { Socio } from '../ledger/movements.js';
import { trimestreSiguiente } from '../presupuesto/reglas.js';
import { nombreTrimestre, rangoDelTrimestre, trimestreDe } from '../socios/dinero.js';
import { TableroError } from './errors.js';
import type { Objetivo } from './tipos.js';

/**
 * The quarter's objectives (OD-4 §1, §7): results such as «60 negocios
 * pagando» are measured, never valued. They are typed in with their goal and
 * unit, updated by hand with a date, and judged at the close against the last
 * progress recorded inside the quarter.
 */
export interface NuevoObjetivo {
  readonly trimestre: string;
  readonly hoy: string;
  readonly quien: Socio | null;
  readonly titulo: string;
  readonly meta: number;
  readonly unidad: string;
}

export function assertNuevoObjetivo(n: NuevoObjetivo): NuevoObjetivo {
  const actual = trimestreDe(n.hoy);
  if (n.trimestre !== actual && n.trimestre !== trimestreSiguiente(actual)) {
    throw new TableroError('TARJETA_TRIMESTRE');
  }
  const titulo = n.titulo.trim();
  const unidad = n.unidad.trim();
  if (titulo === '') throw new TableroError('OBJETIVO_TITULO');
  if (!Number.isInteger(n.meta) || n.meta <= 0 || unidad === '') {
    throw new TableroError('OBJETIVO_META');
  }
  return { ...n, titulo, unidad };
}

export function assertPuedeAvanzar(
  o: Objetivo,
  p: { readonly valor: number; readonly hoy: string },
): void {
  const [desde, hasta] = rangoDelTrimestre(o.trimestre);
  if (p.hoy >= hasta) throw new TableroError('OBJETIVO_CERRADO', nombreTrimestre(o.trimestre));
  if (p.hoy < desde) throw new TableroError('OBJETIVO_AUN_NO', nombreTrimestre(o.trimestre));
  if (!Number.isInteger(p.valor) || p.valor < 0) throw new TableroError('AVANCE_VALOR');
}

export interface ResultadoObjetivo {
  /** The last progress inside the quarter; zero before any. */
  readonly avance: number;
  /** Null until the quarter ends. */
  readonly cumplido: boolean | null;
}

export function resultadoDelObjetivo(o: Objetivo, hoy: string): ResultadoObjetivo {
  const hasta = rangoDelTrimestre(o.trimestre)[1];
  const dentro = o.avances.filter((a) => a.fecha < hasta);
  const avance = dentro.at(-1)?.valor ?? 0;
  return { avance, cumplido: hoy >= hasta ? avance >= o.meta : null };
}
