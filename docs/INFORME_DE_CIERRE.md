# Informe de cierre – Lattely

> **Borrador.** Lo que ya consta en el código, el SRS, el README y Jira está escrito. Lo que solo el equipo puede saber está marcado como `[completar]`: horas reales, tarifas, riesgos que se presentaron, cambios aprobados y resultados de la auditoría. El enunciado pide no inventar incidentes, así que esos espacios se llenan con datos reales.

**Proyecto:** Lattely – cafetería online · **Asignatura:** Gerencia de Software (Proyecto integrador)
**Equipo:** Jhoser Briceño, Stevan Alarcón, Camilo Molina, Joseph Álvarez
**Versión entregada:** `[completar: commit o etiqueta]` · **Fecha:** `[completar]`

## Evidencias
| Componente | Enlace |
|---|---|
| Repositorio (historial de cambios) | https://github.com/Jhoser1801/Gerencia-de-Software- |
| ZIP de respaldo | `Lattely_codigo_fuente.zip` en el repositorio |
| Tablero Jira (proyecto SCRUM) | https://usantoto-team-x372epjv.atlassian.net/jira/software/projects/SCRUM/boards/1 |
| Requisitos (SRS IEEE 830) | `docs/Lattely_SRS_IEEE830.docx` |
| Arquitectura y flujos | `docs/ARQUITECTURA.md` |
| Manual de uso | `docs/MANUAL_DE_USO.md` |
| Casos de prueba | `README.md`, sección *Pruebas* (P1 a P26) |
| Kit y registro de auditoría | `docs/KIT_AUDITORIA.md` |
| URL publicada | `[completar si se publica (SCRUM-71)]` |

## 1. Problema y usuarios
Una cafetería necesita recibir pedidos de bebidas personalizadas sin errores de cobro. Los usuarios son los **clientes**, que arman el pedido, lo pagan y lo consultan, y la **cafetería**, que necesita saber qué pedidos están pagados. El problema que se ataca es el cálculo de precios con recargos (BUG-01: el recargo de la leche de almendras no se sumaba o podía duplicarse) y la falta de un registro confiable del pedido y del pago.

## 2. Alcance aprobado frente al entregado
Base: enunciado del docente (Lattely) y SRS.

| Requisito del enunciado | Historias Jira | Estado en esta versión |
|---|---|---|
| Catálogo y precio | SCRUM-7, 8 | Entregado |
| Selección de tamaño y leche | SCRUM-9, 10, 41 | Entregado (imagen escalada por tamaño) |
| Carrito y cantidades | SCRUM-11, 14, 40 | Entregado |
| Subtotales, recargos y total correctos | SCRUM-12, BUG-01 (SCRUM-22) | Entregado |
| Evitar recargos duplicados | SCRUM-22 | Entregado (prueba P9) |
| Evitar compras sin configuración obligatoria | SCRUM-9, 42 | Entregado (P6, P18) |
| Confirmación del pedido | SCRUM-42 | Entregado, sin duplicados por doble clic (P17) |
| Conservar y consultar el pedido | SCRUM-43, 44 | Entregado en modo local; modo Supabase listo en `db/schema.sql`, `[completar: probado / no probado en Supabase]` |
| Pasarela de pagos (API o funcionalidad de prueba) | SCRUM-45, 46 | Entregado como pasarela simulada con aprobado, rechazado y pendiente |
| Aviso de privacidad, celular y navegadores | SCRUM-47, 48 | Entregado; prueba en 4 navegadores pendiente (P26) |

**No entregado (fuera del alcance de esta versión):** inventario (SCRUM-13, 15, 16), búsqueda y filtros (SCRUM-17, 18), y RF-01 y RF-04 a RF-09 del SRS. `[completar: motivo y decisión del equipo]`

## 3. Organización y decisiones del equipo
| Integrante | Rol |
|---|---|
| Jhoser Briceño | Backend y coordinación |
| Stevan Alarcón | Bases de datos (Supabase) |
| Camilo Molina | Frontend y priorización |
| Joseph Álvarez | QA y apoyo frontend |

Cada historia tiene una subtarea de **revisión cruzada** a cargo de otro integrante y una de **prueba** (SCRUM-23 a 38 y 49 a 70).

Decisiones técnicas (detalle en `README.md`):
1. Los precios se recalculan en el servidor; el navegador solo envía producto, tamaño, leche y cantidad.
2. Cada pedido lleva una clave única para que un doble clic no lo duplique.
3. El precio unitario siempre se calcula desde el precio base para no duplicar recargos (BUG-01).
4. Un pedido se marca como pagado una sola vez y el monto sale del pedido guardado.
5. No se piden ni se guardan datos de tarjeta.
6. Hay un modo local (`localStorage`) para que la aplicación funcione sin servidor.

Bloqueos y otras decisiones: `[completar]`

## 4. Cronograma
| Iteración | Objetivo | Fechas planeadas | Fechas reales | Diferencia y causa |
|---|---|---|---|---|
| Sprint 1 – Base funcional | Catálogo, tamaño, leche, carrito, total, quitar | `[completar]` | `[completar]` | `[completar]` |
| Sprint 2 – Pedido y pago | Cantidades, confirmación, guardado, consulta, pago, privacidad, celular | `[completar]` | `[completar]` | `[completar]` |

Hechos registrados en Jira: el backlog inicial se creó el 2026-10-07 (SCRUM-5 a 38), con fechas límite de historias entre el 2026-10-04 y el 2026-10-14. El 2026-11-04 se reconstruyó desde el SRS (SCRUM-39 a 78) y BUG-01 se cerró ese día. `[completar: estado final de las historias al cierre]`

## 5. Presupuesto y horas
Tarifa supuesta: `[completar]` COP por hora (costo simulado, no se pagó). Fórmula: **costo = horas × tarifa**, con la misma tarifa para el costo estimado y el real.

| Actividad | Horas estimadas | Horas reales | Costo estimado | Costo real |
|---|---|---|---|---|
| Planeación y Jira | | | | |
| Desarrollo frontend | | | | |
| Base de datos y backend | | | | |
| Revisión y pruebas | | | | |
| Documentación | | | | |
| **Total personal** | | | | |

| Herramienta o servicio | Costo real | Observación |
|---|---|---|
| Jira (plan gratuito) | $0 | |
| GitHub | $0 | |
| Supabase (plan gratuito) | $0 | Pausa los proyectos sin uso |
| `[completar]` | | |

## 6. Riesgos y cambios

### Riesgos
Los riesgos de la tabla son una **propuesta**. Hay que revisar con el equipo la probabilidad, el impacto y, sobre todo, el estado real de cada uno.

| ID | Riesgo | Prob. | Impacto | Responsable | Prevención | Respuesta | Estado al cierre |
|---|---|---|---|---|---|---|---|
| R1 | Poca disponibilidad del equipo por otras materias | | | Jhoser | Tareas pequeñas con fechas en Jira | Repriorizar el backlog | `[completar]` |
| R2 | Proyecto gratuito de Supabase pausado el día de la evaluación | | | Stevan | Abrir el proyecto antes de la entrega | Usar el modo local | `[completar]` |
| R3 | Errores de cálculo de precios (recargos) | | | Camilo | Lógica central y pruebas automáticas | Corregir y volver a probar | Se presentó como BUG-01 y se cerró el 2026-11-04 |
| R4 | Pérdida de artefactos de gestión | | | Jhoser | Respaldo en GitHub y Jira | Reconstruir desde el SRS | Se presentó: se perdieron las historias originales y se reconstruyeron el 2026-11-04 |
| R5 | Problemas al integrar el frontend con la base de datos | | | Stevan | Interfaz `Api` común y modo local | Probar con el modo local | `[completar]` |

### Cambios
| ID | Fecha | Solicitud | Motivo | Funciones afectadas | Impacto en tiempo y costo | Decisión |
|---|---|---|---|---|---|---|
| C1 | 2026-11-04 | Reconstruir el backlog desde el SRS | Pérdida de las historias originales | Todo el backlog de Sprint 2 | `[completar]` | Aprobado |
| C2 | `[completar]` | Imagen de la bebida según el tamaño (SCRUM-41) | `[completar]` | Ventana de personalización | `[completar]` | `[completar]` |
| C3 | `[completar]` | Pasarela simulada en vez de una API de pagos real | El enunciado permite una funcionalidad de prueba | Pago | `[completar]` | `[completar]` |

## 7. Resultados de pruebas y auditoría
- **Pruebas automáticas:** 15 de 15 pasan (`node --test pruebas/logica.test.js`, ejecutadas el 2026-11-11).
- **Casos funcionales:** P1 a P26 en el `README.md`. Pendientes de ejecutar y registrar: P1, P2, P5, la parte visual de P14 y P26, y P19 contra Supabase. `[completar al cerrarlos]`
- **Auditoría cruzada (SCRUM-73):** grupo auditor `[completar]`. Hallazgos: `[completar]` defectos, `[completar]` sugerencias y `[completar]` fuera de alcance. Corregidos: `[completar]`. Registro completo en `docs/KIT_AUDITORIA.md`.

## 8. Limitaciones y mantenimiento
- La pasarela es simulada: el resultado lo define el medio elegido. Para usar una pasarela real hay que cambiar `pasarela.js` y confirmar el pago en el servidor (webhook).
- En modo local, los pedidos solo existen en el navegador donde se hicieron.
- No hay cuentas de usuario: el pedido se consulta solo con el código.
- Las tres fotos de cada producto usan el mismo archivo escalado. Para usar fotos distintas por tamaño basta con cambiar las rutas en `datos.js`.
- Para cambiar productos o precios hay que tocar `datos.js` y la tabla `productos` de `db/schema.sql`, y mantener los dos iguales.

## 9. Conclusiones y lecciones aprendidas
`[completar por el equipo]`
