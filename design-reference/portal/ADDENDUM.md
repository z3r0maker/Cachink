# Addendum — pantallas añadidas después del README

El `README.md` de esta carpeta documenta diez pantallas. El bundle ahora incluye además
cuatro pantallas del portal que se construyeron después, y el runtime `support.js`.

| Archivo | Pantalla | Estado del documento |
|---|---|---|
| `Xangarro Portal - Avisos.dc.html` | Bandeja de avisos del director (destino de "Pedir aclaración") | sin sección en el README |
| `Xangarro Portal - Asesor.dc.html` | Asesor / acompañamiento contable | sin sección en el README |
| `Xangarro Portal - Revision de caja.dc.html` | Revisión de caja (Track O, reconstruida sobre los componentes del portal) | sin sección en el README |
| `Xangarro Portal - Cortes de turno.dc.html` | Cortes de turno (Track O, ídem) | sin sección en el README |
| `support.js` | Runtime del entorno de diseño — necesario para abrir cualquier `.dc.html` en el navegador | no es código de producción |

Estas cuatro pantallas siguen exactamente el mismo shell, tokens, estados de datos y reglas
de rol que describe el `README.md`. Todo lo que dice ahí sobre fundamentos visuales,
interacción, accesibilidad y "antes de publicar" aplica igual.

## Notas de consistencia conocidas

- `Xangarro Portal - Operadores y dispositivos.dc.html` muestra $3,280.00 para el turno
  abierto de Ana. Los datos de Track O se reconciliaron en $3,120.00 (V-0412 a $160.00).
  Esa pantalla quedó fuera del alcance de Track O y no se actualizó.
- Los datos de todas las pantallas son ficticios, salvo los precios de Suscripción.
