import { SceneDonCuentas, SceneLibreta, SceneMeta, SceneVenta } from './ReelScenes.jsx';
import { useInView } from './useInView.js';

const CHAPTERS = ['01 · La libreta', '02 · La venta', '03 · Don Cuentas', '04 · La meta'];

/** «De la libreta al ¡Xangarro!»: four scenes on one 16-second loop, CSS-driven. */
export function Reel() {
  const ref = useInView();
  return (
    <section className="xh-sec xh-band reel" ref={ref} data-motion="">
      <div className="xh-wrap reel-inner">
        <div className="reel-head">
          <span className="xeyebrow" style={{ color: 'var(--black)' }}>Xangarro en 16 segundos</span>
          <h2 className="xh2">De la libreta al «¡Xangarro!»</h2>
        </div>
        <div
          className="reel-frame"
          role="img"
          aria-label="Animación en cuatro escenas: la libreta, la venta, el consejo de Don Cuentas y la meta lograda."
        >
          <SceneLibreta />
          <SceneVenta />
          <SceneDonCuentas />
          <SceneMeta />
          <div className="reel-bar"><div className="a-reelbar" /></div>
        </div>
        <div className="reel-chips" aria-hidden="true">
          {CHAPTERS.map((c, i) => (
            <span key={c} className={`xtag chip chip${i + 1}`}>{c}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
