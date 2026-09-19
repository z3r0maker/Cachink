/**
 * JSON-LD structured data for the Xangarro landing page.
 *
 * @graph blocks:
 *   1. Organization       — the company
 *   2. SoftwareApplication — the product + Offer nodes
 *   3. Service            — cash management service for Mexican SMBs
 *   4. FAQPage            — 14 questions imported from landing/copy.jsx
 *                           (single source of truth shared with visible accordion)
 *
 * Rendered server-side via dangerouslySetInnerHTML in AppSSR.jsx,
 * so all of this ends up in the prerendered HTML for crawlers.
 */

// FAQ_ITEMS is the single source of truth — also consumed by FAQAccordion
import { FAQ_ITEMS } from '../landing/copy.jsx';
// Plan prices/limits — same source as the visible pricing table (L-02)
import { PLANES } from '../landing/planes.js';

const SITE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL) || 'https://xangarro.mx';

const organization = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Xangarro',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/assets/apple-touch-icon.png`,
    width: 180,
    height: 180,
  },
  description:
    'Xangarro es la plataforma mexicana para llevar la caja de tu negocio. Registra ventas y egresos en segundos, ve cómo va tu negocio en pesos, y comparte estados financieros con tu contador. Hecho en México para emprendedores mexicanos.',
  foundingLocation: {
    '@type': 'Place',
    addressCountry: 'MX',
    addressLocality: 'México',
  },
  areaServed: { '@type': 'Country', name: 'México' },
  inLanguage: 'es-MX',
};

const softwareApplication = {
  '@type': 'SoftwareApplication',
  '@id': `${SITE_URL}/#app`,
  name: 'Xangarro',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iOS, Android',
  url: SITE_URL,
  description:
    'Plataforma de finanzas para pequeños negocios mexicanos: panaderías, cafeterías, tiendas de barrio y talleres. Registra ventas y egresos desde la web o la app, ve el estado de tu caja en tiempo real, y exporta estados financieros en formato NIF para tu contador.',
  inLanguage: 'es-MX',
  offers: PLANES.map((p) => ({
    '@type': 'Offer',
    name: p.nombre,
    price: String(p.mensual),
    priceCurrency: 'MXN',
    description: `${p.features.join('. ')}. Precios más IVA.`,
    availability: 'https://schema.org/InStock',
    ...(p.mensual > 0 ? { billingIncrement: 'P1M' } : {}),
  })),
  publisher: { '@id': `${SITE_URL}/#organization` },
};

// Service schema: positions Xangarro as a cash-management service for Mexican SMBs.
// This phrasing matches voice-search and LLM intent better than "BusinessApplication".
const service = {
  '@type': 'Service',
  '@id': `${SITE_URL}/#service`,
  name: 'Gestión de caja para pequeños negocios',
  serviceType: 'Software de control de caja y finanzas para emprendedores',
  description:
    'Xangarro es un servicio de gestión de caja para pequeños negocios mexicanos. Permite registrar ventas y egresos en segundos, llevar el control financiero diario y generar estados financieros para contadores, sin necesidad de hojas de Excel ni conocimientos contables.',
  provider: { '@id': `${SITE_URL}/#organization` },
  areaServed: { '@type': 'Country', name: 'México' },
  availableChannel: {
    '@type': 'ServiceChannel',
    serviceUrl: SITE_URL,
    availableLanguage: { '@type': 'Language', name: 'Spanish', alternateName: 'es-MX' },
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Planes Xangarro',
    itemListElement: PLANES.map((p) => ({
      '@type': 'Offer',
      name: p.nombre,
      price: String(p.mensual),
      priceCurrency: 'MXN',
    })),
  },
};

// FAQPage — built from the single source of truth in landing/copy.jsx
const faqPage = {
  '@type': 'FAQPage',
  '@id': `${SITE_URL}/#faq`,
  mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [organization, softwareApplication, service, faqPage],
};

// Per-article schema builder — used by /recursos article pages
export function buildArticleSchema({ slug, title, description, datePublished }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${SITE_URL}/recursos/${slug}/#article`,
    headline: title,
    description,
    datePublished,
    dateModified: datePublished,
    inLanguage: 'es-MX',
    url: `${SITE_URL}/recursos/${slug}/`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/recursos/${slug}/` },
    author: { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}
