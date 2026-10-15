import type { RegistrarMovimientoInput } from '@xangarro/application/corp';
import { pesosToCentavos } from '@xangarro/domain';
import {
  CATEGORIAS_GASTO,
  gastoDesdeCaptura,
  type CategoriaGasto,
  type Movement,
} from '@xangarro/domain/corp';

/**
 * The Registrar form's fields → the use case's input (E-02, board CD-03).
 * Everything a person typed is parsed here; the domain then refuses what does
 * not add up (an IVA bigger than the charge, a USD charge without a rate).
 */
export type Campo = (name: string) => string;

/** What the capture does with a recurring expense (E-02, board CD-03). */
export type Recurrencia =
  | { readonly tipo: 'nueva'; readonly id: string }
  | { readonly tipo: 'existente'; readonly id: string; readonly mes: string }
  | null;

export type Captura =
  | {
      readonly ok: true;
      readonly input: RegistrarMovimientoInput;
      readonly recurrencia: Recurrencia;
    }
  | { readonly ok: false; readonly message: string };

const MES = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * «Hacer recurrente cada mes» makes a template named after the form's nonce;
 * a suggestion being registered names its template and month instead.
 */
function recurrenciaDe(campo: Campo, kind: Movement['kind']): Recurrencia {
  if (kind !== 'gasto') return null;
  const plantilla = campo('plantilla');
  if (plantilla !== '' && MES.test(campo('mesPlantilla'))) {
    return { tipo: 'existente', id: plantilla, mes: campo('mesPlantilla') };
  }
  const nonce = campo('nonce');
  if (campo('recurrente') !== 'si' || !nonce.startsWith('manual-')) return null;
  return { tipo: 'nueva', id: `rec-${nonce.slice('manual-'.length)}` };
}

const fail = (message: string): Captura => ({ ok: false, message });

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

function categoriaDe(value: string): CategoriaGasto | null {
  return CATEGORIAS_GASTO.find((c) => c === value) ?? null;
}

function centavos(value: string, vacio: bigint | null): bigint | null {
  return value === '' ? vacio : pesosToCentavos(value);
}

interface Montos {
  readonly movement: Movement;
  readonly usd: RegistrarMovimientoInput['usd'];
}

/** Partner money a founder records by hand; halves of a call are paid from Socios. */
export const CLASES_SOCIO = [
  'aportacion_capital',
  'aportacion_adicional',
  'prestamo_socio',
  'reembolso_socio',
] as const;

function deSocio(campo: Campo, monto: bigint): Montos | string {
  const socio = campo('socio') === '1' ? 1 : campo('socio') === '2' ? 2 : null;
  if (socio === null) return 'Elige de qué socio es el dinero.';
  const kind = CLASES_SOCIO.find((k) => k === campo('clase'));
  if (kind === undefined) return 'Elige qué tipo de dinero es.';
  return { movement: { kind, socio, monto }, usd: null };
}

function montosDe(campo: Campo): Montos | string {
  const total = centavos(campo('monto'), null);
  if (total === null) return 'Escribe el monto con números, por ejemplo 368.40.';
  if (campo('tipo') === 'comision') {
    return { movement: { kind: 'comision_bancaria', monto: total }, usd: null };
  }
  if (campo('tipo') === 'socios') return deSocio(campo, total);
  const categoria = categoriaDe(campo('categoria'));
  if (categoria === null) return 'Elige la categoría del gasto.';
  const iva = centavos(campo('iva'), 0n);
  if (iva === null) return 'Escribe el IVA con números, o déjalo vacío.';
  const usd = campo('moneda') === 'USD';
  return gastoDesdeCaptura({
    categoria,
    moneda: usd ? 'USD' : 'MXN',
    total,
    iva,
    tipoCambio: usd ? campo('tipoCambio') : null,
    deducible: campo('deducible') !== 'no',
  });
}

/** Domain errors stay thrown: the action maps them with the use case's own. */
export function leerCaptura(campo: Campo, founderId: string): Captura {
  const fecha = campo('fecha');
  if (!FECHA.test(fecha)) return fail('Elige la fecha de pago.');
  const montos = montosDe(campo);
  if (typeof montos === 'string') return fail(montos);
  const { kind } = montos.movement;
  return {
    ok: true,
    recurrencia: recurrenciaDe(campo, kind),
    input: {
      fecha,
      projectId: kind === 'gasto' ? campo('proyecto') || null : null,
      concepto: campo('concepto'),
      contraparte: campo('contraparte') || null,
      founderId,
      source: 'manual',
      sourceRef: campo('nonce') || null,
      usd: montos.usd,
      deducible: deducibleDe(kind, campo),
      movement: montos.movement,
    },
  };
}

/** A bank fee is deductible; partner money is not an expense, so the question does not apply. */
function deducibleDe(kind: Movement['kind'], campo: Campo): boolean | null {
  if (kind === 'gasto') return campo('deducible') !== 'no';
  return kind === 'comision_bancaria' ? true : null;
}
