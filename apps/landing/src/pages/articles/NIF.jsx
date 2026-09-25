import { ArticleCta, ArticleHeader, RelatedGuides, articleSchema } from './shared.jsx';

const schema = articleSchema('nif');

export default function NIF() {
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
        habla. No estás solo — la mayoría de los dueños de negocios pequeños en México nunca
        aprendieron a leer un estado de resultados. Esta guía explica qué son, para qué sirven y
        cómo generarlos automáticamente desde tu app de caja.
      </p>

      <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 14px' }}>
        ¿Qué son las NIF?
      </h2>
      <p
        style={{
          fontSize: 16,
          lineHeight: 1.7,
          margin: '0 0 24px',
          color: 'var(--ink)',
          fontWeight: 500,
        }}
      >
        NIF son las siglas de <strong>Normas de Información Financiera</strong>, el estándar oficial
        que regula cómo se presentan los estados financieros en México. Las emite el{' '}
        <a href="https://www.cinif.org.mx/" style={{ color: 'var(--black)' }}>
          CINIF
        </a>{' '}
        (Consejo Mexicano de Normas de Información Financiera) y todos los contadores mexicanos las
        conocen. Cuando tu contador te pide estados financieros "en formato NIF", te está pidiendo
        que la información esté organizada de cierta manera — ni más ni menos.
      </p>

      <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 14px' }}>
        Los tres estados que necesitas conocer
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, margin: '0 0 32px' }}>
        {[
          {
            t: 'Estado de Resultados',
            d: 'También llamado "pérdidas y ganancias" (PyG). Muestra cuánto vendiste, cuánto gastaste y cuánto ganaste (o perdiste) en un período. Es el más importante para el dueño del negocio — te dice si tu negocio es rentable.',
          },
          {
            t: 'Balance General',
            d: 'Una foto del negocio en un momento específico: qué tienes (activos), qué debes (pasivos) y cuánto vale el negocio (capital). Lo piden los bancos cuando solicitas un crédito.',
          },
          {
            t: 'Estado de Flujo de Efectivo',
            d: 'Muestra de dónde viene y a dónde va el dinero real — no los ingresos en papel, sino el efectivo que entró y salió. Es el que más interesa a los dueños de negocios con caja diaria.',
          },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              border: '2px solid var(--black)',
              borderRadius: 14,
              padding: '20px 24px',
              boxShadow: '4px 4px 0 var(--black)',
              background: i === 0 ? 'var(--yellow)' : 'var(--white)',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--black)', marginBottom: 8 }}>
              {s.t}
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.55 }}>
              {s.d}
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 14px' }}>
        Cómo leer un Estado de Resultados en 3 minutos
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
        El Estado de Resultados tiene una estructura muy simple: empieza con tus ingresos totales y
        le va restando los gastos hasta llegar a la utilidad neta.
      </p>
      <div
        style={{
          border: '2px solid var(--black)',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '4px 4px 0 var(--black)',
          margin: '0 0 32px',
        }}
      >
        {[
          { label: 'Ventas totales del mes', value: '$85,400 MXN', highlight: false },
          {
            label: '− Costo de ventas (insumos, materiales)',
            value: '− $32,000 MXN',
            highlight: false,
          },
          { label: '= Utilidad bruta', value: '$53,400 MXN', highlight: true },
          {
            label: '− Gastos operativos (renta, nómina, servicios)',
            value: '− $28,000 MXN',
            highlight: false,
          },
          {
            label: '= Utilidad operativa (EBITDA simplificado)',
            value: '$25,400 MXN',
            highlight: true,
          },
          { label: '− Impuestos estimados', value: '− $4,000 MXN', highlight: false },
          { label: '= Utilidad neta del mes', value: '$21,400 MXN', highlight: true },
        ].map((row, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 20px',
              background: row.highlight
                ? 'var(--yellow)'
                : i % 2 === 0
                  ? 'var(--white)'
                  : 'var(--offwhite)',
              borderBottom: i < 6 ? '1px solid var(--black)' : 'none',
            }}
          >
            <span
              style={{ fontSize: 14, fontWeight: row.highlight ? 800 : 500, color: 'var(--black)' }}
            >
              {row.label}
            </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--black)' }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 14px' }}>
        Por qué tu contador necesita este formato
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
        El formato NIF no es capricho burocrático. Es el lenguaje común que permite a cualquier
        contador — el tuyo, el del banco, el del{' '}
        <a href="https://www.sat.gob.mx/" style={{ color: 'var(--black)' }}>
          SAT
        </a>{' '}
        — entender la situación de tu negocio rápidamente. Cuando le llegas con tu hoja de Excel o
        tu libreta, él tiene que rehacer todo el trabajo de clasificación y cálculo, lo que tarda
        más y te cuesta más.
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
        Con Xangarro, el{' '}
        <a href="/#portal" style={{ color: 'var(--black)' }}>
          estado de resultados mensual en formato NIF
        </a>{' '}
        se genera automáticamente a partir de tus registros diarios. No tienes que aprender
        contabilidad — solo registrar cada venta y egreso como siempre, y la app hace el resto.
      </p>

      <RelatedGuides slug="nif" />
      <ArticleCta
        title="Genera tus estados financieros NIF automáticamente"
        text="La beta de Xangarro ya está abierta: crea tu cuenta gratis."
      />
    </article>
  );
}
