# Handoff: vistas del operador del portal Xangarro! (más dos pantallas del dueño)

## Qué es esto

Quince pantallas de diseño nuevas, posteriores al primer handoff (`design_handoff_xangarro_portal/`, que cubría el portal del dueño). Trece son del **rol Operativo** —quien cobra en el mostrador— y dos son del **dueño**, necesarias para cerrar el circuito de lo que el operador crea y de sus cortes.

Este paquete es **incremental**: asume que el portal del dueño ya está en código. Si una regla de aquí choca con lo que ya existe, detente y pregunta; no improvises una tercera opción.

## Sobre los archivos de diseño

Los `.dc.html` de esta carpeta son **referencias de diseño hechas en HTML**: prototipos que muestran el aspecto y el comportamiento buscados, no código de producción para copiar. La tarea es **recrearlos en el entorno del código existente** (React, Vue, Svelte, lo que use el repo) con sus patrones y librerías. Si el proyecto aún no tiene entorno, elige el que mejor le siente y trabaja ahí.

Cada archivo abre directo en el navegador (necesita `support.js` y `colors_and_type.css`, ambos incluidos). Ábrelos y recórrelos: son interactivos. Los prototipos traen un **panel de control** arriba a la derecha para forzar estados (`dataState`, `connection`, `situacion`, `forcePhone`, etc.); úsalo para ver los estados que debes implementar.

## Fidelidad

**Alta fidelidad.** Colores, tipografía, espaciado, bordes, sombras e interacciones son finales. Recréalos con precisión usando el sistema de diseño Cachink ya presente en el código. Las medidas y los valores de esta guía son la especificación.

## El modelo operativo: siete reglas que el código debe respetar

Estas reglas salieron de una entrevista de decisión y gobiernan toda la vista del operador.

1. **Caja vinculada, persona identificada.** El navegador se vincula una vez con un código que genera el dueño (formato `TD4 91K`, 6 caracteres). Cada operador abre turno con un **NIP de cuatro dígitos**. El NIP también bloquea la caja y cambia de turno sin perder el ticket en curso. Solo el dueño reinicia un NIP.
2. **Un turno abierto por caja.** Dos cajas pueden operar a la vez, cada una con su fondo y su conteo. El turno abre con fondo de caja y cierra con conteo por denominación.
3. **El corte se cuadra contra lo esperado.** `esperado = fondo + ventas en efectivo + abonos en efectivo − gastos de caja chica`. Si el conteo no coincide, **motivo y nota son obligatorios** para poder cerrar.
4. **Catálogo primero.** La venta se arma tocando productos; el inventario se descuenta solo. Lo que no está en catálogo lo crea el operador con nombre y precio y queda marcado **«creado en caja»** para revisión del dueño. Los clientes nuevos siguen la misma regla (nombre y teléfono).
5. **Fiado es ingreso completo, no venta negativa.** Una venta fiada exige cliente, registra el ingreso a su valor total contra una cuenta por cobrar y **no entra al efectivo esperado**. El abono posterior sí entra a la caja y no se vuelve a contar como venta. Los abonos se aplican **a las ventas más antiguas primero**. Si se cancela una venta fiada que ya recibió abonos, el dinero abonado **no sale de la caja**: queda como **saldo a favor** del cliente, aplicable solo a su siguiente compra, y el dueño lo ve marcado.
6. **Nada se borra.** El operador cancela ventas de su turno abierto con un motivo; la venta queda visible como cancelada y viaja al portal del dueño y al corte. No puede editar ventas cerradas ni ajustar existencias libremente: solo registra entradas y mermas.
7. **Sin conexión se sigue cobrando.** La venta se encola en el navegador y sube al reconectar. **El turno no se puede cerrar con registros sin enviar**, porque el efectivo esperado estaría incompleto.

### Qué ve y qué no ve el operador

Ve lo de su turno: ventas, efectivo esperado, sus movimientos y existencias. **Nunca** costos, margen, nómina ni totales históricos del negocio. El Asesor no aparece en su barra.

## Concha (shell) del operador

- **Barra lateral** de 248 px, fondo `--white`, borde derecho `2.5px solid #0D0D0D`, `position: sticky`, alto `100vh`. Encabezado de 76 px con la moneda amarilla de 38 px y el logotipo «XANGARRO!» en Anton 23 px. Navegación con renglones de 46 px, radio 14, gap 5 px; el activo lleva fondo `--yellow`, borde 2 px negro y sombra `3px 3px 0`.
- **Orden de la barra**: Inicio · Caja · Turno · Ventas · Gastos · Inventario · Cobranza. Al pie, el bloque del turno (iniciales, nombre, «Desde 08:15 · Caja 1») con dos acciones: bloquear caja (icono de candado, 42×42) y «Cerrar turno».
- **Encabezado** de 76 px mínimo, fondo `--gray-200`, borde inferior `2.5px`. A la izquierda la píldora del negocio; a la derecha el indicador de sincronización (enlace a Registros por enviar), la campana de avisos con contador, y en varias pantallas el botón amarillo de acción.
- **Teléfono** (`< 760px`): sin barra lateral; barra inferior fija de 68 px con cuatro pestañas —**Inicio · Caja · Ventas · Turno**— borde superior `2.5px`, pestaña activa en amarillo pleno. Inventario, Cobranza y el Cierre se alcanzan desde Inicio y Turno.
- **Banda intermedia** (760–1240 px) en Caja: la barra lateral se queda, pero el ticket pasa de columna fija a barra inferior amarilla + hoja desplegable.

## Pantallas

### 1. Operador · Acceso (`Operador Acceso.dc.html`)
Pantalla de entrada a pantalla completa sobre amarillo pleno, sin barra lateral. Tres pasos, conmutables con el prop `startStep`:
- **vincular**: seis casillas de 54×66 px para el código, teclado de 3 columnas (dígitos, `C`, `⌫`), botón «Vincular caja» habilitado con 6 caracteres.
- **nip**: píldoras de operador (Ana Robledo, Luis Ortega, Sofía Márquez) con avatar de 40 px; cuatro casillas de 60×72 px que muestran `•`; teclado de 62 px por tecla. NIP `0000` dispara el estado de error («NIP incorrecto. Te quedan 2 intentos.»).
- **fondo**: campo de monto de 74 px de alto con `$` en `--gray-400`, cuatro montos rápidos ($500, $800, $1,000, $1,500), aviso de «un turno abierto por caja» y botón «Abrir turno y empezar a cobrar».
Columna derecha: tres tarjetas de pasos (la del paso activo en amarillo) y la nota de «si olvidaste tu NIP».

### 2. Operador · Inicio (`Operador Inicio.dc.html`)
No es un tablero: responde «qué hago ahora».
- **Saludo** («Buenas tardes, Ana») y fecha larga.
- **Tarjeta «Lo primero»**: una sola acción grande que cambia según `situacion` — `vendiendo` (amarillo, «La caja está lista» → Cobrar), `turno-cerrado` (blanco, «Abre tu turno para empezar»), `hora-de-cerrar` (durazno), `corte-por-aclarar` (rojo suave, «Pedro te pidió aclarar el corte del 13» → Responder) y, si `connection: sin-conexion`, «Hay 3 registros sin enviar» (ámbar). Icono de 58 px en cuadro blanco, CTA de 62 px.
- **Cuatro indicadores** del turno: ventas (12), cobrado ($3,280.00), **efectivo esperado ($2,870.00, sobre `--yellow-soft`)** y fiado de hoy ($182.00). Con turno cerrado cambian a los del último turno más el fondo sugerido.
- **«Para hoy»**: lista mezclada de pendientes —gasto recurrente, producto bajo umbral, cliente fiado atrasado, entrada de mercancía— cada renglón con su acción y «Hoy no».
- **«De parte de Pedro»**: dos mensajes con punto de severidad y enlace a Avisos.
- **«Tus últimos cortes»**: cuatro renglones con «Cuadró» o la diferencia.
- Cuatro accesos rápidos al pie.

### 3. Operador · Turno (`Operador Turno.dc.html`)
- **Tarjeta héroe amarilla** con el efectivo esperado en 56 px (44 px en teléfono) y su desglose: fondo $800.00, ventas en efectivo $2,140.00, abonos en efectivo $550.00, gastos −$620.00. Botón «Cerrar turno».
- Cuatro indicadores y cuatro accesos.
- **«Pendientes de registrar»**: gastos recurrentes con vencimiento («Vence hoy», «Vence mañana», «Atrasado 1 día»), monto y acciones Registrar / Hoy no.
- **«Movimientos de tu turno»**: ventas, gastos, fiado, abonos y mermas con su tinte por tipo.

### 4. Operador · Caja (`Operador Caja.dc.html`) — la pantalla que define el resto
- **Catálogo**: encabezado de una línea, buscador (insensible a acentos), chips de categoría sin contadores, y rejilla de tarjetas compactas de **76 px de alto**: icono Lucide en cuadro blanco de 42 px, nombre, precio a la derecha, insignia amarilla con la cantidad si ya está en el ticket. La tarjeta se tiñe por categoría: Tacos `--red-soft`, Guisados `--peach-soft`, Bebidas `--blue-soft`, Extras `--green-soft`. La etiqueta de existencias **solo aparece cuando el producto está bajo umbral** («Quedan 6», rojo). Última celda de la rejilla: «No está en el catálogo».
- **Ticket**: columna fija de 392 px a `calc(100vh - 124px)`, con lista desplazable y **total + COBRAR anclados abajo**; en la banda intermedia y en teléfono es barra amarilla + hoja.
- **Cobro en modal** de 760 px: resumen del ticket a la izquierda (260 px) y a la derecha el paso — método (Efectivo, Transferencia, Tarjeta, QR/CoDi, Fiado), efectivo (campo manual + montos rápidos + teclado de 3 columnas + cambio en 38 px, «Falta» en rojo si no alcanza) o fiado (lista de clientes, «Cliente nuevo», confirmación bloqueada sin cliente).
- **Después de cobrar**: vuelve al catálogo y queda una tarjeta de esquina con el cambio en 40 px, Deshacer y Comprobante, con barra de progreso que la desvanece en ~8 s.
- **Compartir comprobante**: modal con vista del ticket, teléfono (WhatsApp se habilita con 10 dígitos), guardar imagen y copiar texto.
- **Producto nuevo en caja**: nombre, precio, categoría y el aviso de que queda «creado en caja».
- **Caja bloqueada**: capa amarilla a pantalla completa con selector de operador, NIP y el mensaje de que el ticket se conserva.

### 5. Operador · Ventas (`Operador Ventas.dc.html`)
Tres indicadores (ventas del turno, cobrado, en efectivo), buscador por folio/producto/cliente y filtros por método. Cada renglón: folio, concepto, método con su tinte, hora, monto, flecha al detalle y botón de cancelar. La cancelada se muestra tachada, en gris, con su chip «Cancelada» y sin acciones. Modal de cancelación: motivo obligatorio (cuatro opciones), nota opcional y advertencia del efecto en el efectivo esperado.
**Cifras que deben cuadrar con Inicio, Turno y Cierre: 12 ventas activas, $3,280.00 cobrado, $2,140.00 en efectivo, $182.00 fiado; la cancelada (V-0405, $60.00) queda fuera de los totales.**

### 6. Operador · Detalle de venta (`Operador Detalle de venta.dc.html`)
Lee `?venta=efectivo|fiado` y `?estado=cancelada` de la URL. Ticket completo con renglones, subtotal, recibido y cambio entregado; columna derecha con la traza (capturó, caja, turno, enviada al portal) y las dos acciones. Variante fiada: tarjeta ámbar con el cliente, el efecto en su saldo y el enlace a recibir abono; la advertencia de cancelación explica el **saldo a favor**.

### 7. Operador · Gastos (`Operador Gastos.dc.html`)
Antes se llamaba Egresos: **el término en toda la interfaz es «Gastos»**. Tres indicadores (gastos del turno, total salido de caja, sin comprobante), buscador y filtros por categoría. Cada renglón lleva categoría, chip de comprobante (verde «Con comprobante» / ámbar «Sin comprobante»), hora y monto en rojo. Modal de alta: monto de 62 px, concepto, categoría, y el bloque de comprobante que alterna entre «Tomar foto» y «Comprobante adjunto».

### 8. Operador · Inventario (`Operador Inventario.dc.html`)
Pestañas Existencias / Movimientos de mi turno. Tres indicadores (por reponer, entradas de hoy, mermas de hoy), buscador, y por renglón: icono teñido, umbral, unidad, chip Reponer/Suficiente, cantidad en 22 px y dos botones (entrada verde, merma roja). Modales de entrada y merma con buscador de producto, cantidad, motivo obligatorio en merma (cuatro opciones) y proveedor opcional en entrada. Aviso fijo: **el ajuste libre de existencias es del dueño**.

### 9. Operador · Cobranza (`Operador Cobranza.dc.html`)
Tres indicadores (por cobrar, abonos de hoy, en efectivo), buscador y filtros (Todos, Con saldo, Atrasados). Tarjetas de cliente con avatar, chip de estado, saldo en 30 px, detalle de antigüedad, botón de abono y flecha al detalle. Modal de abono: monto libre, montos rápidos, método, y el bloque verde con «se aplica a» y el saldo restante. Abajo, los abonos recibidos hoy.

### 10. Operador · Detalle de cliente (`Operador Detalle de cliente.dc.html`)
Lee `?cliente=chuy|mari`. **Dos únicos datos por cliente: sus ventas fiadas y sus abonos**; saldo, ventas abiertas, disponible, último abono e historial se **derivan** de ahí (no duplicar estado: fue la causa de varios errores en el diseño). Héroe con saldo y acción; cuatro indicadores (ventas abiertas, límite que fijó el dueño, disponible, último abono); ventas abiertas de la más antigua a la más nueva con «Ya abonó X»; historial de ventas y abonos ordenado por fecha descendente. Recordatorio por WhatsApp con teléfono prellenado y mensaje que refleja el saldo vivo.

### 11. Operador · Cierre de turno (`Operador Cierre de turno.dc.html`)
Dos columnas. Izquierda: **conteo por denominación** ($1000 a $1 con tinte por billete), cada renglón con − / campo / + y su importe, y el total contado en 38 px. Derecha: tarjeta amarilla con el esperado y su desglose; tarjeta de diferencia que dice **Cuadra / Falta / Sobra** con fondo verde, rojo o azul; si hay diferencia aparece el bloque de **motivo obligatorio (cinco opciones) y nota**; resumen del turno; botón de cerrar, bloqueado mientras falte la nota. Si hay registros sin enviar, una banda ámbar bloquea el cierre con «Reintentar envío». Al cerrar: pantalla verde de confirmación con contado, esperado, diferencia y ventas, más «Abrir otro turno».

### 12. Operador · Registros por enviar (`Operador Pendientes.dc.html`)
La cola local. Héroe que cambia entre «3 registros en espera» (ámbar), «Enviando 3 registros…» (azul, icono girando) y «Todo enviado» (verde). Lista con tipo, detalle, chip de estado, hora y monto. Vacío con salida al cierre de turno. Aviso: **no cerrar la pestaña ni borrar los datos del sitio**.

### 13. Operador · Avisos (`Operador Avisos.dc.html`)
Dos pestañas con contador de no leídos: **De Pedro** y **De tu caja**. Cada aviso es una tarjeta con encabezado teñido por severidad, chip «Sin leer», hora y cuerpo. El aviso del corte se **responde ahí mismo**, con cuatro frases sugeridas para no teclear. Los del sistema llevan a la pantalla que resuelve el problema. Acción global: marcar todo como leído.

### 14. Dueño · Revisión de caja (`Revision de caja.dc.html`)
Bandeja de lo que el operador creó en el mostrador. Pestañas Productos / Clientes fiados. Tres indicadores (por revisar, vendido sin costo, fiado sin límite). Cada renglón dice quién lo creó, en qué caja, cuántas veces se vendió desde entonces y, si aplica, con qué registro existente se parece. Modal: en producto, precio, **costo**, margen calculado en vivo con semáforo, categoría, existencias y umbral; en cliente, nombre, teléfono, **límite de fiado** y **plazo**. Tres salidas: aprobar, fusionar con el duplicado o rechazar.
**Barra lateral del dueño**: trece renglones en este orden —Inicio · Asesor · Ventas · Gastos · Estados financieros · Productos · **Revisión de caja** · Operadores · Empleados · Dispositivos · Sincronización · Negocio · Suscripción— con el divisor «Configuración» después de Dispositivos.

### 15. Dueño · Cortes de turno (`Cortes de turno.dc.html`)
Lista de cortes con esperado, contado y diferencia por turno, filtros por estado y por caja, y buscador. Panel lateral de 560 px con el desglose de cómo se formó lo esperado, el **conteo por denominación que capturó el operador**, su nota con el motivo, y lo demás del turno (canceladas, fiado, inventario, productos creados en caja). Dos acciones: pedir aclaración por WhatsApp o marcar como aclarado. Cuatro indicadores, incluida la diferencia acumulada del mes.

## Estados

Las once pantallas del operador implementan **cuatro estados** desde un componente compartido (`Operador Estado.dc.html`), forzables con el prop `dataState`:
- **con datos** (`happy`).
- **cargando**: encabezado con punto amarillo que pulsa y cinco renglones esqueleto (bloques `--gray-100`, sin brillo animado).
- **vacío**: cuadro de 62 px con icono, título, cuerpo y, cuando aplica, una acción. Cada pantalla tiene su propio texto (ver los archivos).
- **error**: tarjeta roja suave, «Lo que capturaste no se pierde: sigue guardado en este dispositivo», y botón Reintentar.

Además, `connection: sin-conexion` cambia el indicador del encabezado a «Sin conexión · 3 por enviar» en las pantallas del operador y bloquea el cierre de turno.

## Interacciones

- **Sello al presionar** en todo lo tocable: `translate(2px, 2px)` y la sombra de `4px 4px 0` a `1px 1px 0`, 100 ms, `cubic-bezier(0.2, 0.8, 0.2, 1)`. Hover en escritorio: solo eleva (`translate(-1px,-1px)` y sombra a 6 px) en tarjetas; nunca cambia color por opacidad.
- **Modales**: velo `rgba(13,13,13,0.45)`, tarjeta opaca con borde 2.5 px y sombra 5 px, entrada `xg-pop` de 140 ms. **Todos** usan `place-items: start center` con `padding` y `max-height: calc(100vh - 32px)` con cuerpo desplazable: centrarlos deja el encabezado inalcanzable en pantallas cortas.
- **Panel lateral** (Cortes de turno): entra con `xg-slide` de 160 ms desde la derecha.
- **Esc** cierra modales y descarta avisos en todas las pantallas.
- `@media (prefers-reduced-motion: reduce)` anula animaciones y transiciones.
- **Foco visible**: `outline: 3px solid var(--yellow)` con `box-shadow: inset 0 0 0 2px var(--black)`; sobre amarillo, `outline` negro (atributo `data-onyellow`).
- Objetivos tocables de 44 px mínimo; los pasos de cantidad en el ticket son de 36 px por densidad, aceptado solo en escritorio.

## Estado de la aplicación

Por pantalla, lo mínimo que hay que sostener:
- **Caja**: líneas del ticket, categoría activa, búsqueda, paso del cobro, monto recibido, cliente fiado, tarjeta de confirmación con su temporizador, bloqueo de caja con NIP, hoja del ticket en móvil.
- **Turno / Inicio**: turno abierto y su hora, pendientes descartados («Hoy no»), estado de conexión.
- **Ventas**: filtros, búsqueda, cancelaciones con su motivo.
- **Cobranza / Detalle de cliente**: abonos (fuente única) y su aplicación derivada; nunca un saldo guardado aparte.
- **Cierre**: conteo por denominación, motivo y nota, turno cerrado, cola pendiente.
- **Revisión de caja / Cortes**: resueltos (aprobado, fusionado, rechazado) y aclarados.

## Tokens de diseño

Todos viven en `colors_and_type.css` (incluido). Lo esencial:
- **Colores**: amarillo `#FFD60A`, negro `#0D0D0D`, tinta `#1A1A18`, blanco, hueso `#F7F7F5`, gris 100/200/400/600, verde `#00C896`, rojo `#FF4757`, azul `#3B6FFF`, y sus versiones `-soft`. Texto sobre suave: verde `#007E5E`, rojo `#DA0013`, azul `#1D59FF`, ámbar `#8E6600`. Extras de este portal: `--purple-soft #F0E5FF`, `--peach-soft #FFE8D6`.
- **Tipografía**: Plus Jakarta Sans. Títulos 800 con tracking −0.02 a −0.04 em; etiquetas en mayúsculas 700 con tracking +0.05 a +0.08 em; cuerpo 600. Anton solo para el logotipo. Cifras con `font-variant-numeric: tabular-nums`.
- **Bordes**: 2 px en primitivas, 2.5 px en tarjetas héroe, barras fijas y modales. Siempre `#0D0D0D`, nunca punteados.
- **Radios**: escala 8/10/11/12/13/14/16/18/20/22 y `9999px` para píldoras.
- **Sombras**: duras, sin difuminado — `2px 2px 0`, `3px 3px 0`, `4px 4px 0`, `5px 5px 0`.
- **Sin degradados, sin transparencias** (salvo el velo de modal), sin desenfoques, sin texturas.
- **Moneda**: `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })`; guardar en centavos enteros.

## Iconos

Lucide, con los trazos reales tomados de `lucide-icons/lucide@main` (ver `github.md` en la raíz del proyecto). Grosor 2.2–2.5 según tamaño, 20–22 px en barra y renglones, 26–30 px en estados vacíos. Los productos del catálogo usan: `flame`, `drumstick`, `ham`, `utensils`, `pizza`, `cooking-pot`, `glass-water`, `cup-soda`, `milk`, `soup`, `salad`, `leafy-green`, `droplet`. **No inventes trazos**: tómalos del paquete.

## Copy

Todo en español de México, tuteando, con vocabulario local: ventas, gastos, fiado, abono, corte, turno, caja chica, merma, comprobante. Botones en mayúsculas con tracking amplio. **No reescribas los textos de los prototipos**: están calibrados para un operador que usa esto con fila enfrente.

## Archivos de este paquete

- Quince pantallas `.dc.html` (trece del operador, dos del dueño).
- `Operador Estado.dc.html`: el componente de estados compartido.
- `support.js` y `colors_and_type.css`: lo necesario para abrir los prototipos.
- `Xangarro Portal - Plan de implementacion.dc.html`: el plan por fases, versión 3, con las catorce fases, el mapa de las veintisiete pantallas y las reglas del modelo operativo.

## Fuera de alcance

Envío real por WhatsApp (diseñado en tres lugares, sin integración), el saldo a favor visto desde el portal del dueño, y las ofertas de crédito de la fase 2 del producto.
