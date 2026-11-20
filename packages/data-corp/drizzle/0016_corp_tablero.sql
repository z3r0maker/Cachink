CREATE TABLE "corp"."board_card_events" (
	"id" text PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"kind" text NOT NULL,
	"socio" smallint NOT NULL,
	"on_date" date NOT NULL,
	"link" text,
	"document_id" text,
	"reason" text,
	"accepted" boolean,
	"founder_id" text NOT NULL,
	"at" timestamp with time zone NOT NULL,
	CONSTRAINT "board_card_events_kind_check" CHECK ("corp"."board_card_events"."kind" IN ('iniciada', 'terminada', 'aceptada', 'objetada', 'al_mediador', 'resuelta', 'hecha')),
	CONSTRAINT "board_card_events_socio_check" CHECK ("corp"."board_card_events"."socio" IN (1, 2)),
	CONSTRAINT "board_card_events_evidence_check" CHECK ("corp"."board_card_events"."kind" <> 'terminada' OR "corp"."board_card_events"."link" IS NOT NULL OR "corp"."board_card_events"."document_id" IS NOT NULL),
	CONSTRAINT "board_card_events_reason_check" CHECK ("corp"."board_card_events"."kind" NOT IN ('objetada', 'al_mediador') OR length(trim(coalesce("corp"."board_card_events"."reason", ''))) > 0),
	CONSTRAINT "board_card_events_ruling_check" CHECK (("corp"."board_card_events"."kind" = 'resuelta') = ("corp"."board_card_events"."accepted" IS NOT NULL) AND ("corp"."board_card_events"."kind" <> 'resuelta' OR "corp"."board_card_events"."document_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "corp"."board_cards" (
	"id" text PRIMARY KEY NOT NULL,
	"quarter" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"criterion" text NOT NULL,
	"owner" smallint NOT NULL,
	"due" date NOT NULL,
	"objective_id" text,
	"value_f1" bigint,
	"value_f2" bigint,
	"quote" bigint,
	"quote_document_id" text,
	"dropped_in" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "board_cards_quarter_check" CHECK ("corp"."board_cards"."quarter" ~ '^[0-9]{4}-T[1-4]$'),
	CONSTRAINT "board_cards_dropped_check" CHECK ("corp"."board_cards"."dropped_in" IS NULL OR "corp"."board_cards"."dropped_in" ~ '^[0-9]{4}-T[1-4]$'),
	CONSTRAINT "board_cards_kind_check" CHECK ("corp"."board_cards"."kind" IN ('entregable', 'tarea')),
	CONSTRAINT "board_cards_owner_check" CHECK ("corp"."board_cards"."owner" IN (1, 2)),
	CONSTRAINT "board_cards_title_check" CHECK (length(trim("corp"."board_cards"."title")) > 0),
	CONSTRAINT "board_cards_values_check" CHECK (coalesce("corp"."board_cards"."value_f1", 1) > 0 AND coalesce("corp"."board_cards"."value_f2", 1) > 0 AND coalesce("corp"."board_cards"."quote", 1) > 0),
	CONSTRAINT "board_cards_task_check" CHECK ("corp"."board_cards"."kind" = 'entregable' OR ("corp"."board_cards"."value_f1" IS NULL AND "corp"."board_cards"."value_f2" IS NULL AND "corp"."board_cards"."quote" IS NULL)),
	CONSTRAINT "board_cards_quote_check" CHECK (("corp"."board_cards"."quote" IS NULL) = ("corp"."board_cards"."quote_document_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "corp"."board_clauses" (
	"id" text PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"body" text NOT NULL,
	"founder_id" text NOT NULL,
	"at" timestamp with time zone NOT NULL,
	CONSTRAINT "board_clauses_text_check" CHECK (length(trim("corp"."board_clauses"."number")) > 0 AND length(trim("corp"."board_clauses"."body")) > 0)
);
--> statement-breakpoint
CREATE TABLE "corp"."board_notices" (
	"id" text PRIMARY KEY NOT NULL,
	"quarter" text NOT NULL,
	"to_socio" smallint NOT NULL,
	"sent_on" date NOT NULL,
	"clause_id" text NOT NULL,
	"document_id" text NOT NULL,
	"founder_id" text NOT NULL,
	"at" timestamp with time zone NOT NULL,
	CONSTRAINT "board_notices_quarter_unique" UNIQUE("quarter"),
	CONSTRAINT "board_notices_quarter_check" CHECK ("corp"."board_notices"."quarter" ~ '^[0-9]{4}-T[1-4]$'),
	CONSTRAINT "board_notices_socio_check" CHECK ("corp"."board_notices"."to_socio" IN (1, 2))
);
--> statement-breakpoint
CREATE TABLE "corp"."board_objective_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"objective_id" text NOT NULL,
	"value" integer NOT NULL,
	"on_date" date NOT NULL,
	"socio" smallint NOT NULL,
	"founder_id" text NOT NULL,
	"at" timestamp with time zone NOT NULL,
	CONSTRAINT "board_objective_progress_value_check" CHECK ("corp"."board_objective_progress"."value" >= 0),
	CONSTRAINT "board_objective_progress_socio_check" CHECK ("corp"."board_objective_progress"."socio" IN (1, 2))
);
--> statement-breakpoint
CREATE TABLE "corp"."board_objectives" (
	"id" text PRIMARY KEY NOT NULL,
	"quarter" text NOT NULL,
	"who" smallint,
	"title" text NOT NULL,
	"goal" integer NOT NULL,
	"unit" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "board_objectives_quarter_check" CHECK ("corp"."board_objectives"."quarter" ~ '^[0-9]{4}-T[1-4]$'),
	CONSTRAINT "board_objectives_who_check" CHECK ("corp"."board_objectives"."who" IS NULL OR "corp"."board_objectives"."who" IN (1, 2)),
	CONSTRAINT "board_objectives_title_check" CHECK (length(trim("corp"."board_objectives"."title")) > 0),
	CONSTRAINT "board_objectives_goal_check" CHECK ("corp"."board_objectives"."goal" > 0 AND length(trim("corp"."board_objectives"."unit")) > 0)
);
--> statement-breakpoint
CREATE TABLE "corp"."board_plan_events" (
	"id" text PRIMARY KEY NOT NULL,
	"quarter" text NOT NULL,
	"kind" text NOT NULL,
	"socio" smallint NOT NULL,
	"on_date" date NOT NULL,
	"founder_id" text NOT NULL,
	"at" timestamp with time zone NOT NULL,
	CONSTRAINT "board_plan_events_quarter_check" CHECK ("corp"."board_plan_events"."quarter" ~ '^[0-9]{4}-T[1-4]$'),
	CONSTRAINT "board_plan_events_kind_check" CHECK ("corp"."board_plan_events"."kind" IN ('enviado', 'aprobado', 'rechazado')),
	CONSTRAINT "board_plan_events_socio_check" CHECK ("corp"."board_plan_events"."socio" IN (1, 2))
);
--> statement-breakpoint
ALTER TABLE "corp"."board_card_events" ADD CONSTRAINT "board_card_events_card_id_board_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "corp"."board_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corp"."board_card_events" ADD CONSTRAINT "board_card_events_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "corp"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corp"."board_cards" ADD CONSTRAINT "board_cards_objective_id_board_objectives_id_fk" FOREIGN KEY ("objective_id") REFERENCES "corp"."board_objectives"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corp"."board_cards" ADD CONSTRAINT "board_cards_quote_document_id_documents_id_fk" FOREIGN KEY ("quote_document_id") REFERENCES "corp"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corp"."board_notices" ADD CONSTRAINT "board_notices_clause_id_board_clauses_id_fk" FOREIGN KEY ("clause_id") REFERENCES "corp"."board_clauses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corp"."board_notices" ADD CONSTRAINT "board_notices_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "corp"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corp"."board_objective_progress" ADD CONSTRAINT "board_objective_progress_objective_id_board_objectives_id_fk" FOREIGN KEY ("objective_id") REFERENCES "corp"."board_objectives"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "board_card_events_card_idx" ON "corp"."board_card_events" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "board_cards_quarter_idx" ON "corp"."board_cards" USING btree ("quarter");--> statement-breakpoint
CREATE INDEX "board_objective_progress_objective_idx" ON "corp"."board_objective_progress" USING btree ("objective_id");--> statement-breakpoint
CREATE INDEX "board_objectives_quarter_idx" ON "corp"."board_objectives" USING btree ("quarter");--> statement-breakpoint
CREATE INDEX "board_plan_events_quarter_idx" ON "corp"."board_plan_events" USING btree ("quarter");