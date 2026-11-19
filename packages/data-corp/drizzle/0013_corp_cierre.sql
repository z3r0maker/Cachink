CREATE TABLE "corp"."bank_balances" (
	"period" text PRIMARY KEY NOT NULL,
	"saldo" bigint NOT NULL,
	"confirmed_by" text NOT NULL,
	"confirmed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "bank_balances_period_check" CHECK ("corp"."bank_balances"."period" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);
--> statement-breakpoint
CREATE TABLE "corp"."period_events" (
	"seq" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "corp"."period_events_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"period" text NOT NULL,
	"kind" text NOT NULL,
	"founder_id" text NOT NULL,
	"motivo" text,
	"at" timestamp with time zone NOT NULL,
	CONSTRAINT "period_events_period_check" CHECK ("corp"."period_events"."period" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
	CONSTRAINT "period_events_kind_check" CHECK ("corp"."period_events"."kind" IN ('cerrado', 'reapertura_pedida', 'reapertura_rechazada', 'reabierto')),
	CONSTRAINT "period_events_motivo_check" CHECK (("corp"."period_events"."kind" = 'reapertura_pedida') = ("corp"."period_events"."motivo" IS NOT NULL AND length(trim("corp"."period_events"."motivo")) > 0))
);
--> statement-breakpoint
CREATE INDEX "period_events_period_idx" ON "corp"."period_events" USING btree ("period","seq");