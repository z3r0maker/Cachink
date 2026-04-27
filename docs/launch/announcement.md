# Cachink! — launch announcement drafts

## Short (Twitter / X / LinkedIn teaser — 280 chars)

Cachink! ya vive en el App Store y Google Play.

La app más simple para llevar las finanzas de tu negocio en México.
Ventas, egresos, inventario y estados NIF — sin internet obligatorio.

Descárgala: https://cachink.mx · Hecho en 🇲🇽

## Medium (LinkedIn post, ~800 chars)

Hoy lanzamos **Cachink!** en México 🇲🇽

Es una app para emprendedoras y pequeños negocios que necesitan llevar
sus ventas, egresos e inventario **sin aprender contabilidad y sin
depender del internet**.

Lo que incluye:

- POS con Efectivo, Transferencia, Tarjeta, QR/CoDi, y Crédito
- Control de inventario con alertas de stock bajo
- Estados NIF (Resultados, Balance, Flujo)
- Informe mensual en PDF para tu contador
- Dos roles: Director (ve todo) y Operativo (captura)

Por defecto todo se guarda en tu dispositivo — privacidad primero.
Sincronizas por Wi-Fi con tu equipo o en la nube cuando quieras.

Gratis en iOS + Android + Mac + Windows:
https://cachink.mx

## Long (blog post outline)

### Por qué Cachink!

...las apps de contabilidad grandes son un martillo demasiado pesado
para quien apenas está empezando. Cachink se limita a lo esencial:
si no captura más clics, no pertenece.

### Las decisiones que nos importaron

- **Local-first por default** — CLAUDE.md §2 principio 2.
- **NIF por dentro** — no es un simple "registra ventas"; genera
  Estado de Resultados (B-3), Balance (B-6) y Flujo (B-2).
- **Sin CFDI en v1** — es una trampa de alcance. Llega en la v2 si
  la comunidad lo pide.

### Cómo lo construimos

Stack: Expo 55, Tauri 2, Tamagui, Drizzle sobre SQLite, PowerSync para
la nube. Monorepo con capas duras (domain / application / data / ui)
y tests TDD obligatorios para la lógica de dinero.

### Beta, ahora

5–10 emprendedoras ya están probándola en Jalisco y CDMX. Si
conoces a alguien que le pudiera servir, mándanos un correo a
contacto@cachink.mx.

### Qué sigue

- Feedback de la beta → hotfixes vía EAS Update.
- v0.2: evaluaremos CoDi, Clip / Mercado Pago Point, y recordatorios
  de pago por WhatsApp basados en lo que los usuarios reales pidan.
