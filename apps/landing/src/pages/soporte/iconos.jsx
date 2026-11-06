/** Stroke icons of the support page (lucide shapes, drawn in currentColor). */
const PATHS = {
  correo: [
    'M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z',
    'm22 7-10 6L2 7',
  ],
  telefono: [
    'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z',
    'M12 18h.01',
  ],
  tienda: ['M3 9h18l-1.5-5h-15z', 'M4 9v11h16V9', 'M9 20v-6h6v6'],
  flecha: ['m9 18 6-6-6-6'],
  vincular: ['M9 17H7A5 5 0 0 1 7 7h2', 'M15 7h2a5 5 0 1 1 0 10h-2', 'M8 12h8'],
  candado: ['M5 11h14v11H5z', 'M8 11V7a4 4 0 0 1 8 0v4'],
  sinRed: ['M2 2l20 20', 'M8.5 16.5a5 5 0 0 1 7 0', 'M5 13a10 10 0 0 1 5.2-2.8', 'M12 20h.01'],
  alerta: [
    'M12 9v4',
    'M12 17h.01',
    'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  ],
  borrar: ['M3 6h18', 'M8 6V4h8v2', 'M6 6l1 14h10l1-14'],
  ayuda: [
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3',
    'M12 17h.01',
  ],
  equis: ['M18 6 6 18', 'm6 6 12 12'],
};

/** The icon for each question in «Si cobras con la app», by its title. */
export const ICONO_PREGUNTA = {
  'No puedo vincular el dispositivo': 'vincular',
  'Olvidé mi NIP': 'candado',
  'Se fue el internet': 'sinRed',
  'Algo no funciona': 'alerta',
  'Quiero que borren mis datos': 'borrar',
};

export function Icono({ nombre, size = 22, className = '' }) {
  const paths = PATHS[nombre] ?? PATHS.ayuda;
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
