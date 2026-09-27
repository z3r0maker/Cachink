export type Connection = 'en-linea' | 'sin-conexion';

/** What the shell shows; the register runtime (O-06) will supply it live. */
export interface OperadorShellData {
  readonly negocio: { readonly nombre: string; readonly iniciales: string };
  readonly caja: string;
  readonly operador: { readonly nombre: string; readonly iniciales: string };
  /** `null` when no turno is open on this register. */
  readonly turno: { readonly desde: string } | null;
  readonly connection: Connection;
  /** Records captured here and not yet accepted by the server. */
  readonly pendientes: number;
  readonly avisosSinLeer: number;
}
