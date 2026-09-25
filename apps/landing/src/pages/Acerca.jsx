/**
 * «Acerca de»: why Xangarro exists, who builds it, where and since when.
 * The founders come from landing/authors.js; the place and year from
 * landing/empresa.js, the same facts the Organization schema states.
 */
import { AUTHORS } from '../../landing/authors.js';
import { ARTICLES } from '../articles.js';
import { EMPRESA } from '../../landing/empresa.js';
import { DonCuentas } from '../../home/icons.jsx';
import { signupUrl } from '../../landing/planes.js';
import { buildAboutSchema } from '../schema-pages.js';

const schema = buildAboutSchema();

const h2 = { fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em', margin: '40px 0 14px' };
const p = {
  fontSize: 17,
  lineHeight: 1.7,
  margin: '0 0 16px',
  color: 'var(--ink)',
  fontWeight: 500,
};

export const PRINCIPIOS = [
  [
    'Menos clics, más valor.',
    'Cada pantalla se gana su lugar. Si algo no te ahorra tiempo o no te dice algo que no sabías, se va.',
  ],
  [
    'Se va el internet, no la venta.',
    'La caja cobra sin conexión y sincroniza cuando vuelve. Un puesto en la calle no debería depender del módem.',
  ],
  [
    'Tus datos son tuyos.',
    'Los exportas cuando quieras, en Excel, en todos los planes. Nunca se venden ni se comparten.',
  ],
  [
    'Gratis para empezar.',
    'El mercado que nos importa es el que nadie atiende: el negocio que apenas abre. Xangarrito es gratis para siempre.',
  ],
];

export default function Acerca() {
  return (
    <main
      id="main-content"
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: 'clamp(40px, 8vw, 72px) clamp(20px, 5vw, 28px)',
        fontFamily: 'var(--font-sans)',
        color: 'var(--black)',
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <a
        href="/"
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--gray-600)',
          textDecoration: 'none',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        ← Xangarro
      </a>
      <span className="xeyebrow" style={{ display: 'block', margin: '24px 0 12px' }}>
        Acerca de · {EMPRESA.ciudad}, {EMPRESA.estado} · desde {EMPRESA.fundacion}
      </span>
      <h1
        style={{
          fontSize: 'clamp(34px, 6vw, 54px)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 1.05,
          margin: '0 0 24px',
        }}
      >
        Hecho en {EMPRESA.ciudad} para los negocios que apenas empiezan.
      </h1>

      <h2 style={{ ...h2, marginTop: 8 }}>Por qué existe Xangarro</h2>
      <p style={p}>
        Xangarro nació en {EMPRESA.ciudad}, {EMPRESA.estado}, en {EMPRESA.fundacion}, con una idea
        sencilla: que cualquier negocio mexicano que apenas empieza pueda llevar sus finanzas sin
        contratar un sistema que no entiende ni necesita.
      </p>
      <p style={p}>
        Vimos el mismo problema en la taquería, en el puesto de la esquina y en la florería. La
        gente ya se gastó todo en abrir. Luego llega la libreta que no cuadra, el Excel que exige
        fórmulas y disciplina, o un sistema caro pensado para empresas que ya crecieron. Y contratar
        internet fijo para un puesto en la calle no es una opción.
      </p>
      <p style={p}>
        Así que construimos otra cosa: una caja que cobra en segundos desde el teléfono o la tablet,
        sigue funcionando cuando se va el internet y convierte cada venta y cada gasto en los
        estados financieros que pide un contador o un banco. Con Don Cuentas encima, para avisarte
        antes de que duela.
      </p>
      <p style={p}>
        Ese es el mercado que nadie atiende en México, y es el que nos importa. Ayudar a esos
        negocios a crecer sin pagar por lo que no necesitan es toda la visión.
      </p>

      <h2 style={h2}>Quiénes somos</h2>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '0 0 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {AUTHORS.map((a) => (
          <li
            key={a.id}
            className="xcard"
            style={{ padding: '16px 20px', boxShadow: '4px 4px 0 var(--black)' }}
          >
            <div style={{ fontSize: 18, fontWeight: 800 }}>{a.name}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-600)' }}>{a.role}</div>
          </li>
        ))}
        <li
          className="xcard"
          style={{
            padding: '16px 20px',
            boxShadow: '4px 4px 0 var(--black)',
            display: 'flex',
            gap: 14,
            alignItems: 'center',
          }}
        >
          <DonCuentas size={40} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Don Cuentas</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-600)' }}>
              Asesor con IA · revisa tus registros todos los días
            </div>
          </div>
        </li>
      </ul>

      <h2 style={h2}>Lo que creemos</h2>
      <ul
        style={{
          paddingLeft: 20,
          margin: '0 0 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {PRINCIPIOS.map(([t, d]) => (
          <li
            key={t}
            style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--ink)', fontWeight: 500 }}
          >
            <strong style={{ color: 'var(--black)' }}>{t}</strong> {d}
          </li>
        ))}
      </ul>

      <h2 style={h2}>Lo que puedes leer</h2>
      <ul
        style={{
          paddingLeft: 20,
          margin: '0 0 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {ARTICLES.map((a) => (
          <li key={a.slug} style={{ fontSize: 16, lineHeight: 1.5 }}>
            <a href={`/recursos/${a.slug}/`} style={{ color: 'var(--black)', fontWeight: 700 }}>
              {a.title}
            </a>
          </li>
        ))}
        <li style={{ fontSize: 16, lineHeight: 1.5 }}>
          <a href="/#como" style={{ color: 'var(--black)', fontWeight: 700 }}>
            Cómo funciona la caja, el portal y la app
          </a>
        </li>
      </ul>

      <h2 style={h2}>Escríbenos</h2>
      <p style={p}>
        <a href="mailto:hola@xangarro.mx" style={{ color: 'var(--black)', fontWeight: 700 }}>
          hola@xangarro.mx
        </a>
        . Y si quieres ver la caja en acción,{' '}
        <a href={signupUrl('xangarrito')} style={{ color: 'var(--black)', fontWeight: 700 }}>
          crea tu cuenta gratis
        </a>
        .
      </p>
    </main>
  );
}
