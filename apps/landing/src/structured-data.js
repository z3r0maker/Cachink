/**
 * JSON-LD structured data for the Xangarro landing page.
 *
 * @graph blocks:
 *   1. Organization       — the company
 *   1b. WebSite           — the site, for sitelinks
 *   2. SoftwareApplication — the product + Offer nodes
 *   3. Service            — cash management service for Mexican SMBs
 *   4. FAQPage            — 15 questions imported from landing/copy.jsx
 *                           (single source of truth shared with visible accordion)
 *
 * Rendered server-side via dangerouslySetInnerHTML in AppSSR.jsx,
 * so all of this ends up in the prerendered HTML for crawlers.
 */

// FAQ_ITEMS is the single source of truth — also consumed by FAQAccordion
import { FAQ_ITEMS } from '../landing/copy.jsx';
// Plan prices/limits — same source as the visible pricing table (L-02)
import { PLANES, signupUrl } from '../landing/planes.js';
// Public profiles — the Organization's sameAs, the same list llms-full.txt names
import { SOCIAL_PROFILES } from '../landing/social.js';
// The founders — Person nodes, the Organization's founders and every guide's authors
import { AUTHORS } from '../landing/authors.js';
import { EMPRESA } from '../landing/empresa.js';

const SITE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL) || 'https://xangarro.mx';

const personId = (a) => `${SITE_URL}/#${a.id}`;

/** One Person per founder; the same nodes sit in the home graph and beside every Article. */
export const persons = AUTHORS.map((a) => ({
  '@type': 'Person',
  '@id': personId(a),
  name: a.name,
  jobTitle: a.role,
  worksFor: { '@id': `${SITE_URL}/#organization` },
}));

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
  foundingDate: EMPRESA.fundacion,
  foundingLocation: {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      addressLocality: EMPRESA.ciudad,
      addressRegion: EMPRESA.estado,
      addressCountry: 'MX',
    },
  },
  areaServed: { '@type': 'Country', name: 'México' },
  inLanguage: 'es-MX',
  email: 'hola@xangarro.mx',
  sameAs: SOCIAL_PROFILES.map((p) => p.url),
  founder: AUTHORS.map((a) => ({ '@id': personId(a) })),
};

const softwareApplication = {
  '@type': 'SoftwareApplication',
  '@id': `${SITE_URL}/#app`,
  name: 'Xangarro',
  applicationCategory: 'BusinessApplication',
  // What ships today; the phone apps join when they are in the stores.
  operatingSystem: 'Web',
  url: SITE_URL,
  description:
    'Plataforma de finanzas para pequeños negocios mexicanos: panaderías, cafeterías, tiendas de barrio y talleres. Registra ventas y egresos desde la web o la app, ve el estado de tu caja en tiempo real, y exporta estados financieros en formato NIF para tu contador.',
  inLanguage: 'es-MX',
  offers: PLANES.map((p) => ({
    '@type': 'Offer',
    name: p.nombre,
    url: signupUrl(p.id),
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

// WebSite: names the site for sitelinks and ties it to the Organization
const webSite = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: 'Xangarro',
  inLanguage: 'es-MX',
  publisher: { '@id': `${SITE_URL}/#organization` },
};

export const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [organization, ...persons, webSite, softwareApplication, service, faqPage],
};

export { SITE_URL, organization };
