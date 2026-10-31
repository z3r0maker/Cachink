CREATE TABLE "corp"."blobs" (
	"key" text PRIMARY KEY NOT NULL,
	"content" "bytea" NOT NULL,
	CONSTRAINT "blobs_size_check" CHECK (octet_length("corp"."blobs"."content") BETWEEN 1 AND 4194304)
);
--> statement-breakpoint
ALTER TABLE "corp"."documents" ADD COLUMN "storage" text;--> statement-breakpoint
ALTER TABLE "corp"."documents" ADD COLUMN "blob_key" text;--> statement-breakpoint
ALTER TABLE "corp"."documents" ADD CONSTRAINT "documents_blob_key_unique" UNIQUE("blob_key");--> statement-breakpoint
-- E-26 (hand-added after the generated part): every file kept so far moves
-- into the Postgres BlobStore under its document's id, and the document points
-- at it. 0007 then drops `documents.content`. The two run in order, each in its
-- own transaction; if 0007 failed, the files would still be in both places.
INSERT INTO "corp"."blobs" ("key", "content") SELECT "id", "content" FROM "corp"."documents";--> statement-breakpoint
UPDATE "corp"."documents" SET "storage" = 'pg', "blob_key" = "id";
