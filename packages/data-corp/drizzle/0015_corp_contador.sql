CREATE TABLE "corp"."account_code_lists" (
	"id" text PRIMARY KEY NOT NULL,
	"captured_by" text NOT NULL,
	"captured_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corp"."account_code_validations" (
	"id" text PRIMARY KEY NOT NULL,
	"list_id" text NOT NULL,
	"validated_on" date NOT NULL,
	"marked_by" text NOT NULL,
	"marked_at" timestamp with time zone NOT NULL,
	CONSTRAINT "account_code_validations_list_id_unique" UNIQUE("list_id")
);
--> statement-breakpoint
CREATE TABLE "corp"."account_codes" (
	"list_id" text NOT NULL,
	"account" text NOT NULL,
	"code" text NOT NULL,
	CONSTRAINT "account_codes_list_id_account_pk" PRIMARY KEY("list_id","account"),
	CONSTRAINT "account_codes_code_check" CHECK ("corp"."account_codes"."code" ~ '^[0-9]{3}([.][0-9]{2})?$')
);
--> statement-breakpoint
ALTER TABLE "corp"."account_code_validations" ADD CONSTRAINT "account_code_validations_list_id_account_code_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "corp"."account_code_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corp"."account_codes" ADD CONSTRAINT "account_codes_list_id_account_code_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "corp"."account_code_lists"("id") ON DELETE no action ON UPDATE no action;