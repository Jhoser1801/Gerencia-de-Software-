# Kit de auditoría – Lattely

Paquete para el grupo auditor (sección 4.3 del enunciado). El grupo debe poder ejecutar todo **sin ayuda del equipo de Lattely**.

| Dato | Valor |
|---|---|
| Producto | Lattely – cafetería online |
| Versión entregada | `v1.0` |
| URL en línea | https://jhoser1801.github.io/Gerencia-de-Software-/ |
| Repositorio | https://github.com/Jhoser1801/Gerencia-de-Software- |
| Archivo de respaldo | `Lattely_codigo_fuente.zip` |
| Modo de almacenamiento | Local (localStorage del navegador) |
| Contacto solo para accesos caídos | `[completar]` |

## 1. Cómo ejecutarla
La forma más fácil es abrir https://jhoser1801.github.io/Gerencia-de-Software-/. También se puede ejecutar sin internet:

1. Descomprimir `Lattely_codigo_fuente.zip`.
2. Abrir `lattely/index.html` en Chrome, Edge, Firefox o Safari.
3. (Opcional) Pruebas automáticas, con Node.js 18 o superior, desde la carpeta `lattely`:
   ```
   node --test pruebas/logica.test.js
   ```
   Resultado esperado: 15 pruebas pasan.

El manual de uso está en `docs/MANUAL_DE_USO.md`.

## 2. Datos de prueba
| Producto | Precio |
|---|---|
| Latte | $5.200 |
| Cappuccino | $4.500 |
| Americano Frío | $3.800 |
| Té Chai | $4.800 |

- Tamaños: Pequeño, Mediano y Grande, sin recargo.
- Leche (solo Latte y Cappuccino): Entera $0, Deslactosada $0, Almendras +$2.000. Té Chai y Americano Frío no llevan leche.
- Medios de pago: **PSE** (cualquier banco de la lista; en la pantalla del banco, **Pagar** aprueba y **Cancelar** rechaza) y **Pagar al recoger**.
- PIN de la vista **Cafetería** (para marcar pagados o rechazar los pagos al recoger): `2468`.
- Pedidos ya cargados (solo en modo Supabase): `LAT-DEMO01` ($11.000, pagado con PSE) y `LAT-DEMO02` ($9.000, pago PSE rechazado).
- Código inexistente para probar: `LAT-NOEXIS`.

## 3. Alcance aprobado y criterios de aceptación

| # | Función | Criterio de aceptación |
|---|---|---|
| CA-01 | Catálogo | Se ven los 4 productos con nombre, descripción, foto y precio igual a la tabla de datos |
| CA-02 | Tamaño obligatorio | Sin tamaño no se puede agregar: aparece "Faltan opciones por seleccionar: elige un tamaño." y el carrito no cambia |
| CA-03 | Leche y recargo | Latte + Almendras = $7.200. Cambiar de leche varias veces nunca suma el recargo dos veces |
| CA-04 | Carrito | Al agregar, el contador sube. Quitar baja el total. Sin ítems se ve "Aún no has agregado nada a tu pedido." |
| CA-05 | Cantidades | Entre 1 y 20 por ítem. Subtotal del ítem = precio unitario × cantidad |
| CA-06 | Totales | Total = subtotal + recargos. Latte Almendras + Americano Pequeño = $11.000 |
| CA-07 | Confirmación | Un carrito vacío no se confirma. Un doble clic crea un solo pedido con código `LAT-XXXXXX` |
| CA-08 | Persistencia | El pedido confirmado sigue disponible después de recargar la página |
| CA-09 | Consulta | Un código existente muestra ítems, total y estados. Uno inexistente muestra "No encontramos ese pedido…" |
| CA-10 | Pago | PSE: sin banco aparece "Elige tu banco."; en la pantalla del banco se ven comercio, valor y CUS; **Pagar** deja el pedido Pagado y **Cancelar** lo deja sin pagar para intentar de nuevo. Al recoger: el pago queda "Pendiente en caja" hasta que la cafetería lo marca pagado. Un pedido pagado no acepta otro pago. El monto es el total del pedido |
| CA-13 | Seguridad del pago | Sin el PIN no se pueden ver ni marcar pagos al recoger ("PIN incorrecto."); el cliente no puede aprobar su propio pago al recoger |
| CA-14 | Bebidas sin leche | Té Chai y Americano Frío no muestran opciones de leche y no tienen recargo |
| CA-11 | Privacidad | El aviso se abre y se cierra sin perder el carrito |
| CA-12 | Celular | A 375 px de ancho no hay desplazamiento horizontal en menú, pago y consulta |

**Fuera del alcance de esta entrega** (no se reportan como defectos): inventario (SCRUM-13, 15, 16), búsqueda y filtros (SCRUM-17, 18), cuentas de usuario, y RF-01 y RF-04 a RF-09 del SRS.

## 4. Formato del registro de auditoría
El grupo auditor llena una fila por hallazgo. **Tipo**: Defecto, Sugerencia o Fuera de alcance. **Severidad**: Alta (bloquea el recorrido o da un total incorrecto), Media (función con error que se puede evitar) o Baja (estética o texto).

| ID | Versión | Fecha | Función / CA | Pasos | Resultado esperado | Resultado obtenido | Evidencia (captura o video) | Tipo | Severidad |
|---|---|---|---|---|---|---|---|---|---|
| AUD-01 | | | | | | | | | |
| AUD-02 | | | | | | | | | |
| AUD-03 | | | | | | | | | |
