/**
 * DirectorAlert — unified notification inbox for Director role.
 *
 * Each alert carries a source (which system generated it), a severity
 * level, and an optional deep-link route for action.
 * Phase 11 of the Feature Flags plan.
 */

import { z } from 'zod';
import type { DirectorAlertId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';

export const AlertSeverityEnum = z.enum(['info', 'warning', 'critical']);
export type AlertSeverity = z.infer<typeof AlertSeverityEnum>;

export const AlertSourceEnum = z.enum([
  'stock-bajo',
  'caja-discrepancia',
  'caja-egreso-auto',
  'merma-threshold',
  'auditoria-pendiente',
  'auditoria-discrepancia',
  'conversion-automatica',
  'conversion-costo',
  'credito-entrega',
  'credito-vencido',
  'usuario-cambio',
  'feature-flag-cambio',
  'gasto-recurrente-pendiente',
]);
export type AlertSource = z.infer<typeof AlertSourceEnum>;

export const DirectorAlertSchema = z
  .object({
    id: ulidField<DirectorAlertId>(),
    source: AlertSourceEnum,
    severity: AlertSeverityEnum,
    titleKey: z.string(),
    message: z.string(),
    read: z.boolean().default(false),
    actionRoute: z.string().nullable(),
    /** JSON-encoded Record<string, string> for source-specific data. */
    metadata: z.string().default('{}'),
  })
  .merge(auditSchema);

export type DirectorAlert = z.infer<typeof DirectorAlertSchema>;
