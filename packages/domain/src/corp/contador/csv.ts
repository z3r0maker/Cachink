import { toPesosString, type Money } from '../../money/index.js';
import { ACCOUNTS, type Naturaleza } from '../ledger/accounts.js';
import type { Balanza } from './balanza.js';
import { CUENTAS_DEL_CATALOGO, grupoDeCuenta, type Codigos } from './codigos.js';

/**
 * The CSV files of the contador's package (E-43): UTF-8 with a BOM, so a
 * spreadsheet reads the accents; CRLF, as RFC 4180 writes it; amounts in plain
 * pesos (`1234.56`). A text cell that a spreadsheet would read as a formula
 * starts with an apostrophe. Pure.
 */
const BOM = '﻿';

const FORMULA = /^[=+\-@\t\r]/;

/** A text cell: quoted when it holds a comma, a quote or a line break. */
export function celda(value: string): string {
  const seguro = FORMULA.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(seguro) ? `"${seguro.replaceAll('"', '""')}"` : seguro;
}

/** Amounts are written as numbers, never as text: a minus sign is a sign. */
const pesos = (v: Money): string => toPesosString(v);

export function csv(filas: readonly (readonly string[])[]): string {
  return `${BOM}${filas.map((f) => f.join(',')).join('\r\n')}\r\n`;
}

const NATURALEZA: Record<Naturaleza, string> = { deudora: 'Deudora', acreedora: 'Acreedora' };

export function balanzaCsv(b: Balanza): string {
  return csv([
    ['Código agrupador', 'Cuenta', 'Naturaleza', 'Saldo inicial', 'Debe', 'Haber', 'Saldo final'],
    ...b.filas.map((f) => [
      celda(f.codigo ?? ''),
      celda(f.nombre),
      NATURALEZA[f.naturaleza],
      pesos(f.inicial),
      pesos(f.debe),
      pesos(f.haber),
      pesos(f.final),
    ]),
    ['', 'Total', '', '', pesos(b.debe), pesos(b.haber), ''],
  ]);
}

/** The accounts for the contador to put a code to, with the ones there are so far. */
export function listaDeCuentasCsv(codigos: Codigos): string {
  return csv([
    ['Cuenta', 'Grupo', 'Naturaleza', 'Código agrupador'],
    ...CUENTAS_DEL_CATALOGO.map((c) => [
      celda(ACCOUNTS[c].nombre),
      celda(grupoDeCuenta(c)),
      NATURALEZA[ACCOUNTS[c].naturaleza],
      celda(codigos.get(c) ?? ''),
    ]),
  ]);
}

/** An issued CFDI of the month, as the package lists it. */
export interface CfdiEmitido {
  readonly uuid: string;
  readonly tipo: string;
  readonly rfc: string;
  readonly nombre: string;
  /** `YYYY-MM-DD`; empty when the CFDI covers the month (the global). */
  readonly fecha: string;
  /** IVA included, centavos. */
  readonly total: Money;
}

export function emitidasCsv(cfdis: readonly CfdiEmitido[]): string {
  return csv([
    ['Folio fiscal', 'Tipo', 'RFC del receptor', 'Receptor', 'Fecha', 'Total'],
    ...cfdis.map((c) => [
      celda(c.uuid),
      celda(c.tipo),
      celda(c.rfc),
      celda(c.nombre),
      celda(c.fecha),
      pesos(c.total),
    ]),
  ]);
}
