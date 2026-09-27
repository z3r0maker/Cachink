/**
 * «Hoy no»: rows the operator put off for the rest of today on this device
 * (Inicio's «Para hoy» and Mi turno's «Pendientes de registrar»). Each app
 * keeps the list in its own device storage; the rule that reads it is here.
 */

export interface Guardado {
  readonly fecha: string;
  readonly ids: readonly string[];
}

/** Today's put-off ids from what was stored; another day's list is stale. */
export function vigentes(raw: string | null, hoy: string): readonly string[] {
  if (raw === null) return [];
  try {
    const v = JSON.parse(raw) as Partial<Guardado>;
    if (v.fecha !== hoy || !Array.isArray(v.ids)) return [];
    return v.ids.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}
