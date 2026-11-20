# ROADMAP.md — el plan de implementación de Xangarro

_Última actualización: 2026-11-20 (X-09)._

> **Qué es este archivo y qué no.** Aquí está la fase en la que anda el producto y el camino a lo
> que ya cerró. Las tareas abiertas **no viven aquí**: viven en los tracks de `docs/plan/`, y
> `docs/plan/PENDIENTES.md` las ordena — ese tablero se genera con `pnpm plan:board` y es el único
> lugar que nunca está viejo. Las reglas viven en `CLAUDE.md` y las decisiones en `ARCHITECTURE.md`.

---

## Fase actual: el lanzamiento de Xangarro

La forma del producto la fijó el **ADR-053**: el teléfono es estrictamente la superficie de captura
(ventas, egresos, caja y turnos, inventario y escáner, un solo rol, sin build de Director) y el
portal web es dueño de todo lo demás (identidad, roles, configuración del negocio, catálogo,
tableros, estados financieros y cobranza del plan). Los cálculos NIF y los KPI viven en
`packages/domain` y los consumen las dos superficies.

Dónde está el lanzamiento, al 2026-11-20:

- **Portal y consola, en producción** desde el 2026-11-18: cinco migraciones aplicadas con respaldo
  previo y los tres secretos del portal puestos en Vercel.
- **iOS primero** (decisión del dueño, 2026-11-18). El App ID `mx.xangarro.mobile` y el registro en
  App Store Connect existen, y la compilación de producción 1.0.0 (2) está subida. Falta probarla en
  TestFlight y llenar App Privacy antes de enviar.
- **Google Play, en diciembre**, cuando la app de Apple ya se pueda probar.
- **Lo que detiene producción** está en «Bloquea producción» del tablero, con su nivel y su
  bloqueo. La mayoría no es código: son consolas de terceros, textos legales y registros.

El estado exacto de cualquier tarea se lee en su track, nunca aquí.

---

## Dónde está cada cosa

| Lo que buscas                               | Dónde                                                 |
| ------------------------------------------- | ----------------------------------------------------- |
| Qué falta, ordenado por urgencia y por tipo | `docs/plan/PENDIENTES.md` (generado)                  |
| La tarea en sí, con sus Steps y Acceptance  | el track en `docs/plan/` que la contiene              |
| Cómo se escribe y se cierra una tarea       | `docs/plan/00-README.md` §3                           |
| Las reglas que no se negocian               | `CLAUDE.md`                                           |
| Por qué algo es así                         | `ARCHITECTURE.md` (bitácora de ADR, sólo se agrega)   |
| Cómo se ve cada pantalla                    | `docs/design/el-mostrador.md` y los boards del canvas |
| Lo que ya cerró, con su detalle             | `ROADMAP-archive.md`                                  |

Los tracks, por superficie: `03-backend.md` (nube y sync), `04-portal.md` (el portal),
`19-movil-mostrador.md` (el teléfono), `20-command-center.md` (la consola interna),
`06-landing.md`, `07-launch.md` (tiendas e integración), `09-next-features.md` (lo que sigue),
`11-pre-launch-and-deferred.md` (lo que le toca al dueño), `22-codi.md`, `24-synth.md`.

---

## El teléfono

La app de captura es `apps/mobile` (Expo + React Native, Tamagui, SQLite por Drizzle) sobre las
pantallas compartidas de `packages/ui`. Su plan vive en **`docs/plan/19-movil-mostrador.md`** — el
track del Mostrador, que la rehizo entera contra los boards aprobados — y lo que le queda abierto
se lee ahí y en el tablero.

Lo que conviene saber antes de tocarla:

- **Cuatro pestañas**: Inicio, Cobrar, Ventas, Mi turno. El cierre de turno es su propia ruta fuera
  de las pestañas (`/cierre`), porque el botón de cerrar quedaba debajo de la barra.
- **Un solo rol.** No hay build de Director: el dueño usa el portal.
- **Captura primero.** Sin conexión nunca se bloquea la captura; el dispositivo encola en un outbox
  append-only contra un entitlement firmado, con gracia de pago y un reloj de obsolescencia
  aparte. Al vencer los dos, la app queda en sólo lectura **más exportación**: nunca borra, nunca
  secuestra los datos (CLAUDE.md §2.2).
- **E2E es Maestro**, en `apps/mobile/maestro/`. Desde el ADR-157 corre en «lanes» paralelos: cada
  corrida toma su simulador, su mock y su Metro. La sección «Lanes» del README del directorio lo
  explica.
- La historia de la app anterior (la de Cachink, con modo LAN y build de escritorio) está en
  `docs/archive/05-app.md` y en este archivo histórico. No es la app de hoy.

---

## Fases cerradas

Su detalle está en `ROADMAP-archive.md`, que sólo se agrega.

| Fase                                     | Cerrada                                 |
| ---------------------------------------- | --------------------------------------- |
| 0 — Fundación (monorepo, capas, tokens)  | 2026-04-23                              |
| 1A — Marca y primitivos de componente    | 2026-04-23                              |
| 1B — Dominio y capa de datos             | 2026-04-23                              |
| 1C — Modo local independiente            | 2026-04-24                              |
| 1D — Modo LAN (retirado por el ADR-053)  | 2026-04-24                              |
| 1E — Modo nube                           | 2026-04-24                              |
| 1F — Preparación de lanzamiento          | 2026-04-24                              |
| Slice 9 — Cableado pendiente             | 2026-04-24                              |
| WUX — Refresco de UX del asistente       | 2026-04-25                              |
| UXD — Alineación con los mocks de diseño | sin objeto tras el ADR-053 y el ADR-117 |
| Auditoría M-1 — Resilience Foundation    | 2026-04-25                              |
| Auditoría M-1 — Mobile-First UI/UX       | sin objeto tras el ADR-053 y el ADR-117 |
| Beta feedback, ronda 1                   | 2026-08-18                              |

Las dos herencias de la fase 0 que el archivo lista sin cerrar (`P0-M4-T04` verificar en simulador,
`P0-M7-T03` CI verde en un PR vacío) se cumplieron solas: Xcode está instalado y CI corre en cada
PR.

---

## Cómo se colapsa una fase

El patrón, escrito aquí porque es de este archivo (antes se citaba una sección de `CLAUDE.md` que
el ADR-100 se llevó):

1. Una fase se colapsa cuando **todos** sus hitos cerraron, o cuando un ADR la deja sin objeto.
2. Su texto completo se **mueve** a `ROADMAP-archive.md`, que sólo se agrega y nunca se edita.
3. En la tabla de arriba queda un renglón de una línea: la fase, cuándo cerró o qué ADR la retiró.
4. Si al colapsar aparece una casilla que **sí** sigue viva, no se archiva: se escribe como tarea al
   final del track que le toca, con la siguiente numeración y una línea diciendo qué la sacó a la
   luz (`docs/plan/00-README.md` §3).
5. Nada se borra. Colapsar es mover, no tirar.

---

## Lo que se archivó el 2026-11-20 (X-09)

Este archivo tenía 1,536 líneas y su «fase actual» era de abril. Se colapsaron trece secciones.
Ninguna de sus 38 casillas abiertas era trabajo vivo: el ADR-053 cambió la forma del producto y el
ADR-117 el lenguaje visual, así que la alineación con los mocks, las conversiones de modal a ruta y
las pantallas de Director quedaron sin objeto; las cinco de «Resilience Foundation» ya decían
cerradas en el propio Current Status; las tres de «Beta feedback» eran elogios sin acción; y de las
cinco de «Step 0», tres estaban hechas (el `<Pressable>` del `Btn`, el `useSafeAreaInsets()` del
modal nativo, y el `ConsentModal` que ya no se auto-monta) y una no tenía caso (los tres
«self-imports» sospechosos son `import type`, que se borra al compilar).

Tres sí seguían vivas y se fueron a `docs/plan/`, cada una citando de dónde viene:

- **P-47** — editar las plantillas de gastos recurrentes (era `S9-E2-T01`).
- **N-86** — virtualizar `<List>` en web cuando una lista pase de ~200 filas (era `M-1-PR4.5-T10`).
- **N-87** — `ConsentModal` no tiene quien la monte: decidir si se monta o se retira (lo que quedó
  de `M-1-STEP0-T02`).

También se retiró la lista «Post-Phase 1 — Future Phase Candidates», que decía «no planear esto»
sobre cosas que hoy son tracks con tareas: CoDi es `22-codi.md`, Clip y Mercado Pago son N-40…N-44
y O-19/O-27/O-28, la caja sin conexión como PWA es `14-caja-offline-pwa.md`, y compartir por
WhatsApp ya salió con N-20 y N-21.
