/**
 * «Cómo quieres enterarte» (P-32): one switch in a member's delivery matrix.
 * Read the stored overrides, apply the domain's rule (critical avisos cannot
 * be switched off), store the result, return the full matrix to render.
 */

import {
  cambiarCanal,
  preferenciasEfectivas,
  type Canal,
  type FilaPreferencia,
  type PreferenciasGuardadas,
  type TipoAviso,
} from '@xangarro/domain';

import type { UseCase } from '../_use-case.js';

export interface PreferenciasPort {
  readonly leer: () => Promise<PreferenciasGuardadas>;
  readonly guardar: (prefs: PreferenciasGuardadas) => Promise<void>;
}

export interface CambiarCanalInput {
  readonly tipo: TipoAviso;
  readonly canal: Canal;
  readonly on: boolean;
}

export class CambiarCanalAvisoUseCase implements UseCase<CambiarCanalInput, FilaPreferencia[]> {
  constructor(private readonly prefs: PreferenciasPort) {}

  async execute(input: CambiarCanalInput): Promise<FilaPreferencia[]> {
    const next = cambiarCanal(await this.prefs.leer(), input.tipo, input.canal, input.on);
    await this.prefs.guardar(next);
    return preferenciasEfectivas(next);
  }
}
