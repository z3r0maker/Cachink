/**
 * Plan data — the single source of truth for the pricing table, FAQs,
 * structured data and every signup CTA (L-02/N-31).
 *
 * Prices are list prices in MXN, **plus 16 % IVA** (decision table row 11 /
 * N-01). The `total*` fields are the IVA-inclusive amounts users pay, shown
 * in the pricing footnote so no one is surprised at checkout.
 */

export const IVA = 0.16;

export const SIGNUP_BASE = 'https://app.xangarro.mx/signup';

/** The portal's front door, for those who already have an account. */
export const LOGIN_URL = 'https://app.xangarro.mx/login';

/** Signup URL for a plan; utm_* params are appended client-side (App.jsx). */
export const signupUrl = (plan) => `${SIGNUP_BASE}?plan=${plan}`;

export const PLANES = [
  {
    id: 'xangarrito',
    nombre: 'Xangarrito',
    mensual: 0,
    anual: 0,
    featured: false,
    tone: 'white',
    tagline: 'Para empezar a llevar tu caja.',
    features: [
      '300 movimientos al mes',
      '50 productos activos',
      'Dueño + 1 empleado (1 dispositivo vinculado)',
      'Corte de día',
      'Exportación de tus datos (Excel)',
    ],
    cta: 'Crear cuenta gratis',
  },
  {
    id: 'xangarro',
    nombre: 'Xangarro',
    mensual: 199,
    anual: 1990,
    featured: true,
    tone: 'yellow',
    tagline: 'Para negocios que ya crecen.',
    features: [
      '10,000 movimientos al mes',
      '1,000 productos activos',
      'Dueño + 2 empleados (2 dispositivos vinculados)',
      'Estados financieros NIF',
      'Informe mensual en PDF',
      'Exportación de tus datos (Excel)',
      'Soporte por WhatsApp',
    ],
    donCuentas: {
      title: 'Cierre de mes con Don Cuentas',
      sub: 'Tu revisión mensual con IA: qué funcionó y qué precios ajustar.',
    },
    cta: 'Elegir este plan',
  },
  {
    id: 'xangarrote',
    nombre: 'Xangarrote',
    mensual: 399,
    anual: 3990,
    featured: false,
    tone: 'black',
    tagline: 'Para negocios con equipo y flujo alto.',
    incluye: 'Xangarro',
    features: [
      '30,000 movimientos al mes',
      '5,000 productos activos',
      'Dueño + 5 empleados (5 dispositivos vinculados)',
      'Reportes avanzados y PDF para tu contador',
      'Soporte prioritario',
      'Multi-sucursal (próximamente)',
    ],
    donCuentas: {
      title: 'Don Cuentas completo',
      sub: 'Cierre de mes con IA más estrategia: precios sugeridos y movidas para crecer.',
    },
    cta: 'Elegir este plan',
  },
];

export const PLAN_BY_ID = Object.fromEntries(PLANES.map((p) => [p.id, p]));

/** IVA-inclusive total for a plan on an interval ('mensual' | 'anual'). */
export const totalConIva = (plan, interval = 'mensual') =>
  Math.round(PLAN_BY_ID[plan][interval] * (1 + IVA) * 100) / 100;

export const PAGO_LINEA = 'Tarjeta de crédito o débito · Transferencia SPEI en plan anual';

export const ANUAL_NOTA = 'El plan anual son 10 meses al precio de 12: 2 meses gratis.';

/** What the annual price works out to per month, for the annual view (+ IVA). */
export const mensualEquivalente = (plan) => Math.round((PLAN_BY_ID[plan].anual / 12) * 100) / 100;

/** es-MX money: $1,990 for whole pesos, $165.83 otherwise. */
export const pesos = (n) =>
  '$' +
  n.toLocaleString('es-MX', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });

/** The IVA footnote under the pricing table, for either interval. */
export const notaIva = (interval) => {
  const unidad = interval === 'anual' ? 'al año' : 'al mes';
  const a = totalConIva('xangarro', interval).toLocaleString('es-MX', { minimumFractionDigits: 2 });
  const b = totalConIva('xangarrote', interval).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
  });
  return `Precios más IVA: $${a} y $${b} ${unidad} con IVA`;
};
