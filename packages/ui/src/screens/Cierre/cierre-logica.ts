/**
 * The count, the explanation and the close as values (the web's
 * `use-cierre.ts` derivations): the counted cash in centavos, the difference
 * against the expected, what still blocks the button, the words each outcome
 * gets, and the close as `CerrarCajaUseCase` takes it: the screen's motive
 * mapped onto the domain's enum (ADR-083 D6), the note only for «Otra razón»,
 * the pieces per denomination (ADR-074 §4). Records still to send never
 * block it (ADR-123, DS-06 (a)). Pure.
 */
import { motivoDominio } from '@xangarro/caja';
import { textoCorte, type MotivoDiferencia } from '@xangarro/caja/cierre';
import { esperadoDe, type PartesEsperado } from '@xangarro/caja/turno';
import {
  diferenciaCorte,
  totalContado,
  type ClaveDenominacion,
  type ConteoDenominaciones,
  type DiferenciaCorte,
  type DiscrepancyReason,
  type Money,
} from '@xangarro/domain';

export interface Derivados {
  readonly contado: Money;
  readonly esperado: Money;
  readonly dif: DiferenciaCorte;
  readonly faltaMotivo: boolean;
  readonly faltaNota: boolean;
  readonly puede: boolean;
}

export function derivar(
  conteo: ConteoDenominaciones,
  partes: PartesEsperado,
  motivo: MotivoDiferencia | null,
  nota: string,
): Derivados {
  const contado = totalContado(conteo);
  const esperado = esperadoDe(partes);
  const dif = diferenciaCorte(contado, esperado);
  const faltaMotivo = dif.tipo !== 'cuadra' && motivo === null;
  const faltaNota = dif.tipo !== 'cuadra' && motivo === 'Otra razón' && nota.trim() === '';
  return { contado, esperado, dif, faltaMotivo, faltaNota, puede: !faltaMotivo && !faltaNota };
}

/** A stepper or the field writes whole pieces of one denomination, never below zero. */
export function poner(
  c: ConteoDenominaciones,
  clave: ClaveDenominacion,
  n: number,
): ConteoDenominaciones {
  return { ...c, [clave]: Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0 };
}

/** «12» from the field, digits only; empty is zero. */
export const piezasDe = (texto: string): number =>
  Number.parseInt(texto.replace(/\D/g, '') || '0', 10);

export interface EntradaCierre {
  readonly montoCierreCentavos: Money;
  readonly discrepancyReason: DiscrepancyReason | null;
  readonly explicacion: string | null;
  readonly denominaciones: Readonly<Record<string, number>>;
}

/** The close as the use case takes it. */
export function entradaCierre(
  d: Derivados,
  conteo: ConteoDenominaciones,
  motivo: MotivoDiferencia | null,
  nota: string,
): EntradaCierre {
  const m = d.dif.tipo === 'cuadra' ? null : motivo;
  const texto = m === 'Otra razón' ? nota.trim() : '';
  const piezas: Record<string, number> = {};
  for (const [k, n] of Object.entries(conteo)) if (n !== undefined && n > 0) piezas[k] = n;
  return {
    montoCierreCentavos: d.contado,
    discrepancyReason:
      m === null ? null : motivoDominio(m, d.dif.tipo === 'falta' ? 'falta' : 'sobra'),
    explicacion: texto === '' ? null : texto,
    denominaciones: piezas,
  };
}

/** The corte as the text the share sheet sends the owner (`textoCorte`). */
export function textoDelCorte(h: {
  readonly data: { readonly caja: string; readonly operador: string };
  readonly fecha: string;
  readonly contado: Money;
  readonly esperado: Money;
  readonly dif: DiferenciaCorte;
}): string {
  return textoCorte({
    caja: h.data.caja,
    operador: h.data.operador,
    fecha: h.fecha,
    contado: h.contado,
    esperado: h.esperado,
    dif: h.dif,
  });
}
