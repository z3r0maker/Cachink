━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 FAILURE REPORT: empty-ventas
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 FAILED STEP
Step #15: tapOn id="tab-ventas"
Duration: 17,117ms (timeout)
Previous: ⚠️ #14 [WARNED ] 0ms tapOn id="consent-modal-no" [optional]

📸 SCREENSHOT AT FAILURE
→ apps/mobile/maestro/reports/empty-ventas/screenshot.png

🔎 VIEW HIERARCHY (elements on screen)
a11y="Cachink!"
id="quick-switch"
a11y="¡Buenas tardes!"
a11y="¡Buenas tardes!"
a11y="Selecciona tu usuario"
a11y="Selecciona tu usuario"
id="login-business-name" a11y="Taquería Don Pedro"
a11y="Taquería Don Pedro"
id="login-date" a11y="lunes, 18 de mayo de 2026"
a11y="lunes, 18 de mayo de 2026"
id="user-avatar-01KRY5Z90X22G271JWY2K0WW2X" a11y="D, Director Test, Director"
id="user-role-01KRY5Z90X22G271JWY2K0WW2X"
id="gearshape.fill" a11y="gearshape.fill"
a11y="12:37 p.m."
text="No signal" a11y="Cellular"
id="3 of 3 Wi-Fi bars" text="SSID, 3 of 3 Wi-Fi bars"
text="Not charging" a11y="100% battery power"

❌ EXPECTED vs ACTUAL
Expected id: "tab-ventas" → ❌ NOT found
On screen: 3 of 3 Wi-Fi bars, gearshape.fill, login-business-name, login-date, quick-switch, user-avatar-01KRY5Z90X22G271JWY2K0WW2X, user-role-01KRY5Z90X22G271JWY2K0WW2X

⚠️ WARNINGS (optional steps that didn't match)
Step #1: tapOn "numpad-0" → WARNED (not found)
Step #2: tapOn "numpad-0" → WARNED (not found)
Step #3: tapOn "consent-no" → WARNED (not found)
Step #4: tapOn "A, Ana Operativa, Operativo" → WARNED (not found)
Step #6: tapOn "numpad-0" → WARNED (not found)
Step #8: tapOn "Continue" → WARNED (not found)
Step #12: tapOn "numpad-0" → WARNED (not found)
Step #14: tapOn "consent-modal-no" → WARNED (not found)
Step #16: tapOn "numpad-0" → WARNED (not found)
Step #17: assertVisible "pin-numpad" → WARNED (not found)
Step #18: tapOn "close" → WARNED (not found)
Step #21: tapOn "numpad-0" → WARNED (not found)
Step #22: assertVisible "tab-ventas" → WARNED (not found)

💡 PROBABLE CAUSE
The element id="tab-ventas" is NOT on screen. The app may be on a different screen than expected.

📋 FULL STEP TRACE
⚠️ # 1 [WARNED ] 0ms tapOn id="numpad-0" [optional]
⚠️ # 2 [WARNED ] 0ms tapOn id="numpad-0" [optional]
⚠️ # 3 [WARNED ] 0ms tapOn id="consent-no" [optional]
⚠️ # 4 [WARNED ] 0ms tapOn text="A, Ana Operativa, Operativo" [optional]
✅ # 5 [COMPLETED] 3ms ['applyConfigurationCommand']
⚠️ # 6 [WARNED ] 0ms tapOn id="numpad-0" [optional]
✅ # 7 [COMPLETED] 12293ms runFlow
⚠️ # 8 [WARNED ] 0ms tapOn text="Continue" [optional]
✅ # 9 [COMPLETED] 7993ms runFlow
✅ #10 [COMPLETED] 0ms ['applyConfigurationCommand']
✅ #11 [COMPLETED] 1218ms ['waitForAnimationToEndCommand']
⚠️ #12 [WARNED ] 0ms tapOn id="numpad-0" [optional]
✅ #13 [COMPLETED] 1ms ['applyConfigurationCommand']
⚠️ #14 [WARNED ] 0ms tapOn id="consent-modal-no" [optional]
❌ #15 [FAILED ] 17117ms tapOn id="tab-ventas"
⚠️ #16 [WARNED ] 0ms tapOn id="numpad-0" [optional]
⚠️ #17 [WARNED ] 0ms assertVisible id="pin-numpad" [optional]
⚠️ #18 [WARNED ] 0ms tapOn text="close" [optional]
✅ #19 [COMPLETED] 2203ms launchApp
✅ #20 [COMPLETED] 4ms ['defineVariablesCommand']
⚠️ #21 [WARNED ] 0ms tapOn id="numpad-0" [optional]
⚠️ #22 [WARNED ] 0ms assertVisible id="tab-ventas" [optional]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
