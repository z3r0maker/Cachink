/**
 * «Equipo y nómina» (ADR-107): the person who cobra at the caja and the
 * employee on payroll are, in a small business, the same person — the owner
 * confirmed it. They live in two tables (`users` with a NIP, `employees` with
 * a salary), so the page pairs them by name: case, accents and spacing aside.
 */
export function normalizaNombre(nombre: string | null): string {
  return (nombre ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export const mismoNombre = (a: string | null, b: string | null): boolean =>
  normalizaNombre(a) !== '' && normalizaNombre(a) === normalizaNombre(b);

interface ConNombre {
  readonly id: string;
  readonly nombre: string | null;
}

export interface Emparejados<O, E> {
  /** Every operator, in their order, with their payroll row when there is one. */
  readonly conCaja: ReadonlyArray<{ readonly operador: O; readonly empleado: E | null }>;
  /** Employees no operator matched: on payroll, not at a caja. */
  readonly soloNomina: readonly E[];
}

/** Pair by name. A payroll row goes to one operator only, an active one first. */
export function emparejar<O extends ConNombre & { readonly active: boolean }, E extends ConNombre>(
  operadores: readonly O[],
  empleados: readonly E[],
): Emparejados<O, E> {
  const libres = new Map(empleados.map((e) => [e.id, e]));
  const toma = (o: O): E | null => {
    for (const e of libres.values()) {
      if (mismoNombre(o.nombre, e.nombre)) {
        libres.delete(e.id);
        return e;
      }
    }
    return null;
  };
  const primero = [...operadores].sort((a, b) => Number(b.active) - Number(a.active));
  const pareja = new Map(primero.map((o) => [o.id, toma(o)]));
  return {
    conCaja: operadores.map((o) => ({ operador: o, empleado: pareja.get(o.id) ?? null })),
    soloNomina: [...libres.values()],
  };
}
