/**
 * Don Cuentas's voice (ADR-163): one invented voice, described in words and
 * never copied from a person. A voice-design model makes one sample from the
 * description; every line of every guide is then said in that sample's voice.
 */
export const VOZ_DON = {
  /** Goes up when the sample is made again, so every line is said again. */
  version: 1,
  /** The language of every line, as the model names it. */
  idioma: 'Spanish',
  /** What the voice-design model is told. In English, as the model's own examples are. */
  descripcion:
    'A warm, playful Mexican man in his fifties who runs a corner shop. ' +
    'He speaks Mexican Spanish from central Mexico, never Castilian. ' +
    'Mid-low pitch, slightly raspy, smiling as he speaks. ' +
    'Unhurried and clear, like explaining something to a neighbour across the counter. ' +
    'Cheerful and a little cheeky, never a cartoon and never an announcer.',
  /** What the sample says. The cloning model needs these exact words beside the audio. */
  muestra:
    '¡Quiubo! Soy Don Cuentas, el de las cuentas claras. ' +
    'Yo te enseño a cobrar, a contar tu caja y a cerrar tu turno, pasito a pasito.',
} as const;
