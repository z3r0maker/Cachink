/**
 * Save the Negocio screen (P-08) — datos generales, datos fiscales, tipos de
 * pago and atributos de producto — as **one** validated patch, so the phones
 * get one coherent `businesses` change and a bad field saves nothing.
 *
 * Every rule is the domain's: the régimen by SAT code with its derived bucket
 * (ADR-082), the RFC check digit, at least one payment method, attribute keys
 * derived from their names.
 */

import type { BusinessPatch, BusinessesRepository } from '@xangarro/data';
import {
  NegocioInvalidoError,
  regimenPatch,
  validateAtributos,
  validateDatosFiscales,
  validateMetodosPago,
  type AtributoDraft,
  type BusinessId,
  type NegocioCampo,
} from '@xangarro/domain';

import type { UseCase } from '../_use-case.js';

export interface GuardarNegocioInput {
  readonly id: BusinessId;
  readonly nombre: string;
  /** SAT code; null leaves an unset régimen unset. */
  readonly regimenSat: string | null;
  /** Basis points, integer. */
  readonly isrTasa: number;
  readonly rfc: string;
  readonly razonSocial: string;
  readonly codigoPostal: string;
  readonly usoCfdi: string;
  readonly metodosPago: readonly string[];
  readonly atributos: readonly AtributoDraft[];
}

type Campos = Partial<Record<NegocioCampo, string>>;

function generales(input: GuardarNegocioInput, campos: Campos): BusinessPatch {
  const nombre = input.nombre.trim();
  if (nombre.length === 0) campos.nombre = 'El negocio necesita un nombre.';
  else if (nombre.length > 120) campos.nombre = 'Usa un nombre de 120 caracteres o menos.';
  if (!Number.isInteger(input.isrTasa) || input.isrTasa < 0 || input.isrTasa > 10_000) {
    campos.isrTasa = 'La tasa de ISR va de 0% a 100%, en centésimas.';
  }
  let regimen: BusinessPatch = {};
  if (input.regimenSat !== null) {
    try {
      const { isrSugerido: _isr, ...r } = regimenPatch(input.regimenSat);
      regimen = r;
    } catch (error) {
      campos.regimen = (error as Error).message;
    }
  }
  return { nombre, ...regimen, isrTasa: input.isrTasa };
}

export class GuardarNegocioUseCase implements UseCase<
  GuardarNegocioInput,
  { warnings: readonly string[] }
> {
  constructor(private readonly businesses: Pick<BusinessesRepository, 'update'>) {}

  async execute(input: GuardarNegocioInput): Promise<{ warnings: readonly string[] }> {
    const campos: Campos = {};
    const base = generales(input, campos);
    const fiscal = validateDatosFiscales(input);
    if (!fiscal.ok) Object.assign(campos, fiscal.errors);
    const metodos = validateMetodosPago(input.metodosPago);
    if (!metodos.ok) campos.metodosPago = metodos.error;
    const atributos = validateAtributos(input.atributos);

    if (!fiscal.ok || !metodos.ok || !atributos.ok || Object.keys(campos).length > 0) {
      throw new NegocioInvalidoError({ campos, atributos: atributos.ok ? {} : atributos.errors });
    }
    await this.businesses.update(input.id, {
      ...base,
      ...fiscal.value,
      enabledPaymentMethods: metodos.value,
      atributosProducto: atributos.value,
    });
    return { warnings: fiscal.warnings };
  }
}
