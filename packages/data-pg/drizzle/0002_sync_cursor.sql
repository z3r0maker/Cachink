CREATE TABLE "sync_cursors" (
	"business_id" text PRIMARY KEY NOT NULL,
	"last_seq" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_receipts" (
	"table_name" text NOT NULL,
	"row_id" text NOT NULL,
	"seq" bigint NOT NULL,
	"device_id" text NOT NULL,
	"row_updated_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"business_id" text NOT NULL,
	CONSTRAINT "sync_receipts_business_id_table_name_row_id_pk" PRIMARY KEY("business_id","table_name","row_id")
);
--> statement-breakpoint
DROP INDEX "sync_log_business_seq_idx";--> statement-breakpoint
ALTER TABLE "sync_log" DROP CONSTRAINT "sync_log_pkey";--> statement-breakpoint
ALTER TABLE "sync_log" ALTER COLUMN "seq" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "sync_log" ALTER COLUMN "seq" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "sync_log" ADD CONSTRAINT "sync_log_business_id_seq_pk" PRIMARY KEY("business_id","seq");--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "acknowledged_through" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_rejections" ADD COLUMN "client_seq" integer;--> statement-breakpoint
ALTER TABLE "sync_rejections" ADD COLUMN "message" text;--> statement-breakpoint
CREATE UNIQUE INDEX "sync_rejections_device_row_uq" ON "sync_rejections" USING btree ("business_id","device_id","table_name","row_id");--> statement-breakpoint
CREATE INDEX "sync_rejections_business_idx" ON "sync_rejections" USING btree ("business_id","resolved_at");--> statement-breakpoint
-- Hand-added: start each tenant's counter at the highest seq it already has.
-- Existing seqs are kept, not renumbered — a device already holding a cursor
-- keeps a valid one — and every new seq is above them.
INSERT INTO "sync_cursors" ("business_id", "last_seq")
  SELECT "business_id", max("seq") FROM "sync_log" GROUP BY "business_id";
