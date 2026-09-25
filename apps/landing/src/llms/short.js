/** /llms.txt — the short product summary, in the llms.txt convention. */
import { PLANES_NOTAS, planesResumen } from './planes-text.js';

export function buildLlmsTxt(siteUrl) {
  return `# Xangarro

> Especificación completa del producto: ${siteUrl}/llms-full.txt

> Xangarro es la plataforma mexicana para llevar la caja de tu negocio.

Xangarro es una plataforma de finanzas para pequeños emprendedores mexicanos: panaderías, cafeterías, tiendas de barrio, talleres y cualquier negocio que maneje caja diaria. Permite registrar ventas y egresos en segundos — desde el navegador o desde la app del equipo —, ver el estado del negocio en tiempo real y compartir estados financieros con un contador. Don Cuentas, el asesor con IA, revisa las ventas, gastos e inventario todos los días y entrega la revisión de fin de mes.

## Para quién es

- Dueños de panaderías, cafeterías, tiendas de barrio y pequeños negocios
- Emprendedores que manejan caja en efectivo, transferencias o pagos digitales
- Negocios que quieren llevar el control financiero sin hojas de Excel ni software complejo

## Cómo funciona

1. **Captura** — Registra cada venta o egreso del día en menos de 3 segundos
2. **Ve** — Ventas de hoy, del mes, efectivo en caja. Actualizado al instante
3. **Decide** — KPIs para dueños, estados financieros para tu contador, Don Cuentas como asesor

## Características principales

- Registro de ingresos y egresos con categorías y métodos de pago
- Vista de caja diaria y mensual
- Captura sin internet — tu negocio sigue aunque se vaya el internet
- Estados financieros exportables para contadores
- Portal web y caja en el navegador hoy; apps para iOS y Android próximamente

## Planes

${planesResumen()}
${PLANES_NOTAS.slice(1, 3)
  .map((n) => `- ${n}`)
  .join('\n')}

## Recursos

- Guías: ${siteUrl}/recursos/
- Acerca de (quiénes somos, Zapopan, Jalisco): ${siteUrl}/acerca/
- Aviso de privacidad: ${siteUrl}/privacidad/

## Información de contacto

- Sitio web: ${siteUrl}
- Crear cuenta: https://app.xangarro.mx/signup
- Correo: hola@xangarro.mx
- País: México
- Idioma: Español (México)
`;
}
