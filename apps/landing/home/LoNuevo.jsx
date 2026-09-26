import { Don } from './Don.jsx';
import { Icon } from './icons.jsx';
import { useInView } from './use-in-view.js';

/** The four things the portal redesign added (ADR-107), each shown the way it looks. */
function Minimo() {
  return (
    <span className="nv-big num">
      $1,240<small> al día</small>
    </span>
  );
}

function Sugerido() {
  return (
    <div className="nv-sug">
      <span className="nv-input">Taco de suadero</span>
      <span className="nv-row">
        <span className="nv-ico">
          <Icon name="sandwich" size={16} />
        </span>
        Ícono sugerido · lo cambias si quieres
      </span>
    </div>
  );
}

function Gente() {
  return (
    <ul className="nv-gente num">
      <li>
        Lupita · Caja 1<span>$2,400 / sem</span>
      </li>
      <li>
        Beto · Caja 2<span>$2,100 / sem</span>
      </li>
    </ul>
  );
}

const CARDS = [
  {
    tag: 'Estados financieros',
    title: 'Cuánto vender para no perder',
    body: 'La cascada de tu mes, paso por paso, y la cifra que importa: lo mínimo al día para salir tablas.',
    Extra: Minimo,
  },
  {
    tag: 'Productos',
    title: 'Un producto nuevo en 3 preguntas',
    body: '¿Cómo se llama? ¿En cuánto lo vendes? ¿Cuánto te cuesta? Por el nombre te sugerimos un ícono, y si no te late, lo cambias.',
    Extra: Sugerido,
  },
  {
    tag: 'Equipo y nómina',
    title: 'Tu gente, en un solo lugar',
    body: 'Quién cobra en qué caja y cuánto le pagas, juntos. Sin dos listas que no cuadran.',
    Extra: Gente,
  },
  {
    tag: 'Ayuda',
    title: '¿En qué te echo la mano?',
    body: 'Guías cortas, paso a paso, para el cierre de caja, tu primer producto o invitar a tu equipo.',
  },
];

function Card({ c }) {
  const { Extra } = c;
  return (
    <article className="xcard nv-card">
      <span className="nv-tag">{c.tag}</span>
      <h3>{c.title}</h3>
      <p>{c.body}</p>
      {Extra ? <Extra /> : null}
    </article>
  );
}

export function LoNuevo() {
  const ref = useInView();
  return (
    <section id="nuevo" className="xh-sec" ref={ref} data-motion="">
      <div className="xh-wrap">
        <div className="xhead nv-head">
          <div className="xhead-text">
            <span className="xeyebrow">Lo nuevo del portal</span>
            <h2 className="xh2">Cosas que antes te tocaba adivinar.</h2>
          </div>
          <Don pose="senalando" size={150} />
        </div>
        <div className="nv-grid">
          {CARDS.map((c) => (
            <Card key={c.tag} c={c} />
          ))}
        </div>
      </div>
    </section>
  );
}
