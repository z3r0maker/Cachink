CREATE TABLE "corp"."certificates" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"holder" text NOT NULL,
	"serial" text NOT NULL,
	"expires_on" date NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "certificates_kind_check" CHECK ("corp"."certificates"."kind" IN ('csd', 'efirma')),
	CONSTRAINT "certificates_holder_check" CHECK ("corp"."certificates"."holder" IN ('mexia', 'f1', 'f2')),
	CONSTRAINT "certificates_serial_check" CHECK ("corp"."certificates"."serial" ~ '^[0-9A-Za-z]{4,40}$')
);
--> statement-breakpoint
CREATE TABLE "corp"."registries" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"autoridad" text NOT NULL,
	"estado" text NOT NULL,
	"referencia" text,
	"siguiente" text NOT NULL,
	"al_dia" boolean DEFAULT false NOT NULL,
	"folder" text NOT NULL,
	"document_id" text,
	"sort_order" smallint NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "corp"."share_events" (
	"id" text PRIMARY KEY NOT NULL,
	"fecha" date NOT NULL,
	"kind" text NOT NULL,
	"from_socio" smallint,
	"to_socio" smallint NOT NULL,
	"shares" integer NOT NULL,
	"note" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "share_events_kind_check" CHECK ("corp"."share_events"."kind" IN ('suscripcion', 'transmision')),
	CONSTRAINT "share_events_shares_check" CHECK ("corp"."share_events"."shares" > 0),
	CONSTRAINT "share_events_partners_check" CHECK ("corp"."share_events"."to_socio" IN (1, 2) AND (
        ("corp"."share_events"."kind" = 'suscripcion' AND "corp"."share_events"."from_socio" IS NULL)
        OR ("corp"."share_events"."kind" = 'transmision' AND "corp"."share_events"."from_socio" IN (1, 2) AND "corp"."share_events"."from_socio" <> "corp"."share_events"."to_socio")))
);
--> statement-breakpoint
ALTER TABLE "corp"."company" ADD COLUMN "administrador" smallint;--> statement-breakpoint
ALTER TABLE "corp"."registries" ADD CONSTRAINT "registries_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "corp"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corp"."company" ADD CONSTRAINT "company_administrador_check" CHECK ("corp"."company"."administrador" IS NULL OR "corp"."company"."administrador" IN (1, 2));