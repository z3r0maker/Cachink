/**
 * Review status for rows created at the register («creado en caja»,
 * ADR-074). The owner approves, merges into a duplicate or rejects them
 * from Revisión de caja; everything the owner or an old device created is
 * `aprobado`, which is also the migration default for existing rows.
 */

import { z } from 'zod';

export const EstadoRevisionEnum = z.enum(['pendiente', 'aprobado', 'fusionado', 'rechazado']);
export type EstadoRevision = z.infer<typeof EstadoRevisionEnum>;

/** Shared review-status field: defaults to `aprobado` (see file header). */
export const estadoRevisionField = EstadoRevisionEnum.default('aprobado');
