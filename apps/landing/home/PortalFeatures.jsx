import { Icon } from './icons.jsx';
import { signupUrl } from '../landing/planes.js';

const FEATS = [
  {
    icon: 'home',
    tile: 'var(--yellow)',
    t: 'Inicio que te da el veredicto',
    d: 'Utilidad del mes en grande y una frase clara: vas ganando o vas perdiendo. Luego el resumen del día y los pendientes.',
  },
  {
    icon: 'doc',
    tile: 'var(--blue-soft)',
    t: 'Estados financieros NIF',
    d: 'Estado de resultados, balance general y flujo de efectivo, listos para tu contador. En PDF, con un clic.',
  },
  {
    icon: 'clock',
    tile: 'var(--green-soft)',
    t: 'Cortes de turno sin pleito',
    d: 'Cada turno con su fondo, su conteo y su diferencia. Si algo no cuadra, pides la aclaración ahí mismo.',
  },
  {
    icon: 'box',
    tile: 'var(--peach-soft, #FFE8D6)',
    t: 'Productos e inventario',
    d: 'Importa tu catálogo desde Excel, registra entradas y mermas, y recibe aviso cuando algo va a acabarse.',
  },
  {
    icon: 'team',
    tile: 'var(--purple-soft, #F0E5FF)',
    t: 'Tu equipo, con NIP',
    d: 'Da de alta a tus empleados, vincula cajas con un código y decide quién ve qué. Nadie ve costos que no debe.',
  },
  {
    icon: 'fiado',
    tile: 'var(--yellow-soft)',
    t: 'Fiado y cobranza',
    d: 'Quién te debe, desde cuándo y cuánto. Los abonos se aplican a lo más viejo primero.',
  },
];

export function PortalFeatures() {
  return (
    <section id="portal" className="xh-sec">
      <div className="xh-wrap">
        <div className="xhead">
          <div className="xhead-text">
            <span className="xeyebrow">Lo que ves desde el portal</span>
            <h2 className="xh2">Menos Excel. Menos libreta. Más «ah, mira, sí ganamos».</h2>
          </div>
          <a className="xbtn xbtn-white" href={signupUrl('xangarrito')}>
            Probarlo gratis
          </a>
        </div>
        <div className="xgrid-3">
          {FEATS.map((f) => (
            <div key={f.t} className="xcard feat">
              <span className="xtile" style={{ background: f.tile }}>
                <Icon name={f.icon} />
              </span>
              <h3>{f.t}</h3>
              <p className="xbody">{f.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
