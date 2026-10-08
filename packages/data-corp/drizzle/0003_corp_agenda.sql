CREATE TABLE "corp"."company" (
	"id" text PRIMARY KEY NOT NULL,
	"inscripcion_rfc" date,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corp"."documents" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"filename" text NOT NULL,
	"mime" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"sha256" text NOT NULL,
	"content" "bytea" NOT NULL,
	"obligation_id" text,
	"entry_id" text,
	"retain_until" date NOT NULL,
	"supersedes_id" text,
	"uploaded_by" text NOT NULL,
	"uploaded_at" timestamp with time zone NOT NULL,
	CONSTRAINT "documents_supersedes_id_unique" UNIQUE("supersedes_id"),
	CONSTRAINT "documents_size_check" CHECK ("corp"."documents"."size_bytes" > 0 AND "corp"."documents"."size_bytes" <= 4194304 AND octet_length("corp"."documents"."content") = "corp"."documents"."size_bytes"),
	CONSTRAINT "documents_sha256_check" CHECK ("corp"."documents"."sha256" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "corp"."obligations" (
	"id" text PRIMARY KEY NOT NULL,
	"template_id" text NOT NULL,
	"period" text NOT NULL,
	"title" text,
	"status" text DEFAULT 'pendiente' NOT NULL,
	"no_payment" boolean DEFAULT false NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "obligations_template_period_unique" UNIQUE("template_id","period"),
	CONSTRAINT "obligations_status_check" CHECK ("corp"."obligations"."status" IN ('pendiente', 'preparada', 'presentada', 'pagada'))
);
--> statement-breakpoint
ALTER TABLE "corp"."documents" ADD CONSTRAINT "documents_obligation_id_obligations_id_fk" FOREIGN KEY ("obligation_id") REFERENCES "corp"."obligations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corp"."documents" ADD CONSTRAINT "documents_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "corp"."entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corp"."documents" ADD CONSTRAINT "documents_supersedes_id_documents_id_fk" FOREIGN KEY ("supersedes_id") REFERENCES "corp"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_obligation_idx" ON "corp"."documents" USING btree ("obligation_id");