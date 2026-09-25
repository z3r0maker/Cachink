/**
 * JSON-LD for the pages beyond the home: the guides (Article + BreadcrumbList,
 * plus a HowTo where a guide has steps), the /recursos/ index (CollectionPage)
 * and /acerca/ (AboutPage). The shared nodes come from structured-data.js.
 */
import { SITE_URL, organization, persons } from './structured-data.js';
import { AUTHORS } from '../landing/authors.js';
import { ogImagePath } from './articles.js';

const personId = (a) => `${SITE_URL}/#${a.id}`;

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
    image: {
      '@type': 'ImageObject',
      url: `${SITE_URL}${ogImagePath(slug)}`,
      width: 1200,
      height: 630,
    },
    datePublished,
    dateModified: dateModified ?? datePublished,
    inLanguage: 'es-MX',
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: AUTHORS.map((a) => ({ '@id': personId(a) })),
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [article, ...persons, breadcrumbs(url, { name: title, item: url }), ...extra],
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

/** The «Acerca de» page: an AboutPage about the Organization, with the founders beside it. */
export function buildAboutSchema() {
  const url = `${SITE_URL}/acerca/`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        '@id': url,
        url,
        name: 'Acerca de Xangarro',
        inLanguage: 'es-MX',
        about: { '@id': `${SITE_URL}/#organization` },
        mainEntity: { '@id': `${SITE_URL}/#organization` },
      },
      { ...organization },
      ...persons,
    ],
  };
}
