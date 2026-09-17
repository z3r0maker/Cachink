# Hyperframes Composition Brief: Xangarro!

## Objective
Create a short launch-style brag video for Xangarro!, the neobrutalist-yellow micro-POS for Mexican emprendedores.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 21s

## Source Material
- Project root: /Users/eduardo.torres/Downloads/Cachink
- Primary files read: README.md, packages/ui/src/theme.ts, packages/ui/src/i18n/locales/es-mx.ts, packages/ui/src/screens/Ventas/*, packages/ui/src/screens/Checkout/*, docs/store/listing-app-store.md, assets/brand/icon-padded.png, e2e screenshots (seed business "Taquería Don Pedro")
- Product name: Xangarro!
- Tagline / strongest claim: "Finanzas para emprendedores." / works without internet
- Key UI to recreate: Ventas tap-to-cart grid + CartFooter "Cobrar $X", Checkout Efectivo with CambioCard, Corte de día (esperado / contado / diferencia), sync pill
- Copy that must appear verbatim (from es-mx.ts):
  - "Toca un producto para agregarlo a la venta"
  - "Total a cobrar", "Efectivo recibido", "Cambio", "Cobro confirmado"
  - "Corte de día", "Efectivo esperado", "Efectivo contado", "Diferencia"
  - "Sin conexión", "Sincronizado"
  - "Finanzas para emprendedores."

## Creative Direction
- Tone preset: default
- Creative direction: sticker-loud taquería-counter launch — neobrutalist, warm, a little cheeky
- Interpretation: brisk, stamp-like entrances mirroring the app's press-down interaction; hard offset shadows, black 2.5px borders; readable holds.
- Angle: A normal day at Taquería Don Pedro is the launch event — three taps, one cobro, the right change, a corte that cuadra — no internet, no contador.
- Hook: "¿Cuánto vendiste hoy?" stamps onto full-bleed yellow; "Sin Excel. Sin internet."
- Outro / punchline: Xangarro! + "Finanzas para emprendedores." + "Hecho en México"
- Avoid: generic SaaS language, abstract filler, soft blurred shadows or gradients (brand rule: hard shadows only)

## Visual Identity
- Background: #FFD60A (hero), #F7F7F5 (app surfaces)
- Text: #0D0D0D; muted #6F6F6B
- Accent: black borders + hard shadows `5px 5px 0 #0D0D0D`; greens #00C896 / #D6FFF4 / #007E5E; yellowSoft #FFFBCC
- Display + body font: Plus Jakarta Sans (800/900 display, 600 body)
- Visual references: coin icon (assets/brand/icon-padded.png), tile cards, CartFooter, CambioCard

## Storyboard
See `brag-output/brag-plan.md`.
1. Hook — 0–3.0s — "¿Cuánto vendiste hoy?" / "Sin Excel. Sin internet."
2. Reveal — 3.0–5.5s — coin + Xangarro! + tagline + "Taquería Don Pedro · Turno abierto"
3. Vende en tres toques — 5.5–10.5s — phone Ventas grid, taps, footer "Cobrar $145.00"
4. Cobra y da el cambio — 10.5–15.5s — métodos, $200.00 typed, Cambio $55.00, Cobro confirmado
5. El corte cuadra — 15.5–19.0s — esperado/contado/diferencia $0.00, pill Sin conexión → Sincronizado
6. Outro — 19.0–21.0s — logo, tagline, Hecho en México

## Audio
- Audio role: warm bed + light UI layer
- Audio arc: upbeat from frame one, tactile taps mid, bells on payoffs, fade under logo
- Music: happy-beats-business-moves-vol-1-by-ende-dot-app.mp3, volume ~0.32, fade last 1.5s
- Music cue guidance: assets/music/cues/happy-beats-business-moves-vol-1-by-ende-dot-app.music-cues.json — 120 BPM, beats at x.02/x.52. Beat-lock "Cobro confirmado" ~15.02, "Diferencia $0.00" ~17.52 (strong), logo ~19.02.
- Audio-reactive treatment: subtle; bass drives hard-shadow offset / background coin scale on yellow scenes
- Audio-coupled moments: tile taps (click), efectivo typing (keypress), cambio (soft impact), confirmado + $0.00 (bell), pill flip (switch), logo (soft impact)
- SFX analysis guidance: skills/brag/assets/sfx/sfx-analysis.md — prefer low HF risk
- Exact SFX choice: chosen after animation exists
- Audio files: copied into `composition/assets/`

## Hyperframes Instructions
Follow hyperframes core/animation/creative/keyframes/cli guidance. Show real UI, keep text readable, 15–25s, include music + SFX, run `hyperframes check` before render.
