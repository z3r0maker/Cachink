/**
 * Fiscal periods ("YYYY-MM") for the monthly global CFDI.
 *
 * Months are counted in Mexico City time. Central Mexico abolished DST in
 * October 2022, so CDMX is a fixed UTC−06:00 — a constant offset keeps this
 * deterministic without depending on the host's tz database.
 */

import { CfdiError } from './errors.js';

const CDMX_OFFSET_MS = 6 * 60 * 60 * 1000;
const PERIOD_RE = /^(20\d{2})-(0[1-9]|1[0-2])$/;
/** CFDI 4.0 became the only valid version in 2023; 2022 is the earliest year accepted. */
const FIRST_YEAR = 2022;

export interface FiscalPeriod {
  readonly period: string;
  /** InformacionGlobal Meses (01–12). */
  readonly meses: string;
  /** InformacionGlobal Año. */
  readonly anio: number;
  /** First instant after the period ends (next month 00:00 CDMX). */
  readonly endsAt: Date;
}

function invalid(value: string): CfdiError {
  return new CfdiError('CFDI_INVALID_PERIOD', `Periodo inválido: "${value}" (usa AAAA-MM)`);
}

/** The "YYYY-MM" period a payment instant falls in, in CDMX time. */
export function fiscalPeriodOf(instant: Date): string {
  const ms = instant.getTime();
  if (Number.isNaN(ms)) throw invalid(String(instant));
  const local = new Date(ms - CDMX_OFFSET_MS);
  const month = String(local.getUTCMonth() + 1).padStart(2, '0');
  return `${local.getUTCFullYear()}-${month}`;
}

export function parseFiscalPeriod(period: string): FiscalPeriod {
  const match = PERIOD_RE.exec(period);
  const anio = Number(match?.[1]);
  const meses = match?.[2];
  if (!meses || anio < FIRST_YEAR) throw invalid(period);
  const endsAt = new Date(Date.UTC(anio, Number(meses), 1) + CDMX_OFFSET_MS);
  return { period, meses, anio, endsAt };
}
