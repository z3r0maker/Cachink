import { Coin, Icon, PATHS } from './icons.jsx';

const SIDE = [
  ['home', 'Inicio', true],
  ['ledger', 'Ventas y gastos'],
  ['box', 'Productos'],
  ['doc', 'Estados financieros'],
  ['clock', 'Cortes de turno'],
  ['team', 'Empleados'],
];
const BARS = [44, 58, 50, 66, 62, 84, 72];
const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function Sidebar() {
  return (
    <div className="bw-side">
      <div className="bw-brand">
        <Coin size={26} />
        <span className="wm">Xangarro!</span>
      </div>
      {SIDE.map(([icon, label, on]) => (
        <div key={label} className={on ? 'bw-nav on' : 'bw-nav'}>
          <Icon name={icon} size={15} />
          {label}
        </div>
      ))}
      <div className="bw-nav">
        <svg className="ico" style={{ width: 15, height: 15 }} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5.5 10a2.8 2.8 0 1 0 5.6 0 2.8 2.8 0 1 0-5.6 0M12.9 10a2.8 2.8 0 1 0 5.6 0 2.8 2.8 0 1 0-5.6 0M11.1 10h1.8M6 16.5c2-2 4-2 6-.3 2-1.7 4-1.7 6 .3" />
        </svg>
        Don Cuentas
      </div>
    </div>
  );
}

function Chart() {
  return (
    <div className="bw-card bw-chart">
      <div className="bw-label">Ventas de la semana</div>
      <div className="bw-bars">
        {BARS.map((h, i) => (
          <div key={i} className="bw-barcol">
            <div className={i === 3 ? 'bw-bar today a-bar' : 'bw-bar'} style={{ height: h }} />
            <span>{DAYS[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Kpis({ compact }) {
  return (
    <div className="bw-kpis">
      <div className="bw-kpi">
        <div className="bw-label">Ventas hoy</div>
        <div className="bw-kval num bw-swap">
          <span className="a-valA">$6,480.00</span>
          <span className="a-valB t-ok" style={{ opacity: 0 }}>$6,565.00</span>
        </div>
        {compact ? null : <div className="bw-ksub">58 ventas</div>}
      </div>
      <div className="bw-kpi">
        <div className="bw-label">Corte · Caja 1</div>
        <div className="bw-kval t-ok">Cuadró</div>
        {compact ? null : <div className="bw-ksub">Ana · 08:15 – 16:00</div>}
      </div>
      {compact ? null : (
        <div className="bw-kpi">
          <div className="bw-label">Stock bajo</div>
          <div className="bw-kval t-bad">3 productos</div>
          <div className="bw-ksub">Tortillas · quedan 2 kg</div>
        </div>
      )}
    </div>
  );
}

/** The owner's portal home, drawn as a browser window (decorative). */
export function BrowserMock({ compact = false }) {
  return (
    <div className="bw">
      <div className="bw-top">
        <span className="bw-dot" style={{ background: 'var(--red)' }} />
        <span className="bw-dot" style={{ background: 'var(--yellow)' }} />
        <span className="bw-dot" style={{ background: 'var(--green)' }} />
        <span className="bw-url">
          <svg className="ico" style={{ width: 12, height: 12 }} viewBox="0 0 24 24" aria-hidden="true">
            <path d={PATHS.lock} />
          </svg>
          app.xangarro.mx
        </span>
      </div>
      <div className="bw-body">
        {compact ? null : <Sidebar />}
        <div className="bw-main">
          <div className="bw-greet">
            <div>
              <div className="bw-hi">Buenas tardes, Pedro</div>
              {compact ? null : <div className="bw-date">jueves, 24 de septiembre de 2026 · Tacos El Güero</div>}
            </div>
            {compact ? null : (
              <span className="xtag bw-live">
                <span className="a-live" />2 cajas en línea
              </span>
            )}
          </div>
          <div className="bw-grid2">
            <div className="bw-hero">
              <div className="bw-label">Utilidad del mes</div>
              <div className="bw-big num">$48,210.00</div>
              <div className="bw-verdict">
                <span className="bw-vdot" />
                Tu negocio va ganando este mes
              </div>
              {compact ? null : <div className="bw-mini">Ver estados</div>}
            </div>
            {compact ? null : <Chart />}
          </div>
          <Kpis compact={compact} />
        </div>
      </div>
    </div>
  );
}
