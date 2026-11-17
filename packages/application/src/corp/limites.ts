import { assertTopes, type TopesDelAnio } from '@xangarro/domain/corp';

/**
 * The year's income caps (E-15, board CD-12d). They are public figures (the
 * DOF's SAS cap, the law's RESICO cap) that a founder captures each January;
 * a correction overwrites the year's row.
 */
export interface TopesRepository {
  /** Every year captured, newest first. */
  topes(): Promise<readonly TopesDelAnio[]>;
  /** Inserts the year, or replaces its caps. */
  guardar(t: TopesDelAnio, founderId: string): Promise<void>;
}

export async function guardarTopes(
  deps: { readonly topes: TopesRepository },
  input: TopesDelAnio & { readonly founderId: string },
): Promise<TopesDelAnio> {
  const t = { anio: input.anio, sas: input.sas, resico: input.resico };
  assertTopes(t);
  await deps.topes.guardar(t, input.founderId);
  return t;
}
