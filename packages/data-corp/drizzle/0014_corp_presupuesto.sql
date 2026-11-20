CREATE TABLE "corp"."budget_answers" (
	"budget_id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"founder_id" text NOT NULL,
	"at" timestamp with time zone NOT NULL,
	CONSTRAINT "budget_answers_kind_check" CHECK ("corp"."budget_answers"."kind" IN ('aprobado', 'rechazado'))
);
--> statement-breakpoint
CREATE TABLE "corp"."budget_lines" (
	"budget_id" text NOT NULL,
	"categoria" text NOT NULL,
	"monto" bigint NOT NULL,
	CONSTRAINT "budget_lines_budget_id_categoria_pk" PRIMARY KEY("budget_id","categoria"),
	CONSTRAINT "budget_lines_categoria_check" CHECK ("corp"."budget_lines"."categoria" IN ('costo_servicio', 'ventas_marketing', 'desarrollo', 'administracion')),
	CONSTRAINT "budget_lines_monto_check" CHECK ("corp"."budget_lines"."monto" >= 0)
);
--> statement-breakpoint
CREATE TABLE "corp"."budgets" (
	"id" text PRIMARY KEY NOT NULL,
	"quarter" text NOT NULL,
	"prepared_by" text NOT NULL,
	"prepared_at" timestamp with time zone NOT NULL,
	CONSTRAINT "budgets_quarter_check" CHECK ("corp"."budgets"."quarter" ~ '^[0-9]{4}-T[1-4]$')
);
--> statement-breakpoint
CREATE TABLE "corp"."spend_request_answers" (
	"request_id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"monto" bigint,
	"founder_id" text NOT NULL,
	"at" timestamp with time zone NOT NULL,
	CONSTRAINT "spend_request_answers_kind_check" CHECK ("corp"."spend_request_answers"."kind" IN ('aprobada', 'rechazada')),
	CONSTRAINT "spend_request_answers_monto_check" CHECK (("corp"."spend_request_answers"."kind" = 'aprobada') = ("corp"."spend_request_answers"."monto" IS NOT NULL AND "corp"."spend_request_answers"."monto" > 0))
);
--> statement-breakpoint
CREATE TABLE "corp"."spend_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"period" text NOT NULL,
	"founder_id" text NOT NULL,
	"concepto" text NOT NULL,
	"categoria" text NOT NULL,
	"monto" bigint NOT NULL,
	"automatica" boolean NOT NULL,
	"at" timestamp with time zone NOT NULL,
	CONSTRAINT "spend_requests_period_check" CHECK ("corp"."spend_requests"."period" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
	CONSTRAINT "spend_requests_categoria_check" CHECK ("corp"."spend_requests"."categoria" IN ('costo_servicio', 'ventas_marketing', 'desarrollo', 'administracion')),
	CONSTRAINT "spend_requests_monto_check" CHECK ("corp"."spend_requests"."monto" > 0),
	CONSTRAINT "spend_requests_concepto_check" CHECK (length(trim("corp"."spend_requests"."concepto")) > 0)
);
--> statement-breakpoint
ALTER TABLE "corp"."budget_answers" ADD CONSTRAINT "budget_answers_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "corp"."budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corp"."budget_lines" ADD CONSTRAINT "budget_lines_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "corp"."budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corp"."spend_request_answers" ADD CONSTRAINT "spend_request_answers_request_id_spend_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "corp"."spend_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "budgets_quarter_idx" ON "corp"."budgets" USING btree ("quarter");--> statement-breakpoint
CREATE INDEX "spend_requests_period_idx" ON "corp"."spend_requests" USING btree ("period","founder_id");