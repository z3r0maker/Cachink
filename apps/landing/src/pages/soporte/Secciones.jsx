/**
 * The support page's sections (ElSoporte): the app's questions, the owner's
 * cards and «Eliminar tu cuenta», each laid out from docs/store/soporte.md.
 */
import { Inline } from '../legal/LegalPage.jsx';
import { ICONO_PREGUNTA, Icono } from './iconos.jsx';

export function Preguntas({ preguntas }) {
  return (
    <section id="app" className="sp-seccion" aria-labelledby="sp-app">
      <h2 id="sp-app">Si cobras con la app</h2>
      <div className="sp-rejilla sp-rejilla-ancha">
        {preguntas.map((q) => (
          <div key={q.titulo} className="sp-tarjeta sp-pregunta">
            <span className="sp-pregunta-icono">
              <Icono nombre={ICONO_PREGUNTA[q.titulo]} />
            </span>
            <span className="sp-pregunta-texto">
              <h3>{q.titulo}</h3>
              <span>
                <Inline text={q.texto} />
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Duenio({ tarjetas }) {
  return (
    <section id="duenio" className="sp-seccion" aria-labelledby="sp-duenio">
      <h2 id="sp-duenio">Si eres el dueño del negocio</h2>
      <div className="sp-rejilla sp-rejilla-tres">
        {tarjetas.map((c, i) => (
          <div key={c.titulo} className="sp-tarjeta sp-duenio">
            <h3>{c.titulo}</h3>
            <span className="sp-duenio-texto">
              <Inline text={c.texto} />
            </span>
            {c.boton ? (
              <a className={i === 0 ? 'sp-btn sp-btn-amarillo' : 'sp-btn'} href={c.boton.href}>
                {c.boton.label}
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function Lista({ titulo, items, icono, className }) {
  return (
    <div className={`sp-lista ${className}`}>
      <span className="sp-lista-titulo">{titulo}</span>
      {items.map((t) => (
        <span key={t} className="sp-lista-item">
          <Icono nombre={icono} size={16} />
          {t}
        </span>
      ))}
    </div>
  );
}

function Pasos({ pasos }) {
  return (
    <ol className="sp-pasos">
      {pasos.map((t, i) => (
        <li key={t}>
          <span className="sp-paso-n" aria-hidden="true">
            {i + 1}
          </span>
          <span>
            <Inline text={t} />
          </span>
        </li>
      ))}
    </ol>
  );
}

export function Eliminar({ e }) {
  return (
    <section id="eliminar-tu-cuenta" className="sp-eliminar" aria-labelledby="sp-eliminar">
      <div className="sp-eliminar-cabeza">
        <h2 id="sp-eliminar">{e.titulo}</h2>
        {e.intro.map((t) => (
          <p key={t}>{t}</p>
        ))}
      </div>
      <Pasos pasos={e.pasos} />
      <div className="sp-rejilla">
        <Lista {...e.borra} icono="equis" className="sp-lista-borra" />
        <div className="sp-lista sp-lista-guarda">
          <Lista {...e.guarda} icono="candado" className="sp-lista-dentro" />
          {e.guarda.parrafos.map((t) => (
            <span key={t} className="sp-sub">
              <Inline text={t} />
            </span>
          ))}
        </div>
      </div>
      <div className="sp-aviso" role="note" aria-label={e.correo.titulo}>
        <Icono nombre="correo" size={20} />
        <span>
          {e.correo.parrafos.map((t) => (
            <Inline key={t} text={t} />
          ))}
        </span>
      </div>
      {e.sinPortal.parrafos.map((t) => (
        <p key={t} className="sp-sin-portal">
          <strong>{e.sinPortal.titulo}.</strong> <Inline text={t} />
        </p>
      ))}
    </section>
  );
}
