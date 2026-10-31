ALTER TABLE "corp"."documents" DROP CONSTRAINT "documents_size_check";--> statement-breakpoint
ALTER TABLE "corp"."documents" ALTER COLUMN "storage" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "corp"."documents" ALTER COLUMN "blob_key" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "corp"."documents" DROP COLUMN "content";--> statement-breakpoint
ALTER TABLE "corp"."documents" ADD CONSTRAINT "documents_storage_check" CHECK ("corp"."documents"."storage" IN ('pg', 'azure'));--> statement-breakpoint
ALTER TABLE "corp"."documents" ADD CONSTRAINT "documents_size_check" CHECK ("corp"."documents"."size_bytes" > 0 AND "corp"."documents"."size_bytes" <= 26214400);