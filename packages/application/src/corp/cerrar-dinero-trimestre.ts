import {
  cuentasDeSocios,
  nombreTrimestre,
  rangoDelTrimestre,
  repartoDelDinero,
  ultimoDiaDelTrimestre,
  type Socio,
} from '@xangarro/domain/corp';

import type { UseCase } from '../_use-case.js';
import { TrimestreEnCursoError } from './errors.js';
import type { CorpLedgerRepository, LedgerEntry } from './ports.js';
import { RegistrarMovimientoUseCase } from './registrar-movimiento.js';

/**
 * The quarter's money close for one partner (E-03, agreement Quinta): the
 * additional money of the quarter counts 1:1 for the pool up to the value of
 * that partner's finished deliverables; the excess moves from AFAC to a loan
 * without interest, dated the quarter's last day.
 *
 * `entregables` comes from the Tablero (E-20); until it ships, the founders
 * type the value their Tablero agreed.
 */
export interface CerrarDineroInput {
  readonly socio: Socio;
  readonly trimestre: string;
  /** The partner's finished deliverables in the quarter, centavos. */
  readonly entregables: bigint;
  /** Today, `YYYY-MM-DD`. */
  readonly hoy: string;
  readonly founderId: string;
}

export interface CierreDeDinero {
  readonly adicional: bigint;
  readonly bolsa: bigint;
  readonly prestamo: bigint;
  /** The excess's entry; null when everything fit under the cap. */
  readonly entry: LedgerEntry | null;
}

export const refExcedente = (trimestre: string, socio: Socio): string =>
  `excedente:${trimestre}:F${socio}`;

export interface DineroDelTrimestre {
  /** The partner's additional money dated in the quarter, before any close. */
  readonly adicional: bigint;
  /** The close already posted, if any. */
  readonly previo: { readonly entry: LedgerEntry; readonly prestamo: bigint } | null;
}

/**
 * Where a partner's quarter stands, from any list of entries (the use case's
 * and the Socios screen's alike); entries outside the quarter are ignored.
 */
export function dineroDelTrimestre(
  entries: readonly LedgerEntry[],
  trimestre: string,
  socio: Socio,
): DineroDelTrimestre {
  const [desde, hasta] = rangoDelTrimestre(trimestre);
  const ref = refExcedente(trimestre, socio);
  const enRango = entries.filter((e) => e.fecha >= desde && e.fecha < hasta);
  const adicional = cuentasDeSocios(enRango.filter((e) => e.sourceRef !== ref))[socio].adicional;
  const entry = enRango.find((e) => e.sourceRef === ref);
  return {
    adicional,
    previo:
      entry === undefined ? null : { entry, prestamo: cuentasDeSocios([entry])[socio].prestamo },
  };
}

export class CerrarDineroDelTrimestreUseCase implements UseCase<CerrarDineroInput, CierreDeDinero> {
  readonly #ledger: CorpLedgerRepository;

  constructor(ledger: CorpLedgerRepository) {
    this.#ledger = ledger;
  }

  async execute(input: CerrarDineroInput): Promise<CierreDeDinero> {
    const [desde, hasta] = rangoDelTrimestre(input.trimestre);
    if (input.hoy < hasta) throw new TrimestreEnCursoError(input.trimestre);
    const ref = refExcedente(input.trimestre, input.socio);
    const entries = await this.#ledger.listPartnerEntries({ desde, hasta });
    const { adicional, previo } = dineroDelTrimestre(entries, input.trimestre, input.socio);
    if (previo !== null) {
      // Closed before: report what was posted, never a second excess.
      const { prestamo, entry } = previo;
      return { adicional, bolsa: adicional - prestamo, prestamo, entry };
    }
    const { bolsa, prestamo } = repartoDelDinero(adicional, input.entregables);
    if (prestamo === 0n) return { adicional, bolsa, prestamo, entry: null };
    const entry = await new RegistrarMovimientoUseCase(this.#ledger).execute({
      fecha: ultimoDiaDelTrimestre(input.trimestre),
      projectId: null,
      concepto: `Excedente del ${nombreTrimestre(input.trimestre)} a préstamo`,
      contraparte: null,
      founderId: input.founderId,
      source: 'manual',
      sourceRef: ref,
      usd: null,
      deducible: null,
      movement: { kind: 'excedente_a_prestamo', socio: input.socio, monto: prestamo },
    });
    return { adicional, bolsa, prestamo, entry };
  }
}
