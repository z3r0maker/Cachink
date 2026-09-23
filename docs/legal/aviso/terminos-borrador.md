# Términos y Condiciones — Xangarro (borrador L-05 para revisión legal)

> **Borrador v0.1, 2026-09-22. No es texto final ni asesoría legal.** Lo redactó un agente de
> ingeniería a partir de la ley, de los ADR del repositorio y de la auditoría
> `docs/audits/privacidad-2026-09-22.md` §8. **Reemplaza a `docs/legal/terms.md`** cuando el abogado
> lo apruebe: ese archivo describe la etapa Cachink (app local, "usa tu propia instancia de Supabase",
> sin suscripción) y ya no corresponde al producto (ADR-053, ADR-054).
> **Novedades respecto del texto anterior:** cobros recurrentes conforme al art. 76 Bis, fracciones
> VIII y IX de la LFPC (DOF 12-12-2025); cláusula del Asesor con inteligencia artificial y traslado de
> las políticas de uso del proveedor del modelo; anexo de encargado; términos mínimos de las tiendas
> de aplicaciones; límite de responsabilidad acorde a un servicio de nube de pago.
> Los `[CORCHETES]` son datos que faltan.

_Vigentes desde: [FECHA]. Versión: [VERSIÓN]._

---

## 1. Quién te presta el servicio

Xangarro es un servicio de **[RAZÓN SOCIAL]**, con domicilio en **[DOMICILIO]** y RFC **[RFC]**
("Xangarro", "nosotros"). Puedes escribirnos a **[CORREO SOPORTE]** o llamarnos al **[TELÉFONO]**
(LFPC art. 76 Bis III: estos datos se muestran también antes de contratar, en xangarro.mx).

## 2. Aceptación

Al crear una cuenta, vincular un dispositivo o usar Xangarro aceptas estos Términos y el
[Aviso de Privacidad](https://xangarro.mx/privacidad). Si no los aceptas, no uses el servicio.
Declaras que eres mayor de edad y que, si contratas en nombre de una empresa, tienes facultades para
obligarla. El servicio no está dirigido a menores de 18 años.

## 3. Qué es Xangarro y qué no es

Xangarro es una herramienta de control financiero y punto de venta ligero para negocios pequeños en
México: registra ventas, egresos, inventario, caja y cortes, y calcula reportes e indicadores.

Xangarro **no es**:

- **Un contador.** Los estados financieros se calculan bajo las NIF (B-2, B-3, B-6) como herramienta
  de apoyo y **no sustituyen a un contador público certificado**. El cálculo de ISR usa una tasa
  configurable y **no constituye asesoría fiscal**. Tu contador sigue siendo la fuente de verdad de
  tus obligaciones fiscales.
- **Un sistema de facturación.** Xangarro emite los CFDI **de tu suscripción**. Los comprobantes que
  generas para tus clientes son comprobantes simples, **no son CFDI ni facturación fiscal**.
- **Un ERP.** El alcance es deliberadamente pequeño.
- **Una entidad financiera.** Xangarro no otorga crédito, no capta ni custodia dinero, no evalúa tu
  capacidad de pago y no tramita solicitudes. Los cobros con tarjeta que llegues a habilitar los procesa
  el proveedor que tú contrates y el dinero va directo a tu cuenta.

Las decisiones de negocio que tomes con la información de Xangarro son tuyas.

## 4. Tu cuenta, tus dispositivos y tu equipo

- Eres responsable de tus credenciales y de lo que ocurra en tu cuenta. Avísanos de inmediato si
  sospechas un acceso no autorizado.
- Puedes vincular los dispositivos que tu plan permita y dar de alta a tu equipo (operadores) con su
  NIP. **Tú decides quién entra y con qué permisos, y tú respondes por su uso.**
- Respecto de los datos personales que tú capturas (tus clientes, tus operadores), **tú eres el
  responsable y Xangarro es el encargado**. Las reglas están en el **Anexo A**.
- Si desvinculas o revocas un dispositivo, los datos ya descargados pueden permanecer en él hasta que
  lo borres. Lo explicamos en el Aviso de Privacidad.

## 5. Uso permitido y prohibido

Puedes usar Xangarro para operar tu negocio, en tantos dispositivos como tu plan permita.

No puedes:

- Revender, redistribuir, arrendar o sublicenciar el servicio o el binario oficial, ni modificarlo,
  descompilarlo o hacer ingeniería inversa salvo en lo que la ley permita.
- Usarlo para actividades ilícitas, ni para registrar operaciones que sirvan a un delito.
- Intentar acceder a datos de otros negocios, saltarte los límites de tu plan, o probar la seguridad
  del servicio sin autorización escrita.
- Abusar de los servicios de envío (correo, comprobantes) para mandar comunicaciones no solicitadas.
- Automatizar el uso del servicio de forma que degrade el servicio de los demás.

## 6. El Asesor e inteligencia artificial

El Asesor detecta situaciones en tus registros y te las explica en palabras. **Las cifras las calcula
Xangarro**; un modelo de lenguaje de un tercero únicamente redacta el texto a partir de esas cifras.

- **Es orientación, no asesoría.** El Asesor **no es asesoría financiera, fiscal, contable ni legal**,
  no es una oferta de crédito y no sustituye el juicio de un profesional. **Tú tomas las decisiones.**
- **Puede equivocarse.** Un modelo de lenguaje puede producir texto impreciso. Verifica cualquier
  cifra contra tus reportes antes de actuar. Cada texto del Asesor lleva la etiqueta **"Generado con
  IA"** para que nunca lo confundas con un reporte.
- **Puedes apagarlo** en Configuración → Privacidad. Si lo apagas, no enviamos nada a ningún modelo.
- **Uso aceptable del modelo.** Al usar el Asesor te obligas a no emplearlo para los usos que prohíben
  las políticas de uso del proveedor del modelo (entre otros: generar contenido ilícito, engañoso o
  que dañe a terceros, o intentar extraer o manipular el modelo). Respondes por el uso que tú y tu
  equipo hagan de esta función. _[Revisión: verificar el traslado de obligaciones que exigen los
  términos comerciales del proveedor y de la tienda del modelo; ver auditoría §8.]_
- **Qué recibe el modelo** se describe en el Aviso de Privacidad §11. Tus datos **no se usan para
  entrenar** modelos.
- Podemos cambiar, limitar o retirar esta función, avisándote conforme a la sección 14.

## 7. Planes, precios y facturación

- Los planes, sus límites y sus precios están en **xangarro.mx**. Los precios se expresan en **pesos
  mexicanos más IVA**.
- Emitimos el **CFDI** de tu suscripción con los datos fiscales que registres. Si están incompletos o
  incorrectos, no podemos timbrar; corregirlos es tu responsabilidad.
- Si superas los límites de tu plan te lo avisamos y te proponemos un cambio de plan. **No bloqueamos
  tus ventas por exceder un límite.**
- Podemos cambiar los precios. Te avisaremos **al menos 30 días naturales antes** y, como el cargo
  recurrente que aceptaste tiene un monto determinado, **te pediremos aceptar expresamente el nuevo
  precio** antes de la primera renovación en que aplique. Si no lo aceptas, tu suscripción termina al
  cierre del periodo que ya pagaste, sin penalización.

## 8. Cobros recurrentes y renovación automática

Esta sección refleja el artículo 76 Bis, fracciones VIII y IX de la Ley Federal de Protección al
Consumidor.

- **Consentimiento expreso e informado.** Antes del primer cobro te informamos y aceptas: que el cargo
  es **recurrente**, su **periodicidad** (mensual o anual, según elijas), su **monto** y la **fecha**
  en que se cobrará.
- **Aviso previo a cada renovación.** Te avisaremos por correo **al menos cinco días hábiles antes**
  de cada renovación automática, indicando la fecha y el monto, **con un enlace para cancelar en un
  clic desde el propio correo**. **Puedes cancelar sin penalización** en ese plazo.
- **Cancelación inmediata.** Puedes cancelar **en cualquier momento** desde el portal, en
  **Configuración → Suscripción**, sin llamadas, sin trámites y sin tener que escribirnos. Cancelar
  nunca será más difícil que suscribirse.
- **Efecto de la cancelación.** Conservas el servicio hasta el final del periodo que ya pagaste; no se
  renueva después. Puedes exportar todos tus datos antes o después (sección 10).
- Si cambias de plan a media suscripción, el ajuste se calcula de forma proporcional.

## 9. Cancelación y reembolsos

- **Si contrataste en xangarro.mx (Stripe):** los periodos ya iniciados no son reembolsables, salvo
  cobro duplicado, error nuestro o cuando la ley lo exija. Escríbenos a **[CORREO SOPORTE]** y
  resolvemos.
- **Si contrataste dentro de la app (App Store o Google Play):** la cancelación y los reembolsos los
  gestiona **la tienda**, con sus propias reglas y plazos; nosotros no podemos procesarlos. Administra
  tu suscripción desde los ajustes de tu cuenta de Apple o de Google.
- Nada en esta sección limita los derechos que la Ley Federal de Protección al Consumidor te concede.

## 10. Tus datos

- **Son tuyos.** No los vendemos ni los rentamos. Cómo los tratamos está en el Aviso de Privacidad.
- **Puedes exportarlos** en cualquier momento (Excel y PDF) desde Ajustes, incluso después de
  cancelar, mientras tu cuenta exista.
- **Al cancelar** aplicamos los plazos de conservación y supresión del Aviso de Privacidad §7. Puedes
  pedir el borrado anticipado con los procedimientos de la sección 9 de ese aviso.
- **Respaldos.** Mantenemos respaldos del servicio, pero **te recomendamos exportar periódicamente**.
- **Contenido de tu negocio.** Nos autorizas únicamente a alojar, procesar y transmitir tu contenido
  para prestarte el servicio, y a usar datos **agregados o disociados** para operar y mejorar el
  producto. Nada más.

## 11. Disponibilidad y cambios al servicio

Xangarro funciona **también sin conexión** y sincroniza cuando vuelve la red. Aun así, el servicio en
la nube puede interrumpirse por mantenimiento, fallas o causas fuera de nuestro control.
**No ofrecemos un nivel de servicio garantizado (SLA)**, pero nos obligamos a esfuerzos razonables
para mantenerlo disponible, a avisarte de los mantenimientos programados y a que **la exportación de
tus datos esté siempre disponible**. Si el servicio en la nube queda inaccesible por causas
imputables a nosotros durante más de **[24] horas continuas** en un mes, te acreditaremos, a solicitud,
la parte proporcional de tu suscripción. Podemos agregar, cambiar o retirar funciones; si un cambio te
perjudica de forma relevante, te avisaremos conforme a la sección 14.

## 12. Propiedad intelectual

El software, la marca, el diseño y la documentación de Xangarro son nuestros o de nuestros
licenciantes. Estos Términos te dan un derecho de uso limitado, no exclusivo, revocable y no
transferible. Tu contenido sigue siendo tuyo. Las licencias de terceros están en
`THIRD_PARTY_LICENSES.md`.

## 13. Garantías y límite de responsabilidad

El servicio se presta **"tal cual"**, sin garantías implícitas más allá de las que la ley imponga y no
pueda excluirse.

No respondemos por: daños indirectos, incidentales o consecuenciales; lucro cesante; pérdida de datos
que hayas podido evitar exportando; ni por las decisiones de negocio o fiscales que tomes con base en
los reportes o en el Asesor.

**Nuestra responsabilidad total** por cualquier reclamación se limita al **monto que hayas pagado por
el servicio en los doce meses anteriores** al hecho que la origine.

**Este límite no aplica** a los daños causados por dolo o culpa grave, a los daños a la persona, al
incumplimiento de nuestras obligaciones en materia de datos personales, ni a ninguna responsabilidad
que la ley no permita limitar. Nada en esta sección te libera de responsabilidad por tu propio
incumplimiento ni traslada la nuestra a ti (LFPC art. 90).

## 14. Cambios a estos Términos

Podemos modificarlos por cambios legales, en el servicio o en nuestros proveedores. Te avisaremos por
correo y en el portal **antes de que entren en vigor**, señalando qué cambió. Si el cambio te
perjudica de forma relevante, puedes cancelar sin penalización antes de esa fecha. Las versiones
anteriores quedan publicadas en **xangarro.mx/terminos**.

## 15. Si instalaste la app desde una tienda

Estos Términos son un acuerdo **entre tú y Xangarro; las tiendas de aplicaciones no son parte**.
Si descargaste la app de App Store aplica además lo siguiente (términos mínimos de Apple):

- **Alcance de la licencia.** Puedes usar la app en los dispositivos Apple que poseas o controles,
  conforme a las Reglas de Uso de los Términos de Servicios Multimedia de Apple.
- **Mantenimiento, soporte y garantía.** Los da Xangarro; **Apple no tiene obligación alguna** de
  darlos. Si la app no cumple una garantía aplicable, puedes avisar a Apple, que te reembolsará el
  precio de compra (si lo hubo); fuera de eso, Apple no responde por garantías.
- **Reclamaciones.** Xangarro, no Apple, responde por cualquier reclamación tuya o de un tercero
  sobre la app, incluidas responsabilidad por producto, cumplimiento legal, protección al consumidor y
  privacidad, y por cualquier reclamación de que la app infringe propiedad intelectual de terceros.
- **Cumplimiento legal.** Declaras que no estás en un país sujeto a embargo del gobierno de EE. UU. ni
  en una lista de partes restringidas.
- **Datos de contacto:** [RAZÓN SOCIAL], [DOMICILIO], [CORREO SOPORTE], [TELÉFONO].
- **Terceros.** Debes cumplir los términos de terceros aplicables al usar la app.
- **Apple y sus filiales son terceros beneficiarios** de estos Términos y pueden hacerlos valer.

Si la descargaste de Google Play, aplican además los Términos de Servicio de Google Play.

## 16. Tu responsabilidad frente a terceros

Si un tercero nos reclama por el uso que tú o tu equipo hagan de Xangarro en contra de estos Términos
o de la ley —por ejemplo, por datos de tus clientes que capturaste sin derecho, por comunicaciones que
enviaste sin consentimiento, o por contenido ilícito— responderás por esa reclamación y por los gastos
razonables que nos cause, salvo en la parte que sea atribuible a nosotros.

## 17. Fuerza mayor

Ninguna de las partes responde por incumplimientos causados por hechos fuera de su control razonable
(desastres naturales, fallas generalizadas de internet o energía, actos de autoridad, ataques
informáticos de gran escala). Xangarro hará esfuerzos razonables para restablecer el servicio y tus
datos seguirán exportables en cuanto sea posible.

## 18. Programa beta

Si te invitamos a probar una versión beta o una función marcada como "prueba", entiendes que puede
contener errores, cambiar o retirarse sin previo aviso y que no está cubierta por el crédito de la
sección 11. Te recomendamos exportar tus datos con mayor frecuencia mientras participes.

## 19. Disposiciones generales

- **Comunicaciones.** Aceptas recibir avisos del servicio por correo electrónico y en el portal; los
  avisos legales se tendrán por recibidos al enviarse a la dirección de tu cuenta.
- **Cesión.** No puedes ceder estos Términos sin nuestro consentimiento. Podemos cederlos a quien
  adquiera el negocio de Xangarro, avisándote, bajo las mismas políticas.
- **Divisibilidad.** Si una cláusula resulta inválida, las demás siguen vigentes.
- **Acuerdo completo.** Estos Términos, el Aviso de Privacidad y el Anexo A son el acuerdo completo
  entre tú y Xangarro sobre el servicio.
- **Idioma.** La versión en español prevalece.

## 20. Ley aplicable, consumidor y jurisdicción

Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos. Nada en ellos limita tus
derechos como consumidor ni tu derecho de acudir a la **Procuraduría Federal del Consumidor
(PROFECO)**. Para lo demás, las partes se someten a los tribunales competentes de **Guadalajara,
Jalisco**.
No incluimos cláusula arbitral: cualquier controversia puede llevarse a la PROFECO (conciliación o
arbitraje **voluntarios**) o a los tribunales.

## 21. Contacto

**[CORREO SOPORTE]** · Privacidad y derechos ARCO: **[CORREO PRIVACIDAD]**

---

## Anexo A — Tratamiento de datos personales (Xangarro como encargado)

Cuando capturas datos de tus clientes o de tu equipo, **tú eres el responsable** y Xangarro es el
**encargado**. Las obligaciones de ambas partes —instrucciones, confidencialidad, subencargados,
seguridad, vulneraciones, atención de solicitudes ARCO y devolución o supresión al terminar— están en
el anexo `encargado-clausulas.md`, que forma parte de estos Términos.

---

## Preguntas abiertas para el abogado

Las OQ-T1 a T8 tienen **respuesta propuesta y ya aplicada en este texto** en
`respuestas-oq-borrador.md` §B; el abogado confirma o corrige. Resumen:

- **OQ-T1.** Tope de responsabilidad con salvedades (§13) — y si el dueño persona física es
  "consumidor" para todos los efectos (OQ-N1).
- **OQ-T2.** Registro en PROFECO: no obligatorio para SaaS según la lista NOM; verificar en RCAL.
- **OQ-T3.** Cambio de precio: 30 días + aceptación expresa (§7).
- **OQ-T4.** Cancelación de un clic en el correo de renovación (§8).
- **OQ-T5.** Cláusula del Asesor + etiqueta "Generado con IA" (§6).
- **OQ-T6.** Sin SLA garantizado, con crédito proporcional (§11).
- **OQ-T7.** Diez términos mínimos de Apple (§15).
- **OQ-T8.** Sin cláusula arbitral (§20).
