import { Icon } from './icons.jsx';

function Estado({ pendClass = 'o-pend', sentClass = 'o-sent', fixed }) {
  if (fixed) {
    return (
      <span className="od-st ok">
        <Icon name="check" size={14} />
        Enviada
      </span>
    );
  }
  return (
    <span className="od-sw">
      <span className={`od-st wait ${pendClass}`} style={{ opacity: 0 }}>
        <Icon name="clock" size={14} />
        Por enviar
      </span>
      <span className={`od-st ok ${sentClass}`}>
        <Icon name="check" size={14} />
        Enviada
      </span>
    </span>
  );
}

function Row({ cls = '', name, pay, amount, fixed }) {
  return (
    <div className={`od-row ${cls}${fixed ? ' old' : ''}`}>
      <span className="od-name">
        {name} <span>· {pay}</span>
      </span>
      <span className="num od-amt">{amount}</span>
      <Estado fixed={fixed} />
    </div>
  );
}

/** A caja that loses signal, keeps selling, and sends both sales when it comes back. */
export function OfflineDemo() {
  return (
    <div
      className="xcard od"
      role="img"
      aria-label="La caja pierde la señal, sigue cobrando dos ventas y las envía al portal en cuanto vuelve la conexión."
    >
      <div className="od-head">
        <strong>Caja 1 · Ana</strong>
        <span className="od-sw">
          <span className="xtag o-onA" style={{ background: 'var(--green-soft)' }}>
            <Icon name="wifi" size={14} />
            En línea
          </span>
          <span className="xtag o-onB od-off" style={{ opacity: 0 }}>
            <Icon name="wifiOff" size={14} />
            Sin conexión
          </span>
        </span>
      </div>
      <Row name="Taco al pastor ×3" pay="Efectivo" amount="$66.00" fixed />
      <Row cls="o-rw1" name="Gringa" pay="Tarjeta" amount="$65.00" />
      <Row cls="o-rw2" name="Horchata" pay="Efectivo" amount="$20.00" />
      <div className="od-sw od-chips">
        <span className="xtag o-ch1" style={{ background: 'var(--warning-soft)', opacity: 0 }}>
          1 por enviar · se sube al volver la señal
        </span>
        <span className="xtag o-ch2" style={{ background: 'var(--warning-soft)', opacity: 0 }}>
          2 por enviar · se sube al volver la señal
        </span>
        <span className="xtag o-ch3" style={{ background: 'var(--green-soft)' }}>
          <Icon name="check" size={13} />
          Todo enviado al portal
        </span>
      </div>
    </div>
  );
}
