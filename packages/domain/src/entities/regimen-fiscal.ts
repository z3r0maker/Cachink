/**
 * Regimen Fiscal types + ISR-default seed values.
 *
 * The ISR defaults are seeded into `AppConfig` once at install time — after
 * that the DB owns the values, editable from Settings → "Tasas de ISR por
 * régimen". The seed values here are never read at runtime once the DB
 * entry exists.
 */

import { z } from 'zod';

/** Canonical list of regímenes fiscales the app supports. */
export const REGIMENES_FISCALES = ['RIF', 'RESICO', 'Asalariados', 'Otro'] as const;
export type RegimenFiscal = (typeof REGIMENES_FISCALES)[number];

/**
 * Schema for the JSON blob stored in AppConfig under key `'isrDefaults'`.
 *
 * Each key is a {@link RegimenFiscal} and each value is a decimal rate
 * in [0, 1] (e.g. 0.30 = 30 %).
 */
export const IsrDefaultsSchema = z.record(
  z.enum(REGIMENES_FISCALES),
  z.number().min(0).max(1),
);
export type IsrDefaults = z.infer<typeof IsrDefaultsSchema>;

/**
 * Initial seed values — used **only** when no DB entry exists yet
 * (first run). Once seeded, these are never read again; the DB is the
 * source of truth. Users can edit these from Settings → "Tasas de ISR
 * por régimen".
 *
 * Rates based on 2026 Mexican ISR law (Anexo 8, RMF 2026):
 *
 * - **RIF** (Régimen de Incorporación Fiscal, transitional): uses a
 *   progressive table with declining subsidies over 10 years. 2 % is a
 *   conservative effective rate for mid-tenure participants (years 3-5).
 *
 * - **RESICO** (Régimen Simplificado de Confianza, Art. 113-E LISR):
 *   flat rates on "ingresos efectivamente cobrados" by bracket —
 *   1.00 % (≤ $25 K/mo), 1.10 % (≤ $50 K), 1.50 % (≤ $83 K),
 *   2.00 % (≤ $208 K), 2.50 % (≤ $291 K). 1.25 % targets the typical
 *   emprendedor earning $25 K–$50 K/month.
 *
 * - **Asalariados** (Art. 96 LISR): progressive marginal rates
 *   1.92 %–35 %. Effective rate for a $30 K–$50 K/month salary is
 *   roughly 20 %–25 %. Seed at 25 % as a conservative mid-high
 *   estimate.
 *
 * - **Otro** (general regime / actividades empresariales y
 *   profesionales): same progressive table, up to 35 % marginal.
 *   For a small-business owner with $50 K–$100 K/month, the effective
 *   rate is roughly 25 %–32 %. Seed at 30 %.
 */
export const ISR_DEFAULTS_SEED: IsrDefaults = {
  RIF: 0.02,
  RESICO: 0.0125,
  Asalariados: 0.25,
  Otro: 0.30,
};
