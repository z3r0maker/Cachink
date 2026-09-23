# N-34 — Aviso de privacidad y ARCO: borradores para revisión legal

**Estado:** borrador v0.1, 2026-09-17. **Nada de esto es texto final ni asesoría legal.** Lo redactó
un agente de ingeniería a partir del texto de la ley y de las decisiones del repositorio, para que un
abogado mexicano lo revise. Tarea: N-34 (`docs/plan/09-next-features.md`), hallazgo SEC-PRIV-01 de la
auditoría N-26.

| Archivo | Qué es | Dónde se usa |
| --- | --- | --- |
| `aviso-integral.md` | Aviso de privacidad integral | `xangarro.mx/privacidad`, pie del portal |
| `aviso-simplificado.md` | Tres variantes cortas | Registro (A), vincular dispositivo (B), NIP del operador (C) |
| `encargado-clausulas.md` | Anexo de tratamiento de datos (Xangarro encargado) | Términos de servicio (L-05) |
| `arco-procedimiento.md` | Procedimiento ARCO público (A) + anexo interno (B) | `xangarro.mx/privacidad/arco`; consola |

**Relación con `docs/legal/privacy.md` y `terms.md`.** Son de la etapa Cachink (2026-04-24): app
local, "puedes usar tu propia instancia de Supabase", `privacidad@cachink.mx`. Ya no describen el
producto (ADR-053: la nube es la columna vertebral; ADR-054: marca Xangarro). No se editaron. De ahí se
conservaron: reportes de fallas **opt-in** en la app, sin contenido capturado, eventos borrados a los 90
días; la exportación de todos los datos; el aviso previo de cambios. Cuando el abogado apruebe estos
textos, `privacy.md` debe quedar reemplazado y `terms.md` reescrito con el anexo (L-05).

---

## 1. Supuestos

1. Xangarro opera como una sola persona moral mexicana (`[RAZÓN SOCIAL]`, `[DOMICILIO]`), sin empresas
   del grupo.
2. Clientes: negocios pequeños; muchos dueños son **personas físicas** (RESICO, actividad empresarial),
   así que sus registros de ventas y gastos son también datos patrimoniales suyos.
3. Xangarro es **responsable** de: la cuenta del dueño y de los usuarios del portal, facturación y
   CFDI, datos de dispositivos, uso, seguridad y soporte.
4. Xangarro es **encargado** de: los clientes del negocio (nombre, teléfono, RFC opcional, saldos), los
   operadores (nombre, hash del NIP, turnos, cortes, mensajes — ADR-072, ADR-075) y cualquier dato
   personal que el negocio capture.
5. Xangarro no pide datos sensibles; campos libres (conceptos, notas, mensajes, reportes) podrían
   contenerlos.
6. Los datos de tarjeta nunca llegan a Xangarro (Stripe Checkout); se reciben marca, últimos 4 y
   vigencia.
7. Base de datos y funciones en EE. UU.: Supabase `us-east-1`, Vercel `iad1`
   (`docs/plan/00-README.md` Q17; `03-backend.md` B-01).
8. Proveedor de correo: Resend "o SMTP de Supabase" (B-14) — **sin decidir**. PAC: Facturapi como
   primer adaptador, sin decidir para `live` (ADR-070).
9. La app guarda 90 días de movimientos en el teléfono (ADR-053 §8); la caja web usa SQLite en OPFS
   (ADR-071); un dispositivo revocado conserva sus datos (auditoría SEC-MOB-02).
10. Reportes de fallas: en la app, opt-in (ADR-027); en portal y API, Sentry sin opt-in con
    `business_id` como etiqueta y "sin PII en logs" (B-18).
11. Cobros con Mercado Pago/Clip (ADR-066) son posteriores al lanzamiento; se mencionan como futuros.
12. El Asesor con LLM está en «Próximamente» en producción (ADR-059) y el explorador GLM (N-49) usa solo
    datos sintéticos: **ningún proveedor de modelos recibe datos personales hoy**. Si cambia, el aviso
    y la lista de proveedores deben actualizarse antes.
13. No hay cuentas para menores de edad ni publicidad de terceros.

---

## 2. Preguntas abiertas para el abogado

Ordenadas por impacto.

- **OQ-L1 — Encargados y remisiones sin regulación en la Ley vigente.** La LFPDPPP 2025 define
  "persona encargada" (art. 2 XII) y excluye de "transferencia" la comunicación al encargado (art. 2
  XX), pero ya no trae las obligaciones del encargado ni el concepto de "remisión". El Reglamento de
  2011 (arts. 49–55) sigue publicado como vigente en diputados.gob.mx y fuentes secundarias dicen que
  aplica de forma supletoria en lo que no contradiga la Ley; el nuevo Reglamento no se ha expedido
  (el transitorio Décimo Segundo daba 90 días). ¿Se puede fundar el anexo de encargado en el
  Reglamento de 2011? Además, "responsable" es cualquier "sujeto regulado" que trate datos (art. 2 XIV
  y XVI): ¿la Ley vigente convierte al encargado también en responsable?
- **OQ-L2 — Papel sobre los registros del dueño persona física.** Las ventas y gastos del dueño son
  contenido del negocio (encargado) y a la vez sus datos patrimoniales (responsable). ¿Cuál papel
  asumir? El borrador: responsable de la cuenta, encargado del contenido; el dueño ejerce acceso,
  rectificación y cancelación sobre su contenido con las herramientas del portal.
- **OQ-L3 — Operadores.** ¿Confirmar que los datos de operadores (empleados del negocio) son del
  negocio como responsable? ¿Mantener la variante C del aviso simplificado o sobra?
- **OQ-L4 — El archivo de 6 años no es "bloqueo".** ADR-064 lo llama bloqueo, pero la Ley define el
  bloqueo como conservación "con el único propósito de determinar posibles responsabilidades en
  relación con su tratamiento", sin tratamiento (art. 2 III). El archivo existe para **restaurarse** y
  para servir a la obligación fiscal **del dueño** (CFF 30 obliga al contribuyente, no a Xangarro).
  Propuesta: tratarlo como finalidad declarada (4.1 punto 10 del aviso) y reservar "bloqueo" para lo
  que Xangarro debe conservar por ley. ¿Es finalidad necesaria o secundaria (con casilla)? ¿Es
  razonable conservar 6 años sin consentimiento específico?
- **OQ-L5 — Consentimiento expreso para datos patrimoniales/financieros.** El art. 7 (párrafo quinto)
  exige consentimiento expreso para datos financieros o patrimoniales, "salvo las excepciones" de los
  arts. 9 y 36. El art. 9 IV exceptúa lo necesario para la relación jurídica. ¿Basta el art. 9 IV
  para el núcleo del servicio? El borrador pide casilla expresa de todas formas (bajo costo, más
  defendible). ¿Aplica a la analítica de uso?
- **OQ-L6 — Lineamientos del Aviso de Privacidad (DOF 17-01-2013).** No se encontró abrogación
  expresa ni confirmación de vigencia. El borrador sigue su práctica (plazo de 5 días para negarse a
  finalidades secundarias, sección de cookies, aviso en tres capas) como buena práctica. ¿Siguen
  siendo exigibles?
- **OQ-L7 — Cláusula de transferencias (art. 35).** No hay transferencias que requieran
  consentimiento. ¿Basta declararlo? ¿SAT vía PAC es transferencia (art. 36 I) o el PAC es encargado y
  el SAT recibe por obligación propia?
- **OQ-L8 — Uso de datos disociados por el encargado** para métricas de uso y mejora (anexo 3.4).
  ¿Es compatible con "tratar solo conforme a instrucciones"? (Art. 9 III exceptúa del consentimiento
  lo disociado.)
- **OQ-L9 — Stripe, Mercado Pago, Clip.** ¿Stripe es encargado de Xangarro o responsable propio
  (KYC, fraude)? MP y Clip tienen contrato directo con el negocio: ¿son encargados del negocio y no de
  Xangarro?
- **OQ-L10 — Negocio que no atiende la solicitud ARCO de su cliente.** ¿Qué debe hacer Xangarro como
  encargado?
- **OQ-L11 — Art. 10 párrafo tercero (72 meses).** "Datos relativos al incumplimiento de
  obligaciones contractuales" deben eliminarse a los 72 meses. ¿Incluye los saldos vencidos de los
  clientes del negocio (cuentas por cobrar, crédito) y el historial `past_due` del dueño en Stripe?
- **OQ-L12 — Días hábiles.** ¿Qué calendario de días inhábiles aplica al cómputo de los plazos ARCO de
  un particular (art. 4 remite supletoriamente a la LFPA y al Código Nacional de Procedimientos Civiles
  y Familiares)?
- **OQ-L13 — Plazos de conservación sin definir:** soporte, expediente ARCO, bitácoras de seguridad,
  copias de identificación, logs de Vercel, respaldos de Supabase. ¿Y el **periodo de bloqueo** de los
  datos de la cuenta tras cancelar? El art. 24 lo iguala al plazo de prescripción de las acciones de la
  relación jurídica (¿Código de Comercio? no verificado).
- **OQ-L14 — Vulneraciones.** El art. 19 dice "de forma inmediata" sin plazo. ¿Es razonable el plazo
  de 72 horas al negocio del anexo (cláusula 10)? ¿Hay que notificar a la Secretaría?
- **OQ-L15 — Revocación que impide el servicio.** ¿Es válido que revocar el consentimiento de una
  finalidad necesaria equivalga a terminar el servicio?
- **OQ-L16 — Plantilla de aviso para los negocios.** ¿Ofrecer a los negocios una plantilla de aviso
  para sus clientes crea responsabilidad para Xangarro?

---

## 3. Citas verificadas

Todas consultadas el **2026-09-17**.

| Fuente | Qué se verificó |
| --- | --- |
| LFPDPPP, texto vigente, Cámara de Diputados — <https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf> ("Nueva Ley publicada en el DOF el 20 de marzo de 2025", "Última reforma publicada DOF 14-11-2025") | Art. 2 (definiciones: I aviso, III bloqueo, IV consentimiento, VI sensibles, VIII días = hábiles, XII encargada, XV Secretaría = **Secretaría Anticorrupción y Buen Gobierno**, XVII tercero, XX transferencia excluye al encargado). Art. 7 (tácito por regla general; **financieros o patrimoniales requieren consentimiento expreso** salvo arts. 9 y 36; revocación con mecanismo en el aviso). Art. 8 (sensibles: expreso y por escrito). Art. 9 (excepciones al consentimiento). Art. 10 (supresión previo bloqueo; **72 meses** para incumplimiento). Art. 11 (finalidad nueva → nuevo consentimiento). Arts. 14–16 (contenido del aviso: **art. 15 fracciones I–VI**; simplificado por medios electrónicos con **fracciones I–IV** + sitio del integral, **art. 16 II**). Art. 17 (datos no obtenidos del titular). Arts. 18–20 (seguridad, **vulneraciones "de forma inmediata"**, confidencialidad). Arts. 21–26 (ARCO; cancelación → bloqueo → supresión y aviso al titular, art. 24; excepciones art. 25; oposición art. 26 incl. automatizado). Arts. 27–34 (**requisitos art. 28**, área de datos art. 29, **20 días para responder y 15 para ejecutar, ampliables una vez, art. 31**, negativa art. 33, gratuidad y 3 UMA art. 34). Arts. 35–36 (transferencias). Art. 40 (protección de derechos ante la Secretaría, **15 días**). Art. 4 reformado DOF 14-11-2025 (supletoriedad: CNPCF y LFPA). Transitorio Segundo (abroga la ley de 2010), Décimo Segundo (90 días para adecuar reglamentos). |
| Reglamento de la LFPDPPP, DOF 21-12-2011, Cámara de Diputados — <https://www.diputados.gob.mx/LeyesBiblio/regley/Reg_LFPDPPP.pdf> (encabezado "TEXTO VIGENTE") | Art. 2 IX (remisión), arts. 49–55 (encargado, obligaciones, cómputo en la nube, remisiones sin consentimiento, subcontratación), art. 89 (acreditación de identidad y representación), 90–91 (medios; identidad por los medios del servicio), 93 (costos), 95–96 (acuse; requerimiento en 5 días, 10 para el titular). Su numeración cita la ley de 2010. |
| Código Fiscal de la Federación, Cámara de Diputados — <https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf> ("Última reforma publicada DOF 09-04-2026") | Art. 30: conservar contabilidad y documentación **5 años desde que se presentaron o debieron presentarse las declaraciones**; obligación del contribuyente. |
| Sharkit, "Nueva LFPDPPP: Reglamento pendiente" — <https://sharkit.mx/nueva-lfpdppp-reglamento-pendiente/> (actualizado 2026-07-09; fuente secundaria) | El nuevo Reglamento **no se ha publicado** a julio de 2026; el de 2011 aplica supletoriamente en lo que no contradiga la Ley. |
| EY México — <https://www.ey.com/es_mx/technical/tax/boletines-fiscales/nueva-ley-federal-proteccion-datos-personal-posesion-particulares>; Hogan Lovells — <https://www.hlc.com/es/publications/mexicos-new-federal-data-protection-law-what-it-means-for-companies> (2025-03-25) (secundarias) | Vigencia desde el 21-03-2025; funciones del INAI pasan a la Secretaría Anticorrupción y Buen Gobierno. Hogan Lovells dice que se eliminó el deber de informar transferencias en el aviso; **el art. 35 vigente aún pide una cláusula de aceptación de transferencias**, así que el borrador la conserva. |

**Sin verificar (marcado en los textos):**

- La vigencia de los **Lineamientos del Aviso de Privacidad** (DOF 17-01-2013) — OQ-L6.
- Si la Secretaría ha publicado criterios o formatos para particulares desde 2025.
- El plazo de prescripción que define el periodo de bloqueo (art. 24) — OQ-L13.
- Retención real de Sentry, logs de Vercel y respaldos de Supabase según los planes contratados.
- Ubicación de procesamiento del PAC, el proveedor de correo, Sentry y MP/Clip.
- Calendario oficial de días inhábiles aplicable — OQ-L12.

---

## 4. Requisitos de producto para implementar N-34

`[plan]` = ya está en N-34 u otra tarea; `[nuevo]` = lo exige o recomienda este análisis y **no está en
el plan**.

### Publicación y superficies

- [ ] `[plan]` Aviso integral en `xangarro.mx/privacidad` y enlazado en el pie del portal.
- [ ] `[nuevo]` Página de versiones anteriores (`/privacidad/versiones`) y lista de proveedores
      (`/privacidad/proveedores`) con fecha de actualización.
- [ ] `[nuevo]` Procedimiento ARCO público en `/privacidad/arco` y formulario público **sin cuenta**
      en `/privacidad/solicitud` (el plan solo prevé el formulario del portal; un exusuario, un
      operador o un cliente final no tiene sesión).
- [ ] `[plan]` Simplificado A en el registro; B en la pantalla de vincular (app y caja web).
- [ ] `[nuevo]` Variante C en la entrada con NIP (si el abogado la conserva).
- [ ] `[nuevo]` En la app, el enlace apunta a `xangarro.mx`, **nunca** a `app.xangarro.mx`, para no
      chocar con el chequeo de N-32 (ADR-069). Añadir `xangarro.mx/privacidad` a la lista permitida.
- [ ] `[nuevo]` URL de política de privacidad en las fichas de App Store y Play (X-05).
- [ ] `[nuevo]` Pie de los correos (B-14) y de los formularios de ayuda con enlace al aviso.

### Consentimiento

- [ ] `[plan]` Registro versionado por usuario. Propuesta de tabla solo portal:
      `privacy_consents (id, user_id, business_id, aviso_version, aviso_sha256, surface
      ('registro'|'reconsentimiento'|'configuracion'), purpose ('necesarias'|'novedades'|'analitica'),
      granted bool, method ('casilla'|'tacito'), ip, user_agent, created_at)`, append-only.
- [ ] `[nuevo]` Casilla **expresa** separada de la de términos, sin marcar por defecto (art. 7 datos
      patrimoniales), y casillas opcionales por finalidad secundaria.
- [ ] `[nuevo]` Pantalla **Configuración → Privacidad**: ver versión aceptada, activar/desactivar
      finalidades secundarias (revocación, art. 7 último párrafo), enlace a solicitudes.
- [ ] `[nuevo]` Re-consentimiento al entrar cuando cambia una versión con finalidad nueva (art. 11);
      aviso previo por correo y banner para cualquier cambio (art. 15 VI).
- [ ] `[nuevo]` Correos de novedades separados de los del servicio, con baja en un clic y listado de
      exclusión.

### ARCO en la consola (N-08)

- [ ] `[plan]` `support_items.kind` admite `arco` y el item lleva sus fechas de vencimiento.
- [ ] `[nuevo]` Campos: derecho, subtipo (`propio` / `encargado`), estado de identidad, fechas
      `due_requerimiento` / `due_respuesta` / `due_ejecucion`, ampliaciones, determinación, evidencia.
- [ ] `[nuevo]` Cálculo de días hábiles con tabla de días inhábiles configurable (OQ-L12), con pruebas.
- [ ] `[nuevo]` Acuse automático con folio y fecha de recepción al solicitante (art. 95 Reglamento).
- [ ] `[nuevo]` Recordatorios en el resumen diario (N-10) a 5 y 2 días; urgente el día del
      vencimiento.
- [ ] `[nuevo]` Re-autenticación (contraseña + código por correo) para cancelación y oposición.
- [ ] `[nuevo]` Adjuntos de identificación cifrados y con supresión automática.
- [ ] `[nuevo]` Remisión al negocio de las solicitudes de sus clientes/operadores (correo + aviso en el
      portal), con plazo de 5 días.

### Cancelación, bloqueo y retención

- [ ] `[nuevo]` **Eliminar cuenta/negocio** de autoservicio en el portal (exportar → confirmar →
      cancelar Stripe → borrar), hoy inexistente. Sin esto cada cancelación es manual.
- [ ] `[nuevo]` Almacén de **bloqueo** separado del archivo de inactividad, con fecha de fin por
      conjunto y tarea de supresión programada.
- [ ] `[nuevo]` Aviso al titular cuando la cancelación queda hecha (art. 24).
- [ ] `[nuevo]` Borrado en proveedores: cliente de Stripe, contacto de correo, eventos de Sentry por
      `business_id`.
- [ ] `[plan]` N-48: los correos de d90/d150 y el aviso mencionan el archivo de 6 años. `[nuevo]`
      Opción "Borrar mi archivo ahora" para un dueño archivado; revisar el término "bloqueo" en ADR-064
      según OQ-L4.
- [ ] `[nuevo]` Supresión/disociación a 72 meses de saldos vencidos de clientes (cuentas por cobrar) y
      del historial de impago del dueño (art. 10; OQ-L11).
- [ ] `[nuevo]` Calendario de retención por tabla y log (SEC-PRIV-01 lo pide): soporte, ARCO,
      `staff_audit_log`, `bug-report` (90 días, SEC-FN-01), importaciones (30 días, fila 18), logs de
      Vercel, respaldos.
- [ ] `[nuevo]` Decisión sobre respaldos del teléfono (SEC-MOB-02) y "revocar y borrar" en el
      dispositivo: el aviso hoy dice que desvincular no borra.

### Encargado y proveedores

- [ ] `[nuevo]` Contratos o DPA firmados/aceptados con cada subencargado (Supabase, Vercel, Sentry,
      correo, PAC, Stripe) y archivo en `docs/legal/` o el gestor documental.
- [ ] `[nuevo]` Proceso de aviso de 30 días a los negocios ante un subencargado nuevo (N-47 puede
      entregarlo).
- [ ] `[nuevo]` Plantilla de aviso de privacidad para que el negocio la dé a sus clientes (OQ-L16).
- [ ] `[nuevo]` Protocolo de vulneraciones: aviso "inmediato" a titulares (art. 19) y ≤ 72 h a los
      negocios; plantilla de correo; responsable designado.

### Operación

- [ ] `[nuevo]` Designar la persona o área de datos personales (art. 29) y el buzón
      `[CORREO PRIVACIDAD]` (p. ej. `privacidad@xangarro.mx`), revisado a diario.
- [ ] `[nuevo]` Revisar que Sentry del portal/API no capture PII (B-18) antes de declararlo en el aviso.
- [ ] `[plan]` Revisión del abogado antes de publicar (criterio de aceptación de N-34).
