/**
 * The 404: a corte de caja that came out one page short, reviewed by Don
 * Cuentas. Vercel serves dist/404.html for any path the site does not have;
 * the prerender writes it with a noindex and no canonical. The receipt is
 * real HTML so the joke reaches crawlers and screen readers, not just eyes.
 *
 * The illustration (public/assets/404-don-cuentas.*) is Don Cuentas reading
 * the 404 ticket; WebP first, PNG for whoever cannot read it.
 */
import { ARTICLES } from '../articles.js';
import { DonCuentas } from '../../home/icons.jsx';

const CORTE = [
  ['Página esperada', '1'],
  ['Página encontrada', '0'],
  ['Diferencia', '−1 página'],
  ['Estado', 'Faltante'],
];

const link = { color: 'var(--black)', fontWeight: 700 };
const btn = {
  display: 'inline-block',
  fontWeight: 800,
  fontSize: 14,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  padding: '14px 24px',
  borderRadius: 12,
  border: '2px solid var(--black)',
  boxShadow: '4px 4px 0 var(--black)',
  textDecoration: 'none',
};

function Corte() {
  return (
    <table
      aria-label="Corte de caja de esta página"
      style={{
        width: '100%',
        maxWidth: 420,
        borderCollapse: 'collapse',
        background: 'var(--white)',
        border: '2.5px solid var(--black)',
        boxShadow: '5px 5px 0 var(--black)',
        fontVariantNumeric: 'tabular-nums',
        margin: '0 0 28px',
      }}
    >
      <caption
        style={{
          captionSide: 'top',
          textAlign: 'left',
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--gray-600)',
          padding: '0 0 8px',
        }}
      >
        Corte de caja · error 404
      </caption>
      <tbody>
        {CORTE.map(([k, v], i) => (
          <tr
            key={k}
            style={{ background: i === CORTE.length - 1 ? 'var(--yellow)' : 'var(--white)' }}
          >
            <th
              scope="row"
              style={{
                textAlign: 'left',
                fontWeight: i === CORTE.length - 1 ? 800 : 600,
                padding: '10px 14px',
                borderBottom: i < CORTE.length - 1 ? '1.5px dashed var(--gray-200)' : 'none',
              }}
            >
              {k}
            </th>
            <td
              style={{
                textAlign: 'right',
                fontWeight: 800,
                padding: '10px 14px',
                borderBottom: i < CORTE.length - 1 ? '1.5px dashed var(--gray-200)' : 'none',
                color: k === 'Diferencia' ? 'var(--red)' : 'var(--black)',
              }}
            >
              {v}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

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
      <picture>
        <source srcSet="/assets/404-don-cuentas.webp" type="image/webp" />
        <img
          src="/assets/404-don-cuentas.png"
          alt="Don Cuentas, la moneda con lentes y bigote, revisa un ticket sellado 404"
          width={665}
          height={850}
          loading="eager"
          decoding="async"
          style={{
            display: 'block',
            width: 'min(240px, 55vw)',
            height: 'auto',
            margin: '0 0 8px -8px',
          }}
        />
      </picture>
      <h1
        style={{
          fontSize: 'clamp(36px, 7vw, 60px)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 1.02,
          margin: '0 0 24px',
        }}
      >
        Esta página no cuadra.
      </h1>

      <Corte />

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', margin: '0 0 32px' }}>
        <DonCuentas size={44} />
        <div className="dc-bubble hi">
          Revisé todos los registros. Esta página no está en ventas, no está en gastos y nadie la
          anotó como fiada. Lo que sí cuadra está aquí abajo.
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, margin: '0 0 36px' }}>
        <a href="/" style={{ ...btn, background: 'var(--black)', color: 'var(--yellow)' }}>
          Volver al inicio
        </a>
        <a href="/recursos/" style={{ ...btn, background: 'var(--yellow)', color: 'var(--black)' }}>
          Ver las guías
        </a>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 10px' }}>
        Registrado y en existencia
      </h2>
      <ul
        style={{
          paddingLeft: 20,
          margin: '0 0 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {ARTICLES.map((a) => (
          <li key={a.slug} style={{ fontSize: 16, lineHeight: 1.5 }}>
            <a href={`/recursos/${a.slug}/`} style={link}>
              {a.title}
            </a>
          </li>
        ))}
      </ul>

      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-600)', margin: 0 }}>
        Error 404 · La caja sigue cobrando.
      </p>
    </main>
  );
}
