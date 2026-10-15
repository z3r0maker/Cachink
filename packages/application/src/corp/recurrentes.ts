import {
  assertPlantilla,
  periodOf,
  PlantillaInvalidaError,
  refRecurrente,
  type PlantillaRecurrente,
} from '@xangarro/domain/corp';

import { PlantillaDesconocidaError, RecurrenteYaRegistradoError } from './errors.js';
import type {
  CorpLedgerRepository,
  LedgerEntry,
  NuevaPlantilla,
  RecurringTemplateRepository,
} from './ports.js';
import {
  RegistrarMovimientoUseCase,
  type RegistrarMovimientoInput,
} from './registrar-movimiento.js';

/**
 * Recurring expenses (E-02, board CD-03): «Hacer recurrente cada mes» turns
 * the charge being captured into a template, and each later month's
 * suggestion is registered against it. Every charge carries the template and
 * the month it pays in its `sourceRef`, so a month is registered once and a
 * double submit lands on the same entry.
 */
export interface RegistrarRecurrenteInput {
  /** The capture, as for any movement; its nonce becomes part of the ref. */
  readonly movimiento: RegistrarMovimientoInput;
  readonly nonce: string;
  readonly plantilla:
    | { readonly tipo: 'nueva'; readonly id: string }
    | { readonly tipo: 'existente'; readonly id: string; readonly mes: string };
}

export interface RecurrenteRegistrado {
  readonly entry: LedgerEntry;
  readonly plantilla: PlantillaRecurrente;
}

interface Deps {
  readonly ledger: CorpLedgerRepository;
  readonly plantillas: RecurringTemplateRepository;
}

/** The template a captured expense makes: its total in its own currency, its day and month. */
export function plantillaDe(m: RegistrarMovimientoInput, id: string): NuevaPlantilla {
  const g = m.movement;
  if (g.kind !== 'gasto') throw new PlantillaInvalidaError('solo un gasto se repite cada mes');
  const plantilla: NuevaPlantilla = {
    id,
    nombre: m.concepto.trim(),
    contraparte: m.contraparte?.trim() || null,
    categoria: g.categoria,
    moneda: m.usd === null ? 'MXN' : 'USD',
    montoEstimado: m.usd?.montoOriginal ?? g.subtotal + g.iva,
    diaCargo: Number(m.fecha.slice(8, 10)),
    projectId: m.projectId,
    deducible: m.deducible ?? true,
    desde: periodOf(m.fecha) ?? '',
    createdBy: m.founderId,
  };
  assertPlantilla(plantilla);
  return plantilla;
}

async function resolver(deps: Deps, input: RegistrarRecurrenteInput) {
  const p = input.plantilla;
  if (p.tipo === 'nueva') {
    const nueva = plantillaDe(input.movimiento, p.id);
    return { plantilla: nueva, mes: nueva.desde, nueva };
  }
  if (input.movimiento.movement.kind !== 'gasto') {
    throw new PlantillaInvalidaError('solo un gasto se repite cada mes');
  }
  const found = await deps.plantillas.findById(p.id);
  if (found === null) throw new PlantillaDesconocidaError(p.id);
  return { plantilla: found, mes: p.mes, nueva: null };
}

export async function registrarRecurrente(
  deps: Deps,
  input: RegistrarRecurrenteInput,
): Promise<RecurrenteRegistrado> {
  const { plantilla, mes, nueva } = await resolver(deps, input);
  const sourceRef = refRecurrente(plantilla.id, mes, input.nonce);
  let entry = await deps.ledger.findBySource('recurring', sourceRef);
  if (entry === null) {
    if ((await deps.plantillas.registradasEn(mes)).has(plantilla.id)) {
      throw new RecurrenteYaRegistradoError(plantilla.nombre, mes);
    }
    entry = await new RegistrarMovimientoUseCase(deps.ledger).execute({
      ...input.movimiento,
      source: 'recurring',
      sourceRef,
    });
  }
  // After the charge: a refused charge leaves no template behind.
  return { entry, plantilla: nueva === null ? plantilla : await deps.plantillas.ensure(nueva) };
}

/** «Dejar de repetir»: no more suggestions; what it registered stays. */
export async function dejarDeRepetir(
  plantillas: RecurringTemplateRepository,
  id: string,
): Promise<void> {
  if ((await plantillas.findById(id)) === null) throw new PlantillaDesconocidaError(id);
  await plantillas.setActivo(id, false);
}
