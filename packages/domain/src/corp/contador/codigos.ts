import { ACCOUNTS, isAccountKey, type AccountGroup, type AccountKey } from '../ledger/accounts.js';
import { esFecha } from '../servicios/validar.js';
import { ContadorError } from './errors.js';

/**
 * The SAT's código agrupador of each account (E-43, board CD-10e). The
 * founders type in what the contador sends and mark the list as validated,
 * with the day; changing a code makes a new list, which is not validated
 * until it is marked again. The console never proposes a code. Pure.
 */
export const CUENTAS_DEL_CATALOGO = Object.keys(ACCOUNTS) as readonly AccountKey[];

/** Account → code, in the chart's order; an account with no code is absent. */
export type Codigos = ReadonlyMap<AccountKey, string>;

export interface ListaDeCodigos {
  readonly id: string;
  readonly codigos: Codigos;
  readonly capturadaPor: string;
  /** ISO-8601. */
  readonly capturadaAt: string;
}

export interface ValidacionDeCodigos {
  readonly id: string;
  readonly listaId: string;
  /** The day the contador validated it, `YYYY-MM-DD`. */
  readonly validadaEl: string;
  readonly marcadaPor: string;
  readonly marcadaAt: string;
}

const GRUPOS: readonly { readonly nombre: string; readonly de: readonly AccountGroup[] }[] = [
  { nombre: 'Activo', de: ['activo'] },
  { nombre: 'Pasivo', de: ['pasivo'] },
  { nombre: 'Capital', de: ['capital'] },
  { nombre: 'Ingresos', de: ['ingreso'] },
  { nombre: 'Costos y gastos', de: ['costo', 'gasto'] },
  { nombre: 'Otros', de: ['otro'] },
];

/** The chart's accounts under the board's six headings, in the chart's order. */
export function cuentasPorGrupo(): readonly {
  readonly nombre: string;
  readonly cuentas: readonly AccountKey[];
}[] {
  return GRUPOS.map((g) => ({
    nombre: g.nombre,
    cuentas: CUENTAS_DEL_CATALOGO.filter((c) => g.de.includes(ACCOUNTS[c].grupo)),
  }));
}

/** The board's heading of an account's group. */
export function grupoDeCuenta(cuenta: AccountKey): string {
  return GRUPOS.find((g) => g.de.includes(ACCOUNTS[cuenta].grupo))?.nombre ?? '';
}

const FORMATO = /^\d{3}(\.\d{2})?$/;

/** A code as Anexo 24 writes it: `102` or `102.01`. */
export const esCodigoAgrupador = (value: string): boolean => FORMATO.test(value);

/** A form's codes, trimmed; an empty one is left out. */
export function leerCodigos(input: Readonly<Record<string, string>>): Codigos {
  const leidos = new Map<AccountKey, string>();
  for (const [cuenta, raw] of Object.entries(input)) {
    if (!isAccountKey(cuenta)) throw new ContadorError('CODIGO_CUENTA', cuenta);
    const codigo = raw.trim();
    if (codigo === '') continue;
    if (!esCodigoAgrupador(codigo))
      throw new ContadorError('CODIGO_FORMATO', ACCOUNTS[cuenta].nombre);
    leidos.set(cuenta, codigo);
  }
  return new Map(
    CUENTAS_DEL_CATALOGO.flatMap((c) => {
      const codigo = leidos.get(c);
      return codigo === undefined ? [] : [[c, codigo] as const];
    }),
  );
}

/** The accounts with no code, in the chart's order. */
export const faltantes = (codigos: Codigos): AccountKey[] =>
  CUENTAS_DEL_CATALOGO.filter((c) => !codigos.has(c));

export const mismosCodigos = (a: Codigos, b: Codigos): boolean =>
  a.size === b.size && [...a].every(([c, codigo]) => b.get(c) === codigo);

export interface EstadoCodigos {
  /** The newest list; null before any was saved. */
  readonly lista: ListaDeCodigos | null;
  /** Its validation: one of an older list does not count. */
  readonly validacion: ValidacionDeCodigos | null;
  readonly faltan: readonly AccountKey[];
}

/** `listas` oldest first. */
export function estadoDeCodigos(
  listas: readonly ListaDeCodigos[],
  validaciones: readonly ValidacionDeCodigos[],
): EstadoCodigos {
  const lista = listas.at(-1) ?? null;
  return {
    lista,
    validacion: lista === null ? null : (validaciones.find((v) => v.listaId === lista.id) ?? null),
    faltan: faltantes(lista?.codigos ?? new Map()),
  };
}

/** Only the newest list, complete and not yet validated, on a real day up to today. */
export function assertPuedeValidar(
  estado: EstadoCodigos,
  listaId: string,
  fecha: string,
  hoy: string,
): void {
  if (estado.lista === null) throw new ContadorError('CODIGOS_SIN_LISTA');
  if (estado.lista.id !== listaId) throw new ContadorError('CODIGOS_DESACTUALIZADA');
  if (estado.faltan.length > 0)
    throw new ContadorError('CODIGOS_INCOMPLETOS', String(estado.faltan.length));
  if (estado.validacion !== null) throw new ContadorError('CODIGOS_YA_VALIDADOS');
  if (!esFecha(fecha)) throw new ContadorError('CODIGOS_FECHA');
  if (fecha > hoy) throw new ContadorError('CODIGOS_FECHA_FUTURA');
}
