import { leerRefRecurrente, type PlantillaRecurrente } from '@xangarro/domain/corp';

import type { NuevaPlantilla, RecurringTemplateRepository } from '../../src/corp/index.js';
import type { FakeLedger } from './fake-ledger.js';

/** E-02's recurring templates in memory, reading their charges off the fake ledger. */
export class FakePlantillas implements RecurringTemplateRepository {
  readonly plantillas: PlantillaRecurrente[] = [];

  constructor(private readonly ledger: FakeLedger) {}

  async ensure(p: NuevaPlantilla) {
    const found = this.plantillas.find((x) => x.id === p.id);
    if (found !== undefined) return found;
    const { createdBy: _by, ...rest } = p;
    const saved: PlantillaRecurrente = { ...rest, activo: true };
    this.plantillas.push(saved);
    return saved;
  }
  async findById(id: string) {
    return this.plantillas.find((p) => p.id === id) ?? null;
  }
  async list() {
    return this.plantillas;
  }
  async setActivo(id: string, activo: boolean) {
    const i = this.plantillas.findIndex((p) => p.id === id);
    const p = this.plantillas[i];
    if (p !== undefined) this.plantillas[i] = { ...p, activo };
  }
  async registradasEn(mes: string) {
    const out = new Map<string, string>();
    for (const e of this.ledger.entries) {
      const ref =
        e.source === 'recurring' && e.sourceRef !== null ? leerRefRecurrente(e.sourceRef) : null;
      if (ref === null || ref.mes !== mes) continue;
      if (this.ledger.entries.some((r) => r.reversesEntryId === e.id)) continue;
      out.set(ref.plantillaId, e.id);
    }
    return out;
  }
}
