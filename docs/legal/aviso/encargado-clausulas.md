# Cláusulas de tratamiento de datos por cuenta del Negocio (Xangarro como encargado)

> **BORRADOR v0.1 (2026-09-17) para revisión de abogado.** Sección para insertar en los Términos de
> servicio (tarea L-05). Fundamento: art. 2, fracciones XII (persona encargada), XVII (tercero) y XX
> (transferencia) de la Ley (DOF 20-03-2025, reforma 14-11-2025); arts. 49 a 55 del Reglamento de
> 2011 (DOF 21-12-2011), aplicado de forma supletoria mientras no se expida el nuevo Reglamento — la
> Ley vigente no regula expresamente al encargado; ver README, OQ-L1.

---

## Anexo de Tratamiento de Datos Personales

### 1. Definiciones

- **"Negocio"**: la persona física o moral que contrata Xangarro, representada por el dueño de la
  cuenta.
- **"Datos del Negocio"**: los datos personales que el Negocio, sus usuarios y operadores capturan en
  Xangarro sobre terceros, en particular:
  - de sus **clientes**: nombre, teléfono, RFC (opcional), notas, compras, abonos y saldos por cobrar;
  - de sus **operadores**: nombre, NIP (que Xangarro guarda solo como hash), turnos, cortes de caja,
    movimientos, mensajes del dueño y respuestas del operador;
  - cualquier otro dato personal incluido en conceptos, notas, archivos importados o comprobantes.
- **"Subencargado"**: un proveedor de Xangarro que trata Datos del Negocio para prestar el servicio.
- Los demás términos tienen el significado que les da la Ley Federal de Protección de Datos
  Personales en Posesión de los Particulares ("la Ley").

### 2. Papeles

2.1 Respecto de los Datos del Negocio, **el Negocio es el responsable** y **Xangarro es persona
encargada**: los trata solo por cuenta del Negocio para prestarle el servicio.

2.2 La comunicación de Datos del Negocio entre el Negocio y Xangarro, y entre Xangarro y sus
Subencargados, es una remisión y no una transferencia (art. 2, fracción XX de la Ley; art. 53 del
Reglamento).

2.3 Respecto de los datos de la cuenta, facturación, dispositivos y uso, Xangarro es responsable y
aplica su Aviso de Privacidad Integral.

### 3. Instrucciones

3.1 El Negocio instruye a Xangarro a tratar los Datos del Negocio **solo** para:

a) almacenarlos, sincronizarlos entre la app, la caja web y el portal, y mostrarlos a los usuarios que
el Negocio autorice;
b) calcular reportes, cuentas por cobrar, estados financieros e indicadores del Negocio;
c) generar exportaciones y comprobantes que el Negocio decida compartir; **Xangarro no envía
comprobantes a los clientes**: el envío por WhatsApp u otro medio lo hace el Negocio desde su
dispositivo;
d) importar los archivos que el Negocio suba o nos encargue importar;
e) si el Negocio lo activa, crear y confirmar cobros con el proveedor de pagos que el Negocio conecte
(Mercado Pago, Clip u otro);
f) dar soporte cuando el Negocio lo solicite, y
g) conservar, archivar, restaurar y suprimir los datos según la cláusula 9.

3.2 Las configuraciones y acciones del Negocio en el servicio (dar de alta un cliente, borrar un
operador, exportar, conectar un proveedor) son instrucciones documentadas.

3.3 Xangarro **no** usa los Datos del Negocio para fines propios, no los vende, no los usa para
publicidad y no contacta a los clientes u operadores del Negocio. Si Xangarro los tratara para una
finalidad distinta o los transfiriera contra las instrucciones del Negocio, asumiría las obligaciones
de responsable (art. 53 del Reglamento).

3.4 Xangarro podrá generar **estadísticas agregadas y disociadas** (que no permitan identificar a
ninguna persona ni al Negocio) para operar y mejorar el servicio, como el conteo de transacciones
contra el límite del plan. _(Ver README OQ-L8.)_

3.5 Si Xangarro considera que una instrucción contraviene la Ley, lo informará al Negocio y podrá
abstenerse de ejecutarla.

### 4. Confidencialidad y personal

Xangarro limita el acceso a los Datos del Negocio a personal que lo necesite para prestar el
servicio, con segundo factor obligatorio y bitácora de cada acción, y obligado a guardar
confidencialidad aun después de terminar su relación con Xangarro (art. 20 de la Ley). Xangarro no
accede al contenido de los registros del Negocio salvo para dar soporte solicitado, atender un
incidente o cumplir un mandato de autoridad.

### 5. Seguridad

Xangarro mantiene medidas administrativas, técnicas y físicas adecuadas al riesgo (art. 18 de la
Ley), que incluyen: cifrado en tránsito; aislamiento de cada Negocio en la base de datos mediante
políticas de acceso por fila; claves de servicio restringidas a la consola interna; tokens de
dispositivo revocables; y copias de seguridad. El Negocio es responsable de la seguridad de sus
dispositivos, de las contraseñas y NIP de su equipo, y de revocar los dispositivos que ya no use.

### 6. Obligaciones del Negocio

El Negocio declara y se obliga a:

a) dar a sus clientes y operadores su propio aviso de privacidad, que informe que usa un proveedor
tecnológico para registrar sus datos, y obtener el consentimiento que corresponda; Xangarro pone
a su disposición una plantilla orientativa [ENLACE], que no sustituye la asesoría legal del
Negocio;
b) capturar solo los datos necesarios y **no capturar datos personales sensibles** de clientes u
operadores (salud, origen, creencias, etc.) en conceptos, notas o mensajes;
c) atender las solicitudes ARCO de sus clientes y operadores, con el apoyo de la cláusula 8, y
d) cumplir sus propias obligaciones de conservación, incluidas las fiscales (art. 30 del Código
Fiscal de la Federación). **Xangarro no asume las obligaciones fiscales del Negocio.**

### 7. Subencargados

7.1 El Negocio **autoriza de forma general** a Xangarro a subcontratar a los Subencargados publicados
en **xangarro.mx/privacidad/proveedores** (arts. 54 y 55 del Reglamento). A la fecha:

| Subencargado                       | Servicio                                                                          | Ubicación           |
| ---------------------------------- | --------------------------------------------------------------------------------- | ------------------- |
| Supabase, Inc.                     | Base de datos, autenticación, almacenamiento (incluido el archivo de inactividad) | EE. UU. (us-east-1) |
| Vercel Inc.                        | Alojamiento del portal y de la API                                                | EE. UU. (iad1)      |
| Functional Software, Inc. (Sentry) | Reportes de fallas (sin contenido capturado por el usuario en la app)             | [REGIÓN]            |
| [PROVEEDOR DE CORREO]              | Correos del servicio                                                              | [PAÍS]              |
| Mercado Pago / Clip                | Solo si el Negocio conecta su cuenta, para cobros                                 | [PAÍS]              |

> Nota: Stripe y el PAC tratan datos de la cuenta y facturación del Negocio (Xangarro responsable), no
> Datos del Negocio; por eso no aparecen aquí. Mercado Pago y Clip son, en rigor, proveedores **del
> Negocio**: el Negocio tiene su propio contrato con ellos. Ver README OQ-L9.

7.2 Xangarro celebra con cada Subencargado un contrato que le impone obligaciones de protección
equivalentes a este Anexo, y responde frente al Negocio por su cumplimiento.

7.3 Xangarro avisará al Negocio, por correo y en el portal, con al menos **[30] días naturales** de
anticipación, de cualquier Subencargado nuevo o sustituido. Si el Negocio se opone por causa razonable
relacionada con la protección de datos y las partes no encuentran una alternativa, el Negocio podrá
terminar el servicio sin penalización y descargar sus datos.

7.4 **Remisiones internacionales.** El Negocio autoriza que los Datos del Negocio se almacenen y
traten en los Estados Unidos de América y en los demás países indicados en la lista, con las
garantías de esta cláusula.

### 8. Apoyo en solicitudes de titulares

8.1 Xangarro ofrece al Negocio herramientas para atender solicitudes de sus clientes y operadores:
consultar, editar, exportar y borrar clientes y operadores desde el portal.

8.2 Si un cliente u operador del Negocio dirige a Xangarro una solicitud ARCO, Xangarro **no la
resolverá por su cuenta**: la remitirá al Negocio dentro de **5 días hábiles**, informará al
solicitante que la remitió, y ayudará al Negocio a atenderla dentro de los plazos del artículo 31 de
la Ley (20 días hábiles para responder y 15 para hacerla efectiva).

8.3 Si el Negocio no puede ser localizado o no actúa, Xangarro podrá [CONSERVAR / BLOQUEAR] los datos
del solicitante y lo informará a este. _(Ver README OQ-L10.)_

### 9. Conservación, devolución y supresión

9.1 **Durante el servicio**, los datos se conservan mientras el Negocio los mantenga. Borrar un
registro en el portal lo borra de la base de datos activa; los dispositivos vinculados conservan
localmente los movimientos de los últimos 90 días hasta que se desinstale la app o se borren los
datos del sitio.

9.2 **Inactividad (plan gratuito).** Si no hay acceso al portal ni sincronización durante 90 días,
Xangarro avisa al dueño a los 90 y 150 días. A los 180 días exporta todos los datos a un almacenamiento
privado y cifrado, verifica la copia y borra los datos de la base activa. El archivo se conserva
**6 años**, bloqueado, solo para restaurarlo a petición del dueño o atender a una autoridad, y después
se suprime. El dueño puede pedir en cualquier momento que el archivo se suprima antes. Los planes de
pago no entran en inactividad.

9.3 **Terminación o cancelación.** Al terminar el servicio a petición del Negocio, Xangarro pone a su
disposición la exportación completa (Excel y JSON) durante [30] días y después suprime los Datos del
Negocio de sus sistemas activos. Las copias de seguridad se sobrescriben en un máximo de [N] días.
Xangarro solo conserva lo que una ley le obligue a conservar, bloqueado.

9.4 **Datos de incumplimiento.** Los saldos vencidos de clientes del Negocio se suprimen o disocian a
más tardar **72 meses** después del incumplimiento (art. 10, párrafo tercero de la Ley).
_(Ver README OQ-L11: hoy el producto no lo hace.)_

### 10. Vulneraciones de seguridad

Si Xangarro detecta una vulneración que afecte Datos del Negocio, lo notificará al Negocio **sin
demora y a más tardar en [72] horas** desde que la confirme, con: la naturaleza del incidente, los
datos y personas afectadas, las medidas tomadas y las recomendaciones. El Negocio, como responsable,
decide cómo informar a sus clientes y operadores (art. 19 de la Ley); Xangarro le dará la información
y el apoyo razonable para hacerlo de inmediato.

### 11. Requerimientos de autoridad

Si una autoridad requiere a Xangarro Datos del Negocio, Xangarro lo informará al Negocio antes de
entregar, salvo que la ley o la autoridad lo prohíban, y entregará solo lo requerido.

### 12. Verificación

A solicitud razonable del Negocio, una vez al año, Xangarro le proporcionará información por escrito
sobre sus medidas de seguridad y sus Subencargados, y los resultados resumidos de sus auditorías de
seguridad. Las visitas presenciales proceden solo si lo ordena una autoridad.

### 13. Responsabilidad

Cada parte responde de sus propias obligaciones conforme a la Ley. La limitación de responsabilidad de
los Términos de servicio aplica a este Anexo [salvo en caso de dolo o de uso de los datos para fines
propios de Xangarro]. _(Redacción a cargo del abogado.)_

### 14. Vigencia

Este Anexo está vigente mientras Xangarro trate Datos del Negocio, incluido el periodo de archivo de
la cláusula 9.2.
