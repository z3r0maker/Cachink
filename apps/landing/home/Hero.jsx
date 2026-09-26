import { HeroArt } from './HeroArt.jsx';
import { Icon } from './icons.jsx';
import { useInView } from './use-in-view.js';
import { signupUrl } from '../landing/planes.js';

const CHECKS = ['Gratis para siempre', 'Sin tarjeta', 'En español y en pesos'];

export function Hero() {
  const ref = useInView();
  return (
    <section id="top" className="hero" ref={ref} data-motion="">
      <div className="xh-wrap hero-grid">
        <div className="hero-copy">
          <span className="xtag hero-beta">
            <span className="hero-beta-dot" />
            Beta abierta · el portal web de tu negocio
          </span>
          <h1 className="hero-h1">
            El mostrador cobra.
            <br />
            <span className="hero-hl">Tú ves todo.</span>
          </h1>
          <p className="xlead hero-sub">
            Xangarro es el punto de venta y control financiero para negocios pequeños en México. Tu
            equipo cobra en la caja, desde la computadora, la tablet o el teléfono, y tú ves todo al
            momento, hasta tus estados financieros NIF.{' '}
            <strong>Y Don Cuentas te lo platica en cristiano.</strong>
          </p>
          <div className="hero-ctas">
            <a className="xbtn xbtn-dark" href={signupUrl('xangarrito')}>
              Crear cuenta gratis
              <Icon name="arrow" size={18} />
            </a>
            <a className="xbtn xbtn-white" href="#como">
              Ver cómo funciona
            </a>
          </div>
          <ul className="hero-checks">
            {CHECKS.map((c) => (
              <li key={c}>
                <Icon name="check" size={18} />
                {c}
              </li>
            ))}
          </ul>
        </div>
        <HeroArt />
      </div>
    </section>
  );
}
