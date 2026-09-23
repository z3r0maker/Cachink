# Respuestas propuestas a las preguntas abiertas (borrador para el abogado)

> **Borrador v0.1, 2026-09-22. No es asesoría legal.** Cada respuesta es una _propuesta de posición_
> redactada por un agente de ingeniería a partir del texto de la ley y del Reglamento, verificados el
> 2026-09-22, para que el abogado la confirme, corrija o descarte con menos trabajo. Cubre las OQ-L1
> a L16 del `README.md` y las OQ-T1 a T8 de `terminos-borrador.md`. **Confianza:** alta = texto legal
> explícito; media = interpretación razonable; baja = criterio que solo un abogado puede fijar.
> Fuentes: LFPDPPP (DOF 20-03-2025, últ. ref. 14-11-2025), Reglamento LFPDPPP (DOF 21-12-2011,
> "texto vigente" en diputados.gob.mx), LFPC (art. 76 Bis ref. DOF 12-12-2025), LFPA art. 28, CCom
> art. 1047, CCF art. 1159, CFF art. 30, y las fuentes secundarias listadas en
> `docs/audits/privacidad-2026-09-22.md`.

## 0. Estado al 2026-09-22 — qué le pedimos al abogado

**Revisar tres borradores** (`aviso-integral.md`, `aviso-simplificado.md`, `terminos-borrador.md`) y
**confirmar o corregir cinco posiciones** que requieren criterio jurídico y no más investigación:

| #   | Pregunta                                                                                                                                                                              | Por qué sólo el abogado                                                         | Dónde        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------ |
| 1   | ¿El esquema "medio publicitario + contacto iniciado por el usuario" queda fuera de "promover u ofrecer" del aviso CNBV? ¿Cambia si el pago es por crédito colocado y no por contacto? | Es la única posición con exposición regulatoria (CNBV/CONDUSEF), no sólo civil. | OQ-N2        |
| 2   | ¿Es válido fundar el anexo de encargado en el Reglamento de 2011 mientras no se expida el nuevo?                                                                                      | Supletoriedad de un reglamento de una ley abrogada.                             | OQ-L1        |
| 3   | ¿Qué hace Xangarro como encargado cuando el negocio ignora una solicitud ARCO de su cliente?                                                                                          | Sin texto legal directo; confianza baja.                                        | OQ-L10       |
| 4   | Tope de responsabilidad a 12 meses con las salvedades redactadas: ¿resiste el art. 90 II–III de la LFPC? ¿El dueño persona física es "consumidor" para todos los efectos (art. 2 I)?  | Cláusula típica de litigio.                                                     | OQ-T1, OQ-N1 |
| 5   | Plazos propuestos de bloqueo y retención (10 años para lo mínimo defensivo; 2 años soporte y ARCO; 12 meses bitácoras).                                                               | Fijar un número es criterio, no lectura de ley.                                 | OQ-L13       |

**Todo lo demás** tiene respuesta propuesta con confianza media-alta o alta (secciones A y B) o quedó
**decidido por el dueño** (OQ-N3 sello NOM-151; OQ-N4 sin eliminación de cuenta en la app; OQ-N5
proveedores por categoría y domicilio convencional; SOFOM propia descartada como oferente). El abogado
puede discrepar de cualquiera, pero no necesita generarla.

**Fuera del alcance de estas preguntas** (otro profesional o el dueño): constitución de la persona moral
(D-6), búsqueda y registro de marca ante el IMPI (agente de PI), estructura fiscal, y — sólo si algún
día se custodian fondos — Ley Fintech.

## A. Aviso de privacidad y ARCO (OQ-L)

| OQ  | Respuesta propuesta                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Fundamento                                                            | Conf.      | Cambio en los textos                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| L1  | **Fundar el anexo de encargado en el Reglamento de 2011 (arts. 49–53) de forma supletoria** mientras no se expida el nuevo. El transitorio Décimo Segundo (90 días) venció sin reglamento; diputados.gob.mx sigue publicando el de 2011 como "texto vigente" y ninguna fuente lo da por abrogado. La Ley vigente **no** convierte al encargado en responsable por serlo: sólo lo es si desvía la finalidad o transfiere sin instrucción (Reglamento art. 53, mismo criterio que la Ley art. 2 XX al excluir al encargado de "transferencia").                                                                                                                                   | Reg. arts. 49, 50 I–VI, 51, 53; Ley art. 2 XII y XX; transitorio 12.° | media      | Preámbulo del anexo: citar el Reglamento expresamente y prever que se ajustará al nuevo cuando se publique. |
| L2  | Xangarro es **responsable de todo dato que se refiera al dueño**, incluidos sus registros cuando es persona física (ya están en §3 como "Registros del negocio"), porque Xangarro decide fines y medios (almacenar, calcular, Asesor). Es **encargado sólo de los datos de terceros** que el negocio captura (clientes, operadores). No hay contradicción: el mismo registro puede ser dato del dueño (responsable) y contener un dato del cliente (encargado).                                                                                                                                                                                                                 | Ley art. 2 XIV y XVI; Reg. art. 49                                    | alta       | Ninguno: es la estructura actual. Quitar la nota de §2.                                                     |
| L3  | **Conservar la variante C.** Informa al operador quién es su responsable; cuesta una línea y reduce la probabilidad de que un operador dirija su queja a Xangarro.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Ley art. 17 (deber del responsable, que es el negocio); anexo cl. 6   | alta       | Ninguno.                                                                                                    |
| L4  | **El archivo de 6 años no es bloqueo y no debe llamarse así.** Es una finalidad declarada (4.1.10) al servicio del dueño. El Reglamento art. 37 permite fijar plazos de conservación atendiendo "aspectos administrativos, contables, fiscales, jurídicos". Propuesta: (a) renombrar en ADR-064 y en §7 ("archivo de recuperación"); (b) **alinear el plazo a 5 años** del CFF art. 30 en vez de 6, salvo razón documentada; (c) mantenerla como finalidad necesaria porque sirve a "Restaurar mis datos", y ofrecer "Borrar mi archivo ahora". Reservar "bloqueo" para lo que Xangarro conserva por responsabilidad propia (L13).                                              | Ley art. 2 III, 10; Reg. arts. 37–39; CFF 30                          | media      | §7 tabla fila 2; ADR-064; N-48.                                                                             |
| L5  | **Mantener la casilla expresa.** El Reglamento art. 15 II exige expreso para financieros/patrimoniales y el art. 15 IV permite al responsable exigirlo "para acreditar el mismo". El art. 9 IV de la Ley exceptúa lo necesario para la relación jurídica, pero acreditar el expreso cuesta una casilla y vale en cualquier inspección. **Analítica:** si es disociada, no requiere consentimiento (Ley art. 9 III) → **eliminar la tercera casilla** y comprometerse en 4.2 b) a que sea sólo disociada/agregada.                                                                                                                                                               | Ley arts. 7 ¶5, 9 III y IV; Reg. arts. 15–16                          | alta       | Simplificado A: quitar casilla 3. Integral 4.2 b): "siempre" en lugar de "siempre que sea posible".         |
| L6  | **Los Lineamientos de 2013 se emitieron bajo la ley abrogada y no tienen sustento formal en la Ley de 2025**; no hay abrogación expresa ni pronunciamiento de la Secretaría. Tratarlos como **buena práctica no vinculante**: conservar el aviso en capas y la sección de cookies; conservar los 5 días para negarse a finalidades secundarias **sin citarlos como ley**.                                                                                                                                                                                                                                                                                                       | DOF 17-01-2013; Ley 2025 transitorio 2.°                              | media      | 4.2: quitar la nota; dejar "5 días hábiles" como cortesía.                                                  |
| L7  | **Basta declararlo.** El art. 35 pide una cláusula sobre si el titular acepta la transferencia; si no hay transferencias sujetas a consentimiento, la cláusula dice que no las hay y que se pedirá antes de hacer una. **SAT:** el PAC es **encargado** (timbra por cuenta de Xangarro); el SAT recibe el CFDI por obligación legal de Xangarro (art. 36 I).                                                                                                                                                                                                                                                                                                                    | Ley arts. 35, 36 I; CFF 29                                            | alta       | Ninguno; quitar la nota de §6.2.                                                                            |
| L8  | **Compatible si es disociación real.** Un dato disociado no es dato personal (Ley art. 2, definición de disociación) y por tanto la prohibición del Reg. art. 50 II no lo alcanza. Condición: agregados sin `business_id` a nivel fila, o con k-anonimato mínimo.                                                                                                                                                                                                                                                                                                                                                                                                               | Ley art. 2 (disociación), 9 III; Reg. 50 II                           | media-alta | Anexo 3.4: definir "disociado" y prohibir re-identificación.                                                |
| L9  | **Stripe** es encargado de Xangarro para procesar el cobro **y** responsable propio para su KYC, prevención de fraude y obligaciones regulatorias (lo dice su propio aviso). **Mercado Pago / Clip** contratan directo con el negocio: son encargados (o responsables propios) **del negocio**, no de Xangarro; Xangarro sólo enruta la operación y no debe recibir datos de tarjeta.                                                                                                                                                                                                                                                                                           | Reg. arts. 49, 53; avisos de privacidad de Stripe/MP/Clip             | media      | §6.1: nota en las filas de Stripe y MP/Clip. Anexo cl. 7: MP/Clip como subencargados **del negocio**.       |
| L10 | Xangarro **no sustituye al negocio** (Reg. art. 50 I: sólo instrucciones) pero tampoco puede ignorar al titular (Ley art. 13: el responsable debe lograr que sus terceros respeten el aviso). Propuesta operativa: remitir en 5 días, recordar al negocio a los 10, y si a los 20 no hay respuesta, **informar por escrito al titular quién es el responsable, sus datos de contacto y su derecho ante la Secretaría** (art. 40), sin ejecutar nada por cuenta propia.                                                                                                                                                                                                          | Ley arts. 13, 40; Reg. art. 50 I                                      | baja       | Anexo cl. 8 y procedimiento ARCO B.6.                                                                       |
| L11 | El art. 10 ¶3 alcanza los datos de **incumplimiento del dueño con Xangarro** (`past_due`, cobros fallidos): **suprimir o disociar a los 72 meses**. Los **saldos vencidos de los clientes del negocio** son datos de los que el negocio es responsable; la obligación es suya, pero Xangarro como encargado debe **darle la herramienta**: aviso y depuración opcional de cuentas por cobrar con más de 72 meses.                                                                                                                                                                                                                                                               | Ley art. 10 ¶3; Reg. art. 50 I                                        | media      | §7 fila 4 (ya está); anexo cl. 9; tarea de producto.                                                        |
| L12 | **Usar el calendario del art. 28 de la LFPA** (la Ley remite a ella supletoriamente, art. 4): inhábiles sábados, domingos, 1 ene, 5 feb, 21 mar, 1 y 5 may, 1 y 16 sep, 20 nov, 1 dic cada seis años, 25 dic; **sin** las vacaciones de la autoridad, que no aplican a un particular. No usar el art. 74 de la LFT (lista distinta: lunes móviles, sin 5 de mayo). Implementar como tabla configurable con pruebas.                                                                                                                                                                                                                                                             | Ley art. 4; LFPA art. 28                                              | media-alta | ARCO B.2; tabla `dias_inhabiles`.                                                                           |
| L13 | **Periodo de bloqueo = prescripción de las acciones** de la relación jurídica (Ley art. 24). Ordinaria mercantil **10 años** (CCom 1047); civil **10 años** (CCF 1159); consumidor frente a proveedor **1 año** (LFPC art. 14). Propuesta: bloquear **sólo el mínimo para defender reclamaciones** (identidad, aceptación de términos y versión, historial de pagos, CFDI) **10 años**; el resto se suprime. Plazos sin definir: soporte **2 años** tras cierre; expediente ARCO **2 años**; bitácoras de seguridad **12 meses**; identificaciones adjuntas **supresión al resolver** (máx. 30 días); respaldos según retención contratada (**Supabase PITR: verificar días**). | Ley arts. 10, 24; CCom 1047; CCF 1159; LFPC 14; Reg. 37–39            | media      | §7: llenar `[PLAZO]` y `[N]`; calendario de retención (auditoría PRIV-OPS-01).                              |
| L14 | **72 h al negocio es razonable y defendible.** La Ley dice "de forma inmediata" (art. 19) y el Reglamento "en cuanto confirme… y sin dilación alguna" (art. 64); ninguno fija número. **No hay obligación de notificar a la Secretaría** en la Ley para particulares (a diferencia del sector público). Contenido mínimo al titular: Reg. art. 65 I–V.                                                                                                                                                                                                                                                                                                                          | Ley art. 19; Reg. arts. 64–66                                         | media-alta | Protocolo de vulneraciones: incorporar art. 65 como lista de campos; anexo cl. 10 se mantiene.              |
| L15 | **Válido.** La revocación no tiene efectos retroactivos (art. 7 ¶6) y si el dato es indispensable, el servicio no puede continuar; debe decirse en el aviso (ya se dice, §5) y ejecutarse como cancelación con exportación previa.                                                                                                                                                                                                                                                                                                                                                                                                                                              | Ley art. 7 ¶6, 9 IV                                                   | alta       | Ninguno.                                                                                                    |
| L16 | **Ofrecer la plantilla**, marcada como modelo que el negocio adapta y adopta **como responsable propio**, con descargo. El riesgo de responsabilidad para Xangarro es bajo si no se presenta como asesoría; el riesgo de **no** ofrecerla (miles de negocios sin aviso, quejas que llegan a Xangarro) es mayor.                                                                                                                                                                                                                                                                                                                                                                 | Ley arts. 13, 17                                                      | media      | Nueva `plantilla-aviso-negocio.md`; anexo cl. 6.                                                            |

## B. Términos y Condiciones (OQ-T)

| OQ  | Respuesta propuesta                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Fundamento                                            | Conf. | Cambio en los textos                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- | ----- | ------------------------------------------------------ |
| T1  | **El tope de responsabilidad se conserva con salvedades.** El art. 90 II declara no puestas las cláusulas que "liberen" al proveedor de responsabilidad civil, y la III las que la trasladen al consumidor. Un tope no es liberación total, pero para blindarlo: excluir del tope **dolo, culpa grave, daños a la persona, incumplimiento de la ley de datos personales** y cualquier responsabilidad que la ley no permita limitar; conservar "en la máxima medida permitida". **Punto previo para el abogado:** si un dueño persona física con actividad empresarial es "consumidor" (LFPC art. 2 I: quien integra el servicio a su actividad sólo lo es para los arts. 99 y 117). Recomendación: cumplir la LFPC íntegra de todas formas — cuesta poco y evita el litigio sobre la calidad de consumidor. | LFPC arts. 2 I, 90 II, III, VI                        | media | §13 del borrador: carve-outs (aplicado).               |
| T2  | **Registro no obligatorio para software/suscripciones digitales:** la lista de registro obligatorio del RCAL la fijan NOM sectoriales (tintorerías, talleres, eventos, tiempos compartidos, funerarias, etc.) y ninguna cubre SaaS. Existe **registro voluntario** (RPCA). Propuesta: no registrar en lanzamiento; considerar el voluntario al estabilizar el texto, por credibilidad. **Verificar** la lista vigente en `rcal.profeco.gob.mx/ContratosObligatorios.jsp` antes de cerrar.                                                                                                                                                                                                                                                                                                                    | LFPC arts. 85–87; RCAL                                | media | §20 del borrador: nota eliminada.                      |
| T3  | La LFPC no fija días para un cambio de precio en suscripción. Como el 76 Bis VIII exige consentimiento expreso e informado **del monto** del cargo recurrente, un aumento no puede ampararse en el consentimiento anterior: **aviso de 30 días naturales + aceptación expresa antes de la primera renovación con el nuevo precio**; sin aceptación, la suscripción termina al cierre del periodo pagado (sin penalización).                                                                                                                                                                                                                                                                                                                                                                                  | LFPC art. 76 Bis VIII, IX                             | media | §7 del borrador (aplicado).                            |
| T4  | **Sí: enlace de cancelación de un clic en el propio correo** de aviso de renovación (5 días hábiles). Cumple "cancelación inmediata" sin discusión y evita que el aviso sea impugnado por hacer difícil cancelar.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | LFPC art. 76 Bis IX                                   | alta  | §8 del borrador; tarea de producto (correo con token). |
| T5  | **Exigible.** Las restricciones de uso de una función no son cláusulas abusivas (no liberan de responsabilidad ni trasladan la del proveedor). Para el traslado que exigen los términos comerciales del proveedor del modelo basta la obligación de cumplir sus políticas + la responsabilidad del usuario por su uso. Añadir **etiqueta visible "Generado con IA"** en cada texto del Asesor (requisito del proveedor para usos financieros de cara al consumidor).                                                                                                                                                                                                                                                                                                                                         | LFPC art. 90; términos comerciales del proveedor      | media | §6 del borrador (etiqueta añadida); tarea de UI.       |
| T6  | **Declarar que no hay SLA garantizado**, pero no disclaimar toda responsabilidad por caídas (art. 90 II). Punto medio defendible: "esfuerzos razonables" + exportación siempre disponible + **crédito proporcional a solicitud** si el servicio en nube está inaccesible más de [24] h continuas en un mes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | LFPC art. 90 II                                       | media | §11 del borrador (aplicado).                           |
| T7  | Los términos mínimos de Apple son **diez**: reconocimiento (contrato con el desarrollador, no con Apple); alcance de la licencia (dispositivos que el usuario posee o controla); mantenimiento y soporte; garantía; reclamaciones del producto (incluidas responsabilidad por producto, cumplimiento legal y protección al consumidor/privacidad); reclamaciones de propiedad intelectual; cumplimiento legal (embargos/exportación); nombre y domicilio del desarrollador; términos de terceros; y **Apple como tercero beneficiario**. El borrador cubría cinco; se completan los diez.                                                                                                                                                                                                                    | apple.com/legal/internet-services/itunes/dev/minterms | alta  | §15 del borrador (aplicado).                           |
| T8  | **No incluir cláusula arbitral obligatoria.** El art. 90 VI anula las cláusulas que obligan al consumidor a renunciar a la protección de la LFPC o a someterse a tribunales extranjeros; una cláusula arbitral forzosa en contrato de adhesión está en riesgo y no aporta nada frente a un usuario mexicano. Mantener tribunales de Guadalajara + acceso a PROFECO (conciliación y arbitraje **voluntarios**, arts. 111–122).                                                                                                                                                                                                                                                                                                                                                                                | LFPC arts. 90 VI, 111–122                             | alta  | §16 del borrador (aplicado).                           |

## C. Preguntas nuevas que surgieron de esta pasada

- **OQ-N1 — Consumidor o no.** ¿El dueño persona física con actividad empresarial que usa Xangarro
  como herramienta de su negocio es "consumidor" (LFPC art. 2 I) para todos los efectos, o sólo para
  los arts. 99 y 117? Cambia si el 76 Bis VIII–IX es exigible o sólo buena práctica. (Propuesta: cumplir
  íntegro de todas formas.)
- **OQ-N2 — Referencia de crédito. DIFERIDA por el dueño (2026-09-22): no se incluye en el aviso v1.**
  Cuando se active será una finalidad nueva (art. 11) que se recabará con un aviso actualizado y una
  compuerta de consentimiento en la app; como el modelo elegido no usa registros financieros (sólo giro,
  antigüedad y datos de contacto a petición del usuario), el costo de diferirla es bajo. El análisis
  siguiente queda como referencia para ese momento.
  **Patrón para activarla después — "adenda en la app" (2026-09-22).** Legal y es el mecanismo del
  art. 11. Regla de oro: **perfilar después del consentimiento, nunca antes.**
  - _Etapa 0 (v1):_ nada de crédito; 4.2 a) ya cubre avisar de funciones nuevas.
  - _Etapa 1 (invitación):_ "Estamos explorando opciones de financiamiento de entidades autorizadas
    para negocios como el tuyo, ¿te interesa?" — mensaje de producto bajo 4.2 a), a todos o segmentado
    **sólo por giro, antigüedad o plan** (no patrimoniales). Nunca "te pre-aprobamos".
  - _Etapa 2 (adenda = "revísalo por mí"):_ la invitación se formula como pregunta al Asesor —
    "¿Quieres que el Asesor revise si un financiamiento te convendría?" — y el toque afirmativo es el
    consentimiento expreso (art. 7 ¶5) para analizar los registros **con ese fin**. Evaluación pedida
    por el titular: fuera del supuesto del art. 26 II (evaluación sin intervención humana no deseada).
    **El filtrado ocurre aquí, sólo sobre quienes aceptaron:** negocio sano → ofertas de entidades
    autorizadas y, si el usuario elige una, envío de datos de contacto a esa entidad (art. 35,
    nombrada); meses en números rojos → **ningún crédito**: "ahora no te conviene; primero esto" con el
    consejo del Asesor, y la entidad nunca se entera. Así no se ofrece crédito a quien no debe recibirlo
    (razón comercial y de lealtad, art. 6) sin perfilar antes del consentimiento. Revocable en
    Configuración → Privacidad; asentado en el libro con el hash de la adenda.
  - _Zona gris para el abogado:_ segmentar la **invitación** (no la evaluación) por antigüedad o plan
    de pago es dato de uso, no patrimonial, y un proxy débil de salud; defendible, confirmar.
  - Ingeniería: `privacy_consents.purpose` admite `addendum:<feature>`; la adenda tiene su propio texto
    versionado en `consent_versions`.
  - Sigue aplicando OQ-N2 regulatorio: medio, no oferente.
  - **Cómo se prueba que el perfilado fue después y no antes.** Nadie puede saberlo desde fuera; el
    principio de responsabilidad (art. 5) obliga a Xangarro a demostrarlo. Se pregunta por tres vías:
    una solicitud de acceso (art. 21: "¿por qué me mostraron esto?"), el texto de la invitación (si dice
    algo que sólo los registros podrían saber, es confesión) y una verificación o queja. Por eso se hace
    **demostrable por construcción**, como los contadores geográficos: (1) el servicio que arma la
    audiencia usa un rol con SELECT sólo sobre `businesses(id, giro, created_at, plan)` — la lista de
    grants es la prueba; (2) cada lote de invitaciones registra criterio (regla legible + hash de la
    consulta), tamaño y fecha; (3) el libro de consentimientos guarda `prompt_shown_at` con el id de
    campaña y `addendum_accepted_at`, y cualquier análisis de registros se ejecuta sólo sobre filas
    posteriores a la segunda; el sello diario NOM-151 hace la cronología inalterable. Si hay duda,
    **invitar a todos** y dejar que el filtrado ocurra tras el "sí": cero segmentación previa es
    no-perfilado indiscutible, y nadie en números rojos ve una oferta.
    (Análisis original:) El modelo **no**
    es calificar ni pre-aprobar a nadie: Xangarro quiere **conectar a usuarios interesados con entidades
    financieras autorizadas**, sin score, sin custodia de fondos y sin tramitar solicitudes. Lectura
    propuesta:
  - **Comisionista no es la figura.** El régimen de comisionistas (LIC art. 46 Bis 1 y CUB) existe
    para que un tercero realice **operaciones del art. 46** por cuenta del banco (captación, pagos,
    retiros, apertura). Entregar un contacto que el propio usuario pidió no es una operación bancaria.
  - **El riesgo real es la palabra "promover".** El aviso de la CNBV alcanza a quien "directa o
    indirectamente promueva, ofrezca y/o preste" servicios financieros. La distinción operativa que
    sostiene a los comparadores y plataformas de contactos del mercado es **medio vs. oferente**: si la
    oferta es de la entidad, con su identidad, su CAT y sus leyendas (LTOSF), y el usuario **inicia** el
    contacto, Xangarro es el medio publicitario y quien promueve es la entidad. Si Xangarro evalúa
    ("podrías calificar"), tramita o presenta el crédito como propio, deja de ser medio.
  - **Estructura recomendada ("espacio de terceros + contacto iniciado por el usuario"):**
    1. Sección "Servicios financieros de terceros", visible sólo si el usuario activó la finalidad
       4.2 d); cada oferta lleva la **razón social de la entidad, su registro (CNBV o SIPRES/CONDUSEF),
       el CAT y sus leyendas legales**, y la nota "Oferta de [Entidad]; Xangarro no otorga crédito y
       **puede recibir** una contraprestación de la entidad" ("puede" es verdad hoy sin cobro y mañana
       con cobro: la contraprestación no es una finalidad del art. 11, así que empezar a cobrar no
       exige re-consentimiento ni nueva versión del aviso).
    2. El usuario toca "Quiero que [Entidad] me contacte" → pantalla de consentimiento que **nombra a
       la entidad** (LFPDPPP art. 35) → Xangarro envía **sólo nombre, teléfono/correo y nombre del
       negocio**. Nunca ventas, gastos, estados financieros ni una opinión de elegibilidad.
    3. La entidad tramita, evalúa y decide con sus propios medios (y con la autorización de buró que
       ella misma recabe).
    4. Contrato con la entidad como **prestación de servicios de publicidad y generación de
       contactos** (no comisión mercantil): la entidad declara estar autorizada/registrada, asume la
       responsabilidad de su oferta y de su publicidad conforme a LTOSF y CONDUSEF, se obliga a no
       usar los datos para otro fin (transferencia con finalidad acotada) y **indemniza** a Xangarro.
       Sólo entidades verificables en el padrón de la CNBV o en SIPRES; nunca un prestamista sin
       registro — ahí el aviso de la CNBV sí muerde, y de paso la reputación.
  - **Segmentación.** Elegir _quién ve_ la sección usando ingresos o movimientos es perfilamiento
    financiero (LFPDPPP art. 26 II) y se acerca a la "pre-calificación" que hay que evitar. Segmentar
    por **giro y antigüedad del negocio** basta y no toca datos patrimoniales. Si algún día se quiere
    más, es una decisión nueva con consentimiento nuevo (art. 11).
  - **¿Es legal cobrarle a una SOFOM por conectar? Sí.** Vender publicidad o contactos a una entidad
    financiera es un contrato mercantil ordinario y no requiere licencia; las SOFOM usan canales de
    originación de terceros de forma habitual. Lo regulado es lo que se hace, no el cobro: la SOFOM
    conserva LTOSF (publicidad, CAT), su contrato de adhesión en el RECA de CONDUSEF, KYC/PLD (LGOAAC
    art. 95 Bis) y la autorización de buró; Xangarro no toca fondos ni tramita. Verificar a la SOFOM
    en SIPRES antes de publicar la oferta. Pago **por contacto** se defiende como publicidad; pago
    **por crédito colocado** acerca a Xangarro a la originación — ambos legales, el primero más simple.
  - **SOFOM propia — decisión del dueño (2026-09-22): descartada como oferente con acceso a los
    registros.** Si algún día existe, entra al mismo espacio **como una entidad más**: oferta propia,
    registro en SIPRES, CAT, contacto iniciado por el usuario y sólo datos de contacto; la tarjeta de la
    oferta debe declarar que la entidad **pertenece al grupo de Xangarro**. Bajo ese modelo no se usa el
    art. 36 III ni se necesita finalidad adicional. Lo que queda cerrado, deliberadamente, es usar los
    registros del negocio para evaluar crédito (sería finalidad nueva, art. 11, sobre datos financieros,
    art. 7 ¶5, con consentimiento expreso nuevo por dueño). No se añade una finalidad 4.2 e).
  - **Para el abogado:** (a) confirmar que el esquema medio + contacto iniciado por el usuario queda
    fuera de "promover u ofrecer" del aviso CNBV; (b) si la contraprestación por _crédito colocado_ (y
    no por contacto) cambia esa lectura; (c) si conviene notificar a la entidad que Xangarro no actúa
    como comisionista para que no lo reporte como tal a la CNBV. **Confianza: media.**
- **OQ-N3 — NOM-151: decidido por el dueño (2026-09-22): SÍ.** Dos capas, y son distintas:
  1. **Firma del usuario = firma electrónica simple** (CCom art. 89: datos electrónicos que identifican
     al firmante e indican su aprobación). Registrar por evento: usuario, superficie, versión y
     **SHA-256 del texto exacto** aceptado, casillas marcadas, fecha-hora, IP y agente de usuario. No
     hace falta e.firma ni un PSC para esto.
  2. **Integridad del registro = constancia NOM-151-SCFI-2016** emitida por un PSC acreditado ante la
     Secretaría de Economía. Para que cueste centavos: **encadenar por hash el libro de consentimientos y
     sellar una vez al día** la raíz del día (una constancia diaria, no una por usuario). Alternativa
     mínima: sello de tiempo RFC 3161; valor probatorio menor. Archivar el **texto íntegro de cada
     versión** del aviso y de los términos: un hash sin su texto no prueba nada.
     Para el abogado: confirmar que la constancia diaria sobre la raíz (y no sobre cada evento) conserva la
     presunción de integridad para cada registro individual.
- **OQ-N4 — Eliminación de cuenta en la app: NO aplica a la app móvil (corregido 2026-09-22).**
  Apple 5.1.1(v) y la política de Google Play se activan sólo cuando la app **permite crear una
  cuenta dentro de la app**. La app de Xangarro no crea cuentas: se **vincula un dispositivo** con un
  código y el operador entra con un **NIP que le asignó el dueño**; nadie provisiona usuario ni
  contraseña desde el teléfono. La cuenta existe únicamente en el portal web (el dueño). Por tanto la
  app no está obligada a ofrecer "eliminar cuenta". Cuatro cosas siguen siendo ciertas:
  1. **En el portal web sí hace falta** eliminar la cuenta en autoservicio (LFPDPPP arts. 21–24 y
     LFPC 76 Bis IX), y la política de Play pide además un enlace web si algún día la app crea cuentas.
     Es PRIV-OPS-01, sin cambio.
  2. **En la app hace falta "Desvincular y borrar los datos de este dispositivo"**: el aviso §7 hoy
     dice que desvincular no borra lo local (SEC-MOB-02). No es una exigencia de las tiendas, es de la
     Ley (cancelación) y de sentido común en un dispositivo compartido.
  3. **Nunca añadir "Iniciar sesión con Apple/Google" a la app**: Apple trata ese inicio de sesión como
     creación de cuenta y activaría 5.1.1(v) de inmediato.
  4. **Notas para el revisor** en App Store Connect y Play: explicar el modelo (dispositivo + NIP, sin
     cuentas; el dueño administra y elimina desde el portal; dónde está el borrado local). Los
     revisores ven una pantalla de NIP y preguntan; la respuesta preparada evita un rechazo por
     literalidad. En el formulario Data Safety declarar el identificador de dispositivo y el mecanismo
     de borrado vía el dueño/portal.
- **OQ-N5 — Domicilio y proveedores (decidido 2026-09-22).** El domicilio es obligatorio (art. 15 I;
  LFPC 76 Bis III) pero puede ser **convencional** (oficina registrada o virtual). Los encargados **no**
  tienen que nombrarse en el aviso (art. 15 no lo pide; Reg. art. 53 exime de informar remisiones): el
  aviso público los describe **por categoría y país**; la lista nominal va en el Anexo a los negocios y
  se entrega a solicitud. Los datos tratados se describen **por categoría con ejemplos** (art. 15 II) y
  lo que viaja al modelo como categorías más una **lista negativa**, para que un cambio de campos no
  obligue a una nueva versión. Confirmar.
- **OQ-N6 — Cambios al aviso y a los términos.** Legales y previstos: el aviso debe decir cómo se
  comunican (art. 15 VI); una **finalidad nueva** exige consentimiento nuevo (art. 11); lo demás corre
  con aviso previo (art. 7, tácito). Versiones públicas con fecha y hash; compuerta de re-consentimiento
  sólo cuando cambia una finalidad o una transferencia sujeta a consentimiento. Para los términos, LFPC
  art. 90 I anula la modificación unilateral: aviso previo + derecho a cancelar sin penalización (§14 del
  borrador), no "seguir usando equivale a aceptar".
- **OQ-N7 — Casillas premarcadas (decidido 2026-09-22).** Regla general: consentimiento **tácito**
  válido (art. 7 ¶3–4) → las finalidades secundarias (novedades) pueden ir **marcadas por defecto** o
  en negativo, con baja fácil y los 5 días para negarse. Excepción: datos **financieros/patrimoniales**
  exigen consentimiento **expreso** (art. 7 ¶5; Reg. art. 15 II): el acto debe ser del titular — una
  casilla sin marcar o el botón de registro con el texto de consentimiento; **nunca premarcada**.
  Analítica disociada: sin casilla (art. 9 III). Para el abogado: confirmar que el botón-con-texto
  (clickwrap) basta como "expreso por medios electrónicos" si se opta por cero casillas.
- **OQ-N8 — Nivel de detalle (decidido 2026-09-22).** El aviso publica lo mínimo del art. 15 y describe
  por categorías: proveedores por tipo y país, datos por categoría con ejemplos, medidas de seguridad
  sin detalle (art. 18 exige tenerlas, no publicarlas), plazos internos "conforme a política documentada
  y a solicitud" salvo los que el usuario experimenta (inactividad y archivo). El detalle vive en
  documentos internos de responsabilidad (art. 5) y en el Anexo a los negocios.
