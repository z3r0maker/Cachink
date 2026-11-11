/**
 * The frame of the support page (ElSoporte): the header, the yellow hero
 * with «Escríbenos», the «¿Quién eres?» choice and the footer.
 */
import { Brand } from '../../../home/Nav.jsx';
import { ContactoLegal } from '../../../home/ContactoLegal.jsx';
import { Don } from '../../../home/Don.jsx';
import { LOGIN_URL } from '../../../landing/planes.js';
import { Inline } from '../legal/LegalPage.jsx';
import { Icono } from './iconos.jsx';
import { SOPORTE_EMAIL } from './contenido.js';

export function Cabecera() {
  return (
    <header className="sp-cabecera">
      <div className="sp-wrap sp-cabecera-fila">
        <Brand size={38} fontSize={26} />
        <a className="sp-btn" href={LOGIN_URL}>
          Entrar al portal
        </a>
      </div>
    </header>
  );
}

export function Hero({ intro, escribe }) {
  return (
    <section className="sp-hero" aria-labelledby="sp-titulo">
      <div className="sp-wrap sp-hero-fila">
        <div className="sp-hero-texto">
          <span className="sp-ceja">Soporte</span>
          <h1 id="sp-titulo">¿En qué te ayudamos?</h1>
          {intro.map((t) => (
            <p key={t} className="sp-hero-intro">
              <Inline text={t} />
            </p>
          ))}
          <div className="sp-hero-acciones">
            <a className="sp-btn sp-btn-negro" href={`mailto:${SOPORTE_EMAIL}`}>
              <Icono nombre="correo" size={20} />
              Escríbenos
            </a>
            <span className="sp-hero-correo">{SOPORTE_EMAIL}</span>
          </div>
          {escribe.map((t) => (
            <p key={t} className="sp-hero-nota">
              <Inline text={t.replace(/^Escribe a \*\*[^*]+\*\*\.\s*/, '')} />
            </p>
          ))}
        </div>
        <Don pose="hola" size={190} eager className="sp-don" />
      </div>
    </section>
  );
}

const QUIEN = [
  ['#app', 'telefono', 'Cobro con la app', 'Vincular, tu NIP, sin internet, reportar un problema'],
  ['#duenio', 'tienda', 'Soy el dueño', 'Tu portal, llevarte tus datos, eliminar tu cuenta'],
];

export function Quien() {
  return (
    <nav className="sp-seccion" aria-labelledby="sp-quien">
      <h2 id="sp-quien">¿Quién eres?</h2>
      <div className="sp-rejilla">
        {QUIEN.map(([href, icono, titulo, sub]) => (
          <a key={href} className="sp-quien" href={href}>
            <span className="sp-quien-icono">
              <Icono nombre={icono} size={26} />
            </span>
            <span className="sp-quien-texto">
              <span className="sp-quien-titulo">{titulo}</span>
              <span className="sp-sub">{sub}</span>
            </span>
            <Icono nombre="flecha" />
          </a>
        ))}
      </div>
    </nav>
  );
}

export function Pie({ legal }) {
  return (
    <footer className="sp-pie">
      <div className="sp-wrap sp-pie-fila">
        <nav aria-label="Legal" className="sp-pie-links">
          {legal.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <ContactoLegal className="sp-sub sp-pie-contacto" />
      </div>
    </footer>
  );
}
