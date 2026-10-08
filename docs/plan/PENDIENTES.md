# Pendientes — tablero generado

> **Generado por `pnpm plan:board`. No se edita a mano.** Cada línea viene de una casilla
> `- [ ]` / `- [~]` / `- [!]` en un track de `docs/plan` (o de una fila `| O-n |` en
> `11-pre-launch-and-deferred.md`). Para cambiar un estado, edita el track y regenera;
> `pnpm test:scripts` falla cuando este archivo quedó viejo. Las especificaciones, los pasos y las
> líneas Done siguen en cada track: aquí sólo está lo que falta, en cuatro listas por tipo de
> trabajo — quién tiene que actuar —, con su disparador o bloqueo y la línea exacta de donde
> viene. El tipo de cada tarea vive en `scripts/plan-board-kinds.ts`; una tarea sin tipo rompe
> la generación. «Siguiente» es el orden de trabajo, derivado de las dependencias.

## Siguiente (15)

Derivado de los campos **Blocked by** / **Blocks** de cada track: tareas sin bloqueo abierto,
ordenadas por cuántas tareas abiertas destraban (transitivamente). Se recalcula con cada
`pnpm plan:board`; el paréntesis es la fase de lanzamiento, el tipo de trabajo está en las
listas de abajo.

- **A-16** Suite de Maestro para la nueva app (Colas de tracks) — destraba 14: N-24, N-29, N-22, N-25, N-32, N-44, … · `05-app.md:194`
- **N-75** Spike de conciliación — ¿podemos ver los pagos con tarjeta de cualquier terminal? (Post-lanzamiento) — destraba 10: N-41, N-76, N-53, N-43, N-80, N-44, … · `09-next-features.md:1025`
- **X-01** Entorno de staging (Q17 "A later") (Lanzamiento) — destraba 9: X-02, X-10, N-28, N-30, X-03, X-05, … · `07-launch.md:10`
- **N-40** Validación de proveedores + alianza con Clip + opinión legal (Post-lanzamiento) — destraba 6: N-80, N-53, N-42, N-79, N-44, N-78 · `09-next-features.md:1005`
- **C-13** API de intenciones de pago (Colas de tracks) — destraba 5: N-80, N-42, N-79, N-44, N-78 · `02-contracts.md:332`
- **P-35** Cobertura del portal al 95% (pruebas unitarias + E2E combinadas, ADR-102) (Colas de tracks) — destraba 5: P-30, P-28, P-29, P-39, P-40 · `04-portal.md:1627`
- **N-64** Embudo de activación y cohortes semanales (Post-lanzamiento) — destraba 3: N-70, N-74, N-73 · `09-next-features.md:1299`
- **X-07** Masters de marca + derivados (ADR-054 §6) (Lanzamiento) — destraba 3: X-05, X-10, L-05 · `07-launch.md:101`
- **N-63** Negocio: MRR, churn, prueba → pago (Post-lanzamiento) — destraba 2: N-70, N-72 · `09-next-features.md:1288`
- **N-66** Roles del staff (Post-lanzamiento) — destraba 2: N-68, N-71 · `09-next-features.md:1319`
- **N-03** Avisos por exceder los límites y alertas al proveedor `[LAUNCH]` (Lanzamiento) — destraba 1: N-30 · `09-next-features.md:142`
- **N-19** Logo + color de marca `[LAUNCH]` (Lanzamiento) — destraba 1: N-12 · `09-next-features.md:561`
- **N-26** Auditoría de seguridad `[LAUNCH]` (Lanzamiento) — destraba 1: N-30 · `09-next-features.md:729`
- **N-27** Auditoría de base de datos `[LAUNCH]` (Lanzamiento) — destraba 1: N-30 · `09-next-features.md:747`
- **N-34** Aviso de privacidad + solicitudes ARCO `[LAUNCH]` (Lanzamiento) — destraba 1: N-30 · `09-next-features.md:845`

## Código y técnico (95)

Trabajo del repo, agrupado por superficie: pantallas, dominio, sync, contratos y tests. Nadie externo tiene que actuar; si una tarea no avanza, su bloqueo es código u otra tarea.

### Teléfono (11)

- [ ] **A-16** Suite de Maestro para la nueva app — Bloqueada por: A-04…A-10, A-15 · Falta: M-11 portó el harness completo (entry `activated` con `reset_app`/`prime-dev-client`/`_maestro_setup`, buckets en `run-flow.sh`/`full-regression.sh`, preámbulo `launchApp → dismiss-modals → login-operator` en cada flujo) y cerró **sus 19 flujos en verde en el sim de iPhone 17 Pro**; `login-operator-pin.yaml` ya existe; `sync-rejected.yaml` se reemplazó por `por-enviar.yaml`. Quedan a A-16: los ~12 flujos legacy de preactivación con sus subflujos compartidos (authenticate-director/operativo, complete-first-run, director-setup, first-run-onboarding, open-director-tools, select-operativo), la lista de reescrituras de A-01/A-09, sustituir del todo los buckets `demo`/`wizard` (hoy `demo` aún corre `demo-mode-setup.yaml`; `activated` ya existe), la cláusula «regression green» de A-15, y la corrida verde en iPhone + iPad (`full-regression.sh --device`). · `05-app.md:194`
- [~] **N-19** Logo + color de marca `[LAUNCH]` — Bloqueada por: C-15 · Falta: el teléfono no descarga ni guarda en caché el logo (nada llama a `/api/logos`; 73324085 solo agregó las columnas de marca), así que «renders offline» sigue sin cumplirse. El logo del PDF mensual (02b207da) ya está — quítalo del «still to do». · `09-next-features.md:561`
- [~] **N-21** Compartir por WhatsApp `[LAUNCH]` — Bloqueada por: N-20 (hecho) · web half landed 2026-09-20 · Falta: solo falta la mitad del teléfono: no hay envío en Android a un número predefinido (`share-image.ts` abre la hoja de compartir genérica), no hay «Enviar como texto», no hay flujo de Maestro hasta la entrega a WhatsApp, ni test unitario del fallback de Android. Bloqueado por N-24. · `09-next-features.md:621`
- [ ] **N-22** Banners de sincronización en la app `[LAUNCH]` — Bloqueada por: A-06, A-07, N-24 · `09-next-features.md:655`
- [ ] **N-24** La app del teléfono adopta el diseño de operador del Track O `[LAUNCH]` — Bloqueada por: lo que falta del lado del teléfono — las fases restantes del track del móvil-mostrador (el dueño corrige una venta, reescritura de Maestro) y el rework de A-16. Las barreras previas ya están cerradas (verificado 2026-10-05): el Track O está completamente terminado (`docs/archive/10-operador.md`) y M-01…M-09 ya salieron · `09-next-features.md:693`
- [ ] **N-25** Vinculación de dispositivos por QR `[LAUNCH]` — Bloqueada por: C-14, B-11, P-06, A-04, N-24 · Falta: la lectura del token desde el fragmento y la pantalla de cámara llegaron con M-06 (`activation-form.ts` lee `#c=`; `qr-visor.native.tsx`, `vincular-escanear.tsx`). Falta: App Links y Universal Links verificados (`assetlinks.json`, AASA) para `app.xangarro.mx/activar` — `app.json` sigue declarando solo el esquema `xangarro` — la confirmación SEC-MOB-04 «¿Vincular a _negocio_?» antes de canjear (una vista previa que nombra el negocio para un token, aún no construida), y el flujo de deep link de Maestro. El contrato, el token, el QR del portal, el compartir por WhatsApp y la página de respaldo `/activar` ya existen. Sigue bloqueado por N-24. · `09-next-features.md:711`
- [ ] **DS-10** Vincular un negocio grande — la primera descarga llega por páginas · `18-db-scale-design-changes.md:171`
- [ ] **M-10** El dueño corrige una venta. · `19-movil-mostrador.md:33`
- [ ] **M-11** Reescritura de Maestro. · `19-movil-mostrador.md:34`
- [ ] **M-12** Lo que quedó de M-01. · `19-movil-mostrador.md:37`
- [ ] En la app «Desvincular y borrar los datos de este dispositivo» (el aviso §7 hoy reconoce que · `../launch/production-readiness.md:65`

### Portal (17)

- [ ] **P-21** Capturas lado a lado para `pnpm design:compare` — Bloqueada por: P-18 · Falta: todo el sistema de captura. El que se verificó en `83ec5840` (2026-09-21) nunca llegó a un commit: el patrón `design-compare/` de `.gitignore`, sin anclar, también coincidía con `scripts/design-compare/`, así que el commit sólo llevó el script de `package.json` y la línea del ignore. Las fuentes no están en ningún disco (se revisaron el worktree y el checkout principal) ni en ningún commit. El mismo día: el patrón ahora es `/design-compare/` y el script `design:compare` que quedó colgando se eliminó, así que los Steps de abajo son una reescritura, no una recuperación. Restaura la entrada del script cuando aterrice el sistema de captura. · `04-portal.md:187`
- [~] **P-23** Primitivas + inventario en Storybook + líneas base de regresión visual — Bloqueada por: P-22 · Falta: la cláusula de aceptación de `design:compare` espera a P-21, reabierto ese mismo día (el sistema de captura nunca llegó a un commit y no existe en ningún disco; ver P-21). No hay página de Storybook en `apps/web`; Toast, gauge, nav item, switcher y user menu siguen sin cubrirse. Auditoría doc 2026-09-22: entregado salvo la compuerta de `design:compare` en su Acceptance. En curso: 2026-09-17 · **vocabulario núcleo construido y en pantalla**, la compuerta aún no cierra. · `04-portal.md:254`
- [~] **P-28** Diagnóstico + estrategia — «Próximamente» en producción — Bloqueada por: P-26, P-30 · Falta: sólo existen la pestaña y ambas compuertas (`asesor/screen.tsx`); las diez secciones, los mosaicos de mes, la tabla de precios, la lista de estrategia, los seis estados, la variante imprimible y el fixture de inyección de prompt siguen sin construirse. Auditoría doc 2026-09-22: entregado salvo las diez secciones del reporte y la tabla de precios. En curso: 2026-09-17 · la pestaña y **ambas compuertas** están cableadas; el reporte en sí no está construido. Dos compuertas se componen en el orden correcto vía `resolveScreenState`: `capabilities.asesor === · `04-portal.md:1170`
- [ ] **P-29** Catálogo desde una foto — «Próximamente» en producción — Bloqueada por: P-07, P-30 · `04-portal.md:1344`
- [~] **P-30** Runtime de generación del Asesor — Bloqueada por: — · Falta: la llamada al modelo existe — `server/asesor/model.ts` carga el cliente real de Anthropic y `pedirProsa` (2026-09-21, abajo) — pero nada la llama: `runtime.ts` sigue siendo sólo determinista hasta que P-28 le dé a la prosa generada una pantalla donde aterrizar. Lo que falta es el cableado (prompt desde las cifras deterministas, resultados hacia el reporte), con la API de Batches y el prompt caching acompañándolo. **Llamada al modelo.** ADR-056 la hace el último paso, con el prompt armado desde las cifras deterministas. Sostenida hasta **P-28**: el Diagnóstico es `<p>Reporte completo del mes.</p>` detrás de dos compuertas, así que la prosa generada caería en una tabla que ninguna pantalla lee. La frontera sigue siendo el módulo único que ADR-056 exige (`server/asesor/model.ts`) y `runtime.ts` nombra la costura. La API de Batches y el prompt caching van con ella — el batching necesita un registro donde juntar resultados, y eso es una tabla propia. 2026-09-26 · **El fan-out diario aterrizó, y no necesitó migración.** La pregunta abierta era qué rol puede enumerar los tenants, entre una función privilegiada nueva, el rol de medición y el rol de servicio de la consola. · `04-portal.md:1354`
- [ ] **P-35** Cobertura del portal al 95% (pruebas unitarias + E2E combinadas, ADR-102) — Bloqueada por: — · `04-portal.md:1627`
- [ ] **P-38** Don Cuentas explica una diferencia de caja — Bloqueada por: — · `04-portal.md:1861`
- [ ] **P-39** Conclusiones de Don Cuentas en Estados financieros — Bloqueada por: P-30, P-28 · `04-portal.md:1877`
- [ ] **P-40** Primer diagnóstico gratis a los 90 días — Bloqueada por: P-28 · `04-portal.md:1895`
- [ ] **P-41** Funciones avanzadas de inventario — Bloqueada por: — · `04-portal.md:1909`
- [~] **N-03** Avisos por exceder los límites y alertas al proveedor `[LAUNCH]` — Bloqueada por: N-02, N-08, B-14 · Falta: sin banner de uso en el portal; sin banner en la app guiado por el `usage` que llega en el pull (`usageMessageCode` nunca se invoca; `PlanLimitSheet` cuenta en local); falta el test de contrato de que un negocio de pago al 150 % sigue sincronizando todas las filas (el escenario `over-limit` del mock no se usa). · `09-next-features.md:142`
- [~] **N-12** Asistente «Platícanos de ti» `[LAUNCH]` — Bloqueada por: N-11, N-19 · Falta: criterio de aceptación cumplido (`suggested-plan-table.test.ts`, 535ceaa1). Las respuestas de tipo de negocio y de WhatsApp nunca se guardan aunque existen `businesses.tipo_negocio` / `whatsapp` (`AplicarConfiguracionUseCase` escribe solo nombre + métodos de pago); el paso 6 registra `hasLogo` sin subida de archivo (N-19); las respuestas viven en `business_onboarding`, no en `businesses.onboarding` — documentado, pero sin ratificar mediante un ADR. · `09-next-features.md:399`
- [ ] **DS-01** Ventas y gastos — filtros que responde el servidor · `18-db-scale-design-changes.md:33`
- [ ] **DS-02** Exportar — todos los registros, con estado de preparación · `18-db-scale-design-changes.md:66`
- [ ] **DS-03** Sincronización › Historial — los últimos 30 días · `18-db-scale-design-changes.md:81`
- [ ] **DS-04** Productos › Movimientos — los 50 más recientes · `18-db-scale-design-changes.md:91`
- [ ] **DS-09** Estados — el rango personalizado tiene un límite · `18-db-scale-design-changes.md:160`

### Caja web (5)

- [!] **P-37** Impresión de tickets desde la caja · `04-portal.md:1847`
- [ ] **DS-05** Estado de sincronización — «Reintentando» · `18-db-scale-design-changes.md:100`
- [ ] **DS-06** Cierre — registros que faltan por enviar · `18-db-scale-design-changes.md:117`
- [ ] **DS-07** Registros por enviar — último y próximo intento · `18-db-scale-design-changes.md:131`
- [ ] **DS-08** Caja — ya abierta en otra pestaña · `18-db-scale-design-changes.md:144`

### Pagos y conciliación (12)

- [ ] **C-13** API de intenciones de pago — Disparador: que N-40 decida avanzar · `02-contracts.md:332`
- [ ] **N-75** Spike de conciliación — ¿podemos ver los pagos con tarjeta de cualquier terminal? · `09-next-features.md:1025`
- [ ] **N-41** Puerto `PaymentProvider` — lado de lectura + adaptador de Mercado Pago — Bloqueada por: N-75, ADR-109 · `09-next-features.md:1041`
- [ ] **N-43** Vinculación de la cuenta de Mercado Pago o Clip en Tipos de pago — Bloqueada por: N-41 · `09-next-features.md:1049`
- [ ] **N-76** Conciliación de tarjeta — Bloqueada por: N-41, N-43 · `09-next-features.md:1062`
- [ ] **N-77** Paso del checklist e invitaciones — Bloqueada por: N-43 · `09-next-features.md:1075`
- [ ] **N-80** Puerto `PaymentProvider` — lado de escritura + Mercado Pago Point — Bloqueada por: N-41, N-40 (go de MP), C-13 · `09-next-features.md:1088`
- [ ] **N-42** Backend de intenciones de pago — Bloqueada por: N-80, C-13 · `09-next-features.md:1096`
- [ ] **N-79** Terminal por caja — Bloqueada por: N-80, N-43, ADR-109 (D-1) · `09-next-features.md:1106`
- [ ] **N-44** Cobrar en terminal (app y caja web) — Bloqueada por: N-42, N-79, N-45, N-24, N-53 · `09-next-features.md:1116`
- [ ] **N-78** Salud de la terminal en la caja — Bloqueada por: N-79 · `09-next-features.md:1127`
- [ ] **N-53** Adaptador de Clip — Bloqueada por: N-41, N-40 (go de Clip), N-75 (go de Clip) · `09-next-features.md:1206`

### Consola (backoffice) (8)

- [~] **B-16** Back-office: consultas guardadas de Studio + funciones de soporte — Bloqueada por: B-03, B-11 · Falta: falta la consulta guardada de «suscripciones por plan/estado» (ya sin bloqueo porque `billing.subscriptions` existe); `billing.reissue_code` / `billing.resend_magic_link` no existen. La emisión desde Studio quedó sustituida por ADR-080 — elimina ese paso. La revisión del runbook requiere la aprobación de una persona. 2026-09-17 · `supabase/studio/`: unresolved rejections, stale devices, codes expiring today, and a SQL sign-in unlock; `xangarro.security_prune()` and `xangarro.session_revoke_user()` (0006); runbook `docs/ops/back-office.md`. `support-tooling.integration.test.ts` runs every saved query on the seed and pins the SQL unlock to the app's throttle key. · `03-backend.md:292`
- [ ] **N-46** Salud de la sincronización y dispositivos — Disparador: lanzamiento + 30 días, o el primer incidente de sincronización entre inquilinos. · `09-next-features.md:1144`
- [ ] **N-62** Métricas de cohortes desde el domicilio fiscal, no desde la IP. · `09-next-features.md:1267`
- [ ] **N-65** Línea de tiempo del inquilino — Bloqueada por: N-08 · Disparador: ya (todas las tablas fuente existen). · `09-next-features.md:1310`
- [ ] **N-66** Roles del staff — Bloqueada por: N-05 · Disparador: que se agregue al segundo miembro del staff, o antes de que arranquen N-68 / N-71 — lo que ocurra primero. · `09-next-features.md:1319`
- [ ] **N-67** `/auditoria` — Bloqueada por: N-05 · Disparador: ya. · `09-next-features.md:1329`
- [ ] **N-68** «Ver como» — suplantación de solo lectura con límite de tiempo — Bloqueada por: N-66, N-67 · Disparador: lanzamiento de X-10 y el primer elemento de la bandeja que no se pueda resolver desde `/tenants/[id]` + N-65. · `09-next-features.md:1338`
- [ ] **N-70** Decisiones — Bloqueada por: N-07, N-63 · Disparador: N-63 `[x]`. · `09-next-features.md:1361`

### Backend, sync y datos (6)

- [ ] **C-21** Interruptores de apagado en la sincronización · `02-contracts.md:503`
- [ ] **N-47** Anuncios a todos los inquilinos — Disparador: la primera ventana de mantenimiento planeada o el primer lanzamiento de funcionalidad tras salir a producción. · `09-next-features.md:1150`
- [ ] **N-48** Ciclo de vida de cuentas inactivas (ADR-064) — Disparador: lanzamiento + 90 días (ningún inquilino puede quedar inactivo antes). · `09-next-features.md:1156`
- [ ] **N-69** Ciclo de vida de flags y despliegue porcentual — Bloqueada por: N-09 · Disparador: N-09 `[x]`. · `09-next-features.md:1351`
- [ ] `ASESOR_LLM_*` nunca apuntado a un proxy personal con datos reales de tenants (agregar una salvaguarda). · `../launch/production-readiness.md:116`
- [ ] Regla: la frontera de modelos del Asesor sigue siendo el único módulo que sabe que existe un modelo; la IA · `../launch/production-readiness.md:117`

### Privacidad y LFPC (19)

- [~] **N-34** Aviso de privacidad + solicitudes ARCO `[LAUNCH]` — Bloqueada por: N-08 · Falta: el aviso del NIP de operador (variante C); Configuración → Privacidad para retirar el consentimiento; eliminación por autoservicio; enrutar las solicitudes de los clientes de un comercio hacia el comercio; PRIV-GEO-01, PRIV-IA-01/02, PRIV-OPS-01. Los textos son borradores con huecos `[BRACKET]` hasta que el abogado dé el visto bueno (O-17). La aplicación al proyecto hospedado quedó hecha 2026-09-25: `db:migrate:hosted` aplicó data-pg `0034`–`0042` y consola `0017`–`0019` (12 archivos; el primer signup en producción había fallado con 42883 en `privacy_consent_record`); el dry run reporta 0 pendientes. Progress: 2026-09-23 · **The aviso is reachable from every surface.** xangarro.mx gets `/privacidad` (the aviso integral) and `/privacidad/arco` (section A of the procedure; the internal annex B is not published), rendered at build time from `docs/legal/aviso/*.md` with every `>` note dropped, as the drafts say; the prerender refuses to publish «BORRADOR», «Nota:» or «Anexo interno». Links: the landing footer, the portal sidebar (beside Ayuda), the login screen, the signup consent (already), and the device-linking notice. · `09-next-features.md:845`
- [~] **N-60** Etapa 6 — ADR-092 + aviso. · `09-next-features.md:1259`
- [ ] Retirar `docs/legal/privacy.md` y `docs/legal/terms.md` una vez aprobado lo anterior. · `../launch/production-readiness.md:26`
- [ ] Llenar las tres celdas `[PAÍS]` en el aviso §6.1 (monitoreo de errores, correo, mensajería) y los · `../launch/production-readiness.md:27`
- [ ] PRONTO — Trabajo nocturno de sellado: llamar `xangarro.privacy_consents_day_root(day)` y obtener una · `../launch/production-readiness.md:51`
- [ ] Archivar el texto completo de cada `AVISO_VERSION` (un hash sin su texto no prueba nada) — · `../launch/production-readiness.md:53`
- [ ] Configuración → Privacidad: mostrar la versión aceptada, alternar novedades (escribe una · `../launch/production-readiness.md:55`
- [ ] Bloqueo de re-consentimiento al iniciar sesión cuando una versión agregue una finalidad (art. 11); banner en … · `../launch/production-readiness.md:57`
- [ ] BLOQUEANTE — Eliminación de cuenta por autoservicio en el portal (exportar → confirmar → cancelar Stripe → · `../launch/production-readiness.md:62`
- [ ] Calendario de retención implementado por tabla (cifras de OQ-L13 una vez confirmadas); regla de 72 meses para · `../launch/production-readiness.md:73`
- [ ] BLOQUEANTE — Cancelar en un clic desde Configuración → Suscripción. · `../launch/production-readiness.md:85`
- [ ] BLOQUEANTE — Correo de recordatorio de renovación ≥ 5 días hábiles antes de cada cargo, con un enlace de canc… · `../launch/production-readiness.md:91`
- [ ] Pantalla de consentimiento de cargos recurrentes en el checkout: frecuencia, monto, fecha, aceptación expresa. · `../launch/production-readiness.md:93`
- [ ] Aumentos de precio: aviso de 30 días + flujo de re-aceptación expresa. · `../launch/production-readiness.md:94`
- [ ] Domicilio, teléfono y canal de quejas visibles antes de contratar (landing + checkout). · `../launch/production-readiness.md:95`
- [ ] Enlaces legales (aviso, términos) en el pie del landing, el pie del portal y los pies de los correos. · `../launch/production-readiness.md:96`
- [ ] Regla de retención de la atribución para `signup_attribution` (geo tiene 400 días; proponer lo mismo). · `../launch/production-readiness.md:129`
- [ ] Beacon del landing declarado en el aviso (hecho) y enlace en el pie de página de `xangarro.mx` (abierto). · `../launch/production-readiness.md:130`
- [ ] Correo de marketing: opt-out respetado dentro de la ventana de 5 días; REPEP si algún día se usa teléfono/SMS. · `../launch/production-readiness.md:131`

### Auditorías y calidad (5)

- [~] **N-26** Auditoría de seguridad `[LAUNCH]` — Bloqueada por: N-05, B-17 · Falta: 4 de 6 hallazgos altos corregidos (SEC-AUTH-01/02, SEC-SEC-01, SEC-DEV-01 — el oráculo quedó cerrado y el token QR construido por C-14, 2026-09-23); SEC-DATA-01 es el interruptor del dueño O-2; SEC-PRIV-01 es N-34. Hallazgos medios en el alcance, 2026-09-23: **SEC-WEB-01 hecho** — el portal envía X-Frame-Options, un `frame-ancestors 'none'` obligatorio, nosniff, HSTS, un referrer estricto y Permissions-Policy, `poweredByHeader` desactivado, todo desde una implementación compartida con la consola (`@xangarro/config/security`); su CSP completa con nonce (`src/proxy.ts`, con `'wasm-unsafe-eval'` y workers para la caja) se sirve en modo **report-only** hacia `/api/csp-report`, y el barrido encontró cero violaciones en 18 páginas y en todos los flujos e2e de caja y sincronización tras dos correcciones (la sonda eval de Zod ponía `jitless` en el head; cada ruta se renderiza por petición, de modo que cada script recibe el nonce). · `09-next-features.md:729`
- [~] **N-27** Auditoría de base de datos `[LAUNCH]` — Bloqueada por: B-03, B-08, B-09 · Falta: la ronda 2 reverificó los 25 hallazgos de la primera ronda (9 corregidos, 9 parciales, 6 abiertos, 1 obsoleto; QRY-01 y MIG-01 quedaron solo parciales, SYNC-02 estaba hecho) y midió 24 hallazgos nuevos DB2-\* a escala. Corregidos en `perf/db-scale`: DB2-USE-01 (índices + reconteo con debounce), DB2-SYNC-01/-02 (push por lotes, ADR-120), DB2-QRY-01..04, DB2-EXP-01, DB2-DEV-01/-02, DB2-HOT-01, DB2-CONN-01, DB2-MIG-01 (migraciones sin transacción, ADR-119; no el journal desactualizado de drizzle), DB2-IDX-01, DB2-RLS-01, DB2-CRON-01, DB2-PAGE-01. Abiertos: DB-OPS-01/DB2-OPS-01 (PITR + simulacro = O-3), DB2-QRY-05 (rollup de `product_stock`; el bootstrap por snapshot ya está hecho, ADR-121), DB2-SYNC-03 (retención de recibos/logs, necesita un ADR), DB2-CHK-01 (el B-19 que nunca se creó), la mitad del journal de drizzle de B-20, DB2-KEY-01, DB2-PART-01 (ADR de S2), contadores de uso incrementales; la UI en `18-db-scale-design-changes.md`. La ronda 3 (`docs/audits/db-2026-09-26-r3.html`) auditó la propia rama: 31 hallazgos (7 altos). Corregidos en `perf/db-scale`: DB3-MIG-01, DB3-IDX-01, DB3-OPS-01, DB3-SYNC-01 (a)(c)/-02/-03/-04. Corregidos en `perf/db-launch`: DB3-BOOT-01 (el bootstrap rebasó el límite de 4.5 MB de Vercel tras alrededor de un mes con un negocio pesado; ahora es un snapshot paginado — línea base de stock + 90 días de movimientos, ≤ 2 MB por página — ADR-121, C-23; también la mitad bootstrap de DB2-QRY-05). DB3-EXP-01 (exportaciones en streaming), DB3-EST-01 (tope de 13 meses, sumas en SQL), DB3-SYNC-05 (503 + Retry-After en lugar de encolar), DB3-QRY-03 (resumen), ADR-122. DB3-SYNC-01 (b) (un lote rechazado en su totalidad se parte a la mitad hasta su fila; límite de tamaño de fila), DB3-L-02/03/07. También corregidos en `perf/db-launch`: DB3-CAJA-01/02/03 (una pestaña es la dueña de la caja, una «por enviar», el cierre con banner, pulls en reposo; ADR-123) y DB3-CAJA-04 en parte (escrituras OPFS encoladas; el VFS permanece abierto). La re-ejecución de `pg_stat_statements` todavía necesita el proyecto hospedado. · `09-next-features.md:747`
- [ ] **N-28** Auditoría de rendimiento `[LAUNCH]` — Bloqueada por: X-01 · `09-next-features.md:761`
- [ ] **N-29** Gate E2E determinista de toda la pila `[LAUNCH]` — Bloqueada por: P-17, A-16, N-22, N-25 · `09-next-features.md:769`
- [ ] **N-49** Explorador de pruebas con GLM — Disparador: el staging de X-01 en vivo y N-29 en verde. · `09-next-features.md:1171`

### Lanzamiento, stores e integración (10)

- [ ] **X-02** Corrida de integración de extremo a extremo (app real ↔ backend real) — Bloqueada por: X-01, P-03, P-04, P-05, P-06, P-11, A-04…A-10, L-03 · `07-launch.md:18`
- [ ] **X-03** Migración de partners — Bloqueada por: X-02 · `07-launch.md:24`
- [ ] **X-05** Fichas de tienda + preparación para la revisión — Bloqueada por: F-01, A-15, X-07, B-04 · Falta: `app.json` ya está renombrado (Xangarro!, `mx.xangarro.mobile`) y `store:screenshots` existe, pero `docs/store/listing-*.md` sigue apuntando soporte/privacidad/términos a `cachink.mx`, el copy es previo al pivote (modo local, Director, LAN sync), no hay notas de revisión (cuenta demo, «no purchase flow»), y `submit.production` dentro de `eas.json` no tiene `ascAppId`. · `07-launch.md:38`
- [ ] **X-09** Reset de ROADMAP.md — Bloqueada por: X-02 · `07-launch.md:114`
- [ ] **X-10** Compuerta del checklist de lanzamiento — Bloqueada por: X-01…X-09 (excepto X-08) · `07-launch.md:120`
- [~] **N-32** Barrido de cumplimiento para las tiendas de apps `[LAUNCH]` — Bloqueada por: N-24, A-15 · Falta: la checklist del revisor para X-05 en `docs/store/`. `pnpm lint:store` vuelve a estar en verde y forma parte del gate en `ci.yml` (ver Progress). · `09-next-features.md:818`
- [ ] ANTES DE STORES — URLs de términos y privacidad activas (`xangarro.mx/privacidad`, `/terminos`) y · `../launch/production-readiness.md:102`
- [ ] ANTES DE STORES — Notas para el revisor que expliquen el modelo de dispositivo + NIP (sin cuenta en la app, s… · `../launch/production-readiness.md:104`
- [ ] Pantalla de avisos de licencias de código abierto generada desde `pnpm licenses list --prod` (1,184 paquetes,… · `../launch/production-readiness.md:106`
- [ ] Nunca agregar Sign in with Apple/Google a la app móvil (activaría 5.1.1(v)). · `../launch/production-readiness.md:108`

### Landing (2)

- [ ] **L-05** Badges de tienda + páginas legales — Bloqueada por: X-05 (URLs reales de tienda) · Falta: `/privacidad/`, `/privacidad/arco/` y ahora `/terminos/` ya existen en el landing — la ruta de términos llegó el 2026-09-24 (`4f39a7f8`, `src/pages/legal/Terminos.jsx`, renderizada desde `docs/legal/aviso/terminos-borrador.md`, enlazada desde el footer). Falta: `docs/legal/terms.md` sigue siendo el texto previo al pivote (no incluye ni el periodo de gracia de 7 días ni el downgrade) y se retira en cuanto se apruebe el borrador, y los badges de tienda esperan las URLs reales de X-05. · `06-landing.md:88`
- [~] **N-58** Etapa 4 — compras + landing. · `09-next-features.md:1244`

## Corporativo, legal y terceros (35)

Actúa el dueño fuera del repo: la razón social, abogado y contador, SAT/IMPI/INDAUTOR, seguros, Clip y Mercado Pago, y las decisiones de negocio.

### `06-landing.md` (2)

- [ ] **L-09** Páginas de comparación y alternativas contra competidores nombrados — Bloqueada por: el dueño — la lista de competidores y los datos de cada uno que estemos dispuestos a publicar · `06-landing.md:192`
- [ ] **L-10** Presencia fuera del sitio: Reddit y YouTube — Bloqueada por: el dueño — cuentas y tiempo · `06-landing.md:208`

### `07-launch.md` (2)

- [ ] **X-07** Masters de marca + derivados (ADR-054 §6) — Bloqueada por: trabajo del logo (externo) · Falta: El kit de íconos ya está en `assets/brand/icons/` y conectado en las cuatro apps (ícono de la app móvil + adaptive + themed layers, favicons y touch icons del portal/consola, favicons + manifest + la imagen OG del landing). Sigue faltando: `logo.png`, `splash-mobile.png` (el splash enviado todavía dice «Cachink!») y borrar los cuatro `role-*.png`. · `07-launch.md:101`
- [ ] **X-08** Renombrado de repo + directorio (opcional, coordinar) — Bloqueada por: A-15 · `07-launch.md:108`

### `08-post-launch.md` (1)

- [ ] **Z-12** Sonido de confirmación de venta: encargar audio nuevo (ADR-054 §7) — Disparador: presupuesto para el trabajo de marca. · `08-post-launch.md:69`

### `09-next-features.md` · 3. Post-lanzamiento (3)

- [~] **N-40** Validación de proveedores + alianza con Clip + opinión legal — Disparador: criterios de salida de N-30 cumplidos. **La conversación con Clip empieza ya** (acción del dueño, no depende del disparador). · `09-next-features.md:1005`
- [ ] **N-45** Prueba de penetración externa — Disparador: N-42 y N-43 en staging. · `09-next-features.md:1137`
- [ ] **N-50** Generación de logo con IA — Disparador: se levante la restricción de ADR-059 sobre las llamadas a modelos en producción. · `09-next-features.md:1178`

### `11-pre-launch-and-deferred.md` · 1. Acciones previas al lanzamiento (dueño) (10)

- [ ] **O-32** Nota para la migración a Azure (owner, 2026-09-26): cuando Postgres pase a Azure (Flexible Server), revisar u… · `11-pre-launch-and-deferred.md:31`
- [ ] **O-14** VoBo del contador sobre las dudas de CFDI: PUE vs PPD para SPEI pagado al momento; ClaveProdServ `81112106` /… · `11-pre-launch-and-deferred.md:51`
- [ ] **O-15** Generar el CSD (Certificado de Sello Digital) en CertiSAT con la e.firma · `11-pre-launch-and-deferred.md:52`
- [ ] **O-16** Hasta el `live`: emitir CFDIs manualmente en el portal del SAT desde la lista "Pagos sin CFDI" del backoffice… · `11-pre-launch-and-deferred.md:53`
- [ ] **O-17** Revisión del abogado sobre `docs/legal/aviso/*` (16 preguntas abiertas en su README), incl. si el archivo de … · `11-pre-launch-and-deferred.md:54`
- [ ] **O-18** Opinión del abogado: una plataforma que nunca retiene fondos y no cobra comisión queda fuera de las reglas de… · `11-pre-launch-and-deferred.md:55`
- [ ] **O-29** El abogado redacta y aprueba un aviso de privacidad simplificado para el signup. La página de signup entonces… · `11-pre-launch-and-deferred.md:56`
- [ ] **O-19** Contactar al equipo de partners de Clip (sdk@payclip.com): programa de OAuth/partners, un dispositivo de prue… · `11-pre-launch-and-deferred.md:57`
- [ ] **O-27** Crear una app de desarrollador de Mercado Pago (Tus integraciones), copiar su access token de prueba y correr… · `11-pre-launch-and-deferred.md:58`
- [ ] **O-28** Clip: terminar el KYC, revisar el modelo de terminal (Total 3 / Ultra / PinPad / Stand 2; no Plus), crear lla… · `11-pre-launch-and-deferred.md:59`

### `../launch/production-readiness.md` · 0. Lo único que todo lo demás espera (1)

- [ ] BLOQUEANTE — Razón social constituida. `[RAZÓN SOCIAL]`, `[DOMICILIO]`, `[RFC]`, `[TELÉFONO]`, · `../launch/production-readiness.md:10`

### `../launch/production-readiness.md` · 1. Textos legales (7)

- [~] Aviso de privacidad integral — `docs/legal/aviso/aviso-integral.md` (generic, category-based). · `../launch/production-readiness.md:18`
- [~] Aviso simplificado (3 variantes) — `docs/legal/aviso/aviso-simplificado.md`. · `../launch/production-readiness.md:19`
- [~] Términos y Condiciones — `docs/legal/aviso/terminos-borrador.md` (replaces `docs/legal/terms.md`). · `../launch/production-readiness.md:20`
- [~] Anexo de encargado — `docs/legal/aviso/encargado-clausulas.md`. · `../launch/production-readiness.md:21`
- [~] Procedimiento ARCO — `docs/legal/aviso/arco-procedimiento.md`. · `../launch/production-readiness.md:22`
- [ ] BLOQUEANTE — Revisión del abogado de los cinco textos + las cinco confirmaciones en · `../launch/production-readiness.md:23`
- [ ] Plantilla de aviso para los clientes del propio negocio (OQ-L16). · `../launch/production-readiness.md:25`

### `../launch/production-readiness.md` · 2. Captura de consentimiento (PRIV-REG-01) — implementado 2026-09-22 (1)

- [ ] Decidir casilla vs. botón como consentimiento con el abogado (OQ-N7); hoy: casilla. · `../launch/production-readiness.md:58`

### `../launch/production-readiness.md` · 3. Derechos que el aviso promete (deben existir antes de publicar el aviso) (1)

- [ ] Protocolo de brechas con la lista de campos del Reglamento art. 65, una persona designada y la cláusula de 72… · `../launch/production-readiness.md:75`

### `../launch/production-readiness.md` · 6. Terceros y contratos (2)

- [ ] DPAs firmados: Supabase, Vercel, Sentry, Stripe, proveedor de correo, PAC, Microsoft (Foundry), · `../launch/production-readiness.md:112`
- [ ] Opción de hosting de Foundry decidida y configurada (recomendada: Hosted on Azure, US DataZone); · `../launch/production-readiness.md:114`

### `../launch/production-readiness.md` · 7. Higiene de producto con peso legal (1)

- [ ] Afirmaciones publicitarias en el landing demostrables (LFPC art. 32). · `../launch/production-readiness.md:132`

### `../launch/production-readiness.md` · 8. Propiedad intelectual y gobernanza (4)

- [ ] BLOQUEANTE — Búsqueda y registro de marca ante el IMPI para «Xangarro» (clases 9, 35, 36, 42) antes · `../launch/production-readiness.md:136`
- [ ] Licencias registradas para imágenes hero/ilustraciones/tipografías (activos aparte de sonidos y datos de mapa… · `../launch/production-readiness.md:138`
- [ ] Seguro de ciberresponsabilidad — decisión de negocio. · `../launch/production-readiness.md:139`
- [ ] Registro de software ante el INDAUTOR — opcional. · `../launch/production-readiness.md:140`

## Infra y consolas (19)

Configuración en consolas de terceros — Vercel, Supabase, Stripe, Resend, DNS, GitHub, stores — y las llaves y regiones que viven ahí. El repo ya tiene lo que falta configurar.

### `06-landing.md` (1)

- [ ] **L-04** Dominio + DNS + dominio de correo — Bloqueada por: — (hacerlo temprano; seguimiento del ADR-054) · Falta: Solo del lado del dueño — registrador, zona DNS y consola de Resend (O-4 … O-6, O-13 en `11-pre-launch-and-deferred.md`); nada en el repo puede comprobarlo. · `06-landing.md:59`

### `07-launch.md` (1)

- [ ] **X-01** Entorno de staging (Q17 "A later") — Bloqueada por: B-01…B-10 · Falta: El repo está listo (`eas.json` separa el entorno de preview/producción y las llaves de entitlement; ambos `vercel.json` fijan `pdx1`) pero `docs/ops/provisioning.md` no tiene sección de staging y `scripts/hosted/*` apunta a una sola base de datos; el proyecto `xangarro-staging` de Supabase, el entorno de Vercel Preview, la conexión de pruebas de Stripe y el par de llaves aparte siguen todos fuera del repo. · `07-launch.md:10`

### `11-pre-launch-and-deferred.md` · 1. Acciones previas al lanzamiento (dueño) (16)

- [ ] **O-2** Apagar la Data API · `11-pre-launch-and-deferred.md:25`
- [ ] **O-3** Backups / PITR en un plan de pago · `11-pre-launch-and-deferred.md:26`
- [ ] **O-4** Proyecto de Vercel `xangarro-web`, Root Directory `apps/web`, dominio `app.xangarro.mx`, región pdx1 · `11-pre-launch-and-deferred.md:27`
- [ ] **O-5** Proyecto de Vercel `xangarro-backoffice`, Root Directory `apps/backoffice`, dominio `admin.xangarro.mx`, regi… · `11-pre-launch-and-deferred.md:28`
- [ ] **O-6** Proyecto de Vercel `xangarro-landing`, Root Directory `apps/landing`, dominio `xangarro.mx` · `11-pre-launch-and-deferred.md:29`
- [ ] **O-7** Verificar que el plan de Vercel permita 4 cron jobs y regiones fijas · `11-pre-launch-and-deferred.md:32`
- [ ] **O-8** URLs de base de datos por rol (Transaction pooler, puerto 6543) · `11-pre-launch-and-deferred.md:33`
- [ ] **O-9** Generar los secretos: `DEVICE_TOKEN_SECRET`, `CRON_SECRET`, `ADMIN_INGEST_SECRET` (los mismos en ambas apps),… · `11-pre-launch-and-deferred.md:34`
- [ ] **O-10** Archivar `z3r0maker/CachinkLanding` en GitHub (no lo elimines) · `11-pre-launch-and-deferred.md:35`
- [ ] **O-11** `gh auth login` en la máquina de desarrollo · `11-pre-launch-and-deferred.md:36`
- [ ] **O-30** Configurar `CRON_SECRET` en Vercel (xangarro-web, Production, Sensitive) y volver a desplegar. Lo encontró el… · `11-pre-launch-and-deferred.md:37`
- [ ] **O-31** Las Functions corren en `iad1`, no en `pdx1`. El smoke check del 2026-09-27 leyó `x-vercel-id: …::iad1::…` au… · `11-pre-launch-and-deferred.md:38`
- [ ] **O-12** Te toca a ti (manual, 2026-09-23): llaves de prueba de Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, … · `11-pre-launch-and-deferred.md:44`
- [ ] **O-13** Te toca a ti (manual, 2026-09-23): Resend: agregar el dominio `xangarro.mx`; los registros DNS de `docs/ops/e… · `11-pre-launch-and-deferred.md:45`
- [ ] **O-23** Vercel rechaza los deploys si el autor del commit de HEAD no tiene permiso para deployar. El 2026-09-26 un re… · `11-pre-launch-and-deferred.md:67`
- [ ] **O-22** Staging (X-01) antes del primer cliente que pague · `11-pre-launch-and-deferred.md:68`

### `../launch/production-readiness.md` · 5. Tiendas de apps (1)

- [ ] ANTES DE STORES — Apple Privacy Nutrition Label + manifiesto de privacidad; formulario de Data Safety de Play… · `../launch/production-readiness.md:100`

## Espera datos reales (18)

No se empieza hasta que el mundo entrega: clientes reales, telemetría, umbral de escala o tiempo después del lanzamiento. Cada una dice su disparador.

### `07-launch.md` (1)

- [ ] **X-04** Xangarro como inquilino #1 (dogfooding) — Bloqueada por: X-02 · `07-launch.md:30`

### `08-post-launch.md` (7)

- [ ] **Z-01** `ventasCredito` — primera función entregada por el portal (Q10) — Disparador: lanzamiento completado; ≥ 1 cliente pide fiado, o 30 días después del lanzamiento. · `08-post-launch.md:9`
- [ ] **Z-02** Pantallas del grupo 2 del portal — Disparador: Z-01 o demanda de clientes. · `08-post-launch.md:15`
- [ ] **Z-04** Extraer `apps/api` — Disparador: latencia p95 de sync > 800 ms en el handler, o límites de funciones de Vercel alcanzados, o que un segundo cliente (p. ej. un POS futuro) necesite la API sin el portal. · `08-post-launch.md:25`
- [ ] **Z-05** Importador de payouts de Stripe → ventas (dogfood) — Disparador: X-04 corriendo desde hace 2 meses. · `08-post-launch.md:30`
- [ ] **Z-07** Multi-sucursal — Disparador: primer cliente con dos sucursales en Pro. · `08-post-launch.md:43`
- [ ] **Z-08** Sync en segundo plano (Android WorkManager / iOS BGTaskScheduler) — Disparador: la telemetría muestra > 10 % de las ventas llegando a la nube > 1 h después de la captura. · `08-post-launch.md:48`
- [ ] **Z-11** Extras de Pro: historial de auditoría + UI de permisos por operador — Disparador: primer cliente Pro. · Falta: Solo falta la pantalla de historial de auditoría (desde `sync_log` / `cancelacion_logs`); el editor de permisos por operador ya existe como P-05 (`equipo/operador-actions.tsx`, restringido por plan, una sola clave `canCancelSales`). · `08-post-launch.md:63`

### `09-next-features.md` · 2. Bloqueantes de lanzamiento (1)

- [ ] **N-30** Beta cerrada `[LAUNCH]` — Bloqueada por: X-01, N-03, N-04, N-06, N-09, N-13, N-26, N-27, N-28, N-29 · `09-next-features.md:779`

### `09-next-features.md` · 3. Post-lanzamiento (9)

- [ ] **N-51** Escalamiento de BD — Etapa 2 (ADR-068) — Disparador: cualquiera de: BD > 25 GB · una tabla > 50 M de filas · sync p95 > 800 ms (tarjeta N-07). · `09-next-features.md:1184`
- [ ] **N-52** Escalamiento de BD — Etapa 3 (ADR-068) — Disparador: BD > 500 GB o > 10 000 inquilinos activos. · `09-next-features.md:1190`
- [ ] **N-54** Facturación para negocios (revendedor PAC de marca blanca) — Disparador: N-33 en `live` durante 3 meses, y ≥ 5 clientes pidiendo facturar a sus propios clientes. · `09-next-features.md:1195`
- [ ] **N-63** Negocio: MRR, churn, prueba → pago — Bloqueada por: N-06 · Disparador: los webhooks de B-10 escriban `billing.subscriptions` para el primer inquilino que paga (se retira el stub de N-06). · `09-next-features.md:1288`
- [ ] **N-64** Embudo de activación y cohortes semanales — Bloqueada por: N-57 · Disparador: lanzamiento de X-10 (registros reales). · `09-next-features.md:1299`
- [ ] **N-71** Cobros: cobranza de vencidos, pruebas por vencer, extender / acreditar — Bloqueada por: N-06, N-66 · Disparador: el primer inquilino que paga. · `09-next-features.md:1371`
- [ ] **N-72** Costo por inquilino — Bloqueada por: N-63 · Disparador: N-63 `[x]`. · `09-next-features.md:1381`
- [ ] **N-73** Salud de la cuenta y microencuesta NPS — Bloqueada por: N-64, N-47 · Disparador: 50 inquilinos activos. · `09-next-features.md:1389`
- [ ] **N-74** Códigos promocionales y de referidos con atribución — Bloqueada por: N-64, N-01 · Disparador: lanzamiento de X-10. · `09-next-features.md:1399`

## Por archivo

- `02-contracts.md` — 2 abiertos (0 en curso, 0 bloqueados, 21 hechos)
- `03-backend.md` — 1 abiertos (1 en curso, 0 bloqueados, 17 hechos)
- `04-portal.md` — 11 abiertos (3 en curso, 1 bloqueados, 30 hechos)
- `05-app.md` — 1 abiertos (0 en curso, 0 bloqueados, 17 hechos)
- `06-landing.md` — 4 abiertos (0 en curso, 0 bloqueados, 6 hechos)
- `07-launch.md` — 9 abiertos (0 en curso, 0 bloqueados, 2 hechos)
- `08-post-launch.md` — 8 abiertos (0 en curso, 0 bloqueados, 4 hechos)
- `09-next-features.md` — 50 abiertos (11 en curso, 0 bloqueados, 26 hechos)
- `11-pre-launch-and-deferred.md` — 26 abiertos (0 en curso, 0 bloqueados, 7 hechos)
- `16-design-conformance.md` — todo cerrado — archivar (0 en curso, 0 bloqueados, 8 hechos)
- `18-db-scale-design-changes.md` — 10 abiertos (0 en curso, 0 bloqueados, 0 hechos)
- `19-movil-mostrador.md` — 3 abiertos (0 en curso, 0 bloqueados, 9 hechos)
- `../launch/production-readiness.md` — 42 abiertos (5 en curso, 0 bloqueados, 10 hechos)
