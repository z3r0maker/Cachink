import { useState } from 'react';
import { PlanCard } from './PlanCard.jsx';
import { PAGO_LINEA, PLANES, notaIva } from '../landing/planes.js';

function Toggle({ anual, setAnual }) {
  return (
    <div role="group" aria-label="Periodo de pago" className="pr-toggle">
      <button type="button" aria-pressed={!anual} className={anual ? '' : 'on'} onClick={() => setAnual(false)}>
        Mensual
      </button>
      <button type="button" aria-pressed={anual} className={anual ? 'on' : ''} onClick={() => setAnual(true)}>
        Anual · 2 meses gratis
      </button>
    </div>
  );
}

export default function Precios() {
  const [anual, setAnual] = useState(false);
  return (
    <section id="precios" className="xh-sec pr">
      <div className="xh-wrap pr-inner">
        <div className="pr-head">
          <span className="xeyebrow">Precios honestos, en pesos</span>
          <h2 className="xh2">Empieza gratis. Crece cuando crezcas.</h2>
          <p className="xlead" style={{ color: 'var(--gray-600)' }}>
            Xangarrito es gratis para siempre. Cuando necesites más, cambias de plan en un clic.
          </p>
        </div>
        <Toggle anual={anual} setAnual={setAnual} />
        <div className="pr-grid">
          {PLANES.map((p) => (
            <PlanCard key={p.id} p={p} anual={anual} />
          ))}
        </div>
        <p className="num pr-nota">
          {notaIva(anual ? 'anual' : 'mensual')} · {PAGO_LINEA}
        </p>
      </div>
    </section>
  );
}
