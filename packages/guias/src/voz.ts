/**
 * Don Cuentas's voice (ADR-163): one invented voice, described in words and
 * never copied from a person. A voice-design model makes one sample from the
 * description; every line of every guide is then said in that sample's voice.
 *
 * He is an older man: the owner's words for him are age, wisdom, a calm voice
 * and patience (2026-11-21, after the first takes came out too young).
 *
 * The description cannot make this voice again: the model gives a different
 * one on every run. The voice is the sample the owner chose by ear, kept as
 * `packages/guias/voz/don-cuentas.wav`. That file, the exact words it says
 * (`muestra`) and the model that copies it are what a future line needs to
 * sound like today's. `huella` pins the file; a new sample changes `huella`
 * and `version` together.
 */
export const VOZ_DON = {
  /** Goes up when the sample is made again, so every line is said again. */
  version: 1,
  /** The kept sample, by its SHA-256: take 7, approved by the owner on 2026-11-21. */
  huella: '4ee642a2d394974521eeccaa5a515405d61165f01f78236b93ecede02dc87d8c',
  /** The language of every line, as the model names it. */
  /**
   * How fast he speaks. The model copies the pace of the sample it hears, and
   * the kept sample is slow, so the model hears it with its pauses cut short
   * and played this many times faster (`scripts/guias-voz-ritmo.ts`). One is
   * the sample's own pace without the pauses. The owner found take 7 «very
   * slow» on 2026-11-21. A new pace has every line said again.
   */
  ritmo: 1.15,
  idioma: 'Spanish',
  /** What the voice-design model is told. In English, as the model's own examples are. */
  descripcion:
    'An elderly Mexican man in his late sixties, a shopkeeper who has kept the books of his ' +
    'corner store for forty years. He speaks Mexican Spanish from central Mexico, never Castilian. ' +
    'A deep, low, slightly gravelly voice that carries the weight of age. ' +
    'Calm, patient and unhurried, like a wise grandfather who explains something a third time ' +
    'without minding. Warm, with a gentle smile in the voice and a touch of dry humour. ' +
    'Never rushed, never a cartoon and never an announcer.',
  /** What the sample says. The cloning model needs these exact words beside the audio. */
  muestra:
    'Buenas. Soy Don Cuentas, el de las cuentas claras. ' +
    'Con calma te enseño a cobrar, a contar tu caja y a cerrar tu turno, pasito a pasito.',
} as const;
