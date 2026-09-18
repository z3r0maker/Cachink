CREATE TABLE "usage_counters" (
	"business_id" text NOT NULL,
	"period" text NOT NULL,
	"transactions" integer NOT NULL,
	"products" integer NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usage_counters_business_id_period_pk" PRIMARY KEY("business_id","period")
);
--> statement-breakpoint
CREATE TABLE "usage_notices" (
	"idempotency_key" text NOT NULL,
	"recipient" text NOT NULL,
	"business_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone,
	CONSTRAINT "usage_notices_idempotency_key_recipient_pk" PRIMARY KEY("idempotency_key","recipient")
);
--> statement-breakpoint
CREATE TABLE "cfdi_globals" (
	"id" text PRIMARY KEY NOT NULL,
	"period" text NOT NULL,
	"sequence" bigint NOT NULL,
	"payment_ids" jsonb NOT NULL,
	"status" text NOT NULL,
	"invoice_provider_id" text,
	"invoice_uuid" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cfdi_payments" (
	"external_payment_id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"route" text NOT NULL,
	"status" text NOT NULL,
	"total_centavos" bigint NOT NULL,
	"paid_at" timestamp with time zone NOT NULL,
	"period" text NOT NULL,
	"forma_pago" text NOT NULL,
	"description" text NOT NULL,
	"receptor" jsonb,
	"global_reasons" jsonb,
	"invoice_provider_id" text,
	"invoice_uuid" text,
	"complement_provider_id" text,
	"complement_uuid" text,
	"global_id" text,
	"cancellation" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "cfdi_globals_period_idx" ON "cfdi_globals" USING btree ("period","sequence");--> statement-breakpoint
CREATE INDEX "cfdi_payments_period_status_idx" ON "cfdi_payments" USING btree ("period","status","paid_at");