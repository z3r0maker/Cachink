"""Say Don Cuentas's lines with Qwen3-TTS on an Apple Silicon Mac (ADR-163, G-07).

This is not part of the workspace. It needs its own Python (3.11 or newer) with
`pip install -U mlx-audio`, and `ffmpeg` on the PATH. The models download from
Hugging Face the first time they are used.

    pnpm guias:voz                              # writes the list this script reads
    python scripts/guias-voz-qwen.py muestra    # the sample, from the description
    python scripts/guias-voz-qwen.py lineas     # every pending line, in that voice
    pnpm guias:voz --check                      # passes once every line has its audio

`muestra` can be run again for another take: listen, and keep the one that
sounds like Don Cuentas. After a new sample, raise `version` in
`packages/guias/src/voz.ts`, so every line is said again in the new voice.

Written from mlx-audio's README and source on 2026-11-21 and not yet run against
the models: if the library has moved, this is the file to fix.
"""

import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PENDIENTES = ROOT / "packages/guias/voz/pendientes.json"
DISENO = "mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-bf16"
BASE = "mlx-community/Qwen3-TTS-12Hz-1.7B-Base-bf16"


def cargar():
    if not PENDIENTES.exists():
        sys.exit("Run `pnpm guias:voz` first: it writes packages/guias/voz/pendientes.json.")
    return json.loads(PENDIENTES.read_text(encoding="utf-8"))


def guardar_wav(resultados, destino):
    """Join what the model yielded and write it as WAV at the model's own sample rate."""
    import numpy as np
    from mlx_audio.audio_io import write as audio_write

    if not resultados:
        sys.exit(f"The model returned no audio for {destino}.")
    audio = np.concatenate([np.array(r.audio) for r in resultados])
    audio_write(str(destino), audio, resultados[0].sample_rate, format="wav")


def muestra(datos, modelo):
    from mlx_audio.tts.utils import load_model

    voz = datos["voz"]
    destino = ROOT / voz["referencia"]
    destino.parent.mkdir(parents=True, exist_ok=True)
    model = load_model(modelo)
    resultados = list(
        model.generate_voice_design(
            text=voz["muestra"], instruct=voz["descripcion"], language=voz["idioma"]
        )
    )
    guardar_wav(resultados, destino)
    print(f"Sample written to {destino.relative_to(ROOT)}. Listen to it before saying the lines.")


def lineas(datos, modelo):
    from mlx_audio.tts.utils import load_model

    voz = datos["voz"]
    referencia = ROOT / voz["referencia"]
    if not referencia.exists():
        sys.exit("No sample yet: run `muestra` first and approve it by ear.")
    if not datos["lineas"]:
        print("Nothing to say: every line has its audio.")
        return
    model = load_model(modelo)
    for linea in datos["lineas"]:
        destino = ROOT / linea["archivo"]
        destino.parent.mkdir(parents=True, exist_ok=True)
        resultados = list(
            model.generate(
                text=linea["texto"],
                ref_audio=str(referencia),
                ref_text=voz["muestra"],
                lang_code=voz["idioma"],
            )
        )
        with tempfile.TemporaryDirectory() as tmp:
            wav = Path(tmp) / "linea.wav"
            guardar_wav(resultados, wav)
            # Mono AAC: small enough to commit, and what the clips carry anyway.
            subprocess.run(
                ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav)]
                + ["-ac", "1", "-c:a", "aac", "-b:a", "64k", str(destino)],
                check=True,
            )
        print(f"{linea['guia']} {linea['paso']}: {destino.relative_to(ROOT)}")
    print("Done. Run `pnpm guias:voz --check`, listen to a few, and commit the audio.")


def main():
    parser = argparse.ArgumentParser(description="Say Don Cuentas's lines with Qwen3-TTS.")
    parser.add_argument("que", choices=["muestra", "lineas"])
    parser.add_argument("--modelo", help="Another mlx-community model id, to try a smaller one.")
    args = parser.parse_args()
    datos = cargar()
    if args.que == "muestra":
        muestra(datos, args.modelo or DISENO)
    else:
        lineas(datos, args.modelo or BASE)


if __name__ == "__main__":
    main()
