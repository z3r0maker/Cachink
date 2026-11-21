# La voz de Don Cuentas

Don Cuentas has one voice (ADR-163). It is invented, never copied from a person, and it is kept
here so a line said next year sounds like the ones said today.

## What is kept

| What                      | Where                                                            | Why                                                        |
| ------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------- |
| The voice                 | `don-cuentas.wav`                                                | The sample the owner chose by ear. This file is the voice. |
| The words the sample says | `VOZ_DON.muestra` in `../src/voz.ts`                             | The model needs them to copy the sample.                   |
| The sample's fingerprint  | `VOZ_DON.huella`                                                 | A test fails if the file is swapped unnoticed.             |
| The model that copies it  | `MODELOS.base` in `scripts/guias-voz-omlx.ts`, with its revision | Another model copies the same sample a little differently. |
| Each line, already said   | `<guía>/<paso>-<huella>.m4a`                                     | The apps play these. Nothing speaks at run time.           |

How fast he speaks is kept too, as `VOZ_DON.ritmo`. See «Changing how fast he speaks» below.

The description in `VOZ_DON.descripcion` is how the sample was first made. It cannot make this
voice again: the design model gives a different voice on every run. It is kept as the brief for a
new voice, not as a way back to this one.

## Saying a new line, or one whose words changed

A line's file is named after a hash of its words and of the voice's version. Change a word and
its file is missing and the old one is left over, which `pnpm guias:voz --check` and
`pnpm test:scripts` both refuse.

```bash
pnpm guias:voz            # what is missing, what is left over
pnpm guias:voz lineas     # say every missing line in the kept voice
```

`pnpm guias:voz limpiar` deletes the files it lists as left over. To hear a line again in another
reading, delete its file and run `lineas`: the voice is the same, the reading is new.

This needs oMLX running on the machine (`OMLX_URL`, default `http://localhost:8000`) with the base
model in its models folder:

```bash
hf download mlx-community/Qwen3-TTS-12Hz-1.7B-Base-bf16 --revision a6eb4f68e4b056f1215157bb696209bc82a6db48 --local-dir ~/.omlx/models/mlx-community/Qwen3-TTS-12Hz-1.7B-Base-bf16
```

## Changing how fast he speaks

The model has no speed setting. It copies the pace of the sample it hears, and the kept sample is
slow: a third of it is pauses. So the model is given the sample with its long pauses cut short and
played `VOZ_DON.ritmo` times faster, pitch kept (`scripts/guias-voz-ritmo.ts`). Only the model
hears that copy. `don-cuentas.wav` is not touched, and no line is stretched afterwards: he says it
faster himself.

| `ritmo`        | Words a minute, measured | How it was judged                   |
| -------------- | ------------------------ | ----------------------------------- |
| sample as kept | about 150                | «very slow» (the owner, 2026-11-21) |
| 1              | about 165                |                                     |
| 1.15           | about 185                | the owner's pick (2026-11-21)       |
| 1.3            | about 200                |                                     |

A line's file name carries the pace, so a new pace leaves every line without audio:

```bash
pnpm guias:voz limpiar    # delete the lines said at the old pace
pnpm guias:voz lineas     # say them all at the new one
```

## Changing the voice

Only the owner does, by ear.

```bash
pnpm guias:voz muestra    # a new take, written to muestras/ (not committed)
pnpm guias:voz usar 3     # keep take 3: it becomes don-cuentas.wav
```

`usar` prints the new fingerprint. Put it in `VOZ_DON.huella` and raise `VOZ_DON.version`: every
line's file name changes with the version, so every line is said again and none is left in the old
voice. New takes need the design model too (`MODELOS.diseno`).
