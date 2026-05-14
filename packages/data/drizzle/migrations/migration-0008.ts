/**
 * Migration 0008 — Add feature_flags column to businesses.
 *
 * Phase 3 of the Feature Flags plan: feature flag infrastructure.
 * Default value ensures existing businesses get stock ON, everything else OFF.
 */

export const migration0008Sql = `ALTER TABLE businesses ADD COLUMN feature_flags TEXT NOT NULL DEFAULT '{"stock":true,"conversionMateriaPrima":false,"conversionAutomatica":false,"caja":false,"auditoriaInventario":false,"merma":false,"ventasCredito":false}';`;
