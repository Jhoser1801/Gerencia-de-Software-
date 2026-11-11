# Manual de uso – Lattely

Lattely es la cafetería online del proyecto integrador. Con ella el cliente arma su pedido de bebidas, lo confirma, lo paga y luego lo consulta con un código.

## 1. Abrir la aplicación
1. Descomprimir `Lattely_codigo_fuente.zip` o clonar el repositorio.
2. Abrir `index.html` con doble clic en Chrome, Edge, Firefox o Safari.

No hay que instalar nada. Si arriba aparece una franja amarilla que dice **"Modo local"**, los pedidos se guardan solo en ese navegador. Para guardarlos en la nube, ver la sección *Conectar Supabase* del `README.md`.

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
1. En **Pagar pedido**, elegir el medio de pago:

   | Medio | Resultado |
   |---|---|
   | Tarjeta · pago aprobado | El pedido queda **Pagado** |
   | Tarjeta · pago rechazado | No se cobra; el pedido sigue sin pagar y se puede intentar otra vez |
   | Transferencia · pago pendiente | El pedido sigue **Confirmado** hasta que llegue un pago aprobado |

2. Pulsar **Pagar $…**. Lattely no pide datos de tarjeta.

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
| "Pago rechazado…" | La pasarela rechazó el pago | Elegir otro medio y volver a pagar; el pedido no se pierde |
| "Pago pendiente…" | La pasarela no confirmó el pago | Consultar el pedido más tarde o volver a pagar |
| "Este pedido ya está pagado." | Se intentó pagar dos veces | No hay que hacer nada; el pedido ya está pagado |
| "No encontramos ese pedido…" | El código está mal escrito o el pedido se hizo en otro navegador (modo local) | Revisar el código; en modo local, consultar desde el mismo navegador |
| "No pudimos conectar con el servidor…" | Sin internet o proyecto de Supabase pausado | Revisar la conexión; abrir el proyecto en Supabase para reactivarlo |
| Las fotos no cambian después de actualizar una imagen | El navegador guardó la versión vieja | Recargar con Ctrl + F5 |
