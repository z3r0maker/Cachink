import json
sfx = [
  (0.18, "impact/impactSoft_medium_001.ogg", 0.8),   # hook stamp
  (2.97, "impact/impactSoft_medium_004.ogg", 0.7),   # bar wipe
  (3.35, "interface/bong_001.ogg", 0.7),             # logo
  (5.5,  "impact/impactSoft_medium_001.ogg", 0.55),  # push
  (6.52, "interface/click_003.ogg", 0.75),
  (7.02, "interface/click_002.ogg", 0.75),
  (7.52, "interface/click_005.ogg", 0.75),
  (8.52, "interface/click_003.ogg", 0.75),
  (9.52, "interface/click_002.ogg", 0.75),
  (10.52,"interface/click_005.ogg", 0.8),            # Cobrar
  (11.52,"interface/click_003.ogg", 0.8),            # Efectivo
  (12.35,"keyboard/keypress-003.wav", 0.6),
  (12.55,"keyboard/keypress-011.wav", 0.6),
  (12.75,"keyboard/keypress-015.wav", 0.6),
  (12.95,"keyboard/keypress-022.wav", 0.6),
  (13.02,"impact/impactSoft_medium_004.ogg", 0.75),  # cambio
  (14.02,"interface/click_002.ogg", 0.8),            # Registrar
  (14.5, "impact/impactBell_heavy_000.ogg", 0.65),   # Cobro confirmado
  (15.5, "impact/impactSoft_medium_001.ogg", 0.55),  # wipe
  (17.5, "impact/impactBell_heavy_003.ogg", 0.65),   # Diferencia $0.00
  (18.02,"interface/switch_002.ogg", 0.7),           # sync pill
  (19.2, "impact/impactSoft_medium_004.ogg", 0.8),   # outro logo
]
lines = []
for i,(t,f,v) in enumerate(sfx):
  lines.append(f'<audio id="sfx-{i+1}" data-start="{t}" data-duration="1.2" data-track-index="{11+i}" data-volume="{v}" src="assets/sfx/{f}"></audio>')
bass = json.load(open(".work/bass.json"))
src = open(".work/src.html").read()
out = src.replace("__SFX__", "\n      ".join(lines)).replace("__BASS__", json.dumps(bass))
open("index.html","w").write(out)
