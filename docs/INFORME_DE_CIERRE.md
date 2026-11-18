# Informe de cierre – Lattely

**Proyecto:** Lattely – cafetería online · **Asignatura:** Gerencia de Software (Proyecto integrador)
**Equipo:** Jhoser Briceño, Stevan Alarcón, Camilo Molina, Joseph Álvarez
**Versión entregada:** `v1.0` · **Fecha:** 2026-11-18

> Las horas reales de este informe se reconstruyeron al cierre, porque no se registraron en Jira durante el trabajo. El detalle de la planificación está en el documento *Lattely – Planificación y control del proyecto*.

## Evidencias
| Componente | Enlace |
|---|---|
| Repositorio (historial de cambios) | https://github.com/Jhoser1801/Gerencia-de-Software- |
| ZIP de respaldo | `Lattely_codigo_fuente.zip` en el repositorio |
| Tablero Jira (proyecto SCRUM) | https://usantoto-team-x372epjv.atlassian.net/jira/software/projects/SCRUM/boards/1 |
| Requisitos (SRS IEEE 830) | `docs/Lattely_SRS_IEEE830.docx` |
| Arquitectura y flujos | `docs/ARQUITECTURA.md` |
| Manual de uso | `docs/MANUAL_DE_USO.md` |
| Casos de prueba | `README.md`, sección *Pruebas* (P1 a P29) |
| Kit y registro de auditoría | `docs/KIT_AUDITORIA.md` |
| URL publicada | https://jhoser1801.github.io/Gerencia-de-Software-/ |

## 1. Problema y usuarios
Una cafetería necesita recibir pedidos de bebidas personalizadas sin errores de cobro. Los usuarios son los **clientes**, que arman el pedido, lo pagan y lo consultan, y la **cafetería**, que necesita saber qué pedidos están pagados. El problema que se ataca es el cálculo de precios con recargos (BUG-01: el recargo de la leche de almendras no se sumaba o podía duplicarse) y la falta de un registro confiable del pedido y del pago.

## 2. Alcance aprobado frente al entregado
Base: enunciado del docente (Lattely) y SRS.

| Requisito del enunciado | Historias Jira | Estado en esta versión |
|---|---|---|
| Catálogo y precio | SCRUM-7, 8 | Entregado |
| Selección de tamaño y leche | SCRUM-9, 10, 41 | Entregado (imagen escalada por tamaño; Té Chai y Café Americano sin leche; Café Americano caliente o frío) |
| Carrito y cantidades | SCRUM-11, 14, 40 | Entregado |
| Subtotales, recargos y total correctos | SCRUM-12, BUG-01 (SCRUM-22) | Entregado |
| Evitar recargos duplicados | SCRUM-22 | Entregado (prueba P9) |
| Evitar compras sin configuración obligatoria | SCRUM-9, 42 | Entregado (P6, P18, P29) |
| Confirmación del pedido | SCRUM-42 | Entregado, sin duplicados por doble clic (P17) |
| Conservar y consultar el pedido | SCRUM-43, 44 | Entregado en modo local; el modo Supabase está listo en `db/schema.sql` pero no se probó (SCRUM-59) |
| Pasarela de pagos (API o funcionalidad de prueba) | SCRUM-45, 46 | Entregado como funcionalidad sin API: PSE (banco, tipo de persona, pantalla del banco con CUS) y pagar al recoger, que la cafetería marca pagado con PIN |
| Aviso de privacidad, celular y navegadores | SCRUM-47, 48 | Entregado; probado en Chromium y Edge, faltan Firefox y Safari (SCRUM-69) |

**No entregado (fuera del alcance de esta versión):** inventario (SCRUM-13, 15, 16), búsqueda y filtros (SCRUM-17, 18), y RF-01 y RF-04 a RF-09 del SRS. El equipo los aplazó el 2026-11-04 (cambio C5) porque el enunciado del docente para Lattely no los incluye y se priorizaron el pedido y el pago.

**Alcance en puntos:** 40 al inicio (2026-10-07), 67 tras reconstruir el backlog (2026-11-04, cambios C1 y C2) y **48 entregados** en v1.0 (Sprint 1 con 23 y Sprint 2 con 25), tras aplazar 19 puntos (C5).

## 3. Organización y decisiones del equipo
| Integrante | Rol | Horas reales |
|---|---|---|
| Jhoser Briceño | Backend y coordinación | 68 h |
| Stevan Alarcón | Bases de datos (Supabase) | 52 h |
| Camilo Molina | Frontend y priorización | 60 h |
| Joseph Álvarez | QA y apoyo frontend | 48 h |

Cada historia tiene una subtarea de **revisión cruzada** a cargo de otro integrante y una de **prueba** (SCRUM-23 a 38 y 49 a 70).

Decisiones técnicas (detalle en `README.md`):
1. Los precios se recalculan en el servidor; el navegador solo envía producto, tamaño, leche, temperatura y cantidad.
2. Cada pedido lleva una clave única para que un doble clic no lo duplique.
3. El precio unitario siempre se calcula desde el precio base para no duplicar recargos (BUG-01).
4. Un pedido se marca como pagado una sola vez y el monto sale del pedido guardado.
5. No se piden ni se guardan datos de tarjeta ni claves bancarias.
6. Hay un modo local (`localStorage`) para que la aplicación funcione sin servidor.

| Fecha | Decisión | Quién |
|---|---|---|
| 2026-11-04 | Reconstruir el backlog desde el SRS (C1) | Equipo |
| 2026-11-04 | Aplazar inventario, búsqueda y filtros (C5) | Equipo |
| 2026-11-11 | Pasarela sin API: PSE y pagar al recoger (C3) | Equipo |
| 2026-11-11 | Café Americano con temperatura obligatoria; Té Chai y Americano sin leche (C4) | Jhoser Briceño |

| Fecha | Bloqueo | Resolución |
|---|---|---|
| 2026-11-04 | Se perdieron las historias originales (R4) | Backlog reconstruido desde el SRS |
| 2026-11-11 | No hay un proyecto Supabase configurado para probar el modo nube | Se entrega en modo local; la prueba en Supabase queda en SCRUM-59 |
| 2026-11-15 | Enlaces de Jira rotos por la reescritura del historial de GitHub (R8) | Enlaces corregidos con los hashes nuevos |

## 4. Cronograma
| Iteración | Objetivo | Planeado | Real | Esfuerzo real | Diferencia y causa |
|---|---|---|---|---|---|
| Sprint 1 – Base funcional | Catálogo, tamaño, leche, carrito, total, quitar | 2026-10-01 → 2026-10-15 | 2026-10-07 → 2026-11-11 | 66 h | Casi 4 semanas tarde: backlog creado tarde, historias perdidas y reconstruidas (C1) e integración del código al final |
| Sprint 2 – Pedido y pago | Cantidades, confirmación, guardado, consulta, pago, privacidad, celular | Sin fechas en Jira (creado el 2026-11-04) | 2026-11-04 → 2026-11-11 | 128 h | Se hizo en una semana junto con el cierre de Sprint 1 |
| Sprint 3 – Cierre | Revisiones, pruebas, presupuesto, riesgos e informe | 2026-11-17 → 2026-11-18 | 2026-11-17 → 2026-11-18 | 34 h | En curso al escribir este informe |

Hechos registrados: el backlog inicial se creó el 2026-10-07 (SCRUM-5 a 38); la primera subida a GitHub fue el 2026-10-21; el 2026-11-04 se reconstruyó el backlog desde el SRS (SCRUM-39 a 78) y se cerró BUG-01; el 2026-11-11 se subieron el código, la documentación y v1.0, y se cerraron las historias de los dos sprints. Al cierre, las 15 historias entregadas de Sprint 1 y Sprint 2 están en Finalizado, y SCRUM-48 sigue en revisión hasta probar Firefox y Safari.

**Lección:** abrir cada sprint con historias estimadas, subir el código por historia con su ID de Jira y registrar las horas al cerrar cada tarea.

## 5. Presupuesto y horas
Tarifa supuesta: **$25.000 COP por hora**, igual para los cuatro (salario de referencia de $4.000.000 COP/mes para un desarrollador junior ÷ 160 h/mes; supuesto del equipo). Es un costo simulado: no se pagó a nadie. Fórmula: **costo = horas × tarifa**, con la misma tarifa para el estimado y el real. Convención: 1 story point = 4 h.

| Actividad | Horas estimadas | Horas reales | Costo estimado | Costo real |
|---|---|---|---|---|
| Desarrollo Sprint 1 (23 puntos) | 92 | 44 | $2.300.000 | $1.100.000 |
| Desarrollo Sprint 2 (25 puntos) | 100 | 72 | $2.500.000 | $1.800.000 |
| Revisiones cruzadas | 16 | 12 | $400.000 | $300.000 |
| Pruebas | 26 | 22 | $650.000 | $550.000 |
| Planeación y Jira | 24 | 20 | $600.000 | $500.000 |
| Documentación | 20 | 32 | $500.000 | $800.000 |
| Auditoría cruzada | 8 | 6 | $200.000 | $150.000 |
| Cambios no planeados (C1 a C5) | 0 | 20 | $0 | $500.000 |
| **Subtotal personal** | **286** | **228** | **$7.150.000** | **$5.700.000** |
| Contingencia 10 % | — | — | $715.000 | $0 (no se usó) |
| **Total** | | | **$7.865.000** | **$5.700.000** |

| Herramienta o servicio | Costo real | Observación |
|---|---|---|
| Jira (plan gratuito) | $0 | |
| GitHub y GitHub Pages | $0 | Repositorio y aplicación publicada |
| Supabase (plan gratuito) | $0 | No se activó; la entrega usa el modo local |

**Desviación:** −58 h (−20,3 %) y −$2.165.000 (−27,5 %). El desarrollo tomó 116 h frente a las 192 h de la regla de 4 h por punto, porque el trabajo se concentró entre el 4 y el 11 de noviembre. En cambio, los cambios no planeados sumaron 20 h y la documentación 12 h más de lo estimado. El alcance aplazado (19 puntos = 76 h = $1.900.000) no entra en el estimado.

## 6. Riesgos y cambios

### Riesgos
Probabilidad e impacto: Alta = 3, Media = 2, Baja = 1; exposición = probabilidad × impacto.

| ID | Riesgo | Prob. | Impacto | Exp. | Responsable | Prevención | Respuesta | Estado al cierre |
|---|---|---|---|---|---|---|---|---|
| R1 | Poca disponibilidad por otras materias | 3 | 3 | 9 | Jhoser | Tareas pequeñas con fecha en Jira | Repriorizar el backlog | Se presentó: Sprint 1 cerró casi 4 semanas tarde |
| R9 | No cerrar revisiones y pruebas antes de la entrega | 3 | 3 | 9 | Camilo | Sprint 3 con responsables | Priorizar revisiones y pruebas | Activo: revisiones y pruebas de otros integrantes por cerrar |
| R3 | Errores de cálculo de precios | 2 | 3 | 6 | Camilo | Lógica central y pruebas | Corregir y volver a probar | Se presentó: BUG-01, cerrado el 2026-11-04 |
| R6 | Integración tardía del código | 3 | 2 | 6 | Jhoser | Rama y PR por historia | Integrar y probar antes de la entrega | Se presentó: casi todo el código subió el 2026-11-11 |
| R7 | Dependencia de una sola persona en el repositorio | 3 | 2 | 6 | Jhoser | Commits y PR desde cada cuenta | Revisiones en Jira como evidencia | Se presentó: los 12 commits salieron de una cuenta |
| R2 | Supabase gratuito pausado el día de la evaluación | 2 | 2 | 4 | Stevan | Abrir el proyecto antes | Usar el modo local | No se presentó: la entrega usa el modo local |
| R5 | Fallas al integrar frontend y base de datos | 2 | 2 | 4 | Stevan | Interfaz `Api` común y modo local | Probar en modo local | No se presentó en modo local; Supabase sin probar (SCRUM-59) |
| R4 | Pérdida de artefactos de gestión | 1 | 3 | 3 | Jhoser | Respaldo en GitHub y Jira | Reconstruir desde el SRS | Se presentó: backlog reconstruido el 2026-11-04 |
| R8 | Reescritura del historial de GitHub | 1 | 2 | 2 | Jhoser | No usar push --force en main | Corregir enlaces | Se presentó: enlaces corregidos el 2026-11-15 |

### Cambios
| ID | Fecha | Solicitud | Motivo | Funciones afectadas | Impacto | Decisión | Jira |
|---|---|---|---|---|---|---|---|
| C1 | 2026-11-04 | Reconstruir el backlog desde el SRS | Pérdida de las historias originales (R4) | Backlog de Sprint 2 | +25 puntos; 6 h | Aprobado | SCRUM-79 |
| C2 | 2026-11-04 | Imagen de la bebida según el tamaño | El RF-10 del SRS pide mostrar la imagen según el tamaño | Personalización y carrito | +2 puntos; 2 h | Implementado | SCRUM-81 |
| C3 | 2026-11-11 | Pasarela de tarjetas → PSE y pagar al recoger (primero se probó transferencia con referencia y se reemplazó por PSE el mismo día) | Pago realista sin usar una API | Pago, consulta y vista Cafetería (SCRUM-45, 46) | Rehace 8 puntos; 10 h | Aprobado | SCRUM-80 |
| C4 | 2026-11-11 | Café Americano caliente o frío; Té Chai y Americano sin leche | El té chai y el americano no se preparan con leche, y el americano se pide caliente o frío | Catálogo y personalización | Sin cambio de puntos; 2 h | Implementado | SCRUM-82 |
| C5 | 2026-11-04 | Aplazar inventario, búsqueda y filtros | El enunciado del docente no los incluye; se priorizaron pedido y pago | Inventario y búsqueda | −19 puntos (76 h, $1.900.000); 0 h | Aplazado | SCRUM-83 |

## 7. Resultados de pruebas y auditoría
- **Pruebas automáticas:** 18 de 18 pasan (`node --test pruebas/logica.test.js`).
- **Casos funcionales:** P1 a P29 en el `README.md`, ejecutados en Chromium en modo local. P26 (navegadores) también pasó en Microsoft Edge el 2026-11-18; faltan Firefox y Safari. P19 contra Supabase no se probó.
- **Auditoría cruzada (SCRUM-73):** la realiza el docente. Los hallazgos se registran en `docs/KIT_AUDITORIA.md` cuando se reciban.

## 8. Limitaciones y mantenimiento
- Lattely no se conecta a PSE: la pantalla del banco está dentro de la página y la respuesta la da el navegador; con PSE real, el banco le avisaría al servidor. En modo local el PIN de la cafetería está en `config.js` y solo sirve para la demostración; en Supabase está protegido en la base de datos.
- En modo local, los pedidos solo existen en el navegador donde se hicieron.
- No hay cuentas de usuario: el pedido se consulta solo con el código.
- Las tres fotos de cada producto usan el mismo archivo escalado. Para usar fotos distintas por tamaño basta con cambiar las rutas en `datos.js`.
- Para cambiar productos o precios hay que tocar `datos.js` y la tabla `productos` de `db/schema.sql`, y mantener los dos iguales.

## 9. Conclusiones y lecciones aprendidas
- Se entregó todo lo que pide el enunciado del docente para Lattely (catálogo, personalización, carrito, totales sin recargos duplicados, confirmación, consulta y pasarela de pagos), con 48 puntos, 18 pruebas automáticas y la aplicación publicada.
- El proyecto costó menos horas de las estimadas (−20 %), pero terminó casi 4 semanas tarde: el problema no fue el esfuerzo sino cuándo se hizo. El backlog se creó tarde y el trabajo se concentró en la última semana.
- Perder las historias originales obligó a reconstruir el backlog (C1). Tener el SRS al día permitió recuperarlo en un día.
- Calcular siempre desde el precio base y probarlo con casos automáticos resolvió BUG-01 y evitó que volviera con los cambios posteriores (C3 y C4).
- **Para el próximo proyecto:** estimar las historias antes de abrir cada sprint, subir el código por historia con su ID de Jira desde la cuenta de cada integrante, y registrar las horas al cerrar cada tarea en vez de reconstruirlas al final.
