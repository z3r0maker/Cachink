import alarma from './alarma.webp';
import * as s from './don-cuentas.css';
import guardia from './guardia.webp';
import tranquilo from './tranquilo.webp';

/**
 * Don Cuentas on shift. Three moods, three pictures; the words beside him are
 * always the page's own facts, never a new claim.
 */
export type DonMood = 'guardia' | 'tranquilo' | 'alarma';

const ART = {
  guardia: { src: guardia.src, alt: 'Don Cuentas de guardia, con audífonos y café' },
  tranquilo: { src: tranquilo.src, alt: 'Don Cuentas con los pies sobre el escritorio' },
  alarma: { src: alarma.src, alt: 'Don Cuentas agarrándose la cabeza' },
} as const;

const TONE = { guardia: s.noteGuardia, tranquilo: s.noteTranquilo, alarma: s.noteAlarma } as const;

export function DonPortrait({
  mood,
  large = false,
}: {
  readonly mood: DonMood;
  readonly large?: boolean;
}) {
  return (
    <span className={large ? `${s.portrait} ${s.portraitLg}` : s.portrait}>
      <img className={s.image} src={ART[mood].src} alt={ART[mood].alt} width={560} height={560} />
    </span>
  );
}

export function DonNote({
  mood,
  children,
}: {
  readonly mood: DonMood;
  readonly children: React.ReactNode;
}) {
  return (
    <aside className={`${s.note} ${TONE[mood]}`} aria-label="Nota de Don Cuentas">
      <DonPortrait mood={mood} />
      <p className={s.text}>{children}</p>
    </aside>
  );
}
