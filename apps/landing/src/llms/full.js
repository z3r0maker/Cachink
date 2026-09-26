/** /llms-full.txt — the full product spec; plans and FAQ come from the same data the page renders. */
import { FAQ_ITEMS } from '../../landing/copy.jsx';
import { SOCIAL_PROFILES } from '../../landing/social.js';
import { AUTHORS } from '../../landing/authors.js';
import { EMPRESA } from '../../landing/empresa.js';
import { PLANES_NOTAS, planesDetalle } from './planes-text.js';

const faqText = () => FAQ_ITEMS.map(({ q, a }) => `**${q}**\n${a}`).join('\n\n');

/* One constant or one function per section; the functions take the site URL. */
const cabecera = (siteUrl) => `# Xangarro: especificación completa del producto

> Plataforma de gestión de caja para pequeños negocios mexicanos.
> Sitio web: ${siteUrl} · Crear cuenta: https://app.xangarro.mx/signup
> Idioma: Español (México) · Portal web y caja en el navegador hoy; apps iOS y Android próximamente`;

const descripcion = `## Descripción

Xangarro es una plataforma de finanzas diseñada específicamente para dueños de pequeños negocios en México. Resuelve el problema del control de caja diario: saber exactamente cuánto se vendió, cuánto se gastó y cuánto queda en efectivo, sin necesidad de hojas de Excel, software contable complejo ni conocimientos financieros avanzados.

El dueño administra su negocio desde el portal web (app.xangarro.mx) y su equipo cobra desde la caja en el navegador o desde la app del teléfono. Don Cuentas, el asesor, revisa cada día las ventas, los gastos y el inventario con cálculos a partir de los registros del negocio; la revisión de fin de mes con IA llega pronto.`;

const problema = `## Problema que resuelve

La mayoría de los pequeños negocios en México (panaderías, cafeterías, tiendas de barrio, talleres, consultorios) llevan el control de su caja en una libreta o de memoria. Esto genera tres problemas críticos:

1. **Falta de visibilidad**: el dueño no sabe con exactitud cuánto ganó hoy, esta semana o este mes.
2. **Errores de cálculo**: las cuentas manuales tienen errores; el efectivo no cuadra al final del día.
3. **Dificultad para crecer**: sin datos financieros ordenados, es imposible negociar créditos, presentar estados financieros a un banco o entender qué días o productos son más rentables.`;

const usuarios = `## Usuarios objetivo

Xangarro está diseñado para dos roles dentro de cada negocio:

**Dueño (Director)**: administra el negocio desde el portal web. Configura su catálogo de productos e impórtalo desde Excel, invita a su equipo, ve KPIs financieros (utilidad del mes, liquidez, cuentas por cobrar), consulta estados financieros NIF y exporta el informe mensual en PDF para su contador. Accede desde cualquier navegador.

**Operador (equipo)**: captura ventas, gastos y movimientos de inventario desde la app del teléfono o el navegador de la caja, con su propio NIP. Captura sin conexión: todo se sincroniza cuando vuelve internet.

Cada negocio tiene su propia cuenta, con su caja, su inventario y su equipo separados.`;

const industrias = `## Industrias de uso frecuente

- Panaderías y pastelerías
- Cafeterías y restaurantes pequeños
- Tiendas de barrio (misceláneas, abarrotes)
- Talleres mecánicos y eléctricos
- Consultorios médicos y dentales
- Salones de belleza y estéticas
- Servicios de limpieza y jardinería
- Pequeños comercios de ropa y calzado`;

const funcionalidades = `## Funcionalidades principales

### Registro de ventas e ingresos
- Captura rápida: monto, concepto, método de pago
- Registro en menos de 3 segundos
- Métodos de pago: efectivo, tarjeta, transferencia (SPEI) y crédito para clientes frecuentes
- Captura sin internet: el negocio sigue aunque se vaya el internet; todo se sincroniza al reconectarse

### Registro de egresos
- Categorías personalizables (insumos, nómina, servicios, renta, etc.)
- Asociación a proveedor opcional

### Vista de caja (Operador)
- Ventas del día y del mes en tiempo real
- Efectivo disponible en caja
- Movimientos del día con hora y método de pago
- Corte de día con un toque: resumen imprimible o compartible

### Panel del Dueño (portal web)
- KPIs financieros: ventas, utilidad bruta, liquidez, meta de mes
- Cuentas por cobrar con días de vencimiento
- Comparativa semana a semana y mes a mes
- Importación de productos y clientes desde Excel/CSV con vista previa

### Don Cuentas (asesor)
- Revisa todos los días ventas, gastos e inventario y avisa qué subió, qué no se mueve y qué se ve raro, calculado a partir de los registros
- Próximamente: cierre de mes con IA: qué funcionó, qué no y qué precios ajustar (plan Xangarro)
- Estrategia de precios y crecimiento (plan Xangarrote)

### Estados financieros
- Estado de resultados mensual en formato NIF
- Balance general y flujo de efectivo
- Informe mensual en PDF para el contador
- Exportación de datos en todos los planes

### Equipo y permisos
- Operadores con NIP, creados y administrados por el dueño
- El dueño puede revocar accesos en cualquier momento`;

const precios = `## Precios

${planesDetalle()}

${PLANES_NOTAS.map((n) => `- ${n}`).join('\n')}`;

const especificaciones = (siteUrl) => `## Especificaciones técnicas

- **Plataformas**: portal web y caja en cualquier navegador; apps para iOS y Android próximamente
- **Modo offline**: los dispositivos del equipo capturan sin conexión y sincronizan automáticamente al recuperarla
- **Seguridad**: cifrado en tránsito y en reposo
- **Idioma**: Español (México), sin traducciones al inglés en la interfaz
- **Privacidad**: los datos del negocio son del usuario; Xangarro no los vende ni los comparte con terceros; exportación y eliminación de cuenta disponibles. Aviso de privacidad: ${siteUrl}/privacidad/`;

const faq = `## Preguntas frecuentes

${faqText()}`;

const equipo = (siteUrl) => `## Quiénes están detrás

${AUTHORS.map((a) => `- **${a.name}**: ${a.role}`).join('\n')}

Xangarro nació en ${EMPRESA.ciudad}, ${EMPRESA.estado}, en ${EMPRESA.fundacion}. Las guías de ${siteUrl}/recursos/ las firman ambos. Más en ${siteUrl}/acerca/.`;

const contacto = (siteUrl) => `## Información de contacto y presencia digital

- **Sitio web**: ${siteUrl}
- **Crear cuenta**: https://app.xangarro.mx/signup
- **Correo**: hola@xangarro.mx
- **País de operación**: México
- **Idioma**: Español (México)
- **Redes sociales**: ${SOCIAL_PROFILES.map((p) => `${p.name} ${p.handle} (${p.url})`).join(' · ')}`;

const pie = (siteUrl) =>
  `*Ver también: ${siteUrl}/llms.txt (resumen corto) · ${siteUrl}/recursos/ (artículos y guías para emprendedores)*`;

const SECCIONES = [
  cabecera,
  descripcion,
  problema,
  usuarios,
  industrias,
  funcionalidades,
  precios,
  especificaciones,
  faq,
  equipo,
  contacto,
  pie,
];

export function buildLlmsFullTxt(siteUrl) {
  const texto = SECCIONES.map((s) => (typeof s === 'function' ? s(siteUrl) : s));
  return `${texto.join('\n\n---\n\n')}\n`;
}
