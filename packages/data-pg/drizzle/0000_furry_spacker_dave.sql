CREATE TABLE "businesses" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"regimen_fiscal" text NOT NULL,
	"isr_tasa" integer NOT NULL,
	"logo_url" text,
	"tipo_negocio" text DEFAULT 'mixto' NOT NULL,
	"categoria_venta_predeterminada" text DEFAULT 'Producto' NOT NULL,
	"atributos_producto" text DEFAULT '[]' NOT NULL,
	"enabled_payment_methods" text DEFAULT '["Efectivo","Transferencia","Tarjeta","QR/CoDi"]' NOT NULL,
	"feature_flags" text DEFAULT '{"stock":true,"conversionMateriaPrima":false,"conversionAutomatica":false,"auditoriaInventario":false,"merma":false,"ventasCredito":false}' NOT NULL,
	"business_id" text NOT NULL,
	"device_id" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"telefono" text,
	"email" text,
	"nota" text,
	"business_id" text NOT NULL,
	"device_id" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"puesto" text NOT NULL,
	"salario_centavos" bigint NOT NULL,
	"periodo" text NOT NULL,
	"business_id" text NOT NULL,
	"device_id" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"email" text,
	"pin_hash" text NOT NULL,
	"recovery_password_hash" text NOT NULL,
	"role" text NOT NULL,
	"must_change_pin" boolean DEFAULT false NOT NULL,
	"avatar_color" text DEFAULT 'blue' NOT NULL,
	"permissions" text DEFAULT '{}' NOT NULL,
	"business_id" text NOT NULL,
	"device_id" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "auditorias_inventario" (
	"id" text PRIMARY KEY NOT NULL,
	"fecha" text NOT NULL,
	"estado" text NOT NULL,
	"lineas" text NOT NULL,
	"total_discrepancias" integer DEFAULT 0 NOT NULL,
	"total_productos" integer NOT NULL,
	"productos_contados" integer DEFAULT 0 NOT NULL,
	"business_id" text NOT NULL,
	"device_id" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "conversion_recetas" (
	"id" text PRIMARY KEY NOT NULL,
	"materia_prima_id" text NOT NULL,
	"producto_resultante_id" text NOT NULL,
	"cantidad_origen" integer NOT NULL,
	"cantidad_resultante" integer NOT NULL,
	"business_id" text NOT NULL,
	"device_id" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "conversions" (
	"id" text PRIMARY KEY NOT NULL,
	"receta_id" text NOT NULL,
	"materia_prima_id" text NOT NULL,
	"producto_resultante_id" text NOT NULL,
	"cantidad_origen_usada" integer NOT NULL,
	"cantidad_resultante_creada" integer NOT NULL,
	"movimiento_salida_id" text NOT NULL,
	"movimiento_entrada_id" text NOT NULL,
	"business_id" text NOT NULL,
	"device_id" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" text PRIMARY KEY NOT NULL,
	"producto_id" text NOT NULL,
	"fecha" text NOT NULL,
	"tipo" text NOT NULL,
	"cantidad" integer NOT NULL,
	"costo_unit_centavos" bigint NOT NULL,
	"motivo" text NOT NULL,
	"nota" text,
	"business_id" text NOT NULL,
	"device_id" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"sku" text,
	"categoria" text NOT NULL,
	"costo_unit_centavos" bigint NOT NULL,
	"unidad" text NOT NULL,
	"umbral_stock_bajo" integer DEFAULT 3 NOT NULL,
	"tipo" text DEFAULT 'producto' NOT NULL,
	"seguir_stock" boolean DEFAULT true NOT NULL,
	"precio_venta_centavos" bigint DEFAULT 0 NOT NULL,
	"atributos" text DEFAULT '{}' NOT NULL,
	"color_fondo" text DEFAULT 'white' NOT NULL,
	"uso_producto" text DEFAULT 'venta' NOT NULL,
	"icono" text,
	"business_id" text NOT NULL,
	"device_id" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "client_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"venta_id" text NOT NULL,
	"fecha" text NOT NULL,
	"monto_centavos" bigint NOT NULL,
	"metodo" text NOT NULL,
	"nota" text,
	"business_id" text NOT NULL,
	"device_id" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "entregas_credito" (
	"id" text PRIMARY KEY NOT NULL,
	"cliente_id" text NOT NULL,
	"fecha" text NOT NULL,
	"total_centavos" bigint NOT NULL,
	"nota" text,
	"sale_ids" text NOT NULL,
	"business_id" text NOT NULL,
	"device_id" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"fecha" text NOT NULL,
	"concepto" text NOT NULL,
	"categoria" text NOT NULL,
	"monto_centavos" bigint NOT NULL,
	"proveedor" text,
	"gasto_recurrente_id" text,
	"business_id" text NOT NULL,
	"device_id" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "recurring_expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"concepto" text NOT NULL,
	"categoria" text NOT NULL,
	"monto_centavos" bigint NOT NULL,
	"proveedor" text,
	"frecuencia" text NOT NULL,
	"dia_del_mes" integer,
	"dia_de_la_semana" integer,
	"proximo_disparo" text NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"business_id" text NOT NULL,
	"device_id" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" text PRIMARY KEY NOT NULL,
	"fecha" text NOT NULL,
	"hora" text,
	"concepto" text NOT NULL,
	"categoria" text NOT NULL,
	"monto_centavos" bigint NOT NULL,
	"metodo" text NOT NULL,
	"cliente_id" text,
	"estado_pago" text NOT NULL,
	"producto_id" text NOT NULL,
	"cantidad" integer DEFAULT 1 NOT NULL,
	"efectivo_recibido_centavos" bigint,
	"cancelled_by_user_id" text,
	"cancel_motivo" text,
	"cancelled_at" timestamp with time zone,
	"caja_turno_id" text,
	"business_id" text NOT NULL,
	"device_id" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "caja_movimientos" (
	"id" text PRIMARY KEY NOT NULL,
	"turno_id" text NOT NULL,
	"tipo" text NOT NULL,
	"monto_centavos" bigint NOT NULL,
	"motivo" text NOT NULL,
	"user_id" text NOT NULL,
	"business_id" text NOT NULL,
	"device_id" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "caja_turnos" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"fecha" text NOT NULL,
	"apertura_at" timestamp with time zone NOT NULL,
	"cierre_at" timestamp with time zone,
	"monto_apertura_centavos" bigint NOT NULL,
	"efectivo_adicional_centavos" bigint NOT NULL,
	"monto_cierre_centavos" bigint,
	"efectivo_esperado_centavos" bigint,
	"diferencia_centavos" bigint,
	"discrepancy_reason" text,
	"explicacion" text,
	"total_transferencias" bigint DEFAULT 0 NOT NULL,
	"total_tarjeta" bigint DEFAULT 0 NOT NULL,
	"total_qr" bigint DEFAULT 0 NOT NULL,
	"total_credito" bigint DEFAULT 0 NOT NULL,
	"egreso_auto_id" text,
	"conteo_centavos" bigint,
	"conteo_at" timestamp with time zone,
	"business_id" text NOT NULL,
	"device_id" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "cancelacion_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"sale_id" text NOT NULL,
	"cancelled_by_user_id" text NOT NULL,
	"motivo" text NOT NULL,
	"monto_original_centavos" bigint NOT NULL,
	"metodo_original" text NOT NULL,
	"cash_returned_centavos" bigint,
	"stock_reversed" boolean DEFAULT false NOT NULL,
	"cantidad_devuelta" integer,
	"producto_id" text,
	"business_id" text NOT NULL,
	"device_id" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "day_closes" (
	"id" text PRIMARY KEY NOT NULL,
	"fecha" text NOT NULL,
	"efectivo_esperado_centavos" bigint NOT NULL,
	"efectivo_contado_centavos" bigint NOT NULL,
	"diferencia_centavos" bigint NOT NULL,
	"explicacion" text,
	"cerrado_por" text NOT NULL,
	"business_id" text NOT NULL,
	"device_id" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "activation_codes" (
	"code" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"redeemed_at" timestamp with time zone,
	"redeemed_by_device_id" text,
	"business_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_members" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"business_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"plataforma" text NOT NULL,
	"modelo" text,
	"last_push_at" timestamp with time zone,
	"last_pull_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"business_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metas" (
	"id" text PRIMARY KEY NOT NULL,
	"objetivo" text NOT NULL,
	"motivo" text NOT NULL,
	"nivel" text NOT NULL,
	"objetivo_centavos" bigint NOT NULL,
	"periodo" text NOT NULL,
	"lograda" boolean,
	"resultado_centavos" bigint,
	"cerrada_at" timestamp with time zone,
	"business_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notices" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"severity" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"cta_label" text,
	"cta_href" text,
	"state" text DEFAULT 'nuevo' NOT NULL,
	"data" jsonb,
	"resolved_at" timestamp with time zone,
	"business_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_log" (
	"seq" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sync_log_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"table_name" text NOT NULL,
	"row_id" text NOT NULL,
	"op" text NOT NULL,
	"business_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_rejections" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"table_name" text NOT NULL,
	"row_id" text NOT NULL,
	"code" text NOT NULL,
	"payload" jsonb,
	"received_at" timestamp with time zone NOT NULL,
	"resolved_at" timestamp with time zone,
	"business_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "notices_business_created_idx" ON "notices" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "sync_log_business_seq_idx" ON "sync_log" USING btree ("business_id","seq");