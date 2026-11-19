# Xangarro Synth — Especificación técnica (v2)

> **Brief, no plan.** Es la especificación v2 del dueño, tal cual, como brief de diseño del track 24 (`24-synth.md`, ADR-153). Donde difieran, mandan §1 y §2 de `24-synth.md`: los hallazgos de la Fase 0 y las decisiones del dueño del 2026-11-19 resuelven todos los `VERIFICAR` de abajo.

Arnés de QA exploratorio y auditoría heurística con agentes LLM para la web de Xangarro, con una app interna (**Synth Studio**) para lanzar, observar y revisar las simulaciones.

**Para Claude Code:** este documento es la especificación completa. Constrúyelo por fases (sección 12), en orden, y no avances de fase sin cumplir sus criterios de aceptación. Todo lo marcado con `VERIFICAR` es un supuesto que debes confirmar contra el repo o con Eduardo antes de implementarlo.

**Cambios en v2:** Synth Studio (sección 16), sesiones longitudinales con memoria (17), grafo de evidencia para personas (18), laboratorio de narrativa opcional (19), política de licencias (20) y fases 8 a 12.

**Regla de arquitectura:** el núcleo (CLI, scripts, skills) funciona completo sin Studio. Studio es una interfaz sobre el mismo núcleo, nunca una segunda implementación.

---

## 1. Qué es y qué no es

### Es

1. **QA exploratorio con evidencia dura.** Agentes que usan la app como usuarios, mientras un runner graba consola, red, screenshots y trazas.
2. **Auditor heurístico con lentes de persona.** Recorrido cognitivo pantalla por pantalla: qué entendería, qué probaría y qué malinterpretaría cada perfil.
3. **Preparador de investigación real.** Genera hipótesis y guiones para sesiones con usuarios reales, y después procesa esas sesiones.
4. **Simulador de uso en el tiempo.** Recorridos de varias sesiones (día 1, 7, 30) con memoria por persona, para encontrar fricción de regreso y de reaprendizaje.
5. **Herramienta interna con interfaz.** Synth Studio permite lanzar corridas, verlas en vivo, reproducirlas paso a paso y revisar hallazgos. No forma parte del producto que usan los clientes.

### No es

- No mide si el producto "gusta". No hay calificaciones 1 a 10 ni preguntas de disposición a pagar.
- No sustituye pruebas con usuarios reales.
- No es una suite de regresión determinista (aunque produce tests de regresión como salida).

### Por qué estas restricciones

La evidencia publicada sobre usuarios sintéticos muestra que:

- Los agentes completan tareas por rutas más óptimas que las personas y detectan menos puntos de falla; o fallan por razones propias del agente. La tasa de éxito no es un proxy del éxito humano.
- Los LLM colapsan hacia una "persona promedio". Las biografías largas escritas por un LLM aumentan la homogeneidad.
- Los sintéticos son complacientes y les "importa todo", así que no sirven para priorizar por opinión.
- No reproducen fatiga ni distracción por instrucción de prompt.
- Sí rinden bien en evaluación heurística y, con el prompting adecuado, predicen puntos de falla que encuentran los humanos.

Cada regla de diseño de la sección 2 responde a uno de estos puntos.

---

## 2. Principios de diseño (obligatorios)

| #   | Principio                                  | Implicación                                                                                             |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| P1  | El actor es caja negra                     | El agente que usa la app no tiene acceso al código, al repo ni a documentación interna. Solo navegador. |
| P2  | Actor y juez son agentes distintos         | Quien usa la app no clasifica sus propios hallazgos.                                                    |
| P3  | Sin evidencia no hay hallazgo              | Todo hallazgo referencia pasos de la traza, screenshots o errores capturados.                           |
| P4  | Lo determinista va en scripts              | Entorno, datos, interrupciones, captura y agregación no dependen de un LLM.                             |
| P5  | Personas ancladas en datos                 | Cada rasgo de una persona cita su fuente o se marca como hipótesis.                                     |
| P6  | Métricas relativas, no absolutas           | La tasa de éxito solo se compara entre versiones con la misma persona y escenario.                      |
| P7  | Separar falla del agente de falla de la UI | El juez clasifica cada tropiezo en una de las dos.                                                      |
| P8  | El arnés se mide a sí mismo                | Bugs sembrados y línea base humana cuantifican qué tanto detecta.                                       |
| P9  | Nunca contra producción                    | Solo local o staging, con cuentas y datos de prueba.                                                    |

---

## 3. Contexto de Xangarro que el arnés debe conocer

Hechos del producto (confirmados por Eduardo):

- POS y gestión financiera para pequeños negocios en México. El foco actual es la **web**; la app móvil (teléfono y tablet) es solo para operar la caja.
- Stack: Expo/React Native (móvil), Tauri 2 (escritorio), arquitectura **local-first**.
- Onboarding con wizard de **dos caminos**.
- Planes: gratis o de pago, **sin periodo de prueba**. Tamaños: Xangarrito (dueño + 1 empleado), Xangarro (dueño + 2), Xangarrote (dueño + 5). Un dispositivo vinculado por empleado.
- Permisos: solo el dueño/director puede editar ventas; el operador no.
- Funciones de gestión (merma, conversión, auditoría, nómina) solo en web.
- "Don Cuentas" es el asesor con IA; su revisión es de fin de mes.

`VERIFICAR` en el repo durante la Fase 0:

- Cómo se levanta la web en local y si existe un entorno de staging.
- Cómo se resetea y siembra la base de datos (por ser local-first, puede haber estado en el navegador además del servidor).
- Flujo de autenticación y cómo crear cuentas de prueba por rol.
- Si las llamadas LLM de Don Cuentas pueden simularse (mock) en pruebas.
- Rutas y nombres reales de cada flujo listado en la sección 6.

---

## 4. Arquitectura

```
                       ┌────────────────────────────┐
                       │  Skill: synth-run          │  orquesta, elige modo
                       └─────────────┬──────────────┘
                                     │
                       ┌─────────────▼──────────────┐
                       │  run.ts (runner)           │
                       │  - seed + reset            │
                       │  - lanza Chromium (CDP)    │
                       │  - captura evidencia       │
                       │  - inyecta interrupciones  │
                       └──┬──────────────────────┬──┘
                          │ CDP                  │ lanza proceso
               ┌──────────▼─────────┐   ┌────────▼───────────────┐
               │ Chromium aislado   │◄──┤ Actor (claude -p)      │
               │ 1 perfil por run   │MCP│ persona + misión       │
               └────────────────────┘   │ solo Playwright MCP    │
                                        └────────┬───────────────┘
                                                 │ traza + transcript
                                        ┌────────▼───────────────┐
                                        │ Juez (synth-judge)     │
                                        │ clasifica con rúbrica  │
                                        └────────┬───────────────┘
                                                 │ findings.json
                                        ┌────────▼───────────────┐
                                        │ aggregate.ts           │
                                        │ dedup + métricas       │
                                        └────────┬───────────────┘
                                                 │
                          ┌──────────────────────┼─────────────────────┐
                 ┌────────▼────────┐   ┌─────────▼────────┐   ┌────────▼─────────┐
                 │ report.md       │   │ Triage           │   │ research-prep    │
                 │ priorizado      │   │ (con repo)       │   │ guion entrevistas│
                 └─────────────────┘   │ → test Playwright│   └──────────────────┘
                                       └──────────────────┘
```

### Decisión clave: el runner es dueño del navegador

El runner lanza Chromium con puerto de depuración remota y el Playwright MCP del actor se conecta a ese navegador por CDP. Así el runner puede, sin intervención del LLM:

- grabar consola, requests fallidos, screenshots y trace;
- inyectar interrupciones (offline, expiración de sesión, etc.);
- aplicar bugs sembrados en tiempo de ejecución.

`VERIFICAR`: la opción actual del paquete Playwright MCP para conectarse a un endpoint CDP existente, y los flags vigentes de `claude -p` para modo headless (formato de salida, herramientas permitidas, configuración MCP, límite de turnos). Consulta la documentación antes de escribir `run.ts`; no asumas nombres de flags.

### Aislamiento del actor (P1)

- El actor corre como proceso headless separado, con directorio de trabajo vacío y temporal.
- Herramientas permitidas: únicamente las del Playwright MCP. Sin Bash, Read, Grep ni acceso a red fuera del navegador.
- Su prompt contiene solo: persona, misión, reglas de comportamiento y esquema de salida.

---

## 5. Estructura del repositorio

Ubicación: dentro del repo de Xangarro, como paquete interno. Usa la convención de monorepo que ya exista (`apps/`, `packages/`, `tools/`) `VERIFICAR`; abajo se muestra como `synth/`.

Tres piezas, con dependencias en un solo sentido (`studio → server → core`):

- `core/`: todo lo descrito en las secciones 4 a 15. Sin dependencias de Studio.
- `server/`: API local y cola de trabajos que invoca al núcleo (sección 16).
- `studio/`: frontend (sección 16).

Ningún paquete del producto puede importar de `synth/`, y `synth/` queda excluido de todos los builds y despliegues del producto. Agrega una regla de lint o de CI que lo verifique.

El árbol siguiente corresponde a `synth/core/`, más `server/` y `studio/` como hermanos:

```
synth/
├── server/                     # sección 16
├── studio/                     # sección 16
├── journeys/*.yaml             # sección 17
├── memory/                     # sección 17, memoria por persona y recorrido
├── graph/                      # sección 18
├── README.md
├── ENV.md                      # salida de Fase 0: cómo levantar, sembrar, autenticar
├── config.yaml                 # baseUrl, concurrencia, modelos por rol, límites
├── personas/
│   ├── core/*.yaml
│   ├── pool/*.yaml
│   └── evidence/               # fuentes reales: reseñas, transcripciones, notas
├── scenarios/*.yaml
├── matrix/
│   ├── smoke.yaml
│   └── full.yaml
├── interruptions/*.ts          # implementaciones deterministas
├── seeded-bugs/*.ts            # mutaciones en runtime
├── calibration/
│   ├── human-baseline.yaml
│   └── sensitivity-history.csv
├── scripts/
│   ├── seed.ts
│   ├── run.ts
│   ├── capture.ts
│   ├── aggregate.ts
│   ├── sensitivity.ts
│   └── validate.ts             # valida todos los YAML contra sus esquemas
├── schemas/*.json              # JSON Schema de persona, escenario, hallazgo, run
├── prompts/
│   ├── actor-task.md
│   ├── actor-walkthrough.md
│   ├── judge.md
│   └── exit-interview.md
├── .claude/
│   ├── skills/
│   │   ├── synth-run/SKILL.md
│   │   ├── synth-judge/SKILL.md
│   │   ├── synth-triage/SKILL.md
│   │   ├── synth-persona/SKILL.md
│   │   └── synth-research-prep/SKILL.md
│   └── agents/
│       ├── synth-judge.md
│       └── synth-triage.md
└── reports/
    └── YYYY-MM-DD-HHmm/
        ├── runs/<run-id>/      # transcript, trace, screenshots, console, network
        ├── findings.json
        ├── metrics.json
        └── report.md
```

Lenguaje de scripts: TypeScript con el runtime que ya use el repo `VERIFICAR`.

---

## 6. Modelos de datos

### 6.1 Persona (`personas/**/*.yaml`)

```yaml
id: lupita-abarrotes
kind: human # human | chaos | device
tier: core # core | pool | anti
status: hypothesis # hypothesis | grounded
market_weight: 0.30 # estimación del segmento; la define Eduardo
business:
  type: abarrotes
  team: solo
  formality: informal # informal | resico | formal-con-contador
device:
  viewport: [360, 740]
  network: slow-3g # perfil de red que aplica el runner
  input: touch
comparators: [libreta] # contra qué juzga: libreta, excel, square, clip...
goals:
  - saber cuánto vendió hoy sin hacer cuentas a mano
knows:
  - cobrar, dar cambio, fiar
does_not_know: # vocabulario que NO entiende si aparece en pantalla
  - SKU
  - inventario
  - conciliación
behaviors: # conductas observables, no adjetivos
  - trait: lee solo los botones grandes y salta el texto de ayuda
    source: evidence/playstore-pos-reviews.md#L12
  - trait: si aparece un error en inglés, cierra la app
    source: hypothesis
patience:
  max_steps: 40 # presupuesto antes de abandonar
  abandon_triggers:
    - le piden un dato que no tiene a la mano (RFC)
    - tres intentos fallidos en la misma pantalla
```

Reglas:

- `behaviors[].source` es obligatorio: una ruta dentro de `personas/evidence/` o el literal `hypothesis`.
- Una persona es `grounded` cuando al menos el 60% de sus `behaviors` cita evidencia real.
- Prohibido incluir biografías narrativas, rasgos de personalidad abstractos o estereotipos. Solo conductas y expectativas concretas.
- El reporte indica junto a cada hallazgo si la persona es `hypothesis` o `grounded`.

### 6.2 Escenario (`scenarios/*.yaml`)

```yaml
id: primera-venta
title: Registrar la primera venta del día
mission: > # lo único que el actor recibe sobre la tarea
  Acabas de abrir tu negocio. Llega un cliente y se lleva dos productos.
  Cóbrale en efectivo.
start:
  seed: negocio-con-catalogo-minimo
  auth_as: owner
  url: / # VERIFICAR ruta real
success: # criterios verificables por script, no por el LLM
  - type: db # VERIFICAR mecanismo real
    assert: existe 1 venta con 2 partidas y método efectivo
optimal_steps: 6 # ruta mínima, medida a mano una vez
interruptions: [] # ids de interruptions/ a inyectar
applies_to: [human, chaos]
```

Escenarios iniciales (`VERIFICAR` rutas y nombres contra la app):

| id                                            | Qué cubre                                                                        |
| --------------------------------------------- | -------------------------------------------------------------------------------- |
| `onboarding-camino-a` / `onboarding-camino-b` | Los dos caminos del wizard                                                       |
| `primera-venta`                               | Venta básica en caja                                                             |
| `corte-de-caja`                               | Cierre del día y cuadre                                                          |
| `alta-producto`                               | Dar de alta un producto con precio                                               |
| `vincular-empleado`                           | Agregar un operador y su dispositivo, respetando el límite del plan              |
| `permisos-operador`                           | El operador intenta editar una venta; debe quedar bloqueado con un mensaje claro |
| `subir-de-plan`                               | Llegar al límite del plan y entender las opciones (sin prueba gratis)            |
| `revision-don-cuentas`                        | Revisión de fin de mes con el asesor                                             |

### 6.3 Matriz (`matrix/*.yaml`)

```yaml
mode: smoke
repetitions: 1 # en full: 3, para ver varianza entre corridas
runs:
  - { persona: lupita-abarrotes, scenario: onboarding-camino-a, style: task }
  - { persona: taquero, scenario: primera-venta, style: task }
  - { persona: operador, scenario: permisos-operador, style: task }
  - { persona: chaos, scenario: primera-venta, style: task }
  - { persona: lupita-abarrotes, scenario: primera-venta, style: walkthrough }
```

`style`: `task` (completa la misión) o `walkthrough` (recorrido cognitivo, sección 8.2).

### 6.4 Hallazgo (`findings.json`)

```json
{
  "id": "F-2026-11-19-007",
  "run_id": "lupita-abarrotes__primera-venta__task__r1",
  "category": "bug | friction | comprehension | agent_failure | out_of_scope_expectation",
  "severity": "critical | major | minor",
  "title": "El botón Cobrar queda oculto bajo el teclado en 360px",
  "description": "…",
  "evidence": {
    "steps": [14, 15, 16],
    "screenshots": ["runs/…/step-015.png"],
    "console": ["runs/…/console.jsonl#L42"],
    "network": []
  },
  "persona_status": "hypothesis",
  "repro": "pasos mínimos para reproducir",
  "confidence": "high | medium | low",
  "dedupe_key": "caja/cobrar/boton-oculto-teclado"
}
```

Reglas:

- Un hallazgo sin al menos una referencia en `evidence` se descarta en `aggregate.ts`.
- `agent_failure` se cuenta aparte y nunca entra a la lista priorizada.
- `out_of_scope_expectation` registra lo que una persona esperaba y el producto no ofrece (útil para anti-personas).

---

## 7. Personas iniciales

Todas nacen como `status: hypothesis`. La Fase 7 las ancla.

### Núcleo (corren siempre)

| id                    | Perfil                                                        | Qué estresa                                                        |
| --------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------ |
| `lupita-abarrotes`    | Dueña de abarrotes, viene de la libreta, Android de gama baja | Onboarding, vocabulario, plan gratis                               |
| `taquero`             | Puesto de comida, solo celular, cobra con prisa               | Velocidad de caja, número de toques                                |
| `operador`            | Empleado en tablet, solo caja                                 | Permisos y mensajes de bloqueo                                     |
| `emprendedora-cafe`   | Café de especialidad, iPad, ya conoce Square o Shopify POS    | Estándar visual, Safari en iPad, expectativa de terminal y factura |
| `dueno-con-equipo`    | Dueño con 5 empleados (Xangarrote)                            | Vincular dispositivos, auditoría, nómina                           |
| `formal-con-contador` | Negocio formal cuyo contador pide reportes                    | Exportación, cuadre, cierre de mes                                 |

### No humanos

| id       | Qué hace                                                                                                                          |
| -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `chaos`  | Doble clic, botón atrás a media operación, precio 0, cantidades decimales, ñ y acentos, textos muy largos, recargar a media venta |
| `device` | Repite misiones en viewports chicos, red lenta y con zoom de texto del sistema                                                    |

### Pool y anti-personas (Fase 7 en adelante)

`ferretero-500-skus`, `estetica-servicios`, `vendedora-instagram`, `hijo-digitaliza`, `multi-sucursal`, `gerente-contratado`, `profesionista-negocio-paralelo`, y la anti-persona `restaurante-con-mesas`.

---

## 8. Agentes

### 8.1 Actor en modo `task` (`prompts/actor-task.md`)

Entradas: persona (YAML completo), `mission` del escenario, `max_steps`.

Reglas que el prompt debe imponer:

1. Solo sabes lo que está en pantalla y lo que tu persona sabe. Si aparece un término de `does_not_know`, no lo entiendes: actúa en consecuencia.
2. Antes de cada acción escribe una línea de pensamiento en voz alta, en primera persona y en el registro de la persona.
3. **Cuando dudes, no elijas la opción más lógica: enumera las opciones plausibles en pantalla y prueba la que tu persona elegiría, aunque sea incorrecta.** (Contrarresta la tendencia del agente a la ruta óptima.)
4. Puedes abandonar. Abandona si se cumple un `abandon_trigger` o si agotas `max_steps`. Abandonar es un resultado válido, no un fracaso tuyo.
5. No uses la URL para navegar, ni atajos de teclado que tu persona no conocería, ni inspecciones el DOM para "descubrir" elementos ocultos.
6. No opines sobre si la app te gusta. No des calificaciones.

Salida (JSON): `outcome` (`completed | abandoned | blocked`), `steps[]` con `{n, thought, action, observed}`, y `exit_interview`.

`exit_interview` (elección forzada, `prompts/exit-interview.md`):

- Los 2 momentos que más te estorbaron (deben citar número de paso).
- Una palabra o texto en pantalla que no entendiste (o "ninguno").
- Qué esperabas encontrar y no encontraste (o "nada").

### 8.2 Actor en modo `walkthrough` (`prompts/actor-walkthrough.md`)

Recorrido cognitivo. En **cada pantalla**, antes de actuar, el actor responde por escrito:

1. ¿Qué cree esta persona que debe hacer aquí para avanzar hacia su meta?
2. ¿Es visible y reconocible el control correcto para esta persona? ¿Por qué sí o no?
3. ¿Qué otras opciones en pantalla podrían confundirla y parecerle la correcta?
4. Después de actuar: ¿la respuesta de la interfaz le deja claro que avanzó?

Después avanza por la ruta correcta (aunque la persona se hubiera equivocado) para auditar el flujo completo. Cada "no" en 2 o 4, y cada opción listada en 3, es un candidato a punto de falla que el juez evalúa.

### 8.3 Juez (`.claude/agents/synth-judge.md` + `prompts/judge.md`)

Entradas: transcript del actor, consola, red, screenshots, criterios `success` evaluados por script, persona y escenario.

Tareas:

1. Por cada tropiezo, decidir `category`. Pregunta de corte para `agent_failure`: _¿un humano con ojos y manos habría tenido este mismo problema?_ Si el problema es que el agente no pudo localizar o accionar un elemento visible y claro, es `agent_failure`.
2. Todo error de consola o request fallido (4xx/5xx inesperado) genera un candidato a `bug` aunque el actor no lo haya notado.
3. Asignar severidad según la rúbrica:
   - `critical`: pérdida de datos, cálculo de dinero incorrecto, bloqueo sin salida, fuga de permisos.
   - `major`: abandono o desvío largo en un flujo principal.
   - `minor`: fricción con recuperación rápida.
4. Emitir hallazgos con evidencia y `dedupe_key` estable (`área/acción/síntoma`).
5. No inventar hallazgos sin referencia a la traza. No usar el `exit_interview` como única evidencia.

Herramientas del juez: solo lectura sobre `reports/<corrida>/runs/<run-id>/`. Sin acceso al código de la app.

### 8.4 Triage (`.claude/agents/synth-triage.md`)

Único agente **con** acceso al repo. Para cada hallazgo `bug` con severidad `critical` o `major`:

1. Reproducirlo con un script Playwright determinista.
2. Si se reproduce: localizar la causa probable en el código y guardar el script como test de regresión en la suite existente `VERIFICAR ubicación`.
3. Si no se reproduce en 3 intentos: marcar `confidence: low` y `flaky: true`.
4. **No corrige el bug.** Deja el test fallando y un resumen. La corrección la decide Eduardo.

---

## 9. Scripts

### `seed.ts`

- Resetea servidor y estado del navegador (por ser local-first) al fixture indicado en `scenario.start.seed`.
- Fixtures por giro: `vacio`, `negocio-con-catalogo-minimo`, `negocio-con-historial-30-dias`, `plan-al-limite`.
- Crea cuentas de prueba por rol (`owner`, `operator`).
- Idempotente. Falla con error claro si `baseUrl` parece producción (lista de hosts permitidos en `config.yaml`).

### `run.ts`

Por cada entrada de la matriz:

1. `seed` del escenario.
2. Lanza Chromium con perfil temporal, viewport y perfil de red de la persona, y puerto CDP.
3. Arranca `capture` y registra las interrupciones y bugs sembrados del run.
4. Lanza el actor headless conectado a ese navegador. Límites: `max_steps`, tiempo máximo y turnos máximos.
5. Al terminar, evalúa `success` por script y escribe `run.json`.
6. Concurrencia configurable (default 3). Cada run en su propio perfil y, si el backend lo requiere, su propio tenant `VERIFICAR`.

### `capture.ts`

- `console.jsonl`, `network.jsonl` (solo fallos y requests lentos), screenshot por paso, Playwright trace.
- Marca de tiempo común para correlacionar con los pasos del actor.

### Interrupciones (`interruptions/*.ts`)

Deterministas, disparadas por patrón de URL o número de paso:

| id                   | Qué hace                                                                   |
| -------------------- | -------------------------------------------------------------------------- |
| `offline-mid-sale`   | Corta la red al entrar a la pantalla de cobro y la restaura 20 s después   |
| `session-expired`    | Invalida la sesión a media tarea                                           |
| `tab-away-10min`     | Avanza el reloj y dispara eventos de visibilidad                           |
| `reload-mid-form`    | Recarga con un formulario a medio llenar                                   |
| `second-device-edit` | Modifica el mismo registro desde otra sesión (conflicto de sincronización) |

### Bugs sembrados (`seeded-bugs/*.ts`)

Mutaciones en runtime (init scripts o intercepción de rutas), sin tocar el código de la app:

- botón principal que no responde al primer clic;
- etiqueta cambiada a un término técnico;
- total con error de redondeo;
- respuesta 500 al guardar;
- mensaje de error en inglés;
- control clave fuera del viewport en 360 px;
- operador que sí puede editar una venta (fuga de permisos);
- guardado que tarda 8 s sin indicador.

Cada uno declara `expected_category` y `expected_dedupe_prefix`.

### `sensitivity.ts`

Corre la matriz smoke con cada bug sembrado activo y calcula **recall** (detectados / sembrados), por categoría. Agrega una fila a `calibration/sensitivity-history.csv`.

### `aggregate.ts`

- Descarta hallazgos sin evidencia. Deduplica por `dedupe_key`.
- Prioridad = severidad × número de personas distintas afectadas × `market_weight` sumado.
- Métricas por persona × escenario: `outcome`, pasos reales / `optimal_steps`, paso de abandono, errores de consola, `agent_failure` separados.
- Si hay una corrida anterior comparable, calcula el delta. **Las tasas de éxito solo se muestran como delta entre versiones.**
- Con `repetitions > 1`, reporta en cuántas repeticiones apareció cada hallazgo.

---

## 10. Skills

| Skill                 | Cuándo se usa                                                  | Qué hace                                                                                                                                          |
| --------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `synth-run`           | "corre synth smoke/full", "prueba este flujo con las personas" | Valida YAMLs, ejecuta `run.ts`, invoca al juez por run, ejecuta `aggregate.ts`, entrega `report.md`                                               |
| `synth-judge`         | Lo invoca `synth-run`                                          | Contiene la rúbrica y los ejemplos de clasificación                                                                                               |
| `synth-triage`        | "haz triage de la última corrida"                              | Reproduce bugs y escribe tests de regresión                                                                                                       |
| `synth-persona`       | "crea una persona a partir de estas notas"                     | Convierte evidencia real en YAML; rechaza rasgos sin fuente                                                                                       |
| `synth-research-prep` | "prepara las sesiones con usuarios reales"                     | Con los hallazgos, genera guion de tareas e hipótesis a validar con humanos; luego procesa las notas de esas sesiones hacia `human-baseline.yaml` |

`VERIFICAR` el formato vigente de skills y subagentes de Claude Code en la documentación antes de crearlos.

---

## 11. Reporte (`report.md`)

Orden fijo:

1. **Encabezado:** fecha, commit de la app, modo, número de runs, y la leyenda "Hallazgos generados por agentes sintéticos; son hipótesis hasta verificarse".
2. **Sensibilidad del arnés:** último recall con bugs sembrados.
3. **Bugs** con evidencia dura, por severidad.
4. **Fricción y comprensión**, por prioridad, indicando personas afectadas y si son `hypothesis` o `grounded`.
5. **Expectativas fuera de alcance** (lo que pidieron y no existe).
6. **Deltas contra la corrida anterior.**
7. **Fallas del agente** (apéndice, para mejorar el arnés).
8. **Preguntas para usuarios reales** derivadas de los hallazgos de baja confianza.

Prohibido en el reporte: calificaciones de satisfacción, NPS, "les gustó", o porcentajes de éxito presentados como predicción de usuarios reales.

---

## 12. Fases de construcción

### Fase 0 — Descubrimiento

Lee el repo de Xangarro y resuelve todos los `VERIFICAR` de las secciones 3 y 4. Escribe `synth/ENV.md`.
**Aceptación:** `ENV.md` explica cómo levantar la web, resetear y sembrar datos, y autenticar cada rol; lista las dudas que requieren a Eduardo. Detente y pregunta si alguna bloquea.

### Fase 1 — Un run de punta a punta

`config.yaml`, esquemas, `validate.ts`, `seed.ts` (un fixture), `run.ts`, `capture.ts`, `prompts/actor-task.md`, una persona (`taquero`) y un escenario (`primera-venta`).
**Aceptación:** un comando ejecuta el run y deja en `reports/` transcript, screenshots por paso, consola, red y `run.json` con `success` evaluado por script. El actor no tiene ninguna herramienta fuera del navegador (demuéstralo en el README).

### Fase 2 — Juez, agregación y reporte

`synth-judge`, `aggregate.ts`, `report.md`.
**Aceptación:** el reporte se genera solo; ningún hallazgo carece de evidencia; `agent_failure` aparece separado.

### Fase 3 — Matriz v1

Personas `lupita-abarrotes`, `taquero`, `operador`, `chaos`. Escenarios `onboarding-camino-a`, `primera-venta`, `corte-de-caja`, `permisos-operador`. Concurrencia y skill `synth-run`.
**Aceptación:** `smoke` corre en paralelo sin interferencia entre runs y termina en menos de 15 minutos.

### Fase 4 — Bugs sembrados y sensibilidad

Los 8 bugs de la sección 9 y `sensitivity.ts`.
**Aceptación:** existe un número de recall. Si es menor a 60%, itera prompts del actor y del juez antes de seguir, y documenta qué cambió.

### Fase 5 — Recorrido cognitivo e interrupciones

`actor-walkthrough.md`, estilo `walkthrough` en la matriz y las 5 interrupciones.
**Aceptación:** el recorrido produce puntos de falla por pantalla; `offline-mid-sale` se dispara sin intervención del LLM y el resultado de sincronización queda registrado.

### Fase 6 — Triage

`synth-triage`.
**Aceptación:** al menos un bug real o sembrado termina como test de regresión reproducible en la suite del repo.

### Fase 7 — Anclaje y calibración

`synth-persona`, `synth-research-prep`, resto de personas núcleo, pool y anti-persona.
**Aceptación:** existe guion para 3 a 5 sesiones reales sobre los mismos 3 escenarios; `human-baseline.yaml` tiene formato definido; `aggregate.ts` reporta coincidencias y diferencias entre hallazgos sintéticos y humanos cuando la línea base existe.

### Fase 8 — Studio en modo lectura

Indexador, API de lectura, y las pantallas Inicio, Corridas, Reproductor y Bandeja de hallazgos con revisión humana (sección 16).
**Aceptación:** una corrida hecha por CLI aparece en Studio sin pasos manuales; el reproductor muestra pensamiento, acción y screenshot sincronizados con consola y red; un veredicto humano sobre un hallazgo persiste y actualiza la métrica de precisión. Un test de CI confirma que ningún build del producto incluye `synth/`.

### Fase 9 — Studio lanza y muestra en vivo

Cola de trabajos, pantalla Lanzar, vista en vivo y pantallas Comparar y Calibración.
**Aceptación:** se lanza una matriz desde la interfaz con estimación de costo previa; la vista en vivo muestra el navegador y el pensamiento actual de cada run; cancelar una corrida detiene sus procesos y navegadores sin dejar huérfanos.

### Fase 10 — Sesiones longitudinales

Recorridos, memoria por persona con olvido, y pantalla Recorridos (sección 17).
**Aceptación:** el recorrido `primer-mes-dueno` corre completo; el día 30 opera sobre los datos generados en los días previos; la memoria se puede leer y editar; el reporte incluye costo de reaprendizaje y conceptos erróneos persistentes.

### Fase 11 — Grafo de evidencia

Ingesta, extracción con verificación literal de citas, constructor de personas y pantalla Evidencia (sección 18).
**Aceptación:** al ingerir un documento, cada cita extraída coincide textualmente con su fuente (verificado por script); una persona generada desde el grafo tiene todos sus `behaviors` enlazados a citas; la pantalla muestra qué segmentos tienen poca evidencia.

### Fase 12 — Laboratorio de narrativa (opcional)

Solo si Eduardo lo confirma (sección 19).
**Aceptación:** dado un mensaje o anuncio, produce una lista de objeciones agrupadas, cada una rotulada como hipótesis y enlazada a la evidencia de la persona que la originó.

---

## 13. Calibración con humanos

`calibration/human-baseline.yaml`:

```yaml
- scenario: primera-venta
  participant: P1 # sin datos personales
  segment: abarrotes
  outcome: completed
  issues:
    - dedupe_key: caja/cobrar/boton-oculto-teclado
      note: buscó el botón 20 segundos
```

Uso:

- **Sintético lo pasó sin problema y el humano no:** el actor es demasiado competente; ajustar la regla 3 del actor y `does_not_know`.
- **Sintético reportó y ningún humano lo vivió:** candidato a falso positivo; bajar confianza de esa clase de hallazgo.
- Todo rasgo observado en sesiones reales se incorpora a la persona con su fuente, y la persona puede pasar a `grounded`.

---

## 14. Costo y límites

En `config.yaml`:

- modelo por rol (actor, juez, triage) `VERIFICAR con Eduardo`;
- `max_steps`, tiempo máximo y turnos máximos por run;
- concurrencia;
- tope de runs por corrida.

Cada corrida registra tokens y duración por run en `metrics.json`.

---

## 15. Salvaguardas

- `seed.ts` y `run.ts` se niegan a correr si `baseUrl` no está en la lista de hosts permitidos.
- Solo cuentas y datos de prueba. Ningún dato real de clientes en fixtures ni en evidencia.
- Las fuentes en `personas/evidence/` se guardan sin nombres ni datos de contacto de personas reales.
- Pagos y suscripciones: solo en modo de prueba del proveedor `VERIFICAR`; si no existe, el escenario `subir-de-plan` termina antes del cobro.
- Don Cuentas: usar mock o un tope de gasto en pruebas `VERIFICAR`.
- Triage nunca hace commit ni push por su cuenta.

---

## 16. Synth Studio

App interna para operar el arnés. Corre en la máquina del desarrollador; no se despliega públicamente.

### 16.1 Arquitectura

```
┌──────────────┐  HTTP + SSE   ┌──────────────────────┐  invoca   ┌───────────┐
│ studio (web) │◄─────────────►│ server (API + cola)  │──────────►│ core      │
└──────────────┘               │  índice SQLite       │           │ run.ts …  │
                               └──────────┬───────────┘           └─────┬─────┘
                                          │ lee/indexa                  │ escribe
                                          └────────► reports/ ◄─────────┘
```

- **Fuente de verdad:** los archivos. Personas, escenarios, matrices y recorridos son YAML versionados en git; los resultados viven en `reports/`. SQLite es solo un índice reconstruible con un comando (`reindex`).
- **Frontend:** el mismo framework y sistema de componentes que la web de Xangarro `VERIFICAR`, para no introducir un segundo stack. Estilo visual sobrio y distinto al del producto, para que nadie lo confunda con una pantalla de cliente.
- **Server:** servicio local en TypeScript. Escucha solo en `localhost` por defecto.
- **Cola de trabajos:** en proceso, con concurrencia de `config.yaml`. Cada trabajo es una invocación de `run.ts`; el server no reimplementa lógica del núcleo.
- **Vivo:** eventos por SSE (estado del run, paso actual, pensamiento) y fotogramas del navegador por screencast de CDP `VERIFICAR`.

### 16.2 Pantallas

| Pantalla                 | Para qué          | Contenido                                                                                                                                                                                                 |
| ------------------------ | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Inicio**               | Estado general    | Última corrida, bugs abiertos por severidad, recall y precisión actuales, tendencia entre versiones                                                                                                       |
| **Lanzar**               | Ejecutar          | Elegir matriz o armar una a mano (personas × escenarios × estilo × repeticiones), commit o `baseUrl` objetivo, bugs sembrados e interrupciones; muestra estimación de costo y duración antes de confirmar |
| **Corridas**             | Historial         | Lista filtrable por fecha, commit, modo y resultado                                                                                                                                                       |
| **En vivo**              | Observar          | Cuadrícula de runs activos: navegador en vivo, pensamiento actual, paso n de max; botón cancelar                                                                                                          |
| **Reproductor**          | Revisar un run    | Línea de tiempo de pasos; por paso: pensamiento, acción, screenshot; pestañas de consola y red sincronizadas; marcas de interrupciones y de hallazgos; enlace al trace de Playwright                      |
| **Bandeja de hallazgos** | Decidir           | Hallazgos deduplicados y priorizados; cada uno abre su evidencia en el reproductor                                                                                                                        |
| **Comparar**             | Regresiones       | Dos corridas lado a lado: hallazgos nuevos, resueltos y persistentes; deltas de pasos y resultado                                                                                                         |
| **Personas**             | Mantener perfiles | Formulario sobre el YAML, porcentaje anclado, fuente de cada conducta, historial de hallazgos que produjo                                                                                                 |
| **Escenarios**           | Mantener misiones | Formulario sobre el YAML, ruta óptima, criterios de éxito                                                                                                                                                 |
| **Recorridos**           | Uso en el tiempo  | Vista día 1, 7, 30 por persona, con su memoria en cada punto (sección 17)                                                                                                                                 |
| **Evidencia**            | Anclar personas   | Documentos fuente, citas extraídas, cobertura por segmento (sección 18)                                                                                                                                   |
| **Calibración**          | Confiar o no      | Historial de recall con bugs sembrados, precisión por revisión humana, coincidencia sintético contra humano                                                                                               |

Las ediciones hechas desde Studio escriben el YAML en disco y pasan por `validate.ts`; el commit lo hace el desarrollador.

### 16.3 Revisión humana de hallazgos

Extiende el esquema de la sección 6.4:

```json
"review": {
  "verdict": "confirmed | false_positive | duplicate | wont_fix | needs_human_test",
  "note": "…",
  "reviewed_at": "2026-11-19T17:30:00Z",
  "linked_issue": "URL o id opcional",
  "sent_to_triage": false
}
```

- **Precisión del arnés** = confirmados / (confirmados + falsos positivos), por categoría y por persona. Se muestra junto al recall.
- Un `false_positive` guarda su `dedupe_key` en una lista de supresión con motivo, para que no reaparezca sin evidencia nueva.
- `needs_human_test` alimenta la lista de preguntas de `synth-research-prep`.
- "Enviar a triage" invoca `synth-triage` sobre ese hallazgo.

### 16.4 API (mínima)

```
GET  /runs                      POST /runs            (lanza; devuelve id)
GET  /runs/:id                  POST /runs/:id/cancel
GET  /runs/:id/events   (SSE)   GET  /runs/:id/steps
GET  /findings                  PATCH /findings/:id/review
GET  /personas | /scenarios | /matrices | /journeys   PUT /…/:id
GET  /calibration               POST /reindex
POST /estimate          (costo y duración de una matriz)
```

### 16.5 Salvaguardas de Studio

- Solo `localhost`. Si alguna vez se comparte en red interna, requiere autenticación; nunca expuesto a internet.
- Hereda las salvaguardas de la sección 15: se niega a lanzar contra hosts no permitidos.
- Tope de gasto por corrida y por día en `config.yaml`; la pantalla Lanzar bloquea si se excede.
- Los screenshots pueden contener datos de prueba; `reports/` va en `.gitignore`.

---

## 17. Sesiones longitudinales

Encuentran lo que una primera sesión no puede: qué pasa cuando la persona regresa días después, ya olvidó parte de lo aprendido y tiene datos acumulados.

**Alcance honesto:** esto detecta fricción de regreso y de reaprendizaje. No predice retención ni abandono reales.

### 17.1 Recorrido (`journeys/*.yaml`)

```yaml
id: primer-mes-dueno
persona: lupita-abarrotes
sessions:
  - day: 1
    scenarios: [onboarding-camino-a, primera-venta]
  - day: 2
    scenarios: [corte-de-caja]
  - day: 7
    between: { generate: ventas-tipicas, days: 5 } # datos sintéticos por script
    scenarios: [alta-producto, vincular-empleado]
  - day: 30
    between: { generate: ventas-tipicas, days: 23 }
    scenarios: [revision-don-cuentas, subir-de-plan]
```

Reglas:

- El estado de la app **no** se resetea entre sesiones del mismo recorrido.
- `between.generate` crea la actividad de los días intermedios por script (API o base de datos `VERIFICAR`), no con un LLM. El reloj de la app se adelanta de forma controlada.
- Cada sesión es un run normal: mismo actor, mismo juez, misma evidencia.

### 17.2 Memoria de la persona

Implementación propia, en archivos (`memory/<journey>/<persona>.json`). Sin servicios externos.

```json
{
  "learned": [
    { "what": "el botón amarillo de abajo es para cobrar", "day": 1, "kind": "path", "strength": 2 }
  ],
  "misconceptions": [
    { "what": "cree que 'Corte' borra las ventas del día", "day": 2, "resolved_day": null }
  ],
  "frustrations": [{ "what": "le pidió RFC y no lo tenía", "day": 1 }],
  "never_discovered": ["reportes", "Don Cuentas"]
}
```

- Tras cada sesión, un agente **escritor de memoria** lee el transcript y propone cambios; solo puede registrar lo que tenga respaldo en pasos concretos.
- **Olvido determinista (script, no LLM):** antes de cada sesión, los elementos `kind: path` pierden 1 de `strength` por cada 3 días sin uso y se eliminan al llegar a 0. Los conceptos erróneos y las frustraciones no decaen. Parámetros en `config.yaml`.
- El actor recibe la memoria resultante como "lo que recuerdas de la vez pasada". No recibe transcripts anteriores.
- La memoria es visible y editable en Studio, y cada cambio queda en su historial.

### 17.3 Métricas y hallazgos propios

- **Costo de reaprendizaje:** pasos en una tarea repetida el día 7 o 30 contra el día 1.
- **Conceptos erróneos persistentes:** los que siguen sin resolverse al final del recorrido.
- **Funciones nunca descubiertas** al día 30.
- **Fricción con datos acumulados:** problemas que solo aparecen con historial (listas largas, reportes, rendimiento).
- Nueva categoría de hallazgo: `return_friction`.

Con `repetitions > 1`, el recorrido completo se repite desde el día 1 con memoria limpia.

---

## 18. Grafo de evidencia para personas

Automatiza el principio P5: las personas salen de material real, con trazabilidad hasta la cita.

### 18.1 Flujo

1. **Ingesta.** Documentos en `personas/evidence/` (reseñas de tiendas de apps, notas de entrevistas, mensajes de soporte), sin datos personales.
2. **Extracción.** Un agente propone nodos y relaciones.
3. **Verificación literal (script).** Toda cita debe ser subcadena exacta de su documento fuente; lo que no coincida se descarta.
4. **Aprobación humana** en la pantalla Evidencia.
5. **Constructor de personas.** `synth-persona` consulta el grafo y arma el YAML; cada `behaviors[].source` apunta a un nodo de cita.

### 18.2 Modelo (tablas SQLite en `graph/`, implementación propia)

| Nodo         | Ejemplo                                     |
| ------------ | ------------------------------------------- |
| `segment`    | abarrotes, comida, servicios                |
| `behavior`   | "anota fiados en libreta aparte"            |
| `pain`       | "no cuadra la caja al cierre"               |
| `vocabulary` | términos que usa y términos que no entiende |
| `comparator` | libreta, Excel, otro POS                    |
| `quote`      | texto literal + documento + posición        |

Relaciones: `quote → supports → behavior|pain|vocabulary`, `behavior → observed_in → segment`, `segment → compares_with → comparator`.

### 18.3 Uso

- **Cobertura:** la pantalla Evidencia muestra cuántas citas respaldan cada segmento. Un segmento con poca evidencia es una señal de con quién hay que hablar.
- **Peso:** una conducta respaldada por una sola cita se marca como débil en el reporte.
- Las observaciones de sesiones con usuarios reales (sección 13) entran al grafo por el mismo flujo.

---

## 19. Laboratorio de narrativa (opcional)

Prueba mensajes, no producto: cómo podrían reaccionar distintos perfiles a un anuncio, a la página de precios o a la política de no ofrecer prueba gratis.

- **Propósito único:** generar objeciones y malentendidos que no se habían considerado.
- **Prohibido:** usar su salida como pronóstico, como medida de aceptación o para decidir precios por sí sola. Es opinión simulada, la zona menos fiable de todo el sistema.
- **Implementación propia y pequeña:** de 8 a 12 personas ancladas reciben el mensaje y discuten por rondas en un hilo; un agente agrupa las objeciones. Cada objeción se enlaza a la evidencia de la persona que la originó; las que no tengan respaldo se rotulan como especulativas.
- Toda la salida lleva la etiqueta "hipótesis para validar con personas reales".

Si se quiere una simulación social a gran escala, se ejecuta una herramienta externa por separado y solo se importa su reporte (ver sección 20).

---

## 20. Política de licencias

Las ideas tomadas de otros proyectos (memoria por agente, personas desde un grafo de documentos, discusión entre agentes) se **reimplementan desde cero**. No se copia código de terceros a este repo.

Reglas para Claude Code:

1. No copies, adaptes ni traduzcas código de MiroFish, OASIS, UXAgent ni de ningún otro proyecto hacia `synth/` ni hacia el producto. Trabaja a partir de esta especificación.
2. No agregues como dependencia paquetes con licencia AGPL o GPL sin aprobación explícita de Eduardo. Para cada dependencia nueva, registra su licencia en `synth/THIRD_PARTY.md`.
3. Si se usa MiroFish u otra herramienta similar, corre **sin modificar**, en su propio contenedor o repo, fuera del codebase de Xangarro. Solo se importan sus archivos de salida.
4. `VERIFICAR` la licencia vigente en el repo original de cada proyecto antes de usarlo; no te bases en lo que diga este documento.

Contexto: los espejos consultados listan MiroFish bajo AGPL. El uso interno sin distribución suele ser de bajo riesgo, pero mezclar código AGPL dentro del repo de un producto comercial abre la posibilidad de que termine enlazado o desplegado con él. Mantenerlo fuera elimina ese riesgo. Esto no es asesoría legal; ante cualquier duda, consultar a un abogado.

---

## 21. Preguntas abiertas para Eduardo

1. Convención de monorepo para ubicar `synth/` (`apps/`, `packages/`, `tools/`).
2. ¿Existe staging o todo corre en local?
3. ¿Studio lo usará solo Eduardo en su máquina, o también el equipo en red interna? (define si hace falta autenticación)
4. ¿Se construye el laboratorio de narrativa (Fase 12) o se deja fuera?
5. Tope de gasto por corrida y por día, y qué modelo usar por rol.
6. `market_weight` de cada persona núcleo.
7. ¿Hay ya reseñas, mensajes o notas de usuarios reales para `personas/evidence/`?
8. ¿La caja móvil (Expo) entra en una fase posterior con Maestro, o queda fuera?
