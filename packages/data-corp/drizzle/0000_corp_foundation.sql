CREATE SCHEMA "corp";
--> statement-breakpoint
CREATE TABLE "corp"."founders" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_member_id" text NOT NULL,
	"numero" smallint NOT NULL,
	"nombre" text NOT NULL,
	"rfc" text,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "founders_staff_member_id_unique" UNIQUE("staff_member_id"),
	CONSTRAINT "founders_numero_unique" UNIQUE("numero"),
	CONSTRAINT "founders_numero_check" CHECK ("corp"."founders"."numero" IN (1, 2))
);
--> statement-breakpoint
CREATE TABLE "corp"."projects" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"nombre" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
