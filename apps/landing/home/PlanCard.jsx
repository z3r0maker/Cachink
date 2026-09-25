import { DonCuentas } from './icons.jsx';
import { mensualEquivalente, pesos, signupUrl } from '../landing/planes.js';

function Precio({ p, anual }) {
  if (p.mensual === 0) {
    return (
      <div className="pc-price">
        <span className="num pc-amount">$0</span>
        <span className="pc-cad">para siempre</span>
      </div>
    );
  }
  return (
    <>
      <div className="pc-price">
        <span className="num pc-amount">{pesos(anual ? p.anual : p.mensual)}</span>
        <span className="pc-cad">{anual ? 'MXN al año' : 'MXN al mes'} + IVA</span>
      </div>
      {anual ? (
        <div className="pc-equiv">
          Equivale a <span className="num">{pesos(mensualEquivalente(p.id))}</span> al mes + IVA · 2
          meses gratis
        </div>
      ) : null}
    </>
  );
}

function DonCuentasItem({ dc }) {
  return (
    <li className="pc-dc">
      <DonCuentas size={28} />
      <span>
        <strong>{dc.title}</strong>
        <span>{dc.sub}</span>
      </span>
    </li>
  );
}

/** One plan, straight from planes.js. `tone` paints it white, yellow (recommended) or black. */
export function PlanCard({ p, anual }) {
  const btn =
    p.tone === 'yellow' ? 'xbtn xbtn-dark' : p.tone === 'black' ? 'xbtn' : 'xbtn xbtn-white';
  return (
    <div className={`xcard pc pc-${p.tone}`}>
      <div className="pc-top">
        <h3>{p.nombre}</h3>
        {p.featured ? <span className="xtag pc-rec">Recomendado</span> : null}
      </div>
      <p className="pc-tag">{p.tagline}</p>
      <Precio p={p} anual={anual} />
      <a className={btn} href={signupUrl(p.id)}>
        {p.cta}
      </a>
      <ul className="pc-list">
        {p.incluye ? <li className="pc-plus">Todo lo de {p.incluye}, más:</li> : null}
        {p.features.map((f) => (
          <li key={f}>{f}</li>
        ))}
        {p.donCuentas ? <DonCuentasItem dc={p.donCuentas} /> : null}
      </ul>
    </div>
  );
}
