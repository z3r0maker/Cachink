import { z } from 'zod';

import { Positive } from './common';

/**
 * `corrida.json` (S-09): what a corrida ran against, written when it starts,
 * so the report can say which commit of the app the findings belong to
 * (spec §11's header). `single` is one `run-one`; `smoke` and `full` come from
 * a matrix (spec §6.3).
 */
export const CorridaSchema = z.strictObject({
  id: z.string().regex(/^\d{8}-[0-9a-f]{4}$/, 'must look like 20261120-1a14'),
  started_at: z.iso.datetime(),
  mode: z.enum(['single', 'smoke', 'full']),
  repetitions: Positive.max(10),
  /** The app's commit, and whether the working tree had changes on top of it. */
  app_commit: z.string().regex(/^[0-9a-f]{40}$/, 'must be a full git commit id'),
  app_dirty: z.boolean(),
});

export type Corrida = z.infer<typeof CorridaSchema>;
