# E2E Test Case Catalog

> Cachink! test-case reference — every operation, its edge cases, assigned layer, and current coverage status.
>
> **Legend**: ✅ covered | ⚠️ partial | ❌ missing
>
> **Layers**: **UC** = use-case unit test (`packages/application/tests/`), **FS** = fullstack scenario (`packages/data/tests/fullstack/`), **M** = Maestro flow (`apps/mobile/maestro/flows/`)
>
> **Priority**: P0 = blocks release, P1 = important, P2 = nice-to-have

---

## 1. Ventas (Sales)

| ID | Operation / Edge Case | Priority | Layer | Status | Existing Coverage |
|----|----------------------|----------|-------|--------|-------------------|
| VEN-01 | Registrar venta efectivo (happy path) | P0 | UC, FS, M | ✅ | `registrar-venta-use-case.test.ts`, `venta-efectivo.yaml` |
| VEN-02 | Registrar venta crédito con cliente válido | P0 | UC, FS, M | ✅ | `registrar-venta-use-case.test.ts`, `venta-credito.yaml` |
| VEN-03 | Registrar venta manual (sin producto) | P1 | UC, M | ✅ | `venta-manual.yaml` |
| VEN-04 | Registrar venta con cantidad múltiple | P1 | UC, M | ✅ | `registrar-venta-use-case.test.ts` (propagates cantidad), `venta-cantidad-multiple.yaml` |
| VEN-05 | Registrar venta otros métodos (Transferencia/Tarjeta/QR) | P1 | M | ✅ | `venta-otros-metodos.yaml` |
| VEN-06 | Editar venta (patch concepto/monto/método) | P1 | UC, M | ✅ | `editar-venta-use-case.test.ts`, `editar-venta.yaml` |
| VEN-07 | Cancelar venta con PIN correcto + reversal stock | P0 | UC, FS | ✅ | `cancelar-venta-use-case.test.ts` |
| VEN-08 | Eliminar venta | P1 | M | ✅ | `eliminar-venta.yaml` |
| VEN-09 | Venta crédito sin clienteId → rechazada | P0 | UC, FS | ✅ | `registrar-venta-use-case.test.ts` |
| VEN-10 | Venta crédito con cliente inexistente → rechazada | P0 | UC | ✅ | `registrar-venta-use-case.test.ts` |
| VEN-11 | Venta sin caja abierta → `CajaNoAbiertaError` | P0 | UC, FS | ✅ | `registrar-venta-use-case.test.ts`, `ventas-caja-gate.yaml` |
| VEN-12 | Venta con producto inexistente → rechazada | P0 | UC | ✅ | `registrar-venta-use-case.test.ts` |
| VEN-13 | Venta efectivo — stock deducted (seguirStock=true) | P0 | UC, FS | ✅ | `registrar-venta-use-case.test.ts` |
| VEN-14 | Venta efectivo — no movement when seguirStock=false | P1 | UC | ✅ | `registrar-venta-use-case.test.ts` |
| VEN-15 | Venta con stockEnabled=false → no stock movement | P1 | UC | ✅ | `registrar-venta-use-case.test.ts` |
| VEN-16 | Venta con stock insuficiente (allows negative stock) | P0 | FS, M | ✅ | `venta-lifecycle.fullstack.test.ts`, `venta-stock-insuficiente.yaml` — **Finding**: RegistrarVenta does NOT block; it creates salida movement regardless, allowing negative stock |
| VEN-17 | Cancelar venta — PIN incorrecto → rechazada | P0 | UC | ✅ | `cancelar-venta-use-case.test.ts` |
| VEN-18 | Cancelar venta — sin permiso → rechazada | P1 | UC | ✅ | `cancelar-venta-use-case.test.ts` |
| VEN-19 | Cancelar venta — ya cancelada → rechazada | P1 | UC | ✅ | `cancelar-venta-use-case.test.ts` |
| VEN-20 | Cancelar venta — stock reversal (entrada creada) | P0 | UC, FS | ✅ | `cancelar-venta-use-case.test.ts` |
| VEN-21 | Editar venta a Crédito requiere cliente | P1 | UC | ✅ | `editar-venta-use-case.test.ts` |
| VEN-22 | Venta search by product name | P2 | M | ✅ | `venta-search-product.yaml` |
| VEN-23 | Venta comprobante generation | P2 | M | ✅ | `venta-comprobante.yaml` |

---

## 2. Stock / Productos

| ID | Operation / Edge Case | Priority | Layer | Status | Existing Coverage |
|----|----------------------|----------|-------|--------|-------------------|
| STK-01 | Crear producto (happy path) | P0 | M | ✅ | `inventario-producto.yaml`, `producto-full-form.yaml` |
| STK-02 | Editar producto (nombre, precio, categoría) | P1 | UC, M | ✅ | `editar-producto-use-case.test.ts`, `editar-producto.yaml` |
| STK-03 | Eliminar producto | P1 | M | ✅ | `eliminar-producto.yaml` |
| STK-04 | Entrada inventario (auto-crea Egreso Inventario) | P0 | UC, FS | ✅ | `registrar-movimiento-inventario-use-case.test.ts`, `producto-entrada-stock.yaml` |
| STK-05 | Salida inventario con motivo | P1 | UC, M | ✅ | `movimiento-salida-con-motivo.yaml` |
| STK-06 | Historial movimientos de producto | P1 | M | ✅ | `producto-movimientos.yaml` |
| STK-07 | costoUnitCentavos no editable via EditarProducto | P1 | UC, FS | ⚠️ | `editar-producto-use-case.test.ts` — partial check |
| STK-08 | Venta con stock insuficiente → observed behavior | P0 | FS, M | ❌ | — see VEN-16 |
| STK-09 | Alertas stock bajo | P1 | M | ✅ | `stock-bajo-ver-link.yaml`, `notificaciones-stock-bajo.yaml`, `director-home-stock-bajo.yaml` |
| STK-10 | Búsqueda de stock | P2 | M | ✅ | `stock-buscar.yaml` |
| STK-11 | Entrada con nota | P2 | M | ✅ | `movimiento-entrada-con-nota.yaml` |
| STK-12 | Stock KPI strip | P2 | M | ✅ | `stock-kpi-strip.yaml` |
| STK-13 | Producto via FAB | P2 | M | ✅ | `producto-via-fab.yaml` |
| STK-14 | Producto uso selector (venta/materiaPrima/ambos) | P2 | M | ✅ | `producto-uso-selector.yaml` |
| STK-15 | Validation: required fields on producto form | P1 | M | ✅ | `validation-producto.yaml` |

---

## 3. Caja (Cash Drawer)

| ID | Operation / Edge Case | Priority | Layer | Status | Existing Coverage |
|----|----------------------|----------|-------|--------|-------------------|
| CAJ-01 | Abrir caja (happy path) | P0 | UC, FS, M | ✅ | `abrir-caja-use-case.test.ts`, `caja-abrir-cerrar.yaml` |
| CAJ-02 | Cerrar caja (happy path, sin discrepancia) | P0 | UC, FS, M | ✅ | `cerrar-caja-use-case.test.ts`, `caja-abrir-cerrar.yaml` |
| CAJ-03 | Retirar de caja abierta | P1 | UC, FS | ✅ | `retirar-caja-use-case.test.ts` |
| CAJ-04 | Depositar en caja abierta | P1 | UC, FS | ✅ | `depositar-caja-use-case.test.ts` |
| CAJ-05 | Doble apertura bloqueada (turno ya abierto) | P0 | UC, FS | ✅ | `abrir-caja-use-case.test.ts` |
| CAJ-06 | Cierre con discrepancia — exige razón | P0 | UC, FS, M | ✅ | `cerrar-caja-use-case.test.ts`, `caja-cierre-discrepancia.yaml` |
| CAJ-07 | Cierre razón=gasto-no-registrado → Egreso auto | P0 | UC, FS | ✅ | `cerrar-caja-use-case.test.ts` |
| CAJ-08 | Retiro/depósito sobre turno cerrado → rechazado | P0 | UC, FS | ✅ | `retirar-caja-use-case.test.ts`, `depositar-caja-use-case.test.ts` |
| CAJ-09 | Corte de día (happy path) | P0 | UC, FS | ✅ | `cerrar-corte-de-dia-use-case.test.ts`, `corte-de-dia.yaml` |
| CAJ-10 | Corte duplicado mismo día+device → rechazado | P0 | UC, FS | ✅ | `cerrar-corte-de-dia-use-case.test.ts` |
| CAJ-11 | Handoff (cierra turno A → abre turno B) | P1 | M | ✅ | `caja-handoff.yaml` |
| CAJ-12 | Caja con adicional (efectivoAdicionalCentavos) | P1 | M | ✅ | `caja-con-adicional.yaml` |
| CAJ-13 | Caja movimiento sobre turno cerrado (UI block) | P1 | FS, M | ✅ | `caja-dia-completo.fullstack.test.ts`, `caja-movimiento-turno-cerrado.yaml` |
| CAJ-14 | Corte duplicado mismo día (UI) | P1 | FS, M | ✅ | `caja-dia-completo.fullstack.test.ts`, `corte-duplicado-mismo-dia.yaml` |
| CAJ-15 | Corte con diferencia (discrepancy display) | P1 | M | ✅ | `corte-con-diferencia.yaml` |
| CAJ-16 | Corte historial director | P2 | M | ✅ | `corte-historial-director.yaml` |

---

## 4. Crédito (CxC — Cuentas por Cobrar)

| ID | Operation / Edge Case | Priority | Layer | Status | Existing Coverage |
|----|----------------------|----------|-------|--------|-------------------|
| CXC-01 | Venta crédito → estadoPago=pendiente | P0 | UC, FS | ✅ | `registrar-venta-use-case.test.ts` |
| CXC-02 | Pago parcial → estadoPago=parcial | P0 | UC, FS | ✅ | `registrar-pago-cliente-use-case.test.ts`, `cliente-pago-parcial.yaml` |
| CXC-03 | Pago completo → estadoPago=pagado | P0 | UC, FS | ✅ | `registrar-pago-cliente-use-case.test.ts`, `cliente-pago-completo.yaml` |
| CXC-04 | Sobrepago rechazado (monto > restante) | P0 | UC, FS | ✅ | `registrar-pago-cliente-use-case.test.ts` |
| CXC-05 | Pago sobre venta no-crédito → rechazado | P0 | UC, FS | ✅ | `registrar-pago-cliente-use-case.test.ts` |
| CXC-06 | Pago sobre venta ya pagada → rechazado | P0 | UC | ✅ | `registrar-pago-cliente-use-case.test.ts` |
| CXC-07 | Sobrepago rechazado en UI | P1 | FS, M | ✅ | `credito-lifecycle.fullstack.test.ts`, `pago-sobrepago-rechazado.yaml` |
| CXC-08 | Venta crédito con flag ventasCredito OFF | P1 | M | ✅ | `venta-credito-flag-off.yaml` |

---

## 5. Conversiones (Raw Material → Product)

| ID | Operation / Edge Case | Priority | Layer | Status | Existing Coverage |
|----|----------------------|----------|-------|--------|-------------------|
| CNV-01 | Crear receta de conversión | P1 | M | ✅ | `conversion-crear-receta.yaml` |
| CNV-02 | Ejecutar conversión (happy path) | P0 | UC, FS | ✅ | `ejecutar-conversion-use-case.test.ts`, `conversion-ejecutar.yaml` |
| CNV-03 | Eliminar receta | P2 | M | ✅ | `conversion-eliminar-receta.yaml` |
| CNV-04 | Stock origen insuficiente → rechazado | P0 | UC, FS | ✅ | `ejecutar-conversion-use-case.test.ts` |
| CNV-05 | Multiplicador no entero o < 1 → rechazado | P1 | UC | ✅ | `ejecutar-conversion-use-case.test.ts` |
| CNV-06 | Cascada de flags (stock→materiaPrima→automática) | P0 | UC | ✅ | `toggle-feature-flag-use-case.test.ts`, `funciones-conversion-auto-chain.yaml` |
| CNV-07 | Ejecutar con stock insuficiente (UI) | P1 | M | ✅ | `conversion-stock-insuficiente.yaml` |

---

## 6. Merma (Shrinkage / Waste)

| ID | Operation / Edge Case | Priority | Layer | Status | Existing Coverage |
|----|----------------------|----------|-------|--------|-------------------|
| MER-01 | Registrar merma (happy path) | P1 | M | ✅ | `merma-registro.yaml` |
| MER-02 | Cancelar merma con nota | P2 | M | ✅ | `merma-cancel-y-nota.yaml` |
| MER-03 | Merma > stock disponible → behavior check | P1 | M | ✅ | `merma-stock-insuficiente.yaml` |
| MER-04 | Merma con flag stock OFF → hidden/blocked | P1 | M | ✅ | `merma-flag-off.yaml` |

---

## 7. Egresos (Expenses)

| ID | Operation / Edge Case | Priority | Layer | Status | Existing Coverage |
|----|----------------------|----------|-------|--------|-------------------|
| EGR-01 | Registrar gasto (happy path) | P0 | UC, M | ✅ | `registrar-egreso-use-case.test.ts`, `egreso-gasto.yaml` |
| EGR-02 | Registrar nómina | P1 | M | ✅ | `egreso-nomina.yaml` |
| EGR-03 | Registrar inventario (auto-Egreso from movement) | P0 | UC, FS | ✅ | `registrar-movimiento-inventario-use-case.test.ts` |
| EGR-04 | Editar egreso | P1 | UC, M | ✅ | `editar-egreso-use-case.test.ts`, `editar-egreso.yaml` |
| EGR-05 | Eliminar egreso | P1 | M | ✅ | `eliminar-egreso.yaml` |
| EGR-06 | Recurrente mensual (happy path) | P0 | UC | ✅ | `procesar-gasto-recurrente-use-case.test.ts`, `egreso-recurrente-mensual.yaml` |
| EGR-07 | Recurrente semanal | P1 | UC, M | ✅ | `procesar-gasto-recurrente-use-case.test.ts`, `egreso-recurrente-semanal.yaml` |
| EGR-08 | Recurrente quincenal | P1 | UC, FS | ⚠️ | `procesar-gasto-recurrente-use-case.test.ts` — logic tested, no Maestro |
| EGR-09 | Recurrente — idempotencia (no double-fire same day) | P0 | UC, FS | ✅ | `procesar-gasto-recurrente-use-case.test.ts` |
| EGR-10 | Descartar — avanza fecha sin crear egreso | P1 | UC, FS | ✅ | `descartar-gasto-recurrente-use-case.test.ts`, `egreso-recurrente-descartar.yaml` |
| EGR-11 | Mensual — clamp fin de mes (31→28/30) | P1 | UC, FS | ✅ | `procesar-gasto-recurrente-use-case.test.ts` |
| EGR-12 | Template inactivo → skipped (processed=false) | P1 | UC | ✅ | `procesar-gasto-recurrente-use-case.test.ts` |
| EGR-13 | Egreso linked to inactive template → rechazado | P1 | UC | ✅ | `registrar-egreso-use-case.test.ts` |
| EGR-14 | Validation: required fields on egreso form | P2 | M | ✅ | `validation-egreso.yaml` |
| EGR-15 | Recurrente quincenal (UI) | P2 | M | ✅ | `egreso-recurrente-quincenal.yaml` |

---

## 8. Usuarios / Auth

| ID | Operation / Edge Case | Priority | Layer | Status | Existing Coverage |
|----|----------------------|----------|-------|--------|-------------------|
| USR-01 | Crear usuario Director | P0 | UC, FS | ✅ | `crear-usuario-use-case.test.ts`, `usuario-crear.yaml` |
| USR-02 | Crear usuario Operativo | P1 | UC, FS | ✅ | `crear-usuario-use-case.test.ts` |
| USR-03 | Autenticar con PIN correcto | P0 | UC, FS | ✅ | `autenticar-usuario-use-case.test.ts`, `quick-switch-login.yaml` |
| USR-04 | Autenticar con PIN incorrecto → failure | P0 | UC, FS | ✅ | `autenticar-usuario-use-case.test.ts` |
| USR-05 | Cambiar PIN (happy path, clears mustChangePin) | P0 | UC, FS | ✅ | `cambiar-pin-use-case.test.ts`, `change-pin.yaml` |
| USR-06 | Cambiar PIN — current PIN incorrecto → rechazado | P1 | UC, M | ✅ | `cambiar-pin-use-case.test.ts`, `change-pin-wrong-current.yaml` |
| USR-07 | Recuperar PIN via recovery password | P0 | UC, FS | ✅ | `recuperar-pin-use-case.test.ts`, `recovery-pin.yaml` |
| USR-08 | Recuperar — recovery password incorrecta → rechazado | P1 | UC | ✅ | `recuperar-pin-use-case.test.ts` |
| USR-09 | Eliminar usuario | P1 | UC, FS, M | ✅ | `eliminar-usuario-use-case.test.ts`, `usuario-eliminar.yaml` |
| USR-10 | Último Director no eliminable | P0 | UC, FS, M | ✅ | `eliminar-usuario-use-case.test.ts`, `usuario-last-director-guard.yaml` |
| USR-11 | Nombre duplicado → rechazado | P0 | UC, FS | ✅ | `crear-usuario-use-case.test.ts` |
| USR-12 | PIN no de 6 dígitos → rechazado (Zod) | P1 | UC | ✅ | `cambiar-pin-use-case.test.ts` |
| USR-13 | Recovery password ≥ 6 chars | P1 | UC | ✅ | via `NewUserSchema` Zod validation |
| USR-14 | Lockout tras intentos fallidos | P1 | M | ✅ | `usuario-wrong-pin-lockout.yaml`, `usuario-wrong-password-lockout.yaml` |
| USR-15 | Multi-user switch | P1 | M | ✅ | `usuario-multi-switch.yaml` |
| USR-16 | Auto-lock by inactivity | P2 | M | ✅ | `auto-lock-smoke.yaml` |

---

## 9. Feature Flags

| ID | Operation / Edge Case | Priority | Layer | Status | Existing Coverage |
|----|----------------------|----------|-------|--------|-------------------|
| FLG-01 | Toggle individual flag ON/OFF | P0 | UC, M | ✅ | `toggle-feature-flag-use-case.test.ts`, `funciones-toggle.yaml` |
| FLG-02 | Enable blocked if parent OFF | P0 | UC, M | ✅ | `toggle-feature-flag-use-case.test.ts`, `funciones-cant-enable-child.yaml` |
| FLG-03 | Disable cascade transitiva (stock OFF → children OFF) | P0 | UC, M | ✅ | `toggle-feature-flag-use-case.test.ts`, `funciones-cascade-disable.yaml` |
| FLG-04 | Conversion automática chain (stock→materiaPrima→auto) | P1 | UC, M | ✅ | `funciones-conversion-auto-chain.yaml` |
| FLG-05 | Stock disabled hides stock UI | P1 | M | ✅ | `funciones-stock-disabled.yaml` |
| FLG-06 | Ventas crédito toggle | P1 | M | ✅ | `funciones-ventas-credito-toggle.yaml` |

---

## 10. Reports

| ID | Operation / Edge Case | Priority | Layer | Status | Existing Coverage |
|----|----------------------|----------|-------|--------|-------------------|
| RPT-01 | Informe mensual — generates correctly | P0 | UC, FS | ✅ | `generar-informe-mensual-use-case.test.ts`, `informe-mensual.yaml` |
| RPT-02 | Exportar datos | P2 | UC, M | ✅ | `exportar-datos-use-case.test.ts`, `exportar-datos.yaml` |
| RPT-03 | Informe — invalid yearMonth format → rechazado | P1 | UC | ✅ | `generar-informe-mensual-use-case.test.ts` |
| RPT-04 | Informe — reconcile ventas−egresos−ISR | P0 | FS | ✅ | `informe-mensual-reconciliacion.fullstack.test.ts` |
| RPT-05 | Estado de Resultados — all rows | P1 | M | ✅ | `estados-resultados-all-rows.yaml` |
| RPT-06 | Balance General — all rows | P1 | M | ✅ | `balance-general-all-rows.yaml` |
| RPT-07 | Flujo de Efectivo | P1 | M | ✅ | `flujo-efectivo-all-rows.yaml` |

---

## 11. Notificaciones (Push Notifications)

| ID | Operation / Edge Case | Priority | Layer | Status | Existing Coverage |
|----|----------------------|----------|-------|--------|-------------------|
| NOT-01 | Emit alert → row appears in inbox | P0 | UC, M | ✅ | `use-emit-director-alert.test.tsx`, `director-notificaciones.yaml` |
| NOT-02 | Unread badge increments on new alert | P1 | UC, M | ✅ | `use-unread-alert-count.test.tsx`, `director-notificaciones.yaml` |
| NOT-03 | Critical/warning severity → OS push notification fires | P0 | UC | ✅ | `use-emit-director-alert.test.tsx` (presentNow assertions) |
| NOT-04 | Info severity → NO OS push, alert stays in-app only | P0 | UC | ✅ | `use-emit-director-alert.test.tsx` (info → presented.length === 0) |
| NOT-05 | Notification prefs suppression → no alert + no push | P1 | UC | ✅ | `use-emit-director-alert.test.tsx` (effectivePrefs gate) |
| NOT-06 | Tap OS notification (unlocked) → navigates to actionRoute | P1 | UC | ✅ | Unit-layer only — OS notification taps not automatable on iOS simulator; `notification-tap-host.tsx` handleTap logic covered by unit tests |
| NOT-07 | Tap OS notification (locked) → queue → PIN unlock → navigate | P1 | UC | ✅ | Unit-layer only — pendingRoute state flush tested via userId transition; Maestro cannot tap OS notification center |

> **Note:** NOT-06 and NOT-07 are unit-layer only. iOS simulator does not support `xcrun simctl` for local notification taps, and Maestro cannot interact with the OS notification center. Tap-navigation is covered by the `NotificationTapHost` component logic. If Appium/XCUITest E2E automation is added later, these can be promoted to the M layer.

---

## Coverage Gap Summary

### Fullstack Scenarios Needed (packages/data/tests/fullstack/)

| # | Scenario File | Covers IDs | Priority |
|---|--------------|------------|----------|
| 1 | `venta-lifecycle.fullstack.test.ts` | VEN-01,07,11,13,16,20 | P0 |
| 2 | `caja-dia-completo.fullstack.test.ts` | CAJ-01–10 | P0 |
| 3 | `credito-lifecycle.fullstack.test.ts` | CXC-01–06 | P0 |
| 4 | `conversion-lifecycle.fullstack.test.ts` | CNV-02,04,05 | P0 |
| 5 | `inventario-egresos.fullstack.test.ts` | STK-04,07; EGR-03 | P0 |
| 6 | `gastos-recurrentes.fullstack.test.ts` | EGR-06–13 | P1 |
| 7 | `usuarios-auth.fullstack.test.ts` | USR-01–12 | P0 |
| 8 | `informe-mensual-reconciliacion.fullstack.test.ts` | RPT-01,03,04 | P0 |

### Maestro Edge-Case Flows Needed

| # | Flow File | Covers IDs | Priority |
|---|-----------|------------|----------|
| 1 | `venta-stock-insuficiente.yaml` | VEN-16 | P0 |
| 2 | `merma-stock-insuficiente.yaml` | MER-03 | P1 |
| 3 | `merma-flag-off.yaml` | MER-04 | P1 |
| 4 | `conversion-stock-insuficiente.yaml` | CNV-07 | P1 |
| 5 | `pago-sobrepago-rechazado.yaml` | CXC-07 | P1 |
| 6 | `venta-credito-flag-off.yaml` | CXC-08 | P1 |
| 7 | `caja-movimiento-turno-cerrado.yaml` | CAJ-13 | P1 |
| 8 | `corte-duplicado-mismo-dia.yaml` | CAJ-14 | P1 |
| 9 | `egreso-recurrente-quincenal.yaml` | EGR-15 | P2 |
