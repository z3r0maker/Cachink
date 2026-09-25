const GIROS = [
  'Taquerías y fondas',
  'Panaderías y cafés',
  'Tiendas de barrio',
  'Talleres y servicios',
  'Consultorios',
  'Puestos y tianguis',
  'Papelerías',
  'Estéticas',
];

export function ParaQuien() {
  return (
    <section className="xh-band quien">
      <div className="xh-wrap quien-row">
        <h2>Si tienes caja, tienes Xangarro.</h2>
        <p className="xbody quien-lead">
          Control financiero y sistema de caja para tiendas, puestos y negocios pequeños en México,
          del mostrador al estado financiero.
        </p>
        <ul className="quien-list">
          {GIROS.map((g) => (
            <li key={g} className={g === 'Tiendas de barrio' ? 'xtag on' : 'xtag'}>
              {g}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
