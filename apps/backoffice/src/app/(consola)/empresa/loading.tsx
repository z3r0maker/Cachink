import * as m from '@/styles/mostrador.css';

/** «Empresa» while a page loads: the frame and a word, no invented figures. */
export default function EmpresaLoading() {
  return (
    <div className={m.page} aria-busy="true">
      <span className={m.eyebrow}>MEXIA · Empresa</span>
      <p className={m.sub}>Cargando…</p>
    </div>
  );
}
