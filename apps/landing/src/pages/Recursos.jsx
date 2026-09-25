import { buildRecursosSchema } from '../structured-data.js';

import { ARTICLES } from '../articles.js';

const schema = buildRecursosSchema(ARTICLES);

export default function Recursos() {
  return (
    <div
      style={{
        fontFamily: 'var(--font-sans)',
        color: 'var(--black)',
        minHeight: '100vh',
        background: 'var(--offwhite)',
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {/* Nav */}
      <nav
        style={{
          borderBottom: '2.5px solid var(--black)',
          background: 'var(--white)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: '0 auto',
            padding: '0 clamp(16px, 5vw, 28px)',
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <a
            href="/"
            style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
          >
            <img
              src="/assets/apple-touch-icon.png"
              alt="Xangarro!"
              width={28}
              height={28}
              style={{ borderRadius: 6, border: '1.5px solid var(--black)' }}
            />
            <span
              style={{
                fontWeight: 800,
                fontSize: 16,
                color: 'var(--black)',
                letterSpacing: '-0.02em',
              }}
            >
              Xangarro!
            </span>
          </a>
          <a
            href="https://app.xangarro.mx/signup?plan=xangarrito"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--black)',
              textDecoration: 'none',
              background: 'var(--yellow)',
              border: '2px solid var(--black)',
              borderRadius: 8,
              padding: '6px 14px',
              boxShadow: '2px 2px 0 var(--black)',
            }}
          >
            Unirme →
          </a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: 'var(--yellow)', borderBottom: '2.5px solid var(--black)' }}>
        <div
          style={{
            maxWidth: 800,
            margin: '0 auto',
            padding: 'clamp(40px, 7vw, 64px) clamp(16px, 5vw, 28px)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--black)',
              opacity: 0.6,
              marginBottom: 12,
            }}
          >
            Recursos · Xangarro
          </div>
          <h1
            style={{
              fontSize: 'clamp(28px, 5vw, 44px)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              margin: '0 0 16px',
              color: 'var(--black)',
            }}
          >
            Guías para llevar mejor
            <br />
            las finanzas de tu negocio
          </h1>
          <p
            style={{
              fontSize: 17,
              fontWeight: 500,
              color: 'var(--ink)',
              lineHeight: 1.6,
              margin: 0,
              maxWidth: 520,
            }}
          >
            Artículos en español, sin jerga contable, para dueños de pequeños negocios en México que
            quieren tener sus cuentas claras.
          </p>
        </div>
      </div>

      {/* Article cards */}
      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: 'clamp(32px, 6vw, 56px) clamp(16px, 5vw, 28px)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {ARTICLES.map((a) => (
            <a
              key={a.slug}
              href={`/recursos/${a.slug}/`}
              style={{
                display: 'block',
                textDecoration: 'none',
                background: 'var(--white)',
                border: '2.5px solid var(--black)',
                borderRadius: 16,
                boxShadow: '5px 5px 0 var(--black)',
                padding: 'clamp(20px, 4vw, 28px)',
                transition: 'transform 0.1s, box-shadow 0.1s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(-2px,-2px)';
                e.currentTarget.style.boxShadow = '7px 7px 0 var(--black)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '5px 5px 0 var(--black)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span
                  style={{
                    display: 'inline-block',
                    background: 'var(--yellow)',
                    border: '2px solid var(--black)',
                    borderRadius: 6,
                    padding: '3px 9px',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--black)',
                  }}
                >
                  {a.badge}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)' }}>
                  {a.readTime} lectura
                </span>
              </div>
              <h2
                style={{
                  fontSize: 'clamp(17px, 3vw, 21px)',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--black)',
                  margin: '0 0 10px',
                  lineHeight: 1.25,
                }}
              >
                {a.title}
              </h2>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--ink)',
                  lineHeight: 1.6,
                  margin: '0 0 16px',
                }}
              >
                {a.blurb}
              </p>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--black)',
                  letterSpacing: '0.04em',
                }}
              >
                Leer artículo →
              </span>
            </a>
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          style={{
            marginTop: 48,
            background: 'var(--black)',
            border: '2.5px solid var(--black)',
            borderRadius: 16,
            boxShadow: '6px 6px 0 rgba(0,0,0,0.2)',
            padding: '28px 32px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: '-0.02em',
              color: 'var(--yellow)',
              marginBottom: 10,
            }}
          >
            Xangarro · crea tu cuenta hoy
          </div>
          <p
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: '#ccc',
              margin: '0 0 20px',
              lineHeight: 1.5,
            }}
          >
            Cuenta gratis para siempre en Xangarrito, sin tarjeta.
          </p>
          <a
            href="https://app.xangarro.mx/signup?plan=xangarrito"
            style={{
              display: 'inline-block',
              background: 'var(--yellow)',
              color: 'var(--black)',
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '14px 24px',
              borderRadius: 12,
              border: '2px solid var(--yellow)',
              boxShadow: '4px 4px 0 rgba(255,214,10,0.3)',
              textDecoration: 'none',
            }}
          >
            Unirme a la lista →
          </a>
        </div>
      </div>
    </div>
  );
}
