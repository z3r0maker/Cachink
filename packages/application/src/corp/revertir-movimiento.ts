import { assertPeriodOpen, MotivoRequeridoError, reverseLines } from '@xangarro/domain/corp';

import type { UseCase } from '../_use-case.js';
import { MovimientoDesconocidoError, YaRevertidoError } from './errors.js';
import type { CorpLedgerRepository, LedgerEntry } from './ports.js';
import { assertPrestamosCubiertos } from './prestamos.js';

/**
 * Undoes a movement the only way the ledger allows (E-02, ADR-124 §4): a new
 * entry with the sides swapped, dated when the correction happens, pointing at
 * the one it reverses. The original stays, so the history is complete.
 */
export interface RevertirMovimientoInput {
  readonly entryId: string;
  readonly fecha: string;
  readonly motivo: string;
  readonly founderId: string;
}

export class RevertirMovimientoUseCase implements UseCase<RevertirMovimientoInput, LedgerEntry> {
  readonly #ledger: CorpLedgerRepository;

  constructor(ledger: CorpLedgerRepository) {
    this.#ledger = ledger;
  }

  async execute(input: RevertirMovimientoInput): Promise<LedgerEntry> {
    const motivo = input.motivo.trim();
    if (motivo === '') throw new MotivoRequeridoError();
    const original = await this.#ledger.findById(input.entryId);
    if (original === null) throw new MovimientoDesconocidoError(input.entryId);
    if (original.reversesEntryId !== null || (await this.#ledger.isReversed(original.id))) {
      throw new YaRevertidoError(original.id);
    }
    assertPeriodOpen(input.fecha, await this.#ledger.closedPeriods());
    const lines = reverseLines(original.lines);
    await assertPrestamosCubiertos(this.#ledger, original.kind, lines);
    return this.#ledger.insert(
      {
        projectId: original.projectId,
        kind: original.kind,
        contraparte: original.contraparte,
        moneda: original.moneda,
        montoOriginal: original.montoOriginal,
        tipoCambio: original.tipoCambio,
        deducible: original.deducible,
        fecha: input.fecha,
        concepto: `Reversa: ${original.concepto}`,
        source: 'manual',
        sourceRef: null,
        reversesEntryId: original.id,
        payload: { reversal: true, motivo },
        createdBy: input.founderId,
      },
      lines,
    );
  }
}
