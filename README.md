# Lattely – Tu cafetería online (Proyecto integrador)

Equipo: Jhoser Briceño (backend y coordinación), Stevan Alarcón (bases de datos), Camilo Molina (frontend y priorización), Joseph Álvarez (QA y apoyo frontend).
Versión presentada: `v1.0`. Jira: proyecto SCRUM.

**Abrir en línea:** https://jhoser1801.github.io/Gerencia-de-Software-/

## Qué hace
Menú → personalizar bebida (tamaño y leche) → carrito con cantidades → confirmar pedido → pagar con PSE o al recoger → consultar el pedido con su código.

## Documentación
- [Manual de uso](docs/MANUAL_DE_USO.md)
- [Arquitectura y flujos](docs/ARQUITECTURA.md)
- [Kit de auditoría](docs/KIT_AUDITORIA.md)
- [Informe de cierre (borrador)](docs/INFORME_DE_CIERRE.md)
- [Requisitos (SRS IEEE 830)](docs/Lattely_SRS_IEEE830.docx)

## Requisitos
- Navegador moderno (Chrome, Edge, Firefox o Safari). Sin Node, sin build, sin dependencias.
- Opcional: un proyecto gratuito de [Supabase](https://supabase.com) para guardar los pedidos en la nube.
- Para correr las pruebas automáticas: Node.js 18 o superior.

## Instalación y ejecución
Opción rápida: abrir https://jhoser1801.github.io/Gerencia-de-Software-/ (GitHub Pages, HTTPS). No requiere instalar nada.

Opción local:
1. Descomprimir la carpeta (o clonar el repositorio).
2. Abrir `index.html` con doble clic. No hay que modificar código.

Sin configurar nada, la app arranca en **modo local**: guarda los pedidos en el navegador (localStorage) con las mismas reglas que la base de datos. La interfaz es la misma en los dos modos.

### Conectar Supabase (modo nube)
1. Crear un proyecto en Supabase.
2. SQL Editor → pegar todo `db/schema.sql` → Run. Crea tablas, RLS, funciones y datos de prueba.
3. Project Settings → API → copiar **Project URL** y la clave **anon public** en `config.js`.
4. Recargar `index.html`. Desde ese momento los pedidos se guardan en Supabase.

Nunca poner la clave `service_role` en `config.js` ni en el repositorio. La clave `anon` es pública por diseño: con RLS solo puede llamar `confirmar_pedido`, `consultar_pedido`, `registrar_pago`, `pagos_pendientes` y `resolver_pago` (estas dos piden el PIN de la cafetería); no puede leer ni escribir tablas directamente.
Supabase pausa los proyectos gratuitos sin uso: abrir el proyecto antes de cada entrega o sustentación.

## Datos de prueba
- Productos (`datos.js` y `db/schema.sql`): Latte $5.200 · Cappuccino $4.500 · Café Americano $3.800 · Té Chai $4.800.
- Tamaños: Pequeño, Mediano, Grande, sin recargo (Jira no define recargo por tamaño).
- Leche (solo Latte y Cappuccino): Entera $0, Deslactosada $0, Almendras +$2.000. Té Chai y Café Americano no llevan leche: no se muestra la opción y se guardan como "Sin leche".
- Temperatura (solo Café Americano, obligatoria, sin recargo): Caliente o Frío.
- Pedidos de ejemplo (solo en Supabase): `LAT-DEMO01` ($11.000, pagado con PSE) y `LAT-DEMO02` ($9.000, pago PSE rechazado, se puede pagar).
- Medios de pago: **PSE** (elegir banco y tipo de persona; en la pantalla del banco, **Pagar** aprueba y **Cancelar** rechaza) y **Pagar al recoger**.
- PIN de la vista **Cafetería** (pagos al recoger): `2468` (modo local: `config.js`; Supabase: tabla `ajustes`). Cambiarlo antes de una entrega real.

## Recorrido de prueba
1. Latte → + Agregar → Mediano → Almendras → Agregar al carrito ($7.200).
2. Té Chai → Grande (no pide leche) → Agregar. Total $12.000.
3. Subir la cantidad del Latte a 3 → subtotal del ítem $21.600, total $26.400. Volver a bajarla a 1.
4. Confirmar pedido → revisar el resumen → Confirmar y pagar. Anotar el código `LAT-XXXXXX`.
5. Elegir **PSE**, banco **Bancolombia**, persona **Natural** → **Ir a mi banco**. En la pantalla del banco, **Cancelar** → "El pago con PSE no se completó…" y el pedido sigue sin pagar.
6. Elegir **PSE** otra vez, banco **Nequi** → **Pagar $12.000** → "Pago aprobado por Nequi" con su código CUS. El pedido queda Pagado.
7. Con otro pedido: **Pagar al recoger** → "Pendiente en caja". En **Cafetería**, con el PIN, **Marcar pagado** → pedido Pagado.
8. Mi pedido → escribir el código → Consultar.

## Archivos
| Archivo | Contenido |
|---|---|
| `index.html` | Vistas de menú, pago, consulta y cafetería; ventanas de personalización, resumen y privacidad |
| `estilos.css` | Estilos y diseño adaptable a celular |
| `datos.js` | Productos, tamaños, recargos de leche y rutas de imagen |
| `logica.js` | Lógica pura: precios, carrito con cantidades, validaciones, cálculo del pedido |
| `config.js` | URL y clave anon de Supabase (vacías = modo local) |
| `api.js` | Pedidos y pagos: `ApiSupabase` (RPC) y `ApiLocal` (localStorage), misma interfaz y mismas reglas |
| `pasarela.js` | Pasarela sin API externa: PSE (banco, tipo de persona, pantalla del banco con CUS) y pagar al recoger |
| `app.js` | Estado, acciones y pintado de la interfaz |
| `db/schema.sql` | Tablas, RLS, funciones `confirmar_pedido`, `consultar_pedido`, `registrar_pago`, `pagos_pendientes`, `resolver_pago` y datos |
| `pruebas/logica.test.js` | Pruebas automáticas |
| `img/` | Una foto por producto, 600×600, WebP con fondo transparente |

## Decisiones de diseño
- **Precios en el servidor:** el navegador manda solo producto, tamaño, leche y cantidad. `confirmar_pedido` recalcula todo desde las tablas, así un precio manipulado no cambia el cobro.
- **Sin pedidos duplicados:** cada carrito lleva una clave (UUID). Si llega dos veces (doble clic o reintento por red), se devuelve el mismo pedido. El botón además se deshabilita mientras confirma.
- **Recargo sin duplicar (BUG-01):** precio unitario = precio base + recargo de leche, siempre desde el base. El subtotal del ítem es precio unitario × cantidad.
- **Pasarela sin API, como PSE:** el cliente elige **PSE**, su banco y el tipo de persona, y pasa a la pantalla del banco con el comercio, el valor y el código **CUS**. Ahí autoriza (**Pagar**) o cancela el débito; la respuesta queda guardada como **Aprobado** o **Rechazado**. No se piden claves ni datos de tarjeta.
- **Pagar al recoger:** el pago queda **Pendiente** y solo la cafetería, en la vista **Cafetería** con su PIN, lo marca pagado o lo rechaza (`resolver_pago`). El navegador no puede aprobar un pago al recoger.
- **Pagado una sola vez:** el monto sale del pedido guardado (no del navegador), cada intento queda en `pagos`, un pedido tiene como máximo un pago pendiente y un pedido pagado no acepta más pagos. Un mismo código de pago (CUS) no se puede registrar dos veces.
- **Sin datos de tarjeta:** no se piden y la tabla `pagos` no tiene columnas para ellos.
- **Limitación conocida:** Lattely no se conecta a PSE; la pantalla del banco está dentro de la página y la respuesta la da el navegador. Con PSE real, el banco le avisaría al servidor y el navegador no decidiría. En modo local el PIN de la cafetería está en `config.js`, que es público: solo sirve para la demostración. En Supabase el PIN está en la base de datos y no se puede leer desde la página.

## Imágenes por tamaño (SCRUM-14 / SCRUM-41)
Cada producto define en `datos.js` su ruta por tamaño (`imagenes: { "Pequeño", "Mediano", "Grande" }`). Mientras no haya fotos reales, los tres tamaños usan el mismo archivo y `estilos.css` lo escala dentro de un recuadro fijo (proporción 70:100:130 = escalas 0,543 : 0,772 : 1). Sin tamaño elegido se muestra el Mediano. El tamaño no cambia el precio.

Presentación: la bebida está "apoyada" en la base del recuadro y crece o se encoge desde abajo con una animación corta, con una sombra que acompaña el tamaño. Los botones de tamaño muestran un vaso de distinto alto. La ventana se dibuja una sola vez al abrirla (`pintarDetalle()`) y al elegir tamaño o leche solo se actualiza (`actualizarDetalle()`), así la foto no parpadea. Quien tenga activado "reducir movimiento" en su sistema ve el cambio sin animación.

## Relación de historias
| HU | Jira | Responsable | Código | Evidencia |
|---|---|---|---|---|
| HU-01 Menú | SCRUM-7 | Camilo | `pintar()`, `elegirProducto()` | demo del catálogo y `datos.js` |
| HU-02 Precio | SCRUM-8 | Stevan | `productosValidos()`, `precioUnitario()` | P3, P4 |
| HU-03 Tamaño | SCRUM-9 | Joseph | `elegirTamano()`, `estado.tamano` | P5, P6 |
| HU-04 Leche | SCRUM-10 | Camilo | `LECHES`, `elegirLeche()` | P8, P9 |
| HU-05 Carrito | SCRUM-11 | Jhoser | `agregarItem()` | P10 |
| HU-06 Total | SCRUM-12 | Camilo | `resumenCarrito()` | P11 |
| Quitar del carrito | SCRUM-14 | Joseph | `quitarItem()` | P12, P13 |
| Imagen por tamaño | SCRUM-41 | Joseph | `datosImagen()`, `htmlImagen()` | P14 |
| Cantidades | SCRUM-40 | Camilo | `cambiarCantidad()`, `subtotalItem()` | P15, P16 |
| Confirmar pedido | SCRUM-42 | Jhoser | `abrirResumen()`, `confirmarPedido()`, `validarCarrito()` | P17, P18 |
| Guardar pedido | SCRUM-43 | Stevan | `db/schema.sql` `confirmar_pedido`, `api.js` | P19 |
| Consultar pedido | SCRUM-44 | Camilo | `consultar()`, `consultar_pedido` | P20, P21 |
| Pago por pasarela | SCRUM-45 | Jhoser | `pasarela.js`, `pagar()`, `pintarCafeteria()` | P22, P23, P27 |
| Registro del pago | SCRUM-46 | Stevan | `registrar_pago`, `resolver_pago`, tabla `pagos` | P22, P27 |
| Aviso de privacidad | SCRUM-47 | Camilo | `#privacidad` en `index.html` | P24 |
| Celular y navegadores | SCRUM-48 | Camilo | `@media` en `estilos.css` | P25, P26 |

Implementó / revisó / probó: completar por historia con enlace al commit (subtareas de revisión y prueba en Jira).
No implementadas en esta entrega: SCRUM-13, 15, 16 (inventario), SCRUM-17, 18 (búsqueda y filtros) y RF-01, RF-04 a RF-09 del SRS (evolución prevista).

## Pruebas
Pruebas automáticas (desde la carpeta `lattely`):
```
node --test pruebas/logica.test.js
```
**A** = prueba automática en Node (18 pasan). **N** = verificado en navegador (Chromium) en modo local; última ejecución 2026-11-11. **Pendiente** = falta ejecutarla y anotar el resultado real. Ninguna prueba se ha corrido todavía contra Supabase.

| ID | Historia | Pasos | Esperado | Obtenido |
|---|---|---|---|---|
| P1 | HU-01 éxito | Elegir Latte y luego Cappuccino | La ventana muestra el producto elegido | N (Latte $5.200 y luego Cappuccino $4.500, sin tamaño elegido) |
| P2 | HU-01 límite | `PRODUCTOS = []` | "No hay productos disponibles por el momento." | N |
| P3 | HU-02 éxito | Ver precios de Latte y Té Chai | $5.200 y $4.800, igual a `datos.js` | A |
| P4 | HU-02 inválido | Producto sin `precio` | No aparece en el menú | A (Sprint 1) |
| P5 | HU-03 éxito | Elegir Pequeño, Mediano, Grande | La opción elegida queda resaltada | N (solo la opción elegida queda resaltada) |
| P6 | HU-03 inválido | Agregar sin tamaño | Aviso de tamaño faltante, carrito en 0 | A, N |
| P7 | Integración | Latte + Grande, luego Cappuccino | Cappuccino sin tamaño elegido | A (Sprint 1) |
| P8 | HU-04 éxito | Latte, Almendras | $7.200 | A, N |
| P9 | HU-04 / BUG-01 | Alternar Almendras↔Entera varias veces | Siempre base +$2.000, nunca +$4.000 | A |
| P10 | HU-05 éxito | Latte Mediano, Agregar | Contador 0→1 | N |
| P11 | HU-06 éxito | Latte Almendras + Café Americano Pequeño frío | Total $11.000 | A |
| P12 | SCRUM-14 éxito | Con 2 ítems, Quitar el Latte | Total $11.000 → $3.800, contador 2→1 | A (Sprint 1) |
| P13 | SCRUM-14 límite | Quitar el último ítem | "Aún no has agregado nada a tu pedido.", total $0 | A (Sprint 1) |
| P14 | SCRUM-41 | Sin tamaño y luego Pequeño, Mediano, Grande | Imagen 70:100:130 centrada, precio igual | A lógica (Sprint 1); N: altos 97, 137 y 178 px = 71:100:130, precio igual |
| P15 | SCRUM-40 éxito | Latte Mediano Almendras, cantidad 3 | Subtotal ítem $21.600; contador 4 con un Americano | A, N |
| P16 | SCRUM-40 límite | Disminuir con cantidad 1; subir más de 20 | Botón − deshabilitado; máximo 20 | A, N |
| P17 | SCRUM-42 éxito + doble clic | Confirmar con 2 clics seguidos | Un solo pedido creado | A, N |
| P18 | SCRUM-42 inválido | Confirmar con carrito vacío | "Tu carrito está vacío…", no se crea pedido | A, N |
| P19 | SCRUM-43 | Confirmar y recargar la página | El pedido sigue disponible con los mismos valores | A, N (local); Supabase Pendiente |
| P20 | SCRUM-44 éxito | Consultar código existente | Ítems, total, estado del pedido y del pago | A, N |
| P21 | SCRUM-44 inválido | Consultar `LAT-NOEXIS` | "No encontramos ese pedido…" | A, N |
| P22 | SCRUM-45/46 | PSE Bancolombia y **Cancelar** en el banco; luego PSE Nequi y **Pagar** | 2 intentos guardados (Rechazado y Aprobado), pedido Pagado una vez, monto = total, CUS visible | A, N |
| P23 | SCRUM-45 inválido/límite | PSE sin banco; pagar al recoger dos veces; pagar un pedido ya pagado; la cafetería marca pagado un pago al recoger | "Elige tu banco."; "…ya tiene un pago pendiente…"; "Este pedido ya está pagado."; pedido Pagado | A, N |
| P24 | SCRUM-47 | Abrir y cerrar el aviso con ítems en el carrito | Aviso visible; carrito y total se conservan | N |
| P25 | SCRUM-48 celular | Ancho 375 px en menú, pago y consulta | Sin desplazamiento horizontal | N |
| P26 | SCRUM-48 navegadores | Recorrido completo en Chrome, Edge, Firefox, Safari | Funciona igual | N en Chromium (Chrome); Edge, Firefox y Safari Pendiente |
| P27 | Seguridad del pago | Registrar un pago al recoger como "Aprobado" desde el navegador; PSE con un banco que no está en la lista; entrar a Cafetería con PIN `1111` | "Un pago al recoger solo lo aprueba la cafetería."; "Elige tu banco."; "PIN incorrecto." | A, N |
| P28 | Bebidas sin leche | Abrir Té Chai y Café Americano; enviar un pedido de Té Chai con leche Almendras | No se muestra la opción de leche; se guarda "Sin leche" sin recargo ($4.800 c/u) | A, N |
| P29 | Temperatura del Café Americano | Agregar un Café Americano Mediano sin elegir temperatura; luego elegir Frío | "…elige si lo quieres caliente o frío." y no se agrega; con Frío se agrega como "Mediano · Frío · Sin leche", $3.800 | A, N |

## Bugs observados
- Al implementar la navegación entre vistas, el menú no se ocultaba al ir a "Pagar" porque `.layout{display:grid}` anulaba el atributo `hidden`. Corregido con `[hidden]{display:none!important}` en `estilos.css`.
- BUG-01 (SCRUM-22) se previno calculando siempre desde el precio base; P9 lo confirma. Vincular P9 con SCRUM-10.

## Imágenes
Una foto por producto en `img/`: `latte.webp`, `cappuccino.webp`, `americano.webp` y `te-chai.webp`. Son PNG con fondo transparente que el equipo entregó, recortados al contorno de la taza, centrados en un lienzo cuadrado y reducidos a 600×600 en formato WebP (de 1,3 MB a menos de 60 KB cada uno). Los originales quedaron fuera del repositorio, en `Imagenes/originales_png/`.

Origen y licencia de las fotos: `[completar]`.

En `datos.js` las rutas llevan `?v=4` (subir el número cuando se cambie una foto) para que el navegador no muestre la versión vieja guardada en caché.
