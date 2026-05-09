/**
 * JSON-LD structured data for Cachink landing page.
 *
 * Three @type blocks combined into a @graph:
 *   1. Organization  — the company
 *   2. SoftwareApplication — the product, with Offer nodes that mirror
 *      the Precios section (prices must match what's rendered on screen)
 *   3. FAQPage — key questions from the landing copy
 *
 * This is imported by App.jsx and rendered server-side via
 * dangerouslySetInnerHTML, so it ends up in the prerendered HTML.
 */

const SITE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL)
  || 'https://cachink.mx'

const organization = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Cachink',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/assets/apple-touch-icon.png`,
    width: 180,
    height: 180,
  },
  description:
    'Cachink es la app mexicana para llevar la caja de tu negocio. Registra ventas y egresos en segundos, ve cómo va tu negocio en pesos, y comparte estados financieros con tu contador.',
  foundingLocation: {
    '@type': 'Place',
    addressCountry: 'MX',
    addressLocality: 'México',
  },
  inLanguage: 'es-MX',
}

const softwareApplication = {
  '@type': 'SoftwareApplication',
  '@id': `${SITE_URL}/#app`,
  name: 'Cachink',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'iOS, Android',
  url: SITE_URL,
  description:
    'App de finanzas para pequeños negocios mexicanos: panaderías, cafeterías, tiendas de barrio y talleres. Registra ventas y egresos, ve el estado de tu caja en tiempo real.',
  inLanguage: 'es-MX',
  offers: [
    {
      '@type': 'Offer',
      name: 'Plan Gratis',
      price: '0',
      priceCurrency: 'MXN',
      description:
        'Ventas + egresos ilimitados, 1 dispositivo, corte de día, exportar a CSV.',
      availability: 'https://schema.org/InStock',
    },
    {
      '@type': 'Offer',
      name: 'Plan Pro',
      price: '149',
      priceCurrency: 'MXN',
      description:
        'Todo lo de Gratis más multi-dispositivo sincronizado, Panel Director, estados financieros NIF y soporte por WhatsApp.',
      availability: 'https://schema.org/InStock',
      billingIncrement: 'P1M',
    },
    {
      '@type': 'Offer',
      name: 'Plan Contador',
      price: '299',
      priceCurrency: 'MXN',
      description:
        'Todo lo de Pro más hasta 10 negocios, exportación fiscal y multi-usuario con permisos.',
      availability: 'https://schema.org/InStock',
      billingIncrement: 'P1M',
    },
  ],
  publisher: { '@id': `${SITE_URL}/#organization` },
}

const faqPage = {
  '@type': 'FAQPage',
  '@id': `${SITE_URL}/#faq`,
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Para quién es Cachink?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Cachink es para dueños de pequeños negocios en México: panaderías, cafeterías, tiendas de barrio, talleres mecánicos y cualquier negocio que maneje caja diaria.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cómo funciona Cachink?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Registras cada venta o egreso en menos de 3 segundos. La app muestra tus ventas de hoy, del mes y el efectivo en caja de forma instantánea. Puedes exportar estados financieros para tu contador.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Funciona sin internet?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. Cachink funciona completamente offline. Tus ventas se sincronizan cuando vuelva la conexión.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuánto cuesta Cachink?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El Plan Gratis es $0 para siempre e incluye ventas y egresos ilimitados. El Plan Pro cuesta $149 MXN al mes e incluye multi-dispositivo, Panel Director y estados financieros NIF. El Plan Contador cuesta $299 MXN al mes e incluye hasta 10 negocios y exportación fiscal.',
      },
    },
    {
      '@type': 'Question',
      name: '¿En qué dispositivos está disponible?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Cachink está disponible en iOS (iPhone) y Android.',
      },
    },
  ],
}

export const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [organization, softwareApplication, faqPage],
}
