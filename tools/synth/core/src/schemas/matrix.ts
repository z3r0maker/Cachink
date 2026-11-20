import { z } from 'zod';

import { KebabId, Positive, Style } from './common';

/** One cell of a matrix: a persona, a scenario and how the actor goes about it. */
export const MatrixRun = z.strictObject({ persona: KebabId, scenario: KebabId, style: Style });
export type MatrixRun = z.infer<typeof MatrixRun>;

const cellKey = (r: MatrixRun) => `${r.persona}__${r.scenario}__${r.style}`;

/**
 * A matrix (spec §6.3). Repeating a cell is what `repetitions` is for, so the
 * same persona, scenario and style may appear once.
 */
export const MatrixSchema = z
  .strictObject({
    mode: z.enum(['smoke', 'full']),
    repetitions: Positive.max(10),
    runs: z.array(MatrixRun).min(1),
  })
  .superRefine((m, ctx) => {
    const seen = new Set<string>();
    m.runs.forEach((r, i) => {
      const key = cellKey(r);
      if (seen.has(key)) {
        ctx.addIssue({
          code: 'custom',
          path: ['runs', i],
          message: `${key} is already in the matrix; raise «repetitions» instead`,
        });
      }
      seen.add(key);
    });
  });

export type Matrix = z.infer<typeof MatrixSchema>;
