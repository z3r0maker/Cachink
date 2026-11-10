/**
 * Is Supabase's Data API closed to us? (audit SEC-DATA-01, ADR-138). Pure;
 * unit-tested in `tests/data-api-check.test.ts`; run by `check-data-api.ts`.
 *
 * A request to PostgREST for a Xangarro table must be refused (401, 403, 404:
 * the API is off or the schema hidden), or answered with an empty list. Any
 * row, or any other answer, fails: it means the door is open.
 */
export type Veredicto = 'cerrada' | 'abierta' | 'dudosa';

export function veredicto(status: number, body: string): Veredicto {
  if (status === 401 || status === 403 || status === 404) return 'cerrada';
  if (status === 200) return body.trim() === '[]' ? 'cerrada' : 'abierta';
  return 'dudosa';
}

export interface Intento {
  readonly nombre: string;
  readonly bearer: string;
}

/** The credentials to try: the anon key on its own, and a device token if given. */
export function intentos(anonKey: string, deviceToken: string | undefined): readonly Intento[] {
  const base = [{ nombre: 'anon key', bearer: anonKey }];
  return deviceToken ? [...base, { nombre: 'device token', bearer: deviceToken }] : base;
}
