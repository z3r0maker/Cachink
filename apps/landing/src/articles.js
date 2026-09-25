/**
 * The guides under /recursos/, described once: the index cards, each
 * article's header and schema, the "sigue leyendo" links and the sitemap
 * all read this list. `description` is what the Article schema carries;
 * `blurb` is the longer card text on the index.
 */
export const ARTICLES = [
  {
    slug: 'sin-excel',
    badge: 'Guía práctica',
    title: 'Cómo llevar la caja de tu negocio sin Excel',
    description:
      'Guía práctica para dueños de pequeños negocios en México que quieren dejar de usar hojas de cálculo y llevar un control de caja más rápido, preciso y sin errores.',
    blurb:
      'Por qué las hojas de cálculo fallan para negocios pequeños y cómo hacer el cambio a una app de caja en una semana, sin perder datos históricos.',
    readTime: '5 min',
    datePublished: '2026-05-09',
  },
  {
    slug: 'nif',
    badge: 'Finanzas en español',
    title: 'Estados financieros NIF: qué son y cómo generarlos sin ser contador',
    description:
      'Guía en lenguaje simple sobre los estados financieros en formato NIF que solicitan los contadores y bancos en México, y cómo generarlos desde tu app de caja.',
    blurb:
      'Tu contador te pide "los estados financieros" y no sabes exactamente de qué habla. Esta guía explica qué son las NIF, para qué sirven, y cómo generarlos automáticamente.',
    readTime: '6 min',
    datePublished: '2026-05-09',
  },
  {
    slug: 'errores-caja',
    badge: 'Control de caja',
    title: '5 errores comunes al registrar ventas en efectivo (y cómo evitarlos)',
    description:
      'Los errores más frecuentes que cometen los dueños de pequeños negocios al llevar el control de caja en efectivo, y cómo un sistema de registro simple los elimina.',
    blurb:
      'Los errores más frecuentes que cometen los dueños de pequeños negocios al llevar el control de caja, todos evitables con un sistema simple.',
    readTime: '4 min',
    datePublished: '2026-05-09',
  },
  {
    slug: 'vs-excel',
    badge: 'Comparativa',
    title: 'Xangarro vs hojas de cálculo: comparativa honesta para pequeños negocios',
    description:
      'Comparación directa entre usar Excel o Google Sheets y una app de caja especializada para el control financiero de pequeños negocios en México.',
    blurb:
      'Comparación directa en 9 criterios: velocidad, offline, multi-dispositivo, costo, curva de aprendizaje, estados NIF, resistencia a errores y más.',
    readTime: '4 min',
    datePublished: '2026-05-09',
  },
];

export const ARTICLE_BY_SLUG = Object.fromEntries(ARTICLES.map((a) => [a.slug, a]));

/** 2026-09-18 → "18 de septiembre de 2026", read as a UTC date so it never shifts a day. */
export const fechaLarga = (iso) =>
  new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${iso}T00:00:00Z`),
  );
