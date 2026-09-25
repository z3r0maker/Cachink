import { Icon } from './icons.jsx';
import { OfflineDemo } from './OfflineDemo.jsx';
import { useInView } from './use-in-view.js';

const CARDS = [
  {
    icon: 'wifiOff',
    t: 'Cobras sin conexión',
    d: 'La caja guarda cada venta y la sube sola al volver la señal. Ninguna se pierde en el camino.',
  },
  {
    icon: 'cuadra',
    t: 'Cortes que cuadran',
    d: 'Fondo + efectivo − caja chica = lo esperado. Si no cuadra, hay motivo y nota. Sin misterios.',
  },
  {
    icon: 'shield',
    t: 'Nada se borra',
    d: 'Una venta cancelada queda a la vista, con su motivo. Tú ves todo lo que pasó en la caja.',
  },
  {
    icon: 'download',
    t: 'Tus datos son tuyos',
    d: 'Exporta a Excel en todos los planes, incluido el gratis. Nunca los vendemos ni los compartimos.',
  },
];

export function Confianza() {
  const ref = useInView();
  return (
    <section id="por-que" className="xh-sec" ref={ref} data-motion="">
      <div className="xh-wrap">
        <div className="conf-top">
          <div className="xhead-text">
            <span className="xeyebrow">Hecho para el México real</span>
            <h2 className="xh2">Se va el internet, no la venta.</h2>
            <p className="xlead" style={{ color: 'var(--gray-600)' }}>
              Aunque se caiga la señal, la caja sigue cobrando. Todo se sube solito en cuanto
              vuelve.
            </p>
          </div>
          <OfflineDemo />
        </div>
        <div className="xgrid-4">
          {CARDS.map((c) => (
            <div key={c.t} className="xcard conf-card">
              <Icon name={c.icon} size={30} />
              <h3>{c.t}</h3>
              <p className="xbody">{c.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
