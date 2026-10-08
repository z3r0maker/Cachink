import { sql } from 'drizzle-orm';
import { check, smallint, text } from 'drizzle-orm/pg-core';

import { at, corp } from './corp.js';

/**
 * The partners of MEXIA, and the founder permission of the console
 * (ADR-124 §1). A staff member is a founder when a row here names their
 * `staff_members.id`. There is deliberately no foreign key to it: staff live
 * in another schema, and a corp row must survive the move to its own
 * database. The console checks the pairing on every request instead.
 *
 * `numero` is the agreement's «Fundador 1» / «Fundador 2».
 */
export const founders = corp.table(
  'founders',
  {
    id: text('id').primaryKey(),
    staffMemberId: text('staff_member_id').notNull().unique(),
    numero: smallint('numero').notNull().unique(),
    nombre: text('nombre').notNull(),
    rfc: text('rfc'),
    createdAt: at('created_at').notNull(),
  },
  (t) => [check('founders_numero_check', sql`${t.numero} IN (1, 2)`)],
);
