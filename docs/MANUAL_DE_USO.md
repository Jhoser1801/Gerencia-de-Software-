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
3. Elegir la **leche**: Entera, Deslactosada o Almendras. La de almendras suma $2.000.
4. Pulsar **Agregar al carrito**. El contador del carrito 🛒 sube.

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

   | Medio | Qué hacer | Estado del pago |
   |---|---|---|
   | Pagar al recoger | Pulsar **Confirmar pago al recoger**, mostrar el código en caja y pagar | **Pendiente en caja** |
   | Transferencia | Transferir el total a la llave `@lattely` con el código del pedido en el mensaje, escribir el número de referencia del banco y pulsar **Enviar referencia** | **En verificación** |

2. La cafetería revisa el pago. Si lo aprueba, el pedido queda **Pagado**. Si lo rechaza, no se cobra nada y se puede pagar de nuevo. **Actualizar estado del pago** muestra la respuesta. Lattely no pide datos de tarjeta.

### Para la cafetería: aprobar pagos
1. Ir a **Cafetería** (menú de arriba) y escribir el PIN.
2. En la lista de **Pagos por revisar** aparece cada pedido con su total, el medio y la referencia.
3. Pulsar **Aprobar** (o **Marcar pagado** si pagó en caja) cuando el dinero llegó, o **Rechazar** si no se encuentra la transferencia.

### 2.5 Consultar el pedido
1. Ir a **Mi pedido** (menú de arriba).
2. Escribir el código `LAT-XXXXXX` y pulsar **Consultar**.
3. Se ven las bebidas, el total, el estado del pedido, el estado del pago y los intentos de pago. Si el pedido no está pagado, aparece **Ir a pagar**.

## 3. Errores comunes y cómo resolverlos

| Mensaje o situación | Causa | Qué hacer |
|---|---|---|
| "Faltan opciones por seleccionar: elige un tamaño." al agregar | No se eligió tamaño | Elegir Pequeño, Mediano o Grande y volver a agregar |
| "Tu carrito está vacío…" al confirmar | No hay bebidas en el carrito | Agregar al menos una bebida |
| El botón **−** no hace nada | La cantidad ya es 1 | Usar **Quitar** para eliminar la bebida |
| La cantidad no pasa de 20 | Es el máximo por bebida | Hacer otro pedido si se necesitan más |
| "Escribe el número de referencia…" o "La referencia debe tener entre 6 y 20…" | Falta la referencia o tiene espacios o símbolos | Copiar la referencia del comprobante del banco, sin espacios |
| "Esa referencia ya se registró en otro pago." | La referencia ya se usó | Revisar el número del comprobante |
| "Este pedido ya tiene un pago pendiente de revisión." | Ya hay un pago esperando a la cafetería | Esperar la revisión y pulsar **Actualizar estado del pago** |
| "La cafetería rechazó el pago anterior…" | La cafetería no encontró la transferencia | Revisar la transferencia y pagar de nuevo; el pedido no se pierde |
| "PIN incorrecto." (vista Cafetería) | El PIN no coincide | Escribir el PIN de la cafetería |
| "Este pedido ya está pagado." | Se intentó pagar dos veces | No hay que hacer nada; el pedido ya está pagado |
| "No encontramos ese pedido…" | El código está mal escrito o el pedido se hizo en otro navegador (modo local) | Revisar el código; en modo local, consultar desde el mismo navegador |
| "No pudimos conectar con el servidor…" | Sin internet o proyecto de Supabase pausado | Revisar la conexión; abrir el proyecto en Supabase para reactivarlo |
| Las fotos no cambian después de actualizar una imagen | El navegador guardó la versión vieja | Recargar con Ctrl + F5 |
