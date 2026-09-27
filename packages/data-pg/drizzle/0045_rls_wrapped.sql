-- xangarro:no-transaction
--
-- Every tenant policy calls `xangarro.current_business_id()` wrapped in a
-- scalar sub-select (DB2-RLS-01; downgrades DB-RLS-02). 11 of 40 already did;
-- these 29 still called it bare, so the planner may evaluate it — parsing the
-- JWT claim JSON — once per row instead of once per statement (an InitPlan).
-- The audit measured little difference on indexed access and a 2× gain on
-- plans that mix tables; this is for consistency and cheaper sequential
-- scans, not a rescue.
--
-- Same predicate, same roles, same command: `ALTER POLICY` rewrites only the
-- expressions. No transaction: each ALTER takes its table's ACCESS EXCLUSIVE
-- lock for an instant, and one per commit means no statement ever holds a
-- hot table's lock while it queues behind the next one. Every statement is
-- repeatable, so a run that stops on `lock_timeout` is simply run again.
--
-- While an ALTER waits for its lock, every new reader of that table queues
-- behind it — at 3 s the audit saw a plain `count(*)` on sales stall 2.5 s
-- (DB3-MIG-01). So each waits only 200 ms, and the runner retries the
-- statement with backoff (up to 20 tries, 250 ms doubling to 5 s) when it
-- expires. Run it in the 00:00–06:00 trough all the same.
-- `tests/migration-scale.integration.test.ts` fails if any policy is left
-- unwrapped.

SET lock_timeout = '200ms';

ALTER POLICY tenant_isolation ON public.activation_codes
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.auditorias_inventario
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_read ON public.billing_customers USING (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.business_members
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.businesses
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.caja_movimientos
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.caja_turnos
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.cancelacion_logs
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.client_payments
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.clients
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.conversion_recetas
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.conversions
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.day_closes
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.devices
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.employees
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.entregas_credito
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.expenses
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.inventory_movements
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.metas
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.notices
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.products
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.recurring_expenses
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.sales
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_read ON public.subscriptions USING (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.sync_cursors
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.sync_log
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.sync_receipts
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.sync_rejections
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
ALTER POLICY tenant_isolation ON public.users
  USING (business_id = (SELECT xangarro.current_business_id())) WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
