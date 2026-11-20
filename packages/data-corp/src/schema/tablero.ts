import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  smallint,
  text,
  unique,
} from 'drizzle-orm/pg-core';

import { documents } from './agenda.js';
import { at, corp } from './corp.js';

/**
 * The Tablero (E-20, boards CD-13b to CD-13d). Plans, card events,
 * objectives' progress, the clause and the notices are append-only; a card
 * changes only its values, its quote and the quarter it was taken off a plan
 * in, and a trigger (0016_zz) freezes those once work starts or a quote sets
 * the value. A card's state is read from its events, never stored.
 */
const TRIMESTRE = (c: unknown) => sql`${c} ~ '^[0-9]{4}-T[1-4]$'`;
const SOCIO = (c: unknown) => sql`${c} IN (1, 2)`;

/** Sent by one partner, approved or rejected by the other. */
export const boardPlanEvents = corp.table(
  'board_plan_events',
  {
    id: text('id').primaryKey(),
    quarter: text('quarter').notNull(),
    kind: text('kind', { enum: ['enviado', 'aprobado', 'rechazado'] }).notNull(),
    socio: smallint('socio').notNull(),
    onDate: date('on_date', { mode: 'string' }).notNull(),
    founderId: text('founder_id').notNull(),
    at: at('at').notNull(),
  },
  (t) => [
    index('board_plan_events_quarter_idx').on(t.quarter),
    check('board_plan_events_quarter_check', TRIMESTRE(t.quarter)),
    check('board_plan_events_kind_check', sql`${t.kind} IN ('enviado', 'aprobado', 'rechazado')`),
    check('board_plan_events_socio_check', SOCIO(t.socio)),
  ],
);

/** A result the quarter measures («60 negocios pagando»); it adds no value. */
export const boardObjectives = corp.table(
  'board_objectives',
  {
    id: text('id').primaryKey(),
    quarter: text('quarter').notNull(),
    /** 1, 2, or null for «Ambos». */
    who: smallint('who'),
    title: text('title').notNull(),
    goal: integer('goal').notNull(),
    unit: text('unit').notNull(),
    createdBy: text('created_by').notNull(),
    createdAt: at('created_at').notNull(),
  },
  (t) => [
    index('board_objectives_quarter_idx').on(t.quarter),
    check('board_objectives_quarter_check', TRIMESTRE(t.quarter)),
    check('board_objectives_who_check', sql`${t.who} IS NULL OR ${SOCIO(t.who)}`),
    check('board_objectives_title_check', sql`length(trim(${t.title})) > 0`),
    check('board_objectives_goal_check', sql`${t.goal} > 0 AND length(trim(${t.unit})) > 0`),
  ],
);

export const boardObjectiveProgress = corp.table(
  'board_objective_progress',
  {
    id: text('id').primaryKey(),
    objectiveId: text('objective_id')
      .notNull()
      .references(() => boardObjectives.id),
    value: integer('value').notNull(),
    onDate: date('on_date', { mode: 'string' }).notNull(),
    socio: smallint('socio').notNull(),
    founderId: text('founder_id').notNull(),
    at: at('at').notNull(),
  },
  (t) => [
    index('board_objective_progress_objective_idx').on(t.objectiveId),
    check('board_objective_progress_value_check', sql`${t.value} >= 0`),
    check('board_objective_progress_socio_check', SOCIO(t.socio)),
  ],
);

export const boardCards = corp.table(
  'board_cards',
  {
    id: text('id').primaryKey(),
    /** The quarter it was planned in. */
    quarter: text('quarter').notNull(),
    kind: text('kind', { enum: ['entregable', 'tarea'] }).notNull(),
    title: text('title').notNull(),
    criterion: text('criterion').notNull(),
    owner: smallint('owner').notNull(),
    due: date('due', { mode: 'string' }).notNull(),
    objectiveId: text('objective_id').references(() => boardObjectives.id),
    /** Fundador 1's proposed value, centavos. */
    valueF1: bigint('value_f1', { mode: 'bigint' }),
    valueF2: bigint('value_f2', { mode: 'bigint' }),
    /** A third party's quote without IVA, centavos: the value for both. */
    quote: bigint('quote', { mode: 'bigint' }),
    quoteDocumentId: text('quote_document_id').references(() => documents.id),
    droppedIn: text('dropped_in'),
    createdBy: text('created_by').notNull(),
    createdAt: at('created_at').notNull(),
    updatedBy: text('updated_by').notNull(),
    updatedAt: at('updated_at').notNull(),
  },
  (t) => [
    index('board_cards_quarter_idx').on(t.quarter),
    check('board_cards_quarter_check', TRIMESTRE(t.quarter)),
    check('board_cards_dropped_check', sql`${t.droppedIn} IS NULL OR ${TRIMESTRE(t.droppedIn)}`),
    check('board_cards_kind_check', sql`${t.kind} IN ('entregable', 'tarea')`),
    check('board_cards_owner_check', SOCIO(t.owner)),
    check('board_cards_title_check', sql`length(trim(${t.title})) > 0`),
    check(
      'board_cards_values_check',
      sql`coalesce(${t.valueF1}, 1) > 0 AND coalesce(${t.valueF2}, 1) > 0 AND coalesce(${t.quote}, 1) > 0`,
    ),
    check(
      'board_cards_task_check',
      sql`${t.kind} = 'entregable' OR (${t.valueF1} IS NULL AND ${t.valueF2} IS NULL AND ${t.quote} IS NULL)`,
    ),
    check('board_cards_quote_check', sql`(${t.quote} IS NULL) = (${t.quoteDocumentId} IS NULL)`),
  ],
);

const EVENTOS = sql.raw(
  `('iniciada', 'terminada', 'aceptada', 'objetada', 'al_mediador', 'resuelta', 'hecha')`,
);

export const boardCardEvents = corp.table(
  'board_card_events',
  {
    id: text('id').primaryKey(),
    cardId: text('card_id')
      .notNull()
      .references(() => boardCards.id),
    kind: text('kind', {
      enum: ['iniciada', 'terminada', 'aceptada', 'objetada', 'al_mediador', 'resuelta', 'hecha'],
    }).notNull(),
    socio: smallint('socio').notNull(),
    onDate: date('on_date', { mode: 'string' }).notNull(),
    link: text('link'),
    documentId: text('document_id').references(() => documents.id),
    reason: text('reason'),
    accepted: boolean('accepted'),
    founderId: text('founder_id').notNull(),
    at: at('at').notNull(),
  },
  (t) => [
    index('board_card_events_card_idx').on(t.cardId),
    check('board_card_events_kind_check', sql`${t.kind} IN ${EVENTOS}`),
    check('board_card_events_socio_check', SOCIO(t.socio)),
    check(
      'board_card_events_evidence_check',
      sql`${t.kind} <> 'terminada' OR ${t.link} IS NOT NULL OR ${t.documentId} IS NOT NULL`,
    ),
    check(
      'board_card_events_reason_check',
      sql`${t.kind} NOT IN ('objetada', 'al_mediador') OR length(trim(coalesce(${t.reason}, ''))) > 0`,
    ),
    check(
      'board_card_events_ruling_check',
      sql`(${t.kind} = 'resuelta') = (${t.accepted} IS NOT NULL) AND (${t.kind} <> 'resuelta' OR ${t.documentId} IS NOT NULL)`,
    ),
  ],
);

/** The agreement's clause the notice quotes; the newest one is in force. */
export const boardClauses = corp.table(
  'board_clauses',
  {
    id: text('id').primaryKey(),
    number: text('number').notNull(),
    body: text('body').notNull(),
    founderId: text('founder_id').notNull(),
    at: at('at').notNull(),
  },
  (t) => [
    check(
      'board_clauses_text_check',
      sql`length(trim(${t.number})) > 0 AND length(trim(${t.body})) > 0`,
    ),
  ],
);

/** An incumplimiento notice the partner sent, filed in the Expediente. */
export const boardNotices = corp.table(
  'board_notices',
  {
    id: text('id').primaryKey(),
    quarter: text('quarter').notNull(),
    toSocio: smallint('to_socio').notNull(),
    sentOn: date('sent_on', { mode: 'string' }).notNull(),
    clauseId: text('clause_id')
      .notNull()
      .references(() => boardClauses.id),
    documentId: text('document_id')
      .notNull()
      .references(() => documents.id),
    founderId: text('founder_id').notNull(),
    at: at('at').notNull(),
  },
  (t) => [
    unique('board_notices_quarter_unique').on(t.quarter),
    check('board_notices_quarter_check', TRIMESTRE(t.quarter)),
    check('board_notices_socio_check', SOCIO(t.toSocio)),
  ],
);
