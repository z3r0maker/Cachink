import { sql } from 'drizzle-orm';
import { check, date, primaryKey, text } from 'drizzle-orm/pg-core';

import { at, corp } from './corp.js';

/**
 * The códigos agrupadores the contador validates (E-43, board CD-10e).
 * Append-only: each save is a whole new list, the newest one counts, and a
 * validation names the list it validated, so changing a code leaves the new
 * list unvalidated. A trigger (0015_zz) lets only the newest list be
 * validated. Which accounts exist is the domain's chart, not a check here.
 */
export const accountCodeLists = corp.table('account_code_lists', {
  id: text('id').primaryKey(),
  /** `corp.founders.id` of who saved it. */
  capturedBy: text('captured_by').notNull(),
  capturedAt: at('captured_at').notNull(),
});

export const accountCodes = corp.table(
  'account_codes',
  {
    listId: text('list_id')
      .notNull()
      .references(() => accountCodeLists.id),
    /** An `AccountKey` of `@xangarro/domain/corp`. */
    account: text('account').notNull(),
    /** As Anexo 24 writes it: `102` or `102.01`. */
    code: text('code').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.listId, t.account] }),
    check('account_codes_code_check', sql`${t.code} ~ '^[0-9]{3}([.][0-9]{2})?$'`),
  ],
);

export const accountCodeValidations = corp.table('account_code_validations', {
  id: text('id').primaryKey(),
  listId: text('list_id')
    .notNull()
    .unique()
    .references(() => accountCodeLists.id),
  /** The day the contador validated it. */
  validatedOn: date('validated_on', { mode: 'string' }).notNull(),
  markedBy: text('marked_by').notNull(),
  markedAt: at('marked_at').notNull(),
});
