/**
 * guias-voz-omlx.ts — asking oMLX to speak (ADR-163, G-07).
 *
 * Don Cuentas's voice is made by Qwen3-TTS, which the owner runs on his own
 * machine behind oMLX. oMLX has one route for speech; what it is asked decides
 * what it does. With `instructions` the voice-design model invents a voice from
 * a description. With `ref_audio` and `ref_text` the base model says the text in
 * the voice of that recording. oMLX wants the recording as base64, not a path.
 *
 * No model is a dependency of the workspace: this only speaks HTTP to a server
 * that may or may not be there.
 */

/**
 * The two models, by the names oMLX gives them: their folders in its models
 * directory. The voice was made and first said with these, from Hugging Face on
 * 2026-11-21 (both Apache 2.0), served by oMLX 0.8.0 (mlx-audio 0.6.3). Saying a
 * new line in the same voice needs the base one:
 *   mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-bf16 @ 7d3824abff87e49756bb0f83fb5411de75d160c4
 *   mlx-community/Qwen3-TTS-12Hz-1.7B-Base-bf16        @ a6eb4f68e4b056f1215157bb696209bc82a6db48
 */
export const MODELOS = {
  diseno: 'Qwen3-TTS-12Hz-1.7B-VoiceDesign-bf16',
  base: 'Qwen3-TTS-12Hz-1.7B-Base-bf16',
} as const;

/** What a request needs to know about the voice. */
export interface Voz {
  readonly idioma: string;
  readonly descripcion: string;
  /** The words the sample says. */
  readonly muestra: string;
}

/** Where oMLX listens, and its key when it asks for one. */
export interface Servidor {
  readonly url: string;
  readonly clave?: string;
}

export type Pedido = Readonly<Record<string, string>>;

/** A new take of the voice: the description, saying the sample's words. */
export const pedirMuestra = (voz: Voz): Pedido => ({
  model: MODELOS.diseno,
  input: voz.muestra,
  language: voz.idioma,
  instructions: voz.descripcion,
  response_format: 'wav',
});

/** A line said in the sample's voice. */
export const pedirLinea = (texto: string, voz: Voz, muestra: Uint8Array): Pedido => ({
  model: MODELOS.base,
  input: texto,
  language: voz.idioma,
  ref_audio: Buffer.from(muestra).toString('base64'),
  ref_text: voz.muestra,
  response_format: 'wav',
});

/** oMLX's own words for a refusal, whichever of its shapes the answer has. */
async function motivo(res: Response): Promise<string> {
  const texto = await res.text();
  try {
    const cuerpo = JSON.parse(texto) as {
      error?: { message?: string };
      message?: string;
      detail?: string;
    };
    return cuerpo.error?.message ?? cuerpo.message ?? cuerpo.detail ?? texto;
  } catch {
    return texto;
  }
}

/** One request to oMLX's speech route. Resolves to the WAV it answers with. */
export async function decir(servidor: Servidor, pedido: Pedido): Promise<Buffer> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (servidor.clave !== undefined) headers.authorization = `Bearer ${servidor.clave}`;
  let res: Response;
  try {
    res = await fetch(`${servidor.url}/v1/audio/speech`, {
      method: 'POST',
      headers,
      body: JSON.stringify(pedido),
    });
  } catch (error) {
    throw new Error(`oMLX did not answer at ${servidor.url}. Is it running?`, { cause: error });
  }
  if (!res.ok) throw new Error(`oMLX refused (${res.status}): ${await motivo(res)}`);
  const tipo = res.headers.get('content-type') ?? '';
  if (!tipo.startsWith('audio/'))
    throw new Error(`oMLX answered with ${tipo}, which is not audio.`);
  return Buffer.from(await res.arrayBuffer());
}
