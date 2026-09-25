/**
 * JSON-LD structured data for the Xangarro landing page.
 *
 * @graph blocks:
 *   1. Organization       — the company
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
  email: 'hola@xangarro.mx',
  sameAs: SOCIAL_PROFILES.map((p) => p.url),
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

export const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [organization, softwareApplication, service, faqPage],
};

const RECURSOS_URL = `${SITE_URL}/recursos/`;

/** BreadcrumbList: Inicio → Recursos → (the article, when given). */
function breadcrumbs(id, leaf) {
  const crumbs = [
    { name: 'Inicio', item: `${SITE_URL}/` },
    { name: 'Recursos', item: RECURSOS_URL },
    ...(leaf ? [leaf] : []),
  ];
  return {
    '@type': 'BreadcrumbList',
    '@id': `${id}#breadcrumb`,
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.item,
    })),
  };
}

// Per-article schema builder — used by /recursos article pages.
// `dateModified` is the route's last commit date (virtual:lastmod); `extra` adds nodes such as a HowTo.
export function buildArticleSchema({
  slug,
  title,
  description,
  datePublished,
  dateModified,
  extra = [],
}) {
  const url = `${RECURSOS_URL}${slug}/`;
  const article = {
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: title,
    description,
    datePublished,
    dateModified: dateModified ?? datePublished,
    inLanguage: 'es-MX',
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [article, breadcrumbs(url, { name: title, item: url }), ...extra],
  };
}

/** A HowTo node for a guide's step sequence, to sit beside its Article. */
export function buildHowToSchema({ slug, name, steps }) {
  const url = `${RECURSOS_URL}${slug}/`;
  return {
    '@type': 'HowTo',
    '@id': `${url}#howto`,
    name,
    inLanguage: 'es-MX',
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
      url: `${url}#paso-${i + 1}`,
    })),
  };
}

// The /recursos/ index: a CollectionPage listing its articles, plus breadcrumbs
export function buildRecursosSchema(articles) {
  const page = {
    '@type': 'CollectionPage',
    '@id': RECURSOS_URL,
    url: RECURSOS_URL,
    name: 'Recursos para pequeños negocios',
    inLanguage: 'es-MX',
    isPartOf: { '@id': `${SITE_URL}/#organization` },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: articles.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: a.title,
        url: `${RECURSOS_URL}${a.slug}/`,
      })),
    },
  };
  return { '@context': 'https://schema.org', '@graph': [page, breadcrumbs(RECURSOS_URL)] };
}
