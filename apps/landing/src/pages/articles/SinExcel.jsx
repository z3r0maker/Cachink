import { buildArticleSchema } from '../../structured-data.js';

const schema = buildArticleSchema({
  slug: 'sin-excel',
  title: 'Cómo llevar la caja de tu negocio sin Excel',
  description:
    'Guía práctica para dueños de pequeños negocios en México que quieren dejar de usar hojas de cálculo y llevar un control de caja más rápido, preciso y sin errores.',
  datePublished: '2026-05-09',
});

export default function SinExcel() {
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
        Guía práctica
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
        Cómo llevar la caja de tu negocio sin Excel
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
        Si llevas las cuentas de tu negocio en una hoja de cálculo —o en una libreta— ya sabes el
        problema: se corrompe, se pierde, tiene errores y te quita tiempo que podrías dedicar a
        vender. Esta guía explica por qué el control de caja en Excel falla para negocios pequeños y
        cómo hacer el cambio sin complicaciones.
      </p>

      <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 14px' }}>
        Por qué el Excel no es suficiente para tu caja
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
        Excel fue diseñado para analistas financieros, no para el dueño de una panadería que tiene
        40 ventas en un día. Cuando lo usas para llevar la caja de tu negocio, te enfrentas a tres
        problemas reales:
      </p>
      <ul
        style={{
          paddingLeft: 20,
          margin: '0 0 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {[
          'Tienes que abrir la laptop o tablet para cada venta — en el calor del momento, eso no pasa.',
          'Si dos personas capturan al mismo tiempo, los datos se sobreescriben o se pierden.',
          'Un error de fórmula puede distorsionar todos tus cálculos sin que te des cuenta.',
        ].map((t, i) => (
          <li
            key={i}
            style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--ink)', fontWeight: 500 }}
          >
            {t}
          </li>
        ))}
      </ul>
      <p
        style={{
          fontSize: 16,
          lineHeight: 1.7,
          margin: '0 0 32px',
          color: 'var(--ink)',
          fontWeight: 500,
        }}
      >
        El resultado: la mayoría de los dueños terminan usando la hoja de cálculo solo al final del
        día —o ni eso— y el control de caja se convierte en una tarea que se pospone hasta que hay
        un problema.
      </p>

      <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 14px' }}>
        La alternativa: una app que funciona como tú trabajas
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
        La diferencia clave entre una app de caja y Excel es que la app está diseñada para el
        momento de la venta, no para el análisis posterior. Eso cambia todo:
      </p>
      <ul
        style={{
          paddingLeft: 20,
          margin: '0 0 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {[
          'Registras desde el teléfono que ya tienes en la mano — sin abrir otro dispositivo.',
          'El formulario tiene 3 campos, no 12 columnas.',
          'Los totales se calculan solos — nunca hay un error de suma.',
          'Funciona sin internet — si se cae el WiFi, sigues registrando.',
        ].map((t, i) => (
          <li
            key={i}
            style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--ink)', fontWeight: 500 }}
          >
            {t}
          </li>
        ))}
      </ul>

      <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 14px' }}>
        Cómo hacer la transición en una semana
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, margin: '0 0 32px' }}>
        {[
          {
            n: '01',
            t: 'Lunes: descarga la app y registra solo las ventas del día',
            d: 'No migres datos históricos. Empieza hoy. El objetivo es que el equipo se acostumbre al flujo: monto, concepto, método de pago.',
          },
          {
            n: '02',
            t: 'Martes y miércoles: agrega los egresos',
            d: 'Proveedores, servicios, nómina. Cada gasto tiene su registro. No te preocupes por categorías perfectas al inicio.',
          },
          {
            n: '03',
            t: 'Jueves: revisa el corte del día',
            d: 'Compara el efectivo real en tu caja con lo que dice la app. Si cuadra, vas bien. Si no, hay un registro faltante — la app te ayuda a encontrarlo.',
          },
          {
            n: '04',
            t: 'Viernes: genera tu primer reporte',
            d: 'La semana completa: total de ventas, desglose por método de pago, total de egresos, utilidad bruta. En un toque.',
          },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              background: i % 2 === 0 ? 'var(--yellow)' : 'var(--offwhite)',
              border: '2px solid var(--black)',
              borderRadius: 14,
              padding: '20px 24px',
              boxShadow: '4px 4px 0 var(--black)',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.12em',
                color: 'var(--gray-600)',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              {s.n}
            </div>
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
        Lo que le dices a tu contador
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
        Una pregunta frecuente: "¿Qué pasa con mi contador?" La respuesta es que su trabajo se
        vuelve más fácil, no más complicado. En lugar de entregarle una hoja de Excel con errores o
        una libreta con tachones, le envías un estado financiero en formato NIF — el estándar que él
        ya conoce — directamente desde la app.
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
        Menos tiempo de captura para él, menos honorarios para ti, más tiempo para crecer el
        negocio.
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
          Xangarro · crea tu cuenta hoy
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
          Empieza gratis con Xangarrito y crece cuando tu negocio crezca.
        </p>
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
          Unirme a la lista →
        </a>
      </div>
    </article>
  );
}
