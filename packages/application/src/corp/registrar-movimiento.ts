import { assertPeriodOpen, postMovement, type Movement } from '@xangarro/domain/corp';

import type { UseCase } from '../_use-case.js';
import { ConceptoRequeridoError, ProyectoDesconocidoError } from './errors.js';
import type { CorpLedgerRepository, EntrySource, LedgerEntry, NewLedgerEntry } from './ports.js';

/**
 * Records one movement in MEXIA's ledger (E-02, ADR-124 §4): the manual
 * capture, an import (billing, a statement) or an approved agent proposal all
 * come through here, so they post identically.
 *
 * An import is idempotent: the same `source` + `sourceRef` returns the entry
 * already recorded instead of posting it twice.
 */
export interface RegistrarMovimientoInput {
  readonly fecha: string;
  readonly projectId: string | null;
  readonly concepto: string;
  readonly contraparte: string | null;
  readonly founderId: string;
  readonly source: EntrySource;
  readonly sourceRef: string | null;
  /** The original USD charge; the movement's amounts are already MXN. */
  readonly usd: { readonly montoOriginal: bigint; readonly tipoCambio: string } | null;
  readonly deducible: boolean | null;
  readonly movement: Movement;
}

export class RegistrarMovimientoUseCase implements UseCase<RegistrarMovimientoInput, LedgerEntry> {
  readonly #ledger: CorpLedgerRepository;

  constructor(ledger: CorpLedgerRepository) {
    this.#ledger = ledger;
  }

  async execute(input: RegistrarMovimientoInput): Promise<LedgerEntry> {
    const concepto = input.concepto.trim();
    if (concepto === '') throw new ConceptoRequeridoError();
    if (input.sourceRef !== null) {
      const existing = await this.#ledger.findBySource(input.source, input.sourceRef);
      if (existing !== null) return existing;
    }
    assertPeriodOpen(input.fecha, await this.#ledger.closedPeriods());
    if (input.projectId !== null && !(await this.#ledger.projectExists(input.projectId))) {
      throw new ProyectoDesconocidoError(input.projectId);
    }
    const lines = postMovement(input.movement);
    return this.#ledger.insert(toNewEntry(input, concepto), lines);
  }
}

function toNewEntry(input: RegistrarMovimientoInput, concepto: string): NewLedgerEntry {
  return {
    fecha: input.fecha,
    projectId: input.projectId,
    kind: input.movement.kind,
    concepto,
    contraparte: input.contraparte?.trim() || null,
    moneda: input.usd === null ? 'MXN' : 'USD',
    montoOriginal: input.usd?.montoOriginal ?? null,
    tipoCambio: input.usd?.tipoCambio ?? null,
    deducible: input.deducible,
    source: input.source,
    sourceRef: input.sourceRef,
    reversesEntryId: null,
    payload: input.movement,
    createdBy: input.founderId,
  };
}
