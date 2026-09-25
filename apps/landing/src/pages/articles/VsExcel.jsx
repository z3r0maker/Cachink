import { PLAN_BY_ID, pesos } from '../../../landing/planes.js';
import { ArticleCta, ArticleHeader, RelatedGuides, articleSchema } from './shared.jsx';

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
    excel: 'Depende. La versión local sí, la de Google Sheets no.',
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
        mejor cada opción. Esta comparativa es honesta — no siempre gana la app.
      </p>

      <div style={{ overflowX: 'auto', margin: '0 0 40px' }}>
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

      <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 14px' }}>
        ¿Cuándo tiene sentido seguir con Excel?
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
        Si tu negocio tiene necesidades muy específicas que una app estándar no cubre — por ejemplo,
        modelos de costos complejos, análisis de escenarios financieros o integraciones con sistemas
        de inventario a medida — Excel puede ser la herramienta correcta, especialmente si tienes a
        alguien con conocimientos para mantenerlo.
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
        Pero para el 95% de los pequeños negocios en México — panadería, cafetería, tienda, taller —
        las necesidades son: registrar ventas rápido, saber cuánto hay en caja, y generar un reporte
        mensual para el contador. Para eso, una app especializada gana en todos los frentes que
        importan.
      </p>

      <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 14px' }}>
        El costo real de Excel en tiempo perdido
      </h2>
      <p
        style={{
          fontSize: 16,
          lineHeight: 1.7,
          margin: '0 0 32px',
          color: 'var(--ink)',
          fontWeight: 500,
        }}
      >
        Si tardas 3 minutos por venta en Excel y tienes 30 ventas al día, son 90 minutos diarios
        solo en captura. Con una app que procesa cada venta en 10 segundos, son 5 minutos. La
        diferencia: 85 minutos al día — más de 35 horas al mes que puedes dedicar a atender
        clientes, mejorar tu producto o simplemente descansar.
      </p>

      <RelatedGuides slug="vs-excel" />
      <ArticleCta
        title="Prueba Xangarro hoy — gratis"
        text="Cuenta gratis para siempre. Importa tu catálogo de Excel en unos clics."
      />
    </article>
  );
}
