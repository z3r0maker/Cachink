/**
 * The route manifest — the one list every crawler-facing artifact is built
 * from: the prerendered HTML (title, description, canonical, OG/Twitter
 * card), sitemap.xml and the smoke test that proves each page rendered.
 *
 * `sources` are the paths (relative to apps/landing) whose last commit dates
 * the page's `<lastmod>`; `type` picks the Open Graph object type. A route
 * with `index: false` is written but kept out of the sitemap and marked
 * noindex; `outFile` names the file when it is not index.html.
 */
export const ROUTES = [
  {
    path: '/',
    outDir: 'dist',
    title: 'Xangarro · Control de caja para negocios pequeños en México',
    description:
      'Sistema de caja y control financiero para negocios pequeños en México: punto de venta, estados financieros NIF y Don Cuentas, tu asesor con IA.',
    smoke: 'El mostrador cobra',
    type: 'website',
    changefreq: 'weekly',
    priority: '1.0',
    sources: ['home', 'landing', 'index.html', 'src/structured-data.js'],
  },
  {
    path: '/recursos/',
    outDir: 'dist/recursos',
    title: 'Recursos para pequeños negocios · Xangarro',
    description:
      'Guías prácticas sobre control de caja, estados financieros NIF y comparativas para dueños de pequeños negocios en México.',
    smoke: 'Guías para llevar mejor',
    type: 'website',
    changefreq: 'weekly',
    priority: '0.8',
    sources: ['src/pages/Recursos.jsx'],
  },
  {
    path: '/recursos/sin-excel/',
    outDir: 'dist/recursos/sin-excel',
    title: 'Cómo llevar la caja de tu negocio sin Excel · Xangarro',
    description:
      'Guía práctica para dueños de pequeños negocios en México que quieren dejar las hojas de cálculo y llevar la caja rápido y sin errores.',
    smoke: 'Cómo llevar la caja',
    type: 'article',
    changefreq: 'monthly',
    priority: '0.7',
    sources: ['src/pages/articles/SinExcel.jsx'],
  },
  {
    path: '/recursos/nif/',
    outDir: 'dist/recursos/nif',
    title: 'Estados financieros NIF sin ser contador · Xangarro',
    description:
      'Qué son los estados financieros NIF que piden contadores y bancos en México, y cómo generarlos desde tu app de caja, en lenguaje simple.',
    smoke: 'Estados financieros NIF',
    type: 'article',
    changefreq: 'monthly',
    priority: '0.7',
    sources: ['src/pages/articles/NIF.jsx'],
  },
  {
    path: '/recursos/errores-caja/',
    outDir: 'dist/recursos/errores-caja',
    title: '5 errores al registrar ventas en efectivo · Xangarro',
    description:
      'Los errores más frecuentes al llevar la caja en efectivo de un pequeño negocio, y cómo un registro simple los elimina.',
    smoke: '5 errores comunes',
    type: 'article',
    changefreq: 'monthly',
    priority: '0.7',
    sources: ['src/pages/articles/ErroresCaja.jsx'],
  },
  {
    path: '/recursos/vs-excel/',
    outDir: 'dist/recursos/vs-excel',
    title: 'Xangarro vs hojas de cálculo: comparativa honesta',
    description:
      'Comparación directa entre usar Excel o Google Sheets y una app de caja especializada para el control financiero de pequeños negocios en México.',
    smoke: 'comparativa honesta',
    type: 'article',
    changefreq: 'monthly',
    priority: '0.7',
    sources: ['src/pages/articles/VsExcel.jsx'],
  },
  {
    path: '/privacidad/',
    outDir: 'dist/privacidad',
    title: 'Aviso de privacidad · Xangarro',
    description:
      'Cómo trata Xangarro tus datos personales, con quién los comparte y cómo ejercer tus derechos ARCO.',
    smoke: 'Aviso de Privacidad Integral',
    // The draft's banner and its notes for counsel are never published.
    absent: ['BORRADOR', 'Nota:', 'Nota para revisión'],
    type: 'website',
    changefreq: 'monthly',
    priority: '0.3',
    sources: ['src/pages/legal', '../../docs/legal/aviso/aviso-integral.md'],
  },
  {
    path: '/privacidad/arco/',
    outDir: 'dist/privacidad/arco',
    title: 'Derechos ARCO · Xangarro',
    description:
      'Cómo pedir acceso, rectificación, cancelación u oposición sobre tus datos personales en Xangarro, y en qué plazos respondemos.',
    smoke: 'derechos ARCO',
    // Section B is the staff's internal annex.
    absent: ['BORRADOR', 'Anexo interno', 'Nota:'],
    type: 'website',
    changefreq: 'monthly',
    priority: '0.3',
    sources: ['src/pages/legal', '../../docs/legal/aviso/arco-procedimiento.md'],
  },
  {
    path: '/terminos/',
    outDir: 'dist/terminos',
    title: 'Términos y Condiciones · Xangarro',
    description:
      'Las condiciones para usar Xangarro: tu cuenta, planes y cobros recurrentes, cancelación, el Asesor con IA y tus datos.',
    smoke: 'Quién te presta el servicio',
    // The draft's title note, banner and open questions for counsel are never published.
    absent: ['borrador', 'Borrador', 'Preguntas abiertas', 'OQ-T1'],
    type: 'website',
    changefreq: 'monthly',
    priority: '0.3',
    sources: ['src/pages/legal', '../../docs/legal/aviso/terminos-borrador.md'],
  },
  {
    path: '/acerca/',
    outDir: 'dist/acerca',
    title: 'Acerca de Xangarro · Hecho en Zapopan',
    description:
      'Por qué existe Xangarro, quiénes lo construyen y qué creemos: finanzas para los negocios mexicanos que apenas empiezan.',
    smoke: 'Por qué existe Xangarro',
    type: 'website',
    changefreq: 'monthly',
    priority: '0.5',
    sources: ['src/pages/Acerca.jsx', 'landing/authors.js', 'landing/empresa.js'],
  },
  {
    path: '/404',
    outDir: 'dist',
    outFile: '404.html',
    title: 'Esta página no cuadra · Xangarro',
    description:
      'Corte de caja: página esperada 1, encontrada 0. Don Cuentas ya lo revisó. Vuelve al inicio o a las guías.',
    smoke: 'Esta página no cuadra',
    type: 'website',
    index: false,
    sources: ['src/pages/NotFound.jsx'],
  },
];
