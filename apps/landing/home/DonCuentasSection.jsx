import { DonCuentasChat } from './DonCuentasChat.jsx';
import { DonCuentasMeta } from './DonCuentasMeta.jsx';
import { Don } from './Don.jsx';
import { Icon } from './icons.jsx';
import { useInView } from './use-in-view.js';

const POINTS = [
  {
    k: 'meta',
    b: 'Ponte una meta con él.',
    t: 'Ganar más, vender más o gastar menos; un empujón, un reto o de plano ambicioso. Te dice cada día si vas adelantado, al ritmo o atrasado.',
  },
  {
    k: 'sello',
    b: 'Gánate el sello.',
    t: 'Tu racha cuenta meses con la meta cumplida, no clics. Y el logro se presume por WhatsApp.',
  },
  {
    k: 'ia',
    b: 'Cada fin de mes, tu revisión con IA.',
    t: 'Qué funcionó, qué no y qué precios ajustar, con tus números de verdad. Y tu catálogo, desde una foto.',
  },
];

function Point({ p }) {
  return (
    <li className="dc-point">
      {p.k === 'ia' ? (
        <span className="dc-ia">Con IA</span>
      ) : (
        <span className="dc-check">
          <Icon name="check" size={18} />
        </span>
      )}
      <p>
        <strong>{p.b}</strong> {p.t}
      </p>
    </li>
  );
}

export function DonCuentasSection() {
  const ref = useInView();
  return (
    <section id="asesor" className="xh-sec xh-band dc" ref={ref} data-motion="">
      <div className="xh-wrap dc-grid">
        <div className="dc-copy">
          <div className="dc-id">
            <Don pose="quieto" size={200} />
            <div className="dc-plate">
              <span className="wm">Don Cuentas</span>
              <span>Tu contador de cabecera</span>
            </div>
          </div>
          <h2 className="xh2">Te echa aguas antes de que duela.</h2>
          <p className="xlead">
            Don Cuentas revisa tus ventas, gastos e inventario todos los días y te habla claro, como
            el compadre que sí sabe de números: qué subió, qué no se mueve, qué se ve raro. Sin
            choro contable, y cada cifra sale de tus propios registros.
          </p>
          <ul className="dc-points">
            {POINTS.map((p) => (
              <Point key={p.k} p={p} />
            ))}
          </ul>
        </div>
        <div className="dc-side">
          <DonCuentasChat />
          <DonCuentasMeta />
        </div>
      </div>
    </section>
  );
}
