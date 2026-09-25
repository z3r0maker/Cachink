import { buildHowToSchema } from '../../schema-pages.js';
import { ArticleCta, ArticleHeader, RelatedGuides, articleSchema } from './shared.jsx';

/** How to get the three statements out of a caja, step by step (also the HowTo schema). */
const PASOS = [
  {
    t: 'Registra cada venta y cada gasto en el momento',
    d: 'Monto, concepto y método de pago. Sin registro no hay estado financiero; con registro diario, el estado se arma solo.',
  },
  {
    t: 'Separa lo que es costo de lo que es gasto',
    d: 'Insumos y mercancía son costo de ventas; renta, luz, nómina y servicios son gastos operativos. La utilidad bruta depende de esa línea.',
  },
  {
    t: 'Marca el fiado como pendiente de cobro',
    d: 'La venta cuenta en resultados desde hoy, pero el efectivo llega después. Así el balance sabe cuánto te deben y el flujo no miente.',
  },
  {
    t: 'Haz el corte de caja cada día',
    d: 'Cuenta el efectivo físico y compáralo con el sistema. Una diferencia hoy se explica; una diferencia acumulada un mes, no.',
  },
  {
    t: 'Exporta el mes en formato NIF',
    d: 'Estado de resultados, balance y flujo, en PDF o Excel, con los nombres que tu contador y el banco esperan.',
  },
];

const schema = articleSchema('nif', [
  buildHowToSchema({
    slug: 'nif',
    name: 'Cómo generar tus estados financieros NIF desde tu caja',
    steps: PASOS.map((s) => ({ name: s.t, text: s.d })),
  }),
]);

const H2 = ({ children }) => (
  <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', margin: '36px 0 14px' }}>
    {children}
  </h2>
);
const P = ({ children }) => (
  <p
    style={{
      fontSize: 16,
      lineHeight: 1.7,
      margin: '0 0 16px',
      color: 'var(--ink)',
      fontWeight: 500,
    }}
  >
    {children}
  </p>
);
const A = ({ href, children }) => (
  <a href={href} style={{ color: 'var(--black)' }}>
    {children}
  </a>
);

/** A statement as a ledger: label / value rows, totals highlighted. */
function Tabla({ rows, caption }) {
  return (
    <table
      aria-label={caption}
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        border: '2px solid var(--black)',
        boxShadow: '4px 4px 0 var(--black)',
        margin: '0 0 12px',
        fontVariantNumeric: 'tabular-nums',
        background: 'var(--white)',
      }}
    >
      <caption
        className="xeyebrow"
        style={{ captionSide: 'top', textAlign: 'left', padding: '0 0 8px' }}
      >
        {caption}
      </caption>
      <tbody>
        {rows.map(([label, value, hl], i) => (
          <tr
            key={label}
            style={{
              background: hl ? 'var(--yellow)' : i % 2 ? 'var(--offwhite)' : 'var(--white)',
            }}
          >
            <th
              scope="row"
              style={{
                textAlign: 'left',
                fontWeight: hl ? 800 : 500,
                padding: '10px 16px',
                fontSize: 14,
              }}
            >
              {label}
            </th>
            <td
              style={{
                textAlign: 'right',
                fontWeight: 800,
                padding: '10px 16px',
                fontSize: 14,
                whiteSpace: 'nowrap',
              }}
            >
              {value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const RESULTADOS = [
  ['Ventas totales del mes', '$85,400'],
  ['− Costo de ventas (insumos, mercancía)', '− $32,000'],
  ['= Utilidad bruta', '$53,400', true],
  ['− Gastos operativos (renta, nómina, servicios)', '− $28,000'],
  ['= Utilidad de operación', '$25,400', true],
  ['− Impuestos estimados', '− $4,000'],
  ['= Utilidad neta del mes', '$21,400', true],
];
const BALANCE = [
  ['Efectivo en caja y bancos', '$38,500'],
  ['Clientes (fiado por cobrar)', '$6,200'],
  ['Inventario', '$22,000'],
  ['Equipo (vitrina, báscula, tablet)', '$45,000'],
  ['= Total activo', '$111,700', true],
  ['Proveedores por pagar', '$14,300'],
  ['Impuestos por pagar', '$4,000'],
  ['= Total pasivo', '$18,300', true],
  ['= Capital contable (activo − pasivo)', '$93,400', true],
];
const FLUJO = [
  ['Efectivo al inicio del mes', '$30,000'],
  ['+ Cobrado a clientes', '+ $80,900'],
  ['− Pagado a proveedores e insumos', '− $36,400'],
  ['− Gastos operativos pagados', '− $28,000'],
  ['− Compra de equipo', '− $8,000'],
  ['= Efectivo al cierre del mes', '$38,500', true],
];

const ESTADOS = [
  [
    'Estado de resultados',
    'NIF B-3',
    'Cuánto vendiste, cuánto te costó y cuánto ganaste en un periodo. Es el que le dice al dueño si el negocio es rentable.',
  ],
  [
    'Balance general',
    'NIF B-6',
    'Una foto del negocio en una fecha: qué tienes (activo), qué debes (pasivo) y cuánto es tuyo (capital). Lo piden los bancos.',
  ],
  [
    'Flujo de efectivo',
    'NIF B-2',
    'De dónde entró y a dónde salió el dinero real. Para un negocio con caja diaria, es el que más se parece a la vida.',
  ],
];

const PREGUNTAS = [
  [
    '¿Necesito los tres estados cada mes?',
    'No para operar: con el estado de resultados y el corte de caja sabes si ganas y si cuadras. Los tres juntos los pide un contador para las declaraciones y un banco para un crédito, y conviene tenerlos al cierre de cada mes.',
  ],
  [
    '¿Puedo hacerlos en Excel?',
    'Sí, si alguien arma la plantilla, clasifica cada registro y no rompe una fórmula. En la práctica se hace una vez al año, con prisa. Un sistema que registra cada venta los genera solos, cada mes, sin plantilla.',
  ],
  [
    '¿Qué pasa con la utilidad si no me pago un sueldo?',
    'Aparece más alta de lo real. Regístrate un sueldo, aunque sea simbólico, como gasto operativo. Así la utilidad neta dice lo que el negocio gana después de pagarte, que es el número que importa.',
  ],
];

export default function NIF() {
  return (
    <main id="main-content">
      <article
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: 'clamp(40px, 8vw, 72px) clamp(20px, 5vw, 28px)',
          fontFamily: 'var(--font-sans)',
          color: 'var(--black)',
        }}
      >
        <ArticleHeader slug="nif" schema={schema} />

        <p
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: 'var(--ink)',
            lineHeight: 1.6,
            margin: '0 0 40px',
            borderBottom: '2px solid var(--black)',
            paddingBottom: 32,
          }}
        >
          Tu contador te pide "los estados financieros del mes" y tú no sabes exactamente de qué
          habla. No estás solo: la mayoría de los dueños de negocios pequeños en México nunca
          aprendieron a leer un estado de resultados. Esta guía explica qué son las NIF, qué dice
          cada uno de los tres estados, cómo se conectan entre sí y cómo generarlos desde tu caja
          sin saber contabilidad.
        </p>

        <H2>¿Qué son las NIF?</H2>
        <P>
          NIF son las siglas de <strong>Normas de Información Financiera</strong>, el estándar que
          regula cómo se preparan y presentan los estados financieros en México. Son el lenguaje
          común: el mismo formato para tu contador, para el banco y para el{' '}
          <A href="https://www.sat.gob.mx/">SAT</A>. Cuando alguien te pide estados "en formato
          NIF", te pide que la información esté organizada de cierta manera, con ciertos nombres, en
          cierto orden. Ni más ni menos.
        </P>
        <P>
          Las normas se agrupan en series. La serie A es el marco conceptual; la B, las normas de
          los estados financieros en su conjunto; la C, los conceptos específicos (efectivo,
          inventarios, cuentas por cobrar); la D, los problemas de determinación de resultados; la
          E, las industrias especializadas. Para un negocio pequeño importan la A y la B: qué
          estados existen y qué va en cada uno.
        </P>

        <H2>¿Quién las emite y desde cuándo?</H2>
        <P>
          Las emite el <A href="https://www.cinif.org.mx/">CINIF</A>, el Consejo Mexicano de Normas
          de Información Financiera, un organismo independiente creado en 2002 que tomó el relevo
          del Instituto Mexicano de Contadores Públicos, que hasta entonces publicaba los Principios
          de Contabilidad Generalmente Aceptados. Las NIF están en vigor desde el 1 de enero de 2006
          y el CINIF las actualiza cada año. Todos los contadores mexicanos las conocen; ninguno te
          va a pedir otra cosa.
        </P>

        <H2>Los tres estados que necesitas conocer</H2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, margin: '0 0 16px' }}>
          {ESTADOS.map(([t, norma, d], i) => (
            <div
              key={t}
              style={{
                border: '2px solid var(--black)',
                borderRadius: 14,
                padding: '20px 24px',
                boxShadow: '4px 4px 0 var(--black)',
                background: i === 0 ? 'var(--yellow)' : 'var(--white)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  alignItems: 'baseline',
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 800 }}>{t}</span>
                <span className="xeyebrow">{norma}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.55 }}>
                {d}
              </div>
            </div>
          ))}
        </div>
        <P>
          Los tres cuentan la misma historia desde tres ángulos. Abajo va un mes completo de una
          fonda imaginaria, con los mismos números en los tres estados, para que veas cómo se
          conectan.
        </P>

        <H2>Cómo leer un estado de resultados en 3 minutos</H2>
        <P>
          Empieza con lo que vendiste y va restando hasta llegar a lo que ganaste. Cada línea
          amarilla es una utilidad distinta: la bruta dice si tu producto deja margen; la de
          operación, si el negocio se sostiene con sus gastos; la neta, lo que queda después de
          impuestos.
        </P>
        <Tabla caption="Estado de resultados · un mes" rows={RESULTADOS} />
        <P>
          Si la utilidad bruta es buena y la neta es mala, el problema son los gastos, no el
          producto. Si la bruta ya es mala, el problema es el precio o el costo de los insumos.
        </P>

        <H2>Cómo se ve un balance general</H2>
        <P>
          El balance no habla de un periodo sino de una fecha: el último día del mes. A la izquierda
          de la mente, lo que el negocio tiene; a la derecha, a quién se lo debe y cuánto es tuyo.
          Siempre cuadra: activo = pasivo + capital.
        </P>
        <Tabla caption="Balance general · al cierre del mes" rows={BALANCE} />
        <P>
          Fíjate en "Clientes": son los $6,200 de fiado que ya contaste como venta pero todavía no
          cobras. Sin registro del fiado, esa línea no existe y el balance queda corto.
        </P>

        <H2>Y el flujo de efectivo, el que más se parece a la vida</H2>
        <P>
          El estado de resultados dice que ganaste $21,400. El flujo dice cuánto dinero real entró y
          salió, que nunca es lo mismo: vendiste $85,400 pero cobraste $80,900, porque $4,500
          quedaron fiados; pagaste $36,400 a proveedores porque liquidaste $4,400 del mes anterior;
          y compraste una báscula. Por eso el efectivo subió $8,500 y no $21,400.
        </P>
        <Tabla caption="Flujo de efectivo · un mes" rows={FLUJO} />

        <H2>Cómo se conectan los tres</H2>
        <P>
          La utilidad neta del estado de resultados ($21,400) se suma al capital del balance. El
          efectivo al cierre del flujo ($38,500) es la primera línea del balance. El fiado pendiente
          aparece como "Clientes" en el balance y como la diferencia entre vendido y cobrado en el
          flujo. Cuando un número no cuadra entre los tres, algo no se registró: casi siempre un
          gasto en efectivo, un retiro del dueño o una venta fiada. La guía de{' '}
          <A href="/recursos/errores-caja/">los cinco errores de caja</A> es exactamente esa lista.
        </P>

        <H2>¿Quién te los pide y para qué?</H2>
        <P>
          <strong>Tu contador</strong>, para las declaraciones y para no rehacer tu clasificación
          desde una libreta. <strong>El banco</strong>, cuando pides un crédito: normalmente balance
          y resultados de los últimos meses, para ver si el negocio paga. <strong>El SAT</strong>,
          para quienes están obligados a llevar contabilidad electrónica; si tributas en RESICO tus
          obligaciones son más simples, pero el estado de resultados sigue siendo la forma más
          rápida de saber si ganas. Y <strong>tú</strong>, cada mes, para decidir precios, compras y
          sueldos con números y no con la sensación de la caja.
        </P>

        <H2>Cómo generarlos sin ser contador</H2>
        <ol
          style={{
            paddingLeft: 22,
            margin: '0 0 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {PASOS.map((s, i) => (
            <li
              key={s.t}
              id={`paso-${i + 1}`}
              style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--ink)', fontWeight: 500 }}
            >
              <strong style={{ color: 'var(--black)' }}>{s.t}.</strong> {s.d}
            </li>
          ))}
        </ol>
        <P>
          Con Xangarro, el <A href="/#portal">estado de resultados mensual en formato NIF</A> se
          genera automáticamente a partir de tus registros diarios, y el balance y el flujo salen de
          los mismos datos. No tienes que aprender contabilidad: solo registrar cada venta y cada
          gasto como siempre.
        </P>

        <H2>Preguntas rápidas</H2>
        {PREGUNTAS.map(([q, a]) => (
          <div key={q} style={{ margin: '0 0 18px' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>{q}</h3>
            <P>{a}</P>
          </div>
        ))}

        <RelatedGuides slug="nif" />
        <ArticleCta
          title="Genera tus estados financieros NIF automáticamente"
          text="La beta de Xangarro ya está abierta: crea tu cuenta gratis."
        />
      </article>
    </main>
  );
}
