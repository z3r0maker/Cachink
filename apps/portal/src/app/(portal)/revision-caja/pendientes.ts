import { REVISION_FIXTURE } from './fixture';

/**
 * How many records wait in Revisión de caja, for the sidebar badge. Fixture
 * data until the review status exists (C-18); the badge does not follow the
 * page's own approvals until then.
 */
export function pendientesRevision(): number {
  return REVISION_FIXTURE.productos.length + REVISION_FIXTURE.clientes.length;
}
