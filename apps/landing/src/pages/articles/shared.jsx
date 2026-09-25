/**
 * The parts every guide shares — header with dates, the "sigue leyendo"
 * links and the closing call to action — so a guide file holds only its
 * own text. `virtual:lastmod` is each route's last commit date, computed by
 * the Vite plugin in vite.config.js; the same map dates the sitemap.
 */
import lastmod from 'virtual:lastmod';
import { ARTICLES, ARTICLE_BY_SLUG, fechaLarga } from '../../articles.js';
import { buildArticleSchema } from '../../structured-data.js';
import { signupUrl } from '../../../landing/planes.js';

/** The Article + BreadcrumbList graph for a guide, plus any extra nodes (a HowTo). */
export function articleSchema(slug, extra = []) {
  const a = ARTICLE_BY_SLUG[slug];
  const dateModified = lastmod[`/recursos/${slug}/`] ?? a.datePublished;
  return buildArticleSchema({ ...a, dateModified, extra });
}

const backLink = {
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--gray-600)',
  textDecoration: 'none',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
};
const badgeStyle = {
  display: 'inline-block',
  background: 'var(--yellow)',
  border: '2px solid var(--black)',
  borderRadius: 8,
  padding: '4px 10px',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginTop: 24,
  marginBottom: 16,
};

function Fechas({ a }) {
  const modified = lastmod[`/recursos/${a.slug}/`];
  const updated = modified && modified > a.datePublished;
  return (
    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', margin: '0 0 20px' }}>
      Por el equipo de Xangarro · Publicado el{' '}
      <time dateTime={a.datePublished}>{fechaLarga(a.datePublished)}</time>
      {updated && (
        <>
          {' '}
          · Actualizado el <time dateTime={modified}>{fechaLarga(modified)}</time>
        </>
      )}{' '}
      · {a.readTime} de lectura
    </p>
  );
}

export function ArticleHeader({ slug, schema }) {
  const a = ARTICLE_BY_SLUG[slug];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <a href="/recursos/" style={backLink}>
        ← Recursos
      </a>
      <div style={badgeStyle}>{a.badge}</div>
      <h1
        style={{
          fontSize: 'clamp(32px, 6vw, 52px)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 1.05,
          margin: '0 0 16px',
          color: 'var(--black)',
        }}
      >
        {a.title}
      </h1>
      <Fechas a={a} />
    </>
  );
}

/** The other guides, so no guide is a dead end for a reader or a crawler. */
export function RelatedGuides({ slug }) {
  const others = ARTICLES.filter((a) => a.slug !== slug);
  return (
    <nav aria-label="Más guías" style={{ margin: '0 0 32px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 12px' }}>
        Sigue leyendo
      </h2>
      <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {others.map((a) => (
          <li key={a.slug} style={{ fontSize: 16, lineHeight: 1.5 }}>
            <a href={`/recursos/${a.slug}/`} style={{ color: 'var(--black)', fontWeight: 700 }}>
              {a.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function ArticleCta({ title, text }) {
  return (
    <div
      style={{
        background: 'var(--yellow)',
        border: '2.5px solid var(--black)',
        borderRadius: 16,
        boxShadow: '6px 6px 0 var(--black)',
        padding: '28px 32px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 900,
          letterSpacing: '-0.02em',
          color: 'var(--black)',
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <p
        style={{
          fontSize: 15,
          fontWeight: 500,
          color: 'var(--ink)',
          margin: '0 0 20px',
          lineHeight: 1.5,
        }}
      >
        {text}
      </p>
      <a
        href={signupUrl('xangarrito')}
        style={{
          display: 'inline-block',
          background: 'var(--black)',
          color: 'var(--yellow)',
          fontWeight: 800,
          fontSize: 14,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '14px 24px',
          borderRadius: 12,
          border: '2px solid var(--black)',
          boxShadow: '4px 4px 0 rgba(0,0,0,0.25)',
          textDecoration: 'none',
        }}
      >
        Crear cuenta gratis →
      </a>
    </div>
  );
}
