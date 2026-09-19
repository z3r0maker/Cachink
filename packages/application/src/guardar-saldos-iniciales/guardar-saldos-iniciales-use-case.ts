/**
 * GuardarSaldosInicialesUseCase (N-17, C-20): the portal's one path for the
 * day-one facts — fecha de apertura, caja, bancos and one saldo per cliente.
 * Replace-style: what the import carries is what stays. Refuses once the
 * owner locked the rows (`SaldosBloqueadosError`).
 */

import { SaldosBloqueadosError, SaldosInvalidosError, type OpeningBalance } from '@xangarro/domain';
import type { UseCase } from '../_use-case.js';

export interface OpeningBalancesPort {
  of(businessId: string): Promise<Pick<OpeningBalance, 'lockedAt'> | null>;
  save(input: {
    readonly businessId: string;
    readonly fechaApertura: string;
    readonly cajaCentavos: bigint;
    readonly bancosCentavos: bigint;
    readonly lines: readonly { readonly clienteId: string; readonly saldoCentavos: bigint }[];
  }): Promise<void>;
  lock(businessId: string): Promise<boolean>;
}

export interface GuardarSaldosInicialesInput {
  readonly businessId: string;
  readonly fechaApertura: string;
  readonly cajaCentavos: bigint;
  readonly bancosCentavos: bigint;
  readonly lines: readonly { readonly clienteId: string; readonly saldoCentavos: bigint }[];
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export class GuardarSaldosInicialesUseCase implements UseCase<GuardarSaldosInicialesInput, void> {
  constructor(private readonly port: OpeningBalancesPort) {}

  async execute(input: GuardarSaldosInicialesInput): Promise<void> {
    const existing = await this.port.of(input.businessId);
    if (existing?.lockedAt != null) throw new SaldosBloqueadosError(existing.lockedAt);

    const campos: string[] = [];
    if (!FECHA.test(input.fechaApertura)) campos.push('fechaApertura');
    if (input.cajaCentavos < 0n) campos.push('cajaCentavos');
    if (input.bancosCentavos < 0n) campos.push('bancosCentavos');
    const seen = new Set<string>();
    for (const line of input.lines) {
      if (line.saldoCentavos < 0n) campos.push(`saldo de ${line.clienteId}`);
      // A cliente twice in one import would double-count its opening saldo.
      if (seen.has(line.clienteId)) campos.push(`cliente repetido ${line.clienteId}`);
      seen.add(line.clienteId);
    }
    if (campos.length > 0) throw new SaldosInvalidosError(campos);

    await this.port.save(input);
  }
}

/**
 * BloquearSaldosInicialesUseCase (N-17): the explicit, one-way owner lock —
 * v1's stand-in for the first period close. True when this call locked;
 * false when they were already locked (a no-op, not an error).
 */
export class BloquearSaldosInicialesUseCase implements UseCase<{ businessId: string }, boolean> {
  constructor(private readonly port: OpeningBalancesPort) {}

  async execute(input: { businessId: string }): Promise<boolean> {
    return this.port.lock(input.businessId);
  }
}
