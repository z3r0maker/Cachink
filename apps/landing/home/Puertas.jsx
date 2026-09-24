import { Icon } from './icons.jsx';

const PUERTAS = [
  {
    icon: 'monitor', tile: 'var(--white)', tag: 'Para el dueño · hoy', tagBg: 'var(--white)', title: 'El portal', main: true,
    body: 'Donde vive tu negocio. Configuras tu catálogo, tu equipo y tus cajas; ves cuánto ganaste, qué falta en el inventario, quién te debe y cómo van tus metas.',
    chips: ['Inicio con veredicto', 'Estados NIF', 'Cortes', 'Don Cuentas'],
    foot: 'app.xangarro.mx · cualquier navegador',
  },
  {
    icon: 'caja', tile: 'var(--yellow-soft)', tag: 'Hoy', tagBg: 'var(--green-soft)', title: 'La caja del mostrador',
    body: 'La computadora o la tablet de tu negocio se vincula una vez con un código. Cada quien entra con su NIP, abre turno con su fondo y cobra tocando productos.',
    chips: ['NIP por persona', 'Fiado', 'Sigue sin internet'],
  },
  {
    icon: 'phone', tile: 'var(--blue-soft)', tag: 'Próximamente', tagBg: 'var(--warning-soft)', title: 'La app del equipo',
    body: 'Para cobrar en la calle, en el puesto o en el piso de venta. Escanea códigos, registra entradas y mermas, y manda todo al portal cuando hay señal.',
    chips: ['iOS y Android', 'Escáner', 'Entradas y mermas'],
  },
];

function Puerta({ p }) {
  return (
    <div className={p.main ? 'xcard puerta puerta-main' : 'xcard puerta'}>
      <div className="puerta-top">
        <span className="puerta-ico" style={{ background: p.tile }}>
          <Icon name={p.icon} size={30} />
        </span>
        <span className="xtag" style={{ background: p.tagBg }}>{p.tag}</span>
      </div>
      <h3>{p.title}</h3>
      <p>{p.body}</p>
      <div className="puerta-chips">
        {p.chips.map((c) => (
          <span key={c} className="xtag" style={{ background: p.main ? 'var(--white)' : 'var(--gray-100)' }}>{c}</span>
        ))}
      </div>
      {p.foot ? <div className="puerta-foot">{p.foot}</div> : null}
    </div>
  );
}

export function Puertas() {
  return (
    <section id="como" className="xh-sec">
      <div className="xh-wrap">
        <div className="xhead">
          <div className="xhead-text">
            <span className="xeyebrow">Una cuenta, tres puertas</span>
            <h2 className="xh2">El cuartel está en la web. Las herramientas, donde está la chamba.</h2>
          </div>
          <p className="xlead" style={{ maxWidth: 420, color: 'var(--gray-600)' }}>
            Tú manejas el negocio desde el portal. Tu equipo cobra desde la computadora del negocio, la
            tablet del mostrador o el teléfono. Todo cae en el mismo lugar, con los mismos números.
          </p>
        </div>
        <div className="puertas">
          {PUERTAS.map((p) => (
            <Puerta key={p.title} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
