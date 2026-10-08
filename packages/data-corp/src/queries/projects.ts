import { asc } from 'drizzle-orm';

import type { CorpDb } from '../client.js';
import { projects } from '../schema/projects.js';

export interface Project {
  readonly id: string;
  readonly slug: string;
  readonly nombre: string;
}

/** Every project MEXIA runs, oldest first. */
export async function listProjects(db: CorpDb): Promise<readonly Project[]> {
  const rows = await db
    .select()
    .from(projects)
    .orderBy(asc(projects.createdAt), asc(projects.slug));
  return rows.map((r) => ({ id: r.id, slug: r.slug, nombre: r.nombre }));
}
