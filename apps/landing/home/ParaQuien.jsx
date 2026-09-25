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
