import { mitad, type Socio } from '@xangarro/domain/corp';

import type { UseCase } from '../_use-case.js';
import {
  ConceptoRequeridoError,
  LlamadaDesconocidaError,
  VencimientoInvalidoError,
} from './errors.js';
import type {
  CorpLedgerRepository,
  FundingCall,
  FundingCallRepository,
  LedgerEntry,
} from './ports.js';
import { RegistrarMovimientoUseCase } from './registrar-movimiento.js';

/**
 * Funding by halves (E-03, agreement Quinta): when the budget or a legal
 * obligation needs more than the company makes, the partners put it in by
 * halves within ten business days. Neither half adds pool value.
 */
export interface PedirFondeoInput {
  readonly concepto: string;
  /** Centavos. */
  readonly total: bigint;
  readonly vence: string;
  /** Today, `YYYY-MM-DD`, in Mexico City. */
  readonly hoy: string;
  readonly founderId: string;
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export class PedirFondeoUseCase implements UseCase<PedirFondeoInput, FundingCall> {
  readonly #calls: FundingCallRepository;

  constructor(calls: FundingCallRepository) {
    this.#calls = calls;
  }

  async execute(input: PedirFondeoInput): Promise<FundingCall> {
    const concepto = input.concepto.trim();
    if (concepto === '') throw new ConceptoRequeridoError();
    if (!FECHA.test(input.vence) || input.vence < input.hoy) {
      throw new VencimientoInvalidoError(input.vence);
    }
    return this.#calls.insert({
      concepto,
      total: input.total,
      porSocio: mitad(input.total),
      vence: input.vence,
      createdBy: input.founderId,
    });
  }
}

export interface PagarMitadInput {
  readonly callId: string;
  readonly socio: Socio;
  /** The day the transfer reached the company's account. */
  readonly fecha: string;
  readonly founderId: string;
}

/** The ledger's reference for a partner's half: one half per partner per call. */
export const refMitad = (callId: string, socio: Socio): string => `llamada:${callId}:F${socio}`;

/** Records a partner's half of a call; paying the same half twice returns the first. */
export class PagarMitadUseCase implements UseCase<PagarMitadInput, LedgerEntry> {
  readonly #calls: FundingCallRepository;
  readonly #ledger: CorpLedgerRepository;

  constructor(calls: FundingCallRepository, ledger: CorpLedgerRepository) {
    this.#calls = calls;
    this.#ledger = ledger;
  }

  async execute(input: PagarMitadInput): Promise<LedgerEntry> {
    const call = await this.#calls.findById(input.callId);
    if (call === null) throw new LlamadaDesconocidaError(input.callId);
    return new RegistrarMovimientoUseCase(this.#ledger).execute({
      fecha: input.fecha,
      projectId: null,
      concepto: call.concepto,
      contraparte: null,
      founderId: input.founderId,
      source: 'manual',
      sourceRef: refMitad(call.id, input.socio),
      usd: null,
      deducible: null,
      movement: { kind: 'fondeo_mitades', socio: input.socio, monto: call.porSocio },
    });
  }
}
