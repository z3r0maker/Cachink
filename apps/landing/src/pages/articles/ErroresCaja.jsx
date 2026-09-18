import { buildArticleSchema } from '../../structured-data.js';

const schema = buildArticleSchema({
  slug: 'errores-caja',
  title: '5 errores comunes al registrar ventas en efectivo (y cómo evitarlos)',
  description:
    'Los errores más frecuentes que cometen los dueños de pequeños negocios al llevar el control de caja en efectivo, y cómo un sistema de registro simple los elimina.',
  datePublished: '2026-05-09',
});

const errores = [
  {
    n: '01',
    t: 'No registrar las ventas en el momento',
    d: 'El error más común: "lo anoto después". El problema es que "después" llega cuando ya se mezclaron tres ventas, un egreso y una vuelta de cambio incorrecta. El registro tiene que ser en el momento de la transacción, aunque sea de 10 pesos.',
    fix: 'Solución: un formulario de 3 campos en el teléfono que ya tienes en la mano. Si tardas más de 5 segundos en abrir la app y registrar, la app está mal diseñada.',
  },
  {
    n: '02',
    t: 'No separar el dinero del negocio del dinero personal',
    d: 'Sacas $200 de la caja para comprar una torta y no lo registras como egreso. Al final del día no cuadra el efectivo y no sabes por qué. Con el tiempo, este hábito hace imposible saber si el negocio es rentable — porque parte del dinero "se fue" sin registro.',
    fix: 'Solución: todo lo que sale de la caja es un egreso, aunque sea para gastos personales. Crea una categoría "Retiro del dueño" y regístralo siempre.',
  },
  {
    n: '03',
    t: 'No registrar las ventas a crédito o "fiado"',
    d: 'El fiado existe. En muchos negocios de barrio es parte del modelo. El problema es cuando no queda registro de quién debe cuánto. Al final del mes hay dinero "en el aire" que apareció como venta pero nunca llegó a la caja.',
    fix: 'Solución: registra la venta como ingreso en el momento que ocurre, marcándola como "pendiente de cobro". Cuando el cliente pague, registras el cobro. Así siempre sabes cuánto te deben y quién.',
  },
  {
    n: '04',
    t: 'No hacer el corte de caja diario',
    d: 'Si no cuentas el efectivo físico y lo comparas con lo que dice tu sistema, los errores se acumulan. Un billete mal contado hoy son $500 de diferencia inexplicable en un mes. El corte diario es la herramienta más simple para detectar problemas antes de que crezcan.',
    fix: 'Solución: al cerrar el día, cuenta el efectivo físico e ingrésalo en la app. Si hay diferencia, se detecta hoy — no en la reunión con el contador a fin de mes.',
  },
  {
    n: '05',
    t: 'Mezclar métodos de pago en un solo registro',
    d: 'Una venta de $800 donde el cliente pagó $500 en efectivo y $300 con transferencia se registra como "$800 efectivo". Al final del día el efectivo físico no cuadra y no hay manera de saber por qué.',
    fix: 'Solución: registra cada método de pago por separado, o usa un formulario que permita pagos mixtos. Así el desglose por método de pago es preciso y puedes conciliar con tu estado de cuenta bancario.',
  },
];

export default function ErroresCaja() {
  return (
    <article
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
        href="/recursos/"
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--gray-600)',
          textDecoration: 'none',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        ← Recursos
      </a>

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
          marginTop: 24,
          marginBottom: 16,
        }}
      >
        Control de caja
      </div>

      <h1
        style={{
          fontSize: 'clamp(32px, 6vw, 52px)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 1.05,
          margin: '0 0 20px',
          color: 'var(--black)',
        }}
      >
        5 errores comunes al registrar ventas en efectivo (y cómo evitarlos)
      </h1>

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
        El efectivo es el método de pago más común en los pequeños negocios de México — y el más
        propenso a errores de registro. Estos son los cinco errores que más daño hacen al control de
        caja, todos evitables con un sistema simple.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 40 }}>
        {errores.map((e, i) => (
          <div
            key={i}
            style={{
              border: '2.5px solid var(--black)',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '5px 5px 0 var(--black)',
            }}
          >
            <div
              style={{
                background: 'var(--black)',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  color: 'var(--yellow)',
                  textTransform: 'uppercase',
                }}
              >
                {e.n}
              </span>
              <span
                style={{ fontSize: 18, fontWeight: 900, color: 'var(--white)', lineHeight: 1.2 }}
              >
                {e.t}
              </span>
            </div>
            <div style={{ padding: '20px 24px', background: 'var(--white)' }}>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: 'var(--ink)',
                  lineHeight: 1.65,
                  margin: '0 0 16px',
                }}
              >
                {e.d}
              </p>
              <div
                style={{
                  background: 'var(--yellow)',
                  border: '2px solid var(--black)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--black)',
                  lineHeight: 1.5,
                }}
              >
                {e.fix}
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 14px' }}>
        La raíz de todos los errores
      </h2>
      <p
        style={{
          fontSize: 16,
          lineHeight: 1.7,
          margin: '0 0 16px',
          color: 'var(--ink)',
          fontWeight: 500,
        }}
      >
        Todos estos errores tienen algo en común: ocurren cuando el sistema de registro es más
        incómodo que no registrar. Si abrir la hoja de Excel tarda 30 segundos y registrar tarda
        otros 2 minutos, el cerebro encuentra razones para no hacerlo.
      </p>
      <p
        style={{
          fontSize: 16,
          lineHeight: 1.7,
          margin: '0 0 32px',
          color: 'var(--ink)',
          fontWeight: 500,
        }}
      >
        La solución no es más disciplina — es un sistema que haga el registro tan rápido que sea más
        fácil hacerlo que no hacerlo. Menos de 5 segundos por venta es el objetivo.
      </p>

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
          Registra cada venta en 3 segundos con Cachink
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
          Lanzamiento en verano 2026. Únete a la lista y obtén 3 meses gratis.
        </p>
        <a
          href="/#top"
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
          Unirme a la lista →
        </a>
      </div>
    </article>
  );
}
