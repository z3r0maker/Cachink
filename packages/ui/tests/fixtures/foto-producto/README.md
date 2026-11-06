# Product photo fixtures (M-13)

PNGs for `tests/foto-producto/encode.test.ts`, drawn with CanvasKit so each
one takes a different path through `encodeProductPhoto`:

| File               | Size      | What it is                              | Path it takes                  |
| ------------------ | --------- | --------------------------------------- | ------------------------------ |
| `recorte-alto.png` | 180 × 460 | A tight cutout on transparency (lifted) | Fits at q80; margin            |
| `foto-ancha.png`   | 480 × 320 | An opaque landscape photo (not lifted)  | Centre-cropped, q80            |
| `grano-medio.png`  | 112 × 112 | Seeded colour grain, ±110 per channel   | Over 40 KB at q80, fits at q70 |
| `grano-fino.png`   | 112 × 112 | Seeded colour grain, ±140 per channel   | Fits only at q60               |
| `ruido.png`        | 120 × 120 | Seeded full-range noise                 | Never fits: refused            |

The grain and noise come from one linear congruential generator (seed 7),
drawn in the order above, one 1 × 1 rect per pixel. Upscaled to 512 px they
keep enough entropy to push WebP past the row limit. If a CanvasKit or
libwebp upgrade moves a file across a threshold, the test names which one;
redraw it with a different amplitude rather than loosening the test.
