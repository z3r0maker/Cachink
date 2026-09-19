import {
  nombreKey,
  telefonoKey,
  type ImportedClient,
  type ParsedClientRow,
} from './import-clientes';

/** What an import row is compared against: the stored cliente, matched by
 * telefono (digits) first, strictly normalised nombre as the fallback — the
 * same key pair `import-clientes` uses for in-file duplicates. */
export interface ExistingClient {
  readonly id: string;
  readonly nombre: string;
  readonly telefono: string | null;
  readonly rfc: string | null;
}

export interface PlannedClientRow extends ParsedClientRow {
  readonly kind: 'nuevo' | 'actualizar' | 'sin-cambios' | 'error';
  /** The cliente an `actualizar` row changes. */
  readonly id?: string;
  /** What the row writes when it matches: only the columns it carries. */
  readonly patch?: { telefono?: string; rfc?: string };
}

/**
 * An empty optional cell means «don't change», never «erase»: a name-only row
 * matching by nombre keeps the phone the business already has, so one blank
 * cell cannot destroy data. A row that carries nothing new is «sin cambios».
 */
export function planImportClientes(
  rows: readonly ParsedClientRow[],
  existing: readonly ExistingClient[],
): PlannedClientRow[] {
  const byPhone = new Map<string, ExistingClient>();
  const byName = new Map<string, ExistingClient>();
  for (const c of existing) {
    const digits = c.telefono === null ? '' : telefonoKey(c.telefono);
    if (digits !== '') byPhone.set(digits, c);
    byName.set(nombreKey(c.nombre), c);
  }
  const sameRfc = (a: string | null, b: string | null) =>
    (a ?? '').toUpperCase() === (b ?? '').toUpperCase();

  return rows.map((r) => {
    if (r.values === null) return { ...r, kind: 'error' };
    const v: ImportedClient = r.values;
    // Phone first; whatever it says, a row without a phone match (or without
    // a phone) falls back to the normalised nombre.
    const byPhoneHit = v.telefono === null ? undefined : byPhone.get(telefonoKey(v.telefono));
    const found = byPhoneHit ?? byName.get(nombreKey(v.nombre));
    if (found === undefined) return { ...r, kind: 'nuevo' };

    const patch: { telefono?: string; rfc?: string } = {};
    if (v.telefono !== null) patch.telefono = v.telefono;
    if (v.rfc !== null) patch.rfc = v.rfc;
    const unchanged =
      (patch.telefono === undefined ||
        telefonoKey(patch.telefono) === telefonoKey(found.telefono ?? '')) &&
      (patch.rfc === undefined || sameRfc(patch.rfc, found.rfc));
    return unchanged
      ? { ...r, kind: 'sin-cambios', id: found.id }
      : { ...r, kind: 'actualizar', id: found.id, patch };
  });
}
