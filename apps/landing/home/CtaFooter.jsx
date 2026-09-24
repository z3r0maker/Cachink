import { Brand } from './Nav.jsx';
import { LOGIN_URL, signupUrl } from '../landing/planes.js';

const COLS = [
  ['Producto', [['#portal', 'El portal'], ['#como', 'La caja'], ['#asesor', 'Don Cuentas'], ['#precios', 'Precios']]],
  ['Recursos', [['/recursos', 'Guías'], ['/recursos/vs-excel', 'Xangarro vs. Excel'], ['/recursos/nif', '¿Qué es la NIF?']]],
  ['Legal', [['/privacidad', 'Aviso de privacidad'], ['/privacidad/arco', 'Derechos ARCO']]],
];

function Cta() {
  return (
    <section id="contacto" className="cta">
      <div className="xh-wrap cta-row">
        <div className="cta-copy">
          <h2>¿Listo para que suene la caja?</h2>
          <p className="xlead">Crea tu cuenta en dos minutos y registra tu primera venta hoy.</p>
        </div>
        <div className="cta-actions">
          <a className="xbtn xbtn-dark cta-btn" href={signupUrl('xangarrito')}>Crear cuenta gratis</a>
          <span>
            ¿Ya tienes cuenta? <a href={LOGIN_URL}>Entra aquí</a>
          </span>
        </div>
      </div>
    </section>
  );
}

export default function CtaFooter() {
  return (
    <>
      <Cta />
      <footer className="foot">
        <div className="xh-wrap">
          <div className="foot-row">
            <div className="foot-brand">
              <Brand light />
              <p>Finanzas para emprendedores. Hecho en México, en español y en pesos.</p>
            </div>
            <div className="foot-cols">
              {COLS.map(([title, links]) => (
                <nav key={title} aria-label={title}>
                  <span className="xeyebrow">{title}</span>
                  {links.map(([href, label]) => (
                    <a key={href} href={href}>{label}</a>
                  ))}
                </nav>
              ))}
            </div>
          </div>
          <div className="foot-legal">© 2026 Xangarro · hola@xangarro.mx</div>
        </div>
      </footer>
    </>
  );
}
