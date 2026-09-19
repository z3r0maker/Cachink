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

/** Signup URL for a plan; utm_* params are appended client-side (App.jsx). */
export const signupUrl = (plan) => `${SIGNUP_BASE}?plan=${plan}`;

export const PLANES = [
  {
    id: 'xangarrito',
    nombre: 'Xangarrito',
    mensual: 0,
    anual: 0,
    featured: false,
    tagline: 'Para empezar a llevar tu caja.',
    features: [
      '300 movimientos al mes',
      '50 productos activos',
      '1 operador',
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
    tagline: 'Para negocios que ya crecen.',
    features: [
      '10,000 movimientos al mes',
      '1,000 productos activos',
      '2 operadores (dueño + empleado)',
      'Estados financieros NIF',
      'Informe mensual en PDF',
      'Exportación de tus datos (Excel)',
      'Soporte por WhatsApp',
    ],
    cta: 'Probar 14 días gratis',
  },
  {
    id: 'xangarrote',
    nombre: 'Xangarrote',
    mensual: 399,
    anual: 3990,
    featured: false,
    tagline: 'Para negocios con equipo y flujo alto.',
    features: [
      '30,000 movimientos al mes',
      '5,000 productos activos',
      '5 operadores',
      'Reportes avanzados y PDF para tu contador',
      'Soporte prioritario',
      'Multi-sucursal (próximamente)',
      'Exportación de tus datos (Excel)',
    ],
    cta: 'Probar 14 días gratis',
  },
];

export const PLAN_BY_ID = Object.fromEntries(PLANES.map((p) => [p.id, p]));

/** IVA-inclusive total for a plan on an interval ('mensual' | 'anual'). */
export const totalConIva = (plan, interval = 'mensual') =>
  Math.round(PLAN_BY_ID[plan][interval] * (1 + IVA) * 100) / 100;

export const PAGO_LINEA = 'Tarjeta de crédito o débito · Transferencia SPEI en plan anual';

export const ANUAL_NOTA = 'El plan anual son 10 meses al precio de 12: 2 meses gratis.';
