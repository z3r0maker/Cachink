# 14 — La caja arranca sin internet (cold-start offline + PWA)

> **Estado: plan, no ejecutar.** Este documento existe para que la decisión y
> su diseño no se pierdan; no hay track ni tareas abiertas. Cuando se priorice,
> llevarlo a ROADMAP con numeración propia (p. ej. Track K).

## El problema

El registro (`/operador`) ya trabaja offline **después** de cargar: la base
vive en SQLite-WASM sobre OPFS, la auth es el token de dispositivo en
`localStorage`, el NIP se verifica contra la base local y el turno es local.
Pero si la PC **arranca** sin red, el navegador no puede siquiera pedir el HTML
de `/operador`: Juan ve "no se pudo acceder al sitio" y no hay puerta que
tocar. El flujo hoy es _online para entrar, offline para trabajar_; falta
cerrar el arranque en frío.

## La pieza que falta: un Service Worker de app-shell

Un SW que pre-cachee el shell del registro (HTML/JS/CSS de la ruta `/operador`,
sus chunks y assets) responde "sirve desde disco" cuando no hay red. Nada del
backend cambia: el SW solo sirve estáticos; toda la lógica ya es local.

**Decisiones de diseño:**

1. **Alcance mínimo.** El SW se registra solo bajo `/operador` (y la pantalla
   de acceso). No cachea el portal del dueño ni el landing — el portal es
   server-truth por diseño (RLS, datos cruzados), y meterlo al cache complica
   sin beneficiar al cajero.
2. **Estrategia de cache.** App-shell precacheado en `install` con lista de
   assets emitida en build (hash de build como versión de cache). Network-first
   para el documento con fallback a cache (arranque fresco cuando hay red);
   cache-first para chunks inmutables (nombres con hash).
3. **Actualización.** El SW nuevo hace `skipWaiting` tras `install` + aviso en
   UI ("Hay una versión nueva — se aplicará al recargar"), nunca a mitad de
   turno. Nunca se sirve un shell de una versión con chunks de otra: el
   documento y sus chunks se versionan juntos.
4. **Lo que sigue siendo online, por naturaleza.** Vincular un dispositivo
   nuevo (activación), el flush del outbox, avisos y todo lo del dueño. El SW
   no intenta "resolver" eso offline: la UI ya sabe decir "sin conexión".
5. **PWA instalable.** `manifest` (nombre "Xangarro · Caja", íconos, display
   standalone, start_url `/operador`) para que la PC del mostrador tenga ícono
   propio que arranque directo en la caja, sin pasar por landing ni login. En
   PC (Chrome/Edge) "Instalar" deja un acceso en el escritorio.

## Fases (cuando se ejecute)

| Fase | Entregable                                                               | Riesgo que atiende                    |
| ---- | ------------------------------------------------------------------------ | ------------------------------------- |
| 1    | SW con shell de `/operador` + versión por build + fallback               | Arranque sin red                      |
| 2    | Update flow con aviso + `skipWaiting` seguro                             | Cajero nunca queda en shell viejo     |
| 3    | Manifest + íconos + instalación                                          | La PC del mostrador abre como app     |
| 4    | E2E: arranque offline (contexto sin red), NIP, venta, reconexión y flush | Que nada de esto se rompa en silencio |

## Riesgos conocidos

- **Estados de SW desactualizados** son el clásico dolor: mitigado por
  versionar documento+chunks juntos y probar la actualización en E2E.
- Next.js App Router y SW interactúan (RSC payloads): cachear el documento del
  registro exige probar con cuidado el prefetch de Next (desactivar prefetch
  client-side en la caja o excluirlo del cache).
- `OPFS` requiere un contexto seguro (https o localhost) — ya es el caso en
  producción; documentar para el dev local.
- Safari de escritorio tiene reglas de instalación distintas a Chrome/Edge:
  fase 3 puede entregar "funciona, instala manual" para Safari.

## Prueba de aceptación (la frase del producto)

> Se apaga el internet de la taquería. Se prende la PC. Se abre Xangarro.
> Juan teclea su NIP, vende, cierra su turno. Al volver la red, todo llega.
