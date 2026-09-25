/**
 * The 404 page. Vercel serves dist/404.html for any path the site does not
 * have; the prerender writes it with a noindex and no canonical.
 */
import { ARTICLES } from '../articles.js';

export default function NotFound() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: 'clamp(48px, 10vw, 96px) clamp(20px, 5vw, 28px)',
        fontFamily: 'var(--font-sans)',
        color: 'var(--black)',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          background: 'var(--yellow)',
          border: '2px solid var(--black)',
          borderRadius: 8,
          padding: '4px 10px',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 16,
        }}
      >
        Error 404
      </div>
      <h1
        style={{
          fontSize: 'clamp(32px, 6vw, 52px)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 1.05,
          margin: '0 0 16px',
        }}
      >
        Esa página no existe.
      </h1>
      <p
        style={{
          fontSize: 18,
          fontWeight: 500,
          color: 'var(--ink)',
          lineHeight: 1.6,
          margin: '0 0 28px',
        }}
      >
        Puede que el enlace esté mal escrito o que la página se haya movido. Lo que sí existe:
      </p>
      <ul
        style={{
          paddingLeft: 20,
          margin: '0 0 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <li style={{ fontSize: 16 }}>
          <a href="/" style={{ color: 'var(--black)', fontWeight: 700 }}>
            El inicio de Xangarro
          </a>
        </li>
        <li style={{ fontSize: 16 }}>
          <a href="/recursos/" style={{ color: 'var(--black)', fontWeight: 700 }}>
            Guías para pequeños negocios
          </a>
        </li>
        {ARTICLES.map((a) => (
          <li key={a.slug} style={{ fontSize: 16 }}>
            <a href={`/recursos/${a.slug}/`} style={{ color: 'var(--black)', fontWeight: 700 }}>
              {a.title}
            </a>
          </li>
        ))}
      </ul>
      <a
        href="https://app.xangarro.mx/signup?plan=xangarrito"
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
    </main>
  );
}
