CREATE TABLE "billing_customers" (
	"business_id" text PRIMARY KEY NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_customers_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "stripe_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"stripe_subscription_id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"interval" text NOT NULL,
	"status" text NOT NULL,
	"stripe_status" text NOT NULL,
	"trial_end" timestamp with time zone,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancel_at" timestamp with time zone,
	"collection_method" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "subscriptions_business_idx" ON "subscriptions" USING btree ("business_id","updated_at");