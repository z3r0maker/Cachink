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

export type Captura =
  | { readonly ok: true; readonly input: RegistrarMovimientoInput }
  | { readonly ok: false; readonly message: string };

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

function montosDe(campo: Campo): Montos | string {
  const total = centavos(campo('monto'), null);
  if (total === null) return 'Escribe el monto con números, por ejemplo 368.40.';
  if (campo('tipo') === 'comision') {
    return { movement: { kind: 'comision_bancaria', monto: total }, usd: null };
  }
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
  const comision = montos.movement.kind === 'comision_bancaria';
  return {
    ok: true,
    input: {
      fecha,
      projectId: campo('proyecto') || null,
      concepto: campo('concepto'),
      contraparte: campo('contraparte') || null,
      founderId,
      source: 'manual',
      sourceRef: campo('nonce') || null,
      usd: montos.usd,
      deducible: comision ? true : campo('deducible') !== 'no',
      movement: montos.movement,
    },
  };
}
