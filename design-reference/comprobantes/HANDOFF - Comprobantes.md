# Handoff — Comprobantes Xangarro (prompt para el LLM que integra)

Copia todo lo que está debajo de la línea y pégalo como prompt. Adjunta los cuatro
archivos `.dc.html` (o su HTML renderizado) junto con el mensaje.

---

## Contexto

Vas a implementar en código cuatro plantillas de **comprobante de venta** para Xangarro,
una app móvil de control financiero y micro-POS para emprendedores mexicanos. El
comprobante se genera después de una venta y se comparte por WhatsApp como PNG, o se
exporta a PDF / se imprime en una térmica.

**No es una factura ni un CFDI.** No incluyas UUID, folio fiscal, RFC, sello, ni ningún
campo del SAT. La única mención fiscal permitida es la línea de pie:
`Este documento no es un comprobante fiscal (CFDI).`

Todo el texto de la interfaz y del comprobante va en español de México. Moneda con
`Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })` → `$1,250.00`.
Fechas con `Intl.DateTimeFormat('es-MX')`, meses en minúscula (`14 sep 2026`).
Los montos se guardan en centavos enteros; el formateo es solo de presentación.

## Dónde están los diseños

En la raíz del proyecto, un archivo por plantilla:

| Archivo | Plantilla |
|---|---|
| `Comprobante Clasico.dc.html` | Clásico — nota de venta tradicional |
| `Comprobante Moderno.dc.html` | Moderno — banda de color, alineado a la izquierda |
| `Comprobante Ticket.dc.html` | Ticket — rollo térmico de 58 mm |
| `Comprobante Minimal.dc.html` | Minimal — A6, casi todo aire |

Cada archivo contiene, de arriba abajo:

1. Un encabezado con el nombre y la intención de la plantilla.
2. **Tres artboards** lado a lado, que son la fuente de verdad visual:
   - **A** — acento claro (`#FFD60A`), con logo, branding completo, 2–3 conceptos.
   - **B** — acento oscuro (`#14532D`), sin logo (respaldo tipográfico), un solo concepto.
   - **C** — nombre de negocio largo, bloques opcionales apagados.
3. Una **ficha de especificación** al pie con formato en mm, escala tipográfica, color y
   contraste, bordes y radios, reglas del logo y comportamiento de los bloques opcionales.

Los estilos están **en línea, valor por valor** en el marcado: lee los `style="…"` de cada
artboard y toma de ahí los números exactos (padding, tamaños, pesos, colores, bordes). No
inventes valores intermedios. La ficha de especificación manda cuando haya duda sobre
el comportamiento dinámico (nombres largos, bloques apagados, cifras largas).

Los tokens del sistema de diseño están en
`_ds/cachink-design-system-890cd1ee-0432-48be-9c4c-478a6b781e00/colors_and_type.css`.

## Datos de entrada (contrato)

```ts
type Comprobante = {
  negocio: {
    nombre: string;              // puede ser largo: ver variante C
    logoUrl?: string;            // ausente en la mayoría de los negocios
    monograma?: string;          // 2 letras, derivado del nombre si no hay logo
    direccion?: string;          // bloque opcional
    whatsapp?: string;           // bloque opcional
    redes?: string;              // bloque opcional, p. ej. "@tacosdonacuca"
    leyenda?: string;            // bloque opcional, p. ej. "¡Gracias por tu compra!"
    acento: string;              // un solo color hex de marca
  };
  folio: string;                 // "V-000128"
  fechaHora: string;             // ISO
  conceptos: Array<{ concepto: string; cantidad: number; importeCentavos: number }>; // 1 a 3
  totalCentavos: number;
  metodoPago: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'QR · CoDi' | 'Crédito';
  mostrarMarcaXangarro: boolean; // pie discreto "Hecho con Xangarro"
};
```

## Reglas que no se negocian

**Contraste.** Calcula la luminancia relativa del color de acento. Si es mayor a 0.45, el
texto encima va en `#0D0D0D`; si es menor, en `#FFFFFF`. Aplica la misma decisión a todos
los bloques teñidos del mismo comprobante, nunca a uno sí y a otro no. En Minimal el
acento nunca va detrás de texto, así que ahí el total siempre es `#0D0D0D`.

**El total es el elemento más fuerte** de las cuatro plantillas. Debe seguir siendo legible
cuando el PNG se ve pequeño en una conversación de WhatsApp. No lo reduzcas por debajo de
lo que indica la ficha; si la cifra es larga, baja el tamaño según la regla de cada ficha.

**Logo.** Ancla fija por plantilla (Clásico: centrado 84 px · Moderno: izquierda de la banda
68 px · Ticket: centrado 58 px · Minimal: arriba a la izquierda 40 px). Sin logo se usa el
respaldo que describe cada ficha. El nombre admite dos renglones (tres en Ticket) y después
se recorta con elipsis; el logo no se mueve ni se reescala por un nombre largo.

**Bloques opcionales.** Leyenda, dirección, WhatsApp y redes se encienden y apagan de forma
independiente. Al apagar uno desaparece también su separación: nunca dejes huecos vacíos.
Si se apagan todos, el pie conserva solo la línea legal y, si está activa, la marca Xangarro.

**Tono.** Cálido, honesto, de negocio chico. Tuteo. Sin patrones oscuros, sin publicidad ni
promociones dentro del comprobante.

## Tipografía

Plus Jakarta Sans (400–800) y JetBrains Mono (400–700), ambas de Google Fonts, embebibles.
Mono solo para folio, cantidades e importes; en Ticket, mono para todo el cuerpo.

## Exportación

- **PNG WhatsApp (principal):** 1080 px de ancho. Clásico y Moderno se diseñaron sobre un
  lienzo de 540 px (@2x); Ticket sobre 360 px (@3x); Minimal sobre 420 px (@2.57x).
- **PDF / impresión:** Clásico y Moderno en media carta 140 × 216 mm; Ticket en rollo de
  58 mm con área imprimible de 48 mm; Minimal en A6 105 × 148 mm.
- En impresión térmica el acento se ignora: el recuadro del total sale en negro sobre papel.

## Criterios de aceptación

1. Las cuatro plantillas se renderizan con el mismo objeto `Comprobante` sin campos extra.
2. Cada plantilla pasa las tres variantes A, B y C sin desbordes ni traslapes.
3. El total cambia de tinta correctamente al probar acento claro y acento oscuro.
4. Un comprobante de un solo concepto no deja huecos ni altera el alto de Minimal.
5. No aparece ningún campo fiscal en ninguna salida.
