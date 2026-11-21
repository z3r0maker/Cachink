/**
 * Don Cuentas's voice (ADR-163): one invented voice, described in words and
 * never copied from a person. A voice-design model makes one sample from the
 * description; every line of every guide is then said in that sample's voice.
 *
 * He is an older man: the owner's words for him are age, wisdom, a calm voice
 * and patience (2026-11-21, after the first takes came out too young).
 */
export const VOZ_DON = {
  /** Goes up when the sample is made again, so every line is said again. */
  version: 1,
  /** The language of every line, as the model names it. */
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
