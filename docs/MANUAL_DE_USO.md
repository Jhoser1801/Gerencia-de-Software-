# Manual de uso – Lattely

Lattely es la cafetería online del proyecto integrador. Con ella el cliente arma su pedido de bebidas, lo confirma, lo paga y luego lo consulta con un código.

## 1. Abrir la aplicación
En línea: abrir https://jhoser1801.github.io/Gerencia-de-Software-/.

Sin internet:
1. Descomprimir `Lattely_codigo_fuente.zip` o clonar el repositorio.
2. Abrir `index.html` con doble clic en Chrome, Edge, Firefox o Safari.

No hay que instalar nada. Si `config.js` no tiene datos de Supabase, los pedidos se guardan solo en ese navegador. Para guardarlos en la nube, ver la sección *Conectar Supabase* del `README.md`.

## 2. Recorrido principal

### 2.1 Elegir y personalizar una bebida
1. En **Nuestro menú**, pulsar **+ Agregar** en la bebida que quieras.
2. En la ventana, elegir el **tamaño** (Pequeño, Mediano o Grande). Es obligatorio. El tamaño no cambia el precio, pero la foto cambia de tamaño.
3. En Latte y Cappuccino, elegir la **leche**: Entera, Deslactosada o Almendras. La de almendras suma $2.000. Té Chai y Café Americano no llevan leche, así que no aparece esa opción.
4. En el Café Americano, elegir la **temperatura**: Caliente o Frío. Es obligatorio y no cambia el precio.
5. Pulsar **Agregar al carrito**. El contador del carrito 🛒 sube.

### 2.2 Revisar el carrito
- En el panel **Tu Pedido** se ve cada bebida con su tamaño, su leche y su precio.
- Con **−** y **+** se cambia la cantidad, entre 1 y 20 unidades.
- **Quitar** elimina la bebida del carrito.
- Abajo se ven el **Subtotal**, los **Recargos** (leche) y el **Total**.

### 2.3 Confirmar el pedido
1. Pulsar **Confirmar pedido**.
2. Revisar el resumen y pulsar **Confirmar y pagar**.
3. La aplicación muestra el **código del pedido** (`LAT-XXXXXX`). **Guárdalo**: sirve para consultar el pedido después.

### 2.4 Pagar
1. En **Pagar pedido**, elegir cómo pagar:

   | Medio | Qué hacer | Resultado |
   |---|---|---|
   | PSE | Elegir el banco y el tipo de persona y pulsar **Ir a mi banco**. En la pantalla del banco revisar el comercio, el valor y el código CUS, y pulsar **Pagar** | **Aprobado**: el pedido queda **Pagado** y se muestra el CUS. Si se pulsa **Cancelar**, no se cobra nada y se puede pagar de nuevo |
   | Pagar al recoger | Pulsar **Confirmar pago al recoger**, mostrar el código en caja y pagar | **Pendiente en caja** hasta que la cafetería lo marca pagado |

2. Para ver si la cafetería ya marcó un pago al recoger, pulsar **Actualizar estado del pago**. Lattely no pide datos de tarjeta ni claves bancarias.

### Para la cafetería: pagos al recoger
1. Ir a **Cafetería** (menú de arriba) y escribir el PIN.
2. En la lista de **Pagos por revisar** aparece cada pedido que se va a pagar en caja, con su total.
3. Pulsar **Marcar pagado** cuando el cliente paga en caja, o **Rechazar** si no se presentó.

### 2.5 Consultar el pedido
1. Ir a **Mi pedido** (menú de arriba).
2. Escribir el código `LAT-XXXXXX` y pulsar **Consultar**.
3. Se ven las bebidas, el total, el estado del pedido, el estado del pago y los intentos de pago. Si el pedido no está pagado, aparece **Ir a pagar**.

## 3. Errores comunes y cómo resolverlos

| Mensaje o situación | Causa | Qué hacer |
|---|---|---|
| "Faltan opciones por seleccionar: elige un tamaño." al agregar | No se eligió tamaño | Elegir Pequeño, Mediano o Grande y volver a agregar |
| "Faltan opciones por seleccionar: elige si lo quieres caliente o frío." | No se eligió la temperatura del Café Americano | Elegir Caliente o Frío y volver a agregar |
| "Tu carrito está vacío…" al confirmar | No hay bebidas en el carrito | Agregar al menos una bebida |
| El botón **−** no hace nada | La cantidad ya es 1 | Usar **Quitar** para eliminar la bebida |
| La cantidad no pasa de 20 | Es el máximo por bebida | Hacer otro pedido si se necesitan más |
| "Elige tu banco." | No se eligió banco en PSE | Elegir el banco en la lista |
| "Este pedido ya tiene un pago pendiente de revisión." | Ya hay un pago esperando a la cafetería | Esperar la revisión y pulsar **Actualizar estado del pago** |
| "El pago con PSE no se completó…" | Se canceló el pago en la pantalla del banco | Pagar de nuevo con PSE o elegir pagar al recoger; el pedido no se pierde |
| "La cafetería rechazó el pago al recoger…" | La cafetería rechazó el pago en caja | Pagar de nuevo; el pedido no se pierde |
| "PIN incorrecto." (vista Cafetería) | El PIN no coincide | Escribir el PIN de la cafetería |
| "Este pedido ya está pagado." | Se intentó pagar dos veces | No hay que hacer nada; el pedido ya está pagado |
| "No encontramos ese pedido…" | El código está mal escrito o el pedido se hizo en otro navegador (modo local) | Revisar el código; en modo local, consultar desde el mismo navegador |
| "No pudimos conectar con el servidor…" | Sin internet o proyecto de Supabase pausado | Revisar la conexión; abrir el proyecto en Supabase para reactivarlo |
| Las fotos no cambian después de actualizar una imagen | El navegador guardó la versión vieja | Recargar con Ctrl + F5 |
