-- ============================================================
-- §1  ENTITY TABLES (FK-dependency order)
-- ============================================================

-- 1. businesses (no FK deps)
CREATE TABLE businesses (
  id TEXT PRIMARY KEY NOT NULL,
  nombre TEXT NOT NULL,
  regimen_fiscal TEXT NOT NULL,
  isr_tasa INTEGER NOT NULL,
  logo_url TEXT,
  tipo_negocio TEXT NOT NULL DEFAULT 'mixto' CHECK (tipo_negocio IN ('producto-con-stock','producto-sin-stock','servicio','mixto')),
  categoria_venta_predeterminada TEXT NOT NULL DEFAULT 'Producto' CHECK (categoria_venta_predeterminada IN ('Producto','Servicio','Anticipo','Suscripción','Otro')),
  atributos_producto TEXT NOT NULL DEFAULT '[]',
  feature_flags TEXT NOT NULL DEFAULT '{"stock":true,"conversionMateriaPrima":false,"conversionAutomatica":false,"caja":false,"auditoriaInventario":false,"merma":false,"ventasCredito":false}',
  enabled_payment_methods TEXT NOT NULL DEFAULT '["Efectivo","Transferencia","Tarjeta","QR/CoDi"]',
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
--> statement-breakpoint

-- 2. app_config (no FK deps)
CREATE TABLE app_config (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
--> statement-breakpoint

-- 3. users (no FK deps besides business_id — enforced at app layer)
CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT,
  pin_hash TEXT NOT NULL,
  recovery_password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('operativo','director')),
  must_change_pin INTEGER NOT NULL DEFAULT 0,
  avatar_color TEXT NOT NULL DEFAULT 'blue',
  permissions TEXT NOT NULL DEFAULT '{}',
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
--> statement-breakpoint

-- 4. products (no FK deps)
CREATE TABLE products (
  id TEXT PRIMARY KEY NOT NULL,
  nombre TEXT NOT NULL,
  sku TEXT,
  categoria TEXT NOT NULL CHECK (categoria IN ('Materia Prima','Producto Terminado','Empaque','Herramienta','Insumo','Otro')),
  costo_unit_centavos INTEGER NOT NULL,
  unidad TEXT NOT NULL CHECK (unidad IN ('pza','kg','lt','m','caja','bolsa','rollo','par','otro')),
  umbral_stock_bajo INTEGER NOT NULL DEFAULT 3,
  tipo TEXT NOT NULL DEFAULT 'producto' CHECK (tipo IN ('producto','servicio')),
  seguir_stock INTEGER NOT NULL DEFAULT 1,
  precio_venta_centavos INTEGER NOT NULL DEFAULT 0,
  atributos TEXT NOT NULL DEFAULT '{}',
  color_fondo TEXT NOT NULL DEFAULT 'white' CHECK (color_fondo IN ('white','yellow','green','blue','pink','purple','peach','gray')),
  uso_producto TEXT NOT NULL DEFAULT 'venta' CHECK (uso_producto IN ('venta','materia-prima','ambos')),
  icono TEXT,
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
--> statement-breakpoint

-- 5. clients (no FK deps)
CREATE TABLE clients (
  id TEXT PRIMARY KEY NOT NULL,
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  nota TEXT,
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
--> statement-breakpoint

-- 6. recurring_expenses (no FK deps)
CREATE TABLE recurring_expenses (
  id TEXT PRIMARY KEY NOT NULL,
  concepto TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('Materia Prima','Inventario','Nómina','Renta','Servicios','Publicidad','Mantenimiento','Impuestos','Logística','Otro')),
  monto_centavos INTEGER NOT NULL,
  proveedor TEXT,
  frecuencia TEXT NOT NULL CHECK (frecuencia IN ('semanal','quincenal','mensual')),
  dia_del_mes INTEGER,
  dia_de_la_semana INTEGER,
  proximo_disparo TEXT NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1,
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
--> statement-breakpoint

-- 7. sales (→ products, clients)
CREATE TABLE sales (
  id TEXT PRIMARY KEY NOT NULL,
  fecha TEXT NOT NULL,
  hora TEXT,
  concepto TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('Producto','Servicio','Anticipo','Suscripción','Otro')),
  monto_centavos INTEGER NOT NULL,
  metodo TEXT NOT NULL CHECK (metodo IN ('Efectivo','Transferencia','Tarjeta','QR/CoDi','Crédito')),
  cliente_id TEXT REFERENCES clients(id),
  estado_pago TEXT NOT NULL CHECK (estado_pago IN ('pagado','pendiente','parcial')),
  producto_id TEXT NOT NULL REFERENCES products(id),
  cantidad INTEGER NOT NULL DEFAULT 1,
  efectivo_recibido_centavos INTEGER,
  cancelled_by_user_id TEXT,
  cancel_motivo TEXT,
  cancelled_at TEXT,
  caja_turno_id TEXT REFERENCES caja_turnos(id),
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
--> statement-breakpoint

-- 8. expenses (→ recurring_expenses)
CREATE TABLE expenses (
  id TEXT PRIMARY KEY NOT NULL,
  fecha TEXT NOT NULL,
  concepto TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('Materia Prima','Inventario','Nómina','Renta','Servicios','Publicidad','Mantenimiento','Impuestos','Logística','Otro')),
  monto_centavos INTEGER NOT NULL,
  proveedor TEXT,
  gasto_recurrente_id TEXT REFERENCES recurring_expenses(id),
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
--> statement-breakpoint

-- 9. inventory_movements (→ products)
CREATE TABLE inventory_movements (
  id TEXT PRIMARY KEY NOT NULL,
  producto_id TEXT NOT NULL REFERENCES products(id),
  fecha TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada','salida')),
  cantidad INTEGER NOT NULL,
  costo_unit_centavos INTEGER NOT NULL,
  motivo TEXT NOT NULL,
  nota TEXT,
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
--> statement-breakpoint

-- 10. employees (no FK deps)
CREATE TABLE employees (
  id TEXT PRIMARY KEY NOT NULL,
  nombre TEXT NOT NULL,
  puesto TEXT NOT NULL,
  salario_centavos INTEGER NOT NULL,
  periodo TEXT NOT NULL CHECK (periodo IN ('semanal','quincenal','mensual')),
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
--> statement-breakpoint

-- 11. client_payments (→ sales)
CREATE TABLE client_payments (
  id TEXT PRIMARY KEY NOT NULL,
  venta_id TEXT NOT NULL REFERENCES sales(id),
  fecha TEXT NOT NULL,
  monto_centavos INTEGER NOT NULL,
  metodo TEXT NOT NULL CHECK (metodo IN ('Efectivo','Transferencia','Tarjeta','QR/CoDi','Crédito')),
  nota TEXT,
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
--> statement-breakpoint

-- 12. day_closes (no FK deps) + UNIQUE constraint
CREATE TABLE day_closes (
  id TEXT PRIMARY KEY NOT NULL,
  fecha TEXT NOT NULL,
  efectivo_esperado_centavos INTEGER NOT NULL,
  efectivo_contado_centavos INTEGER NOT NULL,
  diferencia_centavos INTEGER NOT NULL,
  explicacion TEXT,
  cerrado_por TEXT NOT NULL CHECK (cerrado_por IN ('Operativo','Director')),
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE(fecha, business_id, device_id)
);
--> statement-breakpoint

-- 13. caja_turnos (→ users, expenses)
CREATE TABLE caja_turnos (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  fecha TEXT NOT NULL,
  apertura_at TEXT NOT NULL,
  cierre_at TEXT,
  monto_apertura_centavos INTEGER NOT NULL,
  efectivo_adicional_centavos INTEGER NOT NULL,
  monto_cierre_centavos INTEGER,
  efectivo_esperado_centavos INTEGER,
  diferencia_centavos INTEGER,
  discrepancy_reason TEXT,
  explicacion TEXT,
  total_transferencias INTEGER NOT NULL DEFAULT 0,
  total_tarjeta INTEGER NOT NULL DEFAULT 0,
  total_qr INTEGER NOT NULL DEFAULT 0,
  total_credito INTEGER NOT NULL DEFAULT 0,
  egreso_auto_id TEXT REFERENCES expenses(id),
  conteo_centavos INTEGER,
  conteo_at TEXT,
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
--> statement-breakpoint

-- 14. caja_movimientos (→ caja_turnos, users)
CREATE TABLE caja_movimientos (
  id TEXT PRIMARY KEY NOT NULL,
  turno_id TEXT NOT NULL REFERENCES caja_turnos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('deposito','retiro')),
  monto_centavos INTEGER NOT NULL,
  motivo TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
--> statement-breakpoint

-- 15. cancelacion_logs (→ sales, products)
CREATE TABLE cancelacion_logs (
  id TEXT PRIMARY KEY NOT NULL,
  sale_id TEXT NOT NULL REFERENCES sales(id),
  cancelled_by_user_id TEXT NOT NULL,
  motivo TEXT NOT NULL,
  monto_original_centavos INTEGER NOT NULL,
  metodo_original TEXT NOT NULL CHECK (metodo_original IN ('Efectivo','Transferencia','Tarjeta','QR/CoDi','Crédito')),
  cash_returned_centavos INTEGER,
  stock_reversed INTEGER NOT NULL DEFAULT 0,
  cantidad_devuelta INTEGER,
  producto_id TEXT REFERENCES products(id),
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
--> statement-breakpoint

-- 16. conversion_recetas (→ products) + UNIQUE constraint
CREATE TABLE conversion_recetas (
  id TEXT PRIMARY KEY NOT NULL,
  materia_prima_id TEXT NOT NULL REFERENCES products(id),
  producto_resultante_id TEXT NOT NULL REFERENCES products(id),
  cantidad_origen INTEGER NOT NULL,
  cantidad_resultante INTEGER NOT NULL,
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE(materia_prima_id, producto_resultante_id, business_id)
);
--> statement-breakpoint

-- 17. conversions (→ conversion_recetas, products, inventory_movements)
CREATE TABLE conversions (
  id TEXT PRIMARY KEY NOT NULL,
  receta_id TEXT NOT NULL REFERENCES conversion_recetas(id),
  materia_prima_id TEXT NOT NULL REFERENCES products(id),
  producto_resultante_id TEXT NOT NULL REFERENCES products(id),
  cantidad_origen_usada INTEGER NOT NULL,
  cantidad_resultante_creada INTEGER NOT NULL,
  movimiento_salida_id TEXT NOT NULL REFERENCES inventory_movements(id),
  movimiento_entrada_id TEXT NOT NULL REFERENCES inventory_movements(id),
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
--> statement-breakpoint

-- 18. auditorias_inventario (no FK deps)
CREATE TABLE auditorias_inventario (
  id TEXT PRIMARY KEY NOT NULL,
  fecha TEXT NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('borrador','finalizada')),
  lineas TEXT NOT NULL,
  total_discrepancias INTEGER NOT NULL DEFAULT 0,
  total_productos INTEGER NOT NULL,
  productos_contados INTEGER NOT NULL DEFAULT 0,
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
--> statement-breakpoint

-- 19. entregas_credito (→ clients)
CREATE TABLE entregas_credito (
  id TEXT PRIMARY KEY NOT NULL,
  cliente_id TEXT NOT NULL REFERENCES clients(id),
  fecha TEXT NOT NULL,
  total_centavos INTEGER NOT NULL,
  nota TEXT,
  sale_ids TEXT NOT NULL,
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
--> statement-breakpoint

-- 20. director_alerts (no FK deps)
CREATE TABLE director_alerts (
  id TEXT PRIMARY KEY NOT NULL,
  source TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info','warning','critical')),
  title_key TEXT NOT NULL,
  message TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  action_route TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
--> statement-breakpoint

-- ============================================================
-- §2  SYNC INFRASTRUCTURE TABLES
-- ============================================================

CREATE TABLE __cachink_change_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  table_name TEXT NOT NULL,
  row_id TEXT NOT NULL,
  row_updated_at TEXT NOT NULL,
  row_device_id TEXT NOT NULL,
  op TEXT NOT NULL,
  captured_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (op IN ('insert', 'update'))
);
--> statement-breakpoint
CREATE TABLE __cachink_sync_state (
  scope TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE __cachink_conflicts (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  detected_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  direction TEXT NOT NULL,
  table_name TEXT NOT NULL,
  row_id TEXT NOT NULL,
  loser_updated_at TEXT NOT NULL,
  loser_device_id TEXT NOT NULL,
  winner_updated_at TEXT NOT NULL,
  winner_device_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  CHECK (direction IN ('inbound', 'outbound'))
);
--> statement-breakpoint
CREATE INDEX idx_cachink_conflicts_detected_at
  ON __cachink_conflicts (detected_at);
--> statement-breakpoint

-- ============================================================
-- §3  CHANGE-LOG TRIGGERS
-- ============================================================

CREATE TRIGGER trg_sales_ai AFTER INSERT ON sales
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('sales', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER trg_sales_au AFTER UPDATE ON sales
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('sales', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER trg_expenses_ai AFTER INSERT ON expenses
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('expenses', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER trg_expenses_au AFTER UPDATE ON expenses
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('expenses', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER trg_products_ai AFTER INSERT ON products
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('products', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER trg_products_au AFTER UPDATE ON products
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('products', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER trg_inventory_movements_ai AFTER INSERT ON inventory_movements
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('inventory_movements', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER trg_inventory_movements_au AFTER UPDATE ON inventory_movements
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('inventory_movements', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER trg_employees_ai AFTER INSERT ON employees
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('employees', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER trg_employees_au AFTER UPDATE ON employees
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('employees', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER trg_clients_ai AFTER INSERT ON clients
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('clients', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER trg_clients_au AFTER UPDATE ON clients
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('clients', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER trg_client_payments_ai AFTER INSERT ON client_payments
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('client_payments', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER trg_client_payments_au AFTER UPDATE ON client_payments
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('client_payments', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER trg_day_closes_ai AFTER INSERT ON day_closes
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('day_closes', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER trg_day_closes_au AFTER UPDATE ON day_closes
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('day_closes', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER trg_recurring_expenses_ai AFTER INSERT ON recurring_expenses
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('recurring_expenses', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER trg_recurring_expenses_au AFTER UPDATE ON recurring_expenses
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('recurring_expenses', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER trg_businesses_ai AFTER INSERT ON businesses
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('businesses', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER trg_businesses_au AFTER UPDATE ON businesses
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('businesses', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint

-- ============================================================
-- §4  PARTIAL INDEXES (hot-path query optimization)
-- ============================================================

CREATE INDEX idx_sales_biz_fecha
  ON sales(business_id, fecha)
  WHERE deleted_at IS NULL;
--> statement-breakpoint
CREATE INDEX idx_sales_cliente
  ON sales(cliente_id)
  WHERE deleted_at IS NULL;
--> statement-breakpoint
CREATE INDEX idx_expenses_biz_fecha
  ON expenses(business_id, fecha)
  WHERE deleted_at IS NULL;
--> statement-breakpoint
CREATE INDEX idx_expenses_recurrente_fecha
  ON expenses(gasto_recurrente_id, fecha)
  WHERE deleted_at IS NULL;
--> statement-breakpoint
CREATE INDEX idx_invmov_producto
  ON inventory_movements(producto_id)
  WHERE deleted_at IS NULL;
--> statement-breakpoint
CREATE INDEX idx_client_payments_venta
  ON client_payments(venta_id)
  WHERE deleted_at IS NULL;
--> statement-breakpoint
CREATE INDEX idx_day_closes_biz_fecha
  ON day_closes(business_id, fecha)
  WHERE deleted_at IS NULL;
--> statement-breakpoint
CREATE INDEX idx_products_biz
  ON products(business_id)
  WHERE deleted_at IS NULL;
--> statement-breakpoint
CREATE INDEX idx_employees_biz
  ON employees(business_id)
  WHERE deleted_at IS NULL;
--> statement-breakpoint
CREATE INDEX idx_clients_biz
  ON clients(business_id)
  WHERE deleted_at IS NULL;
--> statement-breakpoint
CREATE INDEX idx_recurring_expenses_biz
  ON recurring_expenses(business_id)
  WHERE deleted_at IS NULL;
--> statement-breakpoint

-- ============================================================
-- §5  COMPOSITE INDEX (sync pagination)
-- ============================================================

CREATE INDEX idx_changelog_table_row
  ON __cachink_change_log(table_name, row_id);
