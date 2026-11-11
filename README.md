# Lattely – Tu cafetería online (Proyecto integrador)

Equipo: Jhoser Briceño (backend y coordinación), Stevan Alarcón (bases de datos), Camilo Molina (frontend y priorización), Joseph Álvarez (QA y apoyo frontend).
Versión presentada: `<commit o ZIP>`. Jira: proyecto SCRUM.

## Qué hace
Menú → personalizar bebida (tamaño y leche) → carrito con cantidades → confirmar pedido → pagar con pasarela de prueba → consultar el pedido con su código.

## Requisitos
- Navegador moderno (Chrome, Edge, Firefox o Safari). Sin Node, sin build, sin dependencias.
- Opcional: un proyecto gratuito de [Supabase](https://supabase.com) para guardar los pedidos en la nube.
- Para correr las pruebas automáticas: Node.js 18 o superior.

## Instalación y ejecución
1. Descomprimir la carpeta (o clonar el repositorio).
2. Abrir `index.html` con doble clic. No hay que modificar código.

Sin configurar nada, la app arranca en **modo local**: guarda los pedidos en el navegador (localStorage) con las mismas reglas que la base de datos y lo avisa con una franja amarilla arriba.

### Conectar Supabase (modo nube)
1. Crear un proyecto en Supabase.
2. SQL Editor → pegar todo `db/schema.sql` → Run. Crea tablas, RLS, funciones y datos de prueba.
3. Project Settings → API → copiar **Project URL** y la clave **anon public** en `config.js`.
4. Recargar `index.html`. La franja de "Modo local" desaparece.

Nunca poner la clave `service_role` en `config.js` ni en el repositorio. La clave `anon` es pública por diseño: con RLS solo puede llamar `confirmar_pedido`, `consultar_pedido` y `registrar_pago`; no puede leer ni escribir tablas directamente.
Supabase pausa los proyectos gratuitos sin uso: abrir el proyecto antes de cada entrega o sustentación.

## Datos de prueba
- Productos (`datos.js` y `db/schema.sql`): Latte $5.200 · Cappuccino $4.500 · Americano Frío $3.800 · Té Chai $4.800.
- Tamaños: Pequeño, Mediano, Grande, sin recargo (Jira no define recargo por tamaño).
- Leche: Entera $0, Deslactosada $0, Almendras +$2.000.
- Pedidos de ejemplo (solo en Supabase): `LAT-DEMO01` ($11.000, pagado) y `LAT-DEMO02` ($9.000, pago rechazado, se puede pagar).
- Medios de la pasarela simulada: "Tarjeta de prueba · aprobada", "· rechazada" y "Pago de prueba · queda pendiente".

## Recorrido de prueba
1. Latte → + Agregar → Mediano → Almendras → Agregar al carrito ($7.200).
2. Americano Frío → Pequeño → Agregar. Total $11.000.
3. Subir la cantidad del Latte a 3 → subtotal del ítem $21.600, total $25.400.
4. Confirmar pedido → revisar el resumen → Confirmar y pagar. Anotar el código `LAT-XXXXXX`.
5. Pagar con "rechazada" → pedido sigue sin pagar. Pagar con "aprobada" → pedido Pagado.
6. Mi pedido → escribir el código → Consultar.

## Archivos
| Archivo | Contenido |
|---|---|
| `index.html` | Vistas de menú, pago y consulta; ventanas de personalización, resumen y privacidad |
| `estilos.css` | Estilos y diseño adaptable a celular |
| `datos.js` | Productos, tamaños, recargos de leche y rutas de imagen |
| `logica.js` | Lógica pura: precios, carrito con cantidades, validaciones, cálculo del pedido |
| `config.js` | URL y clave anon de Supabase (vacías = modo local) |
| `api.js` | Pedidos y pagos: `ApiSupabase` (RPC) y `ApiLocal` (localStorage), misma interfaz |
| `pasarela.js` | Pasarela simulada; se cambia por una real implementando `cobrar()` |
| `app.js` | Estado, acciones y pintado de la interfaz |
| `db/schema.sql` | Tablas, RLS, funciones `confirmar_pedido`, `consultar_pedido`, `registrar_pago` y datos |
| `pruebas/logica.test.js` | Pruebas automáticas |
| `img/` | Una foto por producto, 600×600 |

## Decisiones de diseño
- **Precios en el servidor:** el navegador manda solo producto, tamaño, leche y cantidad. `confirmar_pedido` recalcula todo desde las tablas, así un precio manipulado no cambia el cobro.
- **Sin pedidos duplicados:** cada carrito lleva una clave (UUID). Si llega dos veces (doble clic o reintento por red), se devuelve el mismo pedido. El botón además se deshabilita mientras confirma.
- **Recargo sin duplicar (BUG-01):** precio unitario = precio base + recargo de leche, siempre desde el base. El subtotal del ítem es precio unitario × cantidad.
- **Pagado una sola vez:** `registrar_pago` toma el monto del pedido guardado (no del navegador), guarda cada intento en `pagos` y rechaza nuevos pagos de un pedido ya pagado.
- **Sin datos de tarjeta:** la pasarela simulada no los pide y la tabla `pagos` no tiene columnas para ellos.
- **Limitación conocida:** en la pasarela simulada el resultado lo elige el navegador. Con una pasarela real, el resultado debe confirmarlo el servidor (webhook).

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
| Pago por pasarela | SCRUM-45 | Jhoser | `pasarela.js`, `pagar()` | P22, P23 |
| Registro del pago | SCRUM-46 | Stevan | `registrar_pago`, tabla `pagos` | P22 |
| Aviso de privacidad | SCRUM-47 | Camilo | `#privacidad` en `index.html` | P24 |
| Celular y navegadores | SCRUM-48 | Camilo | `@media` en `estilos.css` | P25, P26 |

Implementó / revisó / probó: completar por historia con enlace al commit (subtareas de revisión y prueba en Jira).
No implementadas en esta entrega: SCRUM-13, 15, 16 (inventario), SCRUM-17, 18 (búsqueda y filtros) y RF-01, RF-04 a RF-09 del SRS (evolución prevista).

## Pruebas
Pruebas automáticas (desde la carpeta `lattely`):
```
node --test pruebas/logica.test.js
```
**A** = prueba automática en Node (15 pasan). **N** = verificado en navegador (Chromium) en modo local. **Pendiente** = falta ejecutarla y anotar el resultado real. Ninguna prueba se ha corrido todavía contra Supabase.

| ID | Historia | Pasos | Esperado | Obtenido |
|---|---|---|---|---|
| P1 | HU-01 éxito | Elegir Latte y luego Cappuccino | La ventana muestra el producto elegido | Pendiente |
| P2 | HU-01 límite | `PRODUCTOS = []` | "No hay productos disponibles por el momento." | Pendiente |
| P3 | HU-02 éxito | Ver precios de Latte y Té Chai | $5.200 y $4.800, igual a `datos.js` | A |
| P4 | HU-02 inválido | Producto sin `precio` | No aparece en el menú | A (Sprint 1) |
| P5 | HU-03 éxito | Elegir Pequeño, Mediano, Grande | La opción elegida queda resaltada | Pendiente |
| P6 | HU-03 inválido | Agregar sin tamaño | Aviso de tamaño faltante, carrito en 0 | A, N |
| P7 | Integración | Latte + Grande, luego Cappuccino | Cappuccino sin tamaño elegido | A (Sprint 1) |
| P8 | HU-04 éxito | Latte, Almendras | $7.200 | A, N |
| P9 | HU-04 / BUG-01 | Alternar Almendras↔Entera varias veces | Siempre base +$2.000, nunca +$4.000 | A |
| P10 | HU-05 éxito | Latte Mediano, Agregar | Contador 0→1 | N |
| P11 | HU-06 éxito | Latte Almendras + Americano Frío Pequeño | Total $11.000 | A |
| P12 | SCRUM-14 éxito | Con 2 ítems, Quitar el Latte | Total $11.000 → $3.800, contador 2→1 | A (Sprint 1) |
| P13 | SCRUM-14 límite | Quitar el último ítem | "Aún no has agregado nada a tu pedido.", total $0 | A (Sprint 1) |
| P14 | SCRUM-41 | Sin tamaño y luego Pequeño, Mediano, Grande | Imagen 70:100:130 centrada, precio igual | A lógica (Sprint 1); visual Pendiente |
| P15 | SCRUM-40 éxito | Latte Mediano Almendras, cantidad 3 | Subtotal ítem $21.600; contador 4 con un Americano | A, N |
| P16 | SCRUM-40 límite | Disminuir con cantidad 1; subir más de 20 | Botón − deshabilitado; máximo 20 | A, N |
| P17 | SCRUM-42 éxito + doble clic | Confirmar con 2 clics seguidos | Un solo pedido creado | A, N |
| P18 | SCRUM-42 inválido | Confirmar con carrito vacío | "Tu carrito está vacío…", no se crea pedido | A, N |
| P19 | SCRUM-43 | Confirmar y recargar la página | El pedido sigue disponible con los mismos valores | A, N (local); Supabase Pendiente |
| P20 | SCRUM-44 éxito | Consultar código existente | Ítems, total, estado del pedido y del pago | A, N |
| P21 | SCRUM-44 inválido | Consultar `LAT-NOEXIS` | "No encontramos ese pedido…" | A, N |
| P22 | SCRUM-45/46 | Pagar rechazada y luego aprobada | 2 intentos guardados, pedido Pagado una vez, monto = total | A, N |
| P23 | SCRUM-45 límite | Pagar con "pendiente"; pagar un pedido ya pagado | Sigue Confirmado; "Este pedido ya está pagado." | A |
| P24 | SCRUM-47 | Abrir y cerrar el aviso con ítems en el carrito | Aviso visible; carrito y total se conservan | N |
| P25 | SCRUM-48 celular | Ancho 375 px en menú, pago y consulta | Sin desplazamiento horizontal | N |
| P26 | SCRUM-48 navegadores | Recorrido completo en Chrome, Edge, Firefox, Safari | Funciona igual | Pendiente |

## Bugs observados
- Al implementar la navegación entre vistas, el menú no se ocultaba al ir a "Pagar" porque `.layout{display:grid}` anulaba el atributo `hidden`. Corregido con `[hidden]{display:none!important}` en `estilos.css`.
- BUG-01 (SCRUM-22) se previno calculando siempre desde el precio base; P9 lo confirma. Vincular P9 con SCRUM-10.

## Créditos de imágenes
Fotos de Wikimedia Commons, recortadas a 600×600 para la página (cambio de las imágenes: recorte y reducción; en el Americano se rellenaron los lados con la misma foto desenfocada para hacerla cuadrada).

| Archivo en `img/` | Original | Autor | Licencia |
|---|---|---|---|
| `latte.jpg` | [Glass of Coffee Latte with Pastry (1)](https://commons.wikimedia.org/wiki/File:Glass_of_Coffee_Latte_with_Pastry_(1).jpg) | Jonatan Svensson Glad | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `cappuccino.jpg` | [Cappuccino with Chocolate](https://commons.wikimedia.org/wiki/File:Cappuccino_with_Chocolate.jpg) | Benjamin Thomas | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |
| `americano-frio.jpg` | [Iced Americano 1](https://commons.wikimedia.org/wiki/File:Iced_Americano_1.jpg) | Challapramod | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `te-chai.jpg` | [Chai latte - Cafe Coho, Queens Road, Brighton 2024-03-06](https://commons.wikimedia.org/wiki/File:Chai_latte_-_Cafe_Coho,_Queens_Road,_Brighton_2024-03-06.jpg) | Andy Li | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (dominio público) |

Las licencias BY-SA piden que las versiones modificadas de esas dos fotos se compartan con la misma licencia (CC BY-SA 4.0).

Estas fotos reemplazaron a las del Sprint 1 con los mismos nombres de archivo. En `datos.js` las rutas llevan `?v=3` (subir el número cuando se cambie una foto) para que el navegador no muestre la versión vieja guardada en caché.
