import { PLAN_BY_ID, pesos } from '../../../landing/planes.js';
import { A, ArticleCta, ArticleHeader, H2, P, RelatedGuides, articleSchema } from './shared.jsx';

const schema = articleSchema('vs-excel');

const comparativa = [
  {
    criterio: 'Velocidad de registro',
    excel: 'Abrir laptop, buscar archivo, encontrar fila, escribir. 2–5 minutos.',
    app: 'Abrir app en el teléfono, 3 campos, guardar. Menos de 10 segundos.',
    ganador: 'app',
  },
  {
    criterio: 'Funciona sin internet',
    excel: 'Excel de escritorio sí. Google Sheets solo si activaste antes su modo sin conexión.',
    app: 'Siempre. Offline-first desde el diseño.',
    ganador: 'app',
  },
  {
    criterio: 'Multi-dispositivo',
    excel: 'Requiere OneDrive o Google Drive, con riesgo de conflictos de versiones.',
    app: 'Sincronización nativa en tiempo real. Sin conflictos.',
    ganador: 'app',
  },
  {
    criterio: 'Costo',
    excel: 'Gratis (Google Sheets) o incluido en Microsoft 365 (~$100 MXN/mes).',
    app: `Gratis para siempre con Xangarrito. Planes de pago desde ${pesos(PLAN_BY_ID.xangarro.mensual)} MXN/mes + IVA.`,
    ganador: 'empate',
  },
  {
    criterio: 'Curva de aprendizaje',
    excel: 'Alta. Requiere saber de fórmulas y diseñar la estructura tú mismo.',
    app: 'Baja. Diseñada para usuarios sin conocimientos contables.',
    ganador: 'app',
  },
  {
    criterio: 'Estados financieros NIF',
    excel: 'Imposible automáticamente. Requiere que un contador arme la plantilla.',
    app: 'Automático. Genera estado de resultados en formato NIF con un toque.',
    ganador: 'app',
  },
  {
    criterio: 'Resistencia a errores',
    excel: 'Una fórmula mal escrita distorsiona todos los cálculos.',
    app: 'Sin fórmulas. Los cálculos son del sistema, no del usuario.',
    ganador: 'app',
  },
  {
    criterio: 'Flexibilidad para casos especiales',
    excel: 'Alta. Puedes modelar cualquier cosa si sabes cómo.',
    app: 'Media. Cubre el 95% de los casos de negocios pequeños.',
    ganador: 'excel',
  },
  {
    criterio: 'Respaldo automático',
    excel: 'Manual en local; automático si usas nube (con sus riesgos).',
    app: 'Automático en nube con cifrado. Sin acción del usuario.',
    ganador: 'app',
  },
];

export default function VsExcel() {
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
        <ArticleHeader slug="vs-excel" schema={schema} />

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
          Antes de cambiar tu sistema de control de caja, vale la pena saber exactamente en qué es
          mejor cada opción. Esta comparativa es honesta: no siempre gana la app.
        </p>

        <H2>¿Excel o una app de caja: cuál conviene a un negocio pequeño?</H2>
        <P>
          Para registrar ventas, saber cuánto hay en caja y darle al contador un reporte cada mes,
          una app de caja: es más rápida, no depende de fórmulas y arma los estados financieros
          sola. Excel conviene cuando necesitas modelar algo a la medida y tienes a alguien que sepa
          mantener la hoja. Criterio por criterio:
        </P>

        <div style={{ overflowX: 'auto', margin: '20px 0 40px' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '2.5px solid var(--black)',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '5px 5px 0 var(--black)',
              minWidth: 600,
            }}
          >
            <thead>
              <tr style={{ background: 'var(--black)' }}>
                <th
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--yellow)',
                    borderRight: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  Criterio
                </th>
                <th
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#aaa',
                    borderRight: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  Excel / Sheets
                </th>
                <th
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--yellow)',
                  }}
                >
                  App de caja
                </th>
              </tr>
            </thead>
            <tbody>
              {comparativa.map((row, i) => (
                <tr
                  key={i}
                  style={{
                    background: i % 2 === 0 ? 'var(--white)' : 'var(--offwhite)',
                    borderTop: '1px solid var(--black)',
                  }}
                >
                  <td
                    style={{
                      padding: '14px 16px',
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--black)',
                      borderRight: '1px solid var(--black)',
                      verticalAlign: 'top',
                    }}
                  >
                    {row.criterio}
                  </td>
                  <td
                    style={{
                      padding: '14px 16px',
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--ink)',
                      borderRight: '1px solid var(--black)',
                      verticalAlign: 'top',
                      background: row.ganador === 'excel' ? '#fffacd' : 'inherit',
                    }}
                  >
                    {row.excel}
                  </td>
                  <td
                    style={{
                      padding: '14px 16px',
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--ink)',
                      verticalAlign: 'top',
                      background: row.ganador === 'app' ? 'rgba(255,214,10,0.2)' : 'inherit',
                    }}
                  >
                    {row.app}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--gray-600)',
            margin: '-24px 0 32px',
          }}
        >
          Fuentes: el precio de Microsoft 365 según{' '}
          <a
            href="https://www.microsoft.com/es-mx/microsoft-365/buy/compare-all-microsoft-365-products"
            style={{ color: 'var(--gray-600)' }}
          >
            microsoft.com
          </a>
          ; el de Xangarro, según{' '}
          <a href="/#precios" style={{ color: 'var(--gray-600)' }}>
            nuestra página de precios
          </a>
          .
        </p>

        <H2>¿Cuándo tiene sentido seguir con Excel?</H2>
        <P>
          Si tu negocio tiene necesidades muy específicas que una app estándar no cubre (por
          ejemplo, modelos de costos complejos, análisis de escenarios financieros o integraciones
          con sistemas de inventario a medida), Excel puede ser la herramienta correcta,
          especialmente si tienes a alguien con conocimientos para mantenerlo.
        </P>
        <P>
          Pero para el 95% de los pequeños negocios en México (panadería, cafetería, tienda,
          taller), las necesidades son: registrar ventas rápido, saber cuánto hay en caja, y generar
          un reporte mensual para el contador. Para eso, una app especializada gana en todos los
          frentes que importan.
        </P>

        <H2>¿Y Google Sheets? ¿Cambia algo?</H2>
        <P>
          Sheets resuelve dos cosas que Excel de escritorio no: es gratis y varias personas pueden
          abrir la misma hoja. Pero conserva los problemas de fondo: las fórmulas las escribe y las
          mantiene alguien del negocio, una celda borrada por accidente se nota tarde (si se nota),
          y capturar una venta en una hoja de cálculo desde el celular es lento. Para trabajar sin
          internet hay que activar antes su modo sin conexión.
        </P>

        <H2>¿Cuánto tiempo pierdes registrando ventas en Excel?</H2>
        <P>
          Si tardas 3 minutos por venta en Excel y tienes 30 ventas al día, son 90 minutos diarios
          solo en captura, y <A href="/#precios">empezar con Xangarro es gratis</A>. Con una app que
          procesa cada venta en 10 segundos, son 5 minutos. La diferencia: 85 minutos al día, más de
          35 horas al mes que puedes dedicar a atender clientes, mejorar tu producto o simplemente
          descansar.
        </P>

        <H2>¿Cómo pasar de Excel a una app de caja sin perder tus datos?</H2>
        <P>
          No empiezas de cero. En Xangarro subes tu lista de productos o de clientes como archivo
          .xlsx o .csv desde el portal, revisas lo que se va a importar y listo. Si prefieres no
          hacerlo tú, en los planes de pago nos mandas tus archivos con «Hazlo por mí» y la
          migración la hacemos nosotros. Para el resto del cambio, sigue el{' '}
          <A href="/recursos/sin-excel/">plan de una semana para dejar el Excel</A>.
        </P>
        <P>
          La salida también está abierta: todos los planes, incluido el gratuito, exportan tus datos
          a Excel. Tus registros no quedan atrapados en la app.
        </P>

        <H2>¿Tu contador puede seguir usando Excel?</H2>
        <P>
          Sí, y no tiene que aprender nada nuevo. Le mandas la exportación en Excel y, desde el plan
          Xangarro, también el estado de resultados, el balance y el flujo de efectivo en formato
          NIF. Si quieres entender qué contiene cada uno, lee la{' '}
          <A href="/recursos/nif/">guía de estados financieros NIF</A>.
        </P>

        <RelatedGuides slug="vs-excel" />
        <ArticleCta
          title="Prueba Xangarro hoy, gratis"
          text="Cuenta gratis para siempre. Importa tu catálogo de Excel en unos clics."
        />
      </article>
    </main>
  );
}
